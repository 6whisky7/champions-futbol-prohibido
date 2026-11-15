-- Six-month privacy retention. Sports snapshots and aggregate competition data
-- remain intact; only personal handles and request payload copies are scrubbed.

alter table cfp_private.privacy_config
  add column retention_months smallint not null default 6 check (retention_months = 6),
  add column minors_policy_confirmed boolean not null default false,
  add column notice_reviewed_at timestamptz,
  add column retention_confirmed_at timestamptz,
  add column updated_at timestamptz not null default clock_timestamp();
update cfp_private.privacy_config set version='2026-11-15-v1',active=false,updated_at=clock_timestamp() where singleton;

alter table cfp_private.applications add column anonymized_at timestamptz;
create index applications_retention_scan on cfp_private.applications(event_id,state,expires_at) where anonymized_at is null;

create table cfp_private.privacy_operations (
 id bigint generated always as identity primary key,
 operation text not null check(operation in ('configuration','preview','run','scheduled_run')),
 actor uuid,
 at timestamptz not null default clock_timestamp(),
 considered_count integer not null default 0,
 anonymized_count integer not null default 0,
 detail jsonb not null default '{}'::jsonb
);
alter table cfp_private.privacy_operations enable row level security;
revoke all on cfp_private.privacy_operations from public,anon,authenticated;

create or replace function cfp_private.scrub_application_payload(p jsonb) returns jsonb
language sql immutable set search_path='' as $$
select jsonb_build_object(
 'name',coalesce(p->>'name',''),
 'crest',coalesce(p->>'crest',''),
 'number',coalesce(p->>'number',''),
 'captain','',
 'members',coalesce((select jsonb_agg(jsonb_build_object('roblox','','tiktok','') order by ord)
   from jsonb_array_elements(coalesce(p->'members','[]'::jsonb)) with ordinality as m(value,ord)),'[]'::jsonb)
);
$$;
revoke all on function cfp_private.scrub_application_payload(jsonb) from public,anon,authenticated;

-- Allow the frozen-team guard to pass only the exact one-way scrub performed
-- by the private retention routine. Ordinary corrections remain blocked.
create or replace function cfp_private.freeze_league_team() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.cfp_events where id=old.event_id for update;
 if old.state='approved' and exists(select 1 from cfp_private.leagues where event_id=old.event_id and state<>'preview') and (new.state<>old.state or new.payload<>old.payload) then
  if current_setting('cfp.retention_maintenance',true)='on'
     and new.state=old.state
     and new.anonymized_at is not null
     and new.payload=cfp_private.scrub_application_payload(old.payload) then
   return new;
  end if;
  raise exception 'Participante fijado. Usa la decisión de descalificación de la liguilla.';
 end if;
 return new;
end;$$;
revoke all on function cfp_private.freeze_league_team() from public,anon,authenticated;

create or replace function cfp_private.retention_candidates()
returns table(event_id uuid,event_name text,event_status text,application_id uuid,application_state text,eligible_at timestamptz)
language sql stable set search_path='' as $$
select ev.id,ev.name,ev.status,a.id,a.state,
 case a.state
  when 'rejected' then (select max(h.at) from cfp_private.application_history h where h.application_id=a.id and h.action='reject')
  when 'expired' then coalesce((select max(h.at) from cfp_private.application_history h where h.application_id=a.id and h.action='expired'),a.expires_at)
  when 'approved' then coalesce(ev.finished_at,ev.cancelled_at)
  when 'waiting' then coalesce(ev.finished_at,ev.cancelled_at)
  when 'pending' then case when ev.status in ('finished','cancelled') then coalesce(ev.finished_at,ev.cancelled_at) else a.expires_at end
  else null
 end as eligible_at
from cfp_private.applications a join public.cfp_events ev on ev.id=a.event_id
where a.anonymized_at is null
 and case a.state
  when 'rejected' then (select max(h.at) from cfp_private.application_history h where h.application_id=a.id and h.action='reject')
  when 'expired' then coalesce((select max(h.at) from cfp_private.application_history h where h.application_id=a.id and h.action='expired'),a.expires_at)
  when 'approved' then case when ev.status='finished' then ev.finished_at when ev.status='cancelled' then ev.cancelled_at end
  when 'waiting' then case when ev.status='finished' then ev.finished_at when ev.status='cancelled' then ev.cancelled_at end
  when 'pending' then case when ev.status in ('finished','cancelled') then coalesce(ev.finished_at,ev.cancelled_at) when a.expires_at<=clock_timestamp() then a.expires_at end
  else null
 end is not null;
$$;
revoke all on function cfp_private.retention_candidates() from public,anon,authenticated;

create or replace function cfp_private.perform_retention(p_operation text,p_actor uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare eligible integer; changed integer; log_id bigint; current_months integer;
begin
 select retention_months into current_months from cfp_private.privacy_config where singleton;
 if current_months<>6 then raise exception 'La conservación debe permanecer configurada en seis meses.';end if;
 select count(*) into eligible from cfp_private.retention_candidates() c where c.eligible_at<=clock_timestamp()-interval '6 months';
 insert into cfp_private.privacy_operations(operation,actor,considered_count,detail)
 values(p_operation,p_actor,eligible,jsonb_build_object('retention_months',6)) returning id into log_id;
 perform set_config('cfp.retention_maintenance','on',true);
 -- Expired pending requests become terminal before their history is scrubbed.
 with ids as (select c.application_id from cfp_private.retention_candidates() c where c.application_state='pending' and c.eligible_at<=clock_timestamp()-interval '6 months')
 update cfp_private.applications a set state='expired'
 from ids where a.id=ids.application_id and a.state='pending';
 with ids as (select c.application_id from cfp_private.retention_candidates() c where c.eligible_at<=clock_timestamp()-interval '6 months')
 update cfp_private.application_history h
 set before_payload=case when h.before_payload is null then null else cfp_private.scrub_application_payload(h.before_payload) end,
     after_payload=case when h.after_payload is null then null else cfp_private.scrub_application_payload(h.after_payload) end,
     reason=case when h.before_payload is not null or h.after_payload is not null then 'Datos personales anonimizados por conservación.' else h.reason end
 from ids where h.application_id=ids.application_id;
 with ids as (select c.application_id from cfp_private.retention_candidates() c where c.eligible_at<=clock_timestamp()-interval '6 months')
 update cfp_private.applications a
 set payload=cfp_private.scrub_application_payload(a.payload),
     accepted_privacy_version=null,accepted_privacy_at=null,anonymized_at=clock_timestamp()
 from ids where a.id=ids.application_id and a.anonymized_at is null;
 get diagnostics changed=row_count;
 update cfp_private.privacy_operations set anonymized_count=changed where id=log_id;
 return jsonb_build_object('operation_id',log_id,'considered',eligible,'anonymized',changed,'retention_months',6);
end;$$;
revoke all on function cfp_private.perform_retention(text,uuid) from public,anon,authenticated;

create or replace function public.cfp_registration_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'enabled',active and minors_policy_confirmed and retention_months=6 and notice_reviewed_at is not null and retention_confirmed_at is not null,
  'version',case when active and minors_policy_confirmed and retention_months=6 and notice_reviewed_at is not null and retention_confirmed_at is not null then version else null end)
 from cfp_private.privacy_config where singleton;
$$;
revoke all on function public.cfp_registration_status() from public;
grant execute on function public.cfp_registration_status() to anon,authenticated;

create or replace function cfp_private.guard_registration_privacy() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.registration_status='open' and not coalesce((select active and minors_policy_confirmed and retention_months=6 and notice_reviewed_at is not null and retention_confirmed_at is not null from cfp_private.privacy_config where singleton),false) then
  raise exception 'Antes de abrir, confirma el aviso de privacidad, la conservación de seis meses y las medidas para participantes menores desde Privacidad y conservación.';
 end if;
 return new;
end;$$;
revoke all on function cfp_private.guard_registration_privacy() from public,anon,authenticated;

create or replace function public.cfp_privacy_admin_status() returns jsonb
language plpgsql security definer set search_path='' as $$
declare cfg cfp_private.privacy_config; cron_enabled boolean; last_run jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 select * into cfg from cfp_private.privacy_config where singleton;
 select exists(select 1 from pg_extension where extname='pg_cron') into cron_enabled;
 select jsonb_build_object('operation',operation,'at',at,'considered',considered_count,'anonymized',anonymized_count)
 into last_run from cfp_private.privacy_operations where operation in('run','scheduled_run') order by at desc limit 1;
 return jsonb_build_object('notice_active',cfg.active,'notice_version',cfg.version,
  'notice_reviewed',cfg.notice_reviewed_at is not null,'retention_confirmed',cfg.retention_confirmed_at is not null,
  'retention_months',cfg.retention_months,'minors_policy_confirmed',cfg.minors_policy_confirmed,
  'enabled',cfg.active and cfg.minors_policy_confirmed and cfg.retention_months=6 and cfg.notice_reviewed_at is not null and cfg.retention_confirmed_at is not null,
  'cron_enabled',cron_enabled,'last_run',last_run);
end;$$;
revoke all on function public.cfp_privacy_admin_status() from public,anon;
grant execute on function public.cfp_privacy_admin_status() to authenticated;

create or replace function public.cfp_privacy_admin_set(p_notice_active boolean,p_minors_confirmed boolean,p_notice_reviewed boolean,p_retention_confirmed boolean,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare old_cfg cfp_private.privacy_config; changed boolean;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 if p_notice_active is null or p_minors_confirmed is null or p_notice_reviewed is null or p_retention_confirmed is null or coalesce(char_length(trim(p_reason)),0) not between 3 and 1000 then raise exception 'Confirma cada condición e indica un motivo (3–1000 caracteres).';end if;
 select * into old_cfg from cfp_private.privacy_config where singleton for update;
 if p_notice_active and (not p_minors_confirmed or not p_notice_reviewed or not p_retention_confirmed) then raise exception 'Antes de activar el aviso, revisa el texto, confirma seis meses y las medidas para participantes menores.';end if;
 update cfp_private.privacy_config set active=p_notice_active,minors_policy_confirmed=p_minors_confirmed,
  notice_reviewed_at=case when p_notice_reviewed then clock_timestamp() else null end,
  retention_confirmed_at=case when p_retention_confirmed then clock_timestamp() else null end,
  version='2026-11-15-v1',retention_months=6,updated_at=clock_timestamp() where singleton;
 insert into cfp_private.privacy_operations(operation,actor,detail)
 values('configuration',auth.uid(),jsonb_build_object('notice_active',p_notice_active,'minors_policy_confirmed',p_minors_confirmed,'retention_months',6));
 changed:=old_cfg.active is distinct from p_notice_active or old_cfg.minors_policy_confirmed is distinct from p_minors_confirmed;
 return jsonb_build_object('saved',true,'changed',changed,'enabled',p_notice_active and p_minors_confirmed,'notice_version','2026-11-15-v1');
end;$$;
revoke all on function public.cfp_privacy_admin_set(boolean,boolean,boolean,boolean,text) from public,anon;
grant execute on function public.cfp_privacy_admin_set(boolean,boolean,boolean,boolean,text) to authenticated;

create or replace function public.cfp_retention_preview() returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; total integer;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 select count(*) into total from cfp_private.retention_candidates() c where c.eligible_at<=clock_timestamp()-interval '6 months';
 select coalesce(jsonb_agg(jsonb_build_object('event_id',x.event_id,'event_name',x.event_name,'event_status',x.event_status,
  'state',x.application_state,'eligible_before',x.oldest_eligible,'eligible_count',x.count,'history_rows',x.history_rows) order by x.oldest_eligible,x.event_name),'[]'::jsonb)
 into result from (
  select c.event_id,c.event_name,c.event_status,c.application_state,min(c.eligible_at) oldest_eligible,count(*)::integer count,
   (select count(*)::integer from cfp_private.application_history h join cfp_private.applications a on a.id=h.application_id
    join cfp_private.retention_candidates() eligible on eligible.application_id=a.id
    where a.event_id=c.event_id and a.state=c.application_state and a.anonymized_at is null
      and eligible.eligible_at<=clock_timestamp()-interval '6 months') history_rows
  from cfp_private.retention_candidates() c where c.eligible_at<=clock_timestamp()-interval '6 months'
  group by c.event_id,c.event_name,c.event_status,c.application_state
 ) x;
 insert into cfp_private.privacy_operations(operation,actor,considered_count,detail) values('preview',auth.uid(),total,jsonb_build_object('retention_months',6));
 return jsonb_build_object('retention_months',6,'application_count',total,'groups',result);
end;$$;
revoke all on function public.cfp_retention_preview() from public,anon;
grant execute on function public.cfp_retention_preview() to authenticated;

create or replace function public.cfp_retention_run(p_confirm boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 if p_confirm is distinct from true then raise exception 'Confirma la anonimización después de revisar la vista previa.';end if;
 return cfp_private.perform_retention('run',auth.uid());
end;$$;
revoke all on function public.cfp_retention_run(boolean) from public,anon;
grant execute on function public.cfp_retention_run(boolean) to authenticated;

create or replace function cfp_private.retention_job() returns jsonb
language plpgsql security definer set search_path='' as $$
begin return cfp_private.perform_retention('scheduled_run',null);end;$$;
revoke all on function cfp_private.retention_job() from public,anon,authenticated;

-- Install the daily job where pg_cron is available and permitted. A missing or
-- unavailable extension leaves manual preview/run available and does not abort.
do $cron_setup$
declare job_id bigint;
begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') and not exists(select 1 from pg_extension where extname='pg_cron') then
  begin execute 'create extension pg_cron'; exception when insufficient_privilege or feature_not_supported then null; end;
 end if;
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute 'select jobid from cron.job where jobname=$1' into job_id using 'cfp-privacy-retention';
  if job_id is not null then execute 'select cron.unschedule($1)' using job_id;end if;
  execute 'select cron.schedule($1,$2,$3)' using 'cfp-privacy-retention','15 4 * * *','select cfp_private.retention_job();';
 end if;
end;
$cron_setup$;
