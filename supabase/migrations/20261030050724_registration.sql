-- All mutations serialize on the event row. Private data never has public SELECT.
alter table public.cfp_events add column review_hours integer not null default 48 check(review_hours between 1 and 720);
alter table public.cfp_events add column roster_locked boolean not null default false;
create table cfp_private.applications (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.cfp_events(id),
 request_key uuid not null unique, payload jsonb not null,
 state text not null check(state in ('pending','approved','waiting','rejected','expired')),
 expires_at timestamptz, created_at timestamptz not null default now(),
 captain_confirmed boolean not null default false, requirements_checked boolean not null default false
);
create index applications_event on cfp_private.applications(event_id,state);
alter table cfp_private.applications enable row level security;
revoke all on cfp_private.applications from public,anon,authenticated;
create table cfp_private.application_history (
 id bigint generated always as identity primary key, application_id uuid not null references cfp_private.applications(id),
 at timestamptz not null default clock_timestamp(), action text not null, reason text not null, actor uuid
);
alter table cfp_private.application_history enable row level security;
revoke all on cfp_private.application_history from public,anon,authenticated;

create function cfp_private.normal(value text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(translate(lower(value),'áéíóúüñ','aeiouun'),'[^a-z0-9]','','g');
$$;
revoke all on function cfp_private.normal(text) from public,anon,authenticated;

create function cfp_private.expire_applications(e uuid) returns void language plpgsql set search_path='' as $$
begin
 with expired as (update cfp_private.applications set state='expired' where event_id=e and state='pending' and expires_at<=clock_timestamp() returning id)
 insert into cfp_private.application_history(application_id,action,reason) select id,'expired','Terminó el plazo de revisión' from expired;
end; $$;
revoke all on function cfp_private.expire_applications(uuid) from public,anon,authenticated;

create function cfp_private.validate_application(e uuid,p jsonb,exclude_id uuid default null, reserve boolean default true) returns void language plpgsql set search_path='' as $$
declare member jsonb; n text; t text; seen_r text[]='{}'; seen_t text[]='{}'; count_members int;
begin
 if p is null or jsonb_typeof(p)<>'object' or coalesce(char_length(p->>'name'),0) not between 3 and 60 or char_length(cfp_private.normal(p->>'name'))<3 then raise exception 'Nombre inválido (3–60 caracteres).'; end if;
 if (p->>'crest') !~ '^(0[1-9]|[1-3][0-9]|4[0-8])$' or p->>'crest' is null then raise exception 'Elige un escudo válido.'; end if;
 if coalesce(p->>'number','')<>'' and (p->>'number') !~ '^(0[1-9]|[1-9][0-9])$' then raise exception 'Número opcional del 01 al 99.'; end if;
 if coalesce(jsonb_typeof(p->'members'),'')<>'array' then raise exception 'Plantilla inválida.'; end if;
 count_members=jsonb_array_length(p->'members');
 if count_members not in (3,4) or coalesce(p->>'captain','') !~ '^[0-2]$' then raise exception 'Tres titulares, un capitán y un suplente opcional.'; end if;
 for member in select value from jsonb_array_elements(p->'members') loop
  n=regexp_replace(lower(trim(member->>'roblox')),'^@|\s','','g'); t=regexp_replace(lower(trim(member->>'tiktok')),'^@|\s','','g');
  if n is null or t is null or n !~ '^[a-z0-9_]{3,20}$' or t !~ '^[a-z0-9_.]{2,24}$' then raise exception 'Revisa los usuarios de Roblox y TikTok.'; end if;
  if n=any(seen_r) or t=any(seen_t) then raise exception 'Hay un usuario repetido en la plantilla.'; end if;
  seen_r=array_append(seen_r,n);seen_t=array_append(seen_t,t);
 end loop;
 if not reserve then return; end if;
 if exists(select 1 from cfp_private.applications a where a.event_id=e and a.id is distinct from exclude_id and (a.state='approved' or (a.state='pending' and a.expires_at>clock_timestamp())) and (a.payload->>'crest'=p->>'crest' or cfp_private.normal(a.payload->>'name')=cfp_private.normal(p->>'name') or regexp_replace(cfp_private.normal(a.payload->>'name'),'[0-9]','','g')=regexp_replace(cfp_private.normal(p->>'name'),'[0-9]','','g'))) then raise exception 'Escudo o nombre reservado. Elige otro sin perder tu plantilla.'; end if;
 if exists(select 1 from cfp_private.applications a cross join lateral jsonb_array_elements(a.payload->'members') m where a.event_id=e and a.id is distinct from exclude_id and (a.state='approved' or (a.state='pending' and a.expires_at>clock_timestamp())) and (regexp_replace(lower(m->>'roblox'),'^@|\s','','g')=any(seen_r) or regexp_replace(lower(m->>'tiktok'),'^@|\s','','g')=any(seen_t))) then raise exception 'Un integrante ya tiene una reserva activa en este evento.'; end if;
 if (select count(*) from cfp_private.applications a where event_id=e and a.id is distinct from exclude_id and (state='approved' or (state='pending' and expires_at>clock_timestamp()))) >= (select capacity from public.cfp_events where id=e) then raise exception 'No quedan plazas. Puedes enviar a lista de espera.'; end if;
end; $$;
revoke all on function cfp_private.validate_application(uuid,jsonb,uuid,boolean) from public,anon,authenticated;

create function public.cfp_submit_application(e uuid,p jsonb,k uuid,waiting boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events; a cfp_private.applications; payload_size int;
begin
 select * into ev from public.cfp_events where id=e for update;
 select * into a from cfp_private.applications where request_key=k;
 if found then
  if a.event_id<>e or a.payload<>p then raise exception 'Referencia de reintento inválida.'; end if;
  return jsonb_build_object('id',a.id,'state',a.state,'expires_at',a.expires_at);
 end if;
 if ev.id is null or ev.status<>'published' or ev.registration_status<>'open' then raise exception 'Las inscripciones están cerradas.'; end if;
 if k is null or octet_length(p::text)>6000 then raise exception 'Solicitud inválida.'; end if;
 perform cfp_private.expire_applications(e);
 -- A per-captain cooldown also covers repeated waiting/rejected submissions.
 if exists(select 1 from cfp_private.applications where event_id=e and created_at>clock_timestamp()-interval '1 minute' and cfp_private.normal(payload->'members'->((payload->>'captain')::int)->>'tiktok')=cfp_private.normal(p->'members'->((p->>'captain')::int)->>'tiktok')) then raise exception 'Espera un minuto antes de enviar otra solicitud.'; end if;
 perform cfp_private.validate_application(e,p,null,not waiting);
 insert into cfp_private.applications(event_id,request_key,payload,state,expires_at) values(e,k,p,case when waiting then 'waiting' else 'pending' end,case when waiting then null else clock_timestamp()+make_interval(hours=>ev.review_hours) end) returning * into a;
 insert into cfp_private.application_history(application_id,action,reason) values(a.id,a.state,'Solicitud enviada');
 return jsonb_build_object('id',a.id,'state',a.state,'expires_at',a.expires_at);
end; $$;
revoke all on function public.cfp_submit_application(uuid,jsonb,uuid,boolean) from public;
grant execute on function public.cfp_submit_application(uuid,jsonb,uuid,boolean) to anon,authenticated;

-- Explicit projection: no TikTok, request keys or private review notes leave this RPC.
create function public.cfp_public_teams(e uuid) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.payload->>'name','crest',a.payload->>'crest','number',a.payload->>'number','captain',a.payload->'captain','state',a.state,'members',(select jsonb_agg(jsonb_build_object('roblox',m->>'roblox')) from jsonb_array_elements(a.payload->'members') m)) order by a.created_at),'[]'::jsonb)
from cfp_private.applications a join public.cfp_events ev on ev.id=a.event_id where a.event_id=e and ev.status='published' and (a.state='approved' or (a.state='pending' and a.expires_at>now())); $$;
revoke all on function public.cfp_public_teams(uuid) from public;
grant execute on function public.cfp_public_teams(uuid) to anon,authenticated;

create function public.cfp_admin_applications(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado'; end if;
 perform 1 from public.cfp_events where id=e for update;
 perform cfp_private.expire_applications(e);
 return (select coalesce(jsonb_agg(to_jsonb(a)-'request_key' || jsonb_build_object('history',(select coalesce(jsonb_agg(to_jsonb(h) order by h.at desc),'[]') from cfp_private.application_history h where h.application_id=a.id)) order by a.created_at),'[]') from cfp_private.applications a where event_id=e);
end; $$;
revoke all on function public.cfp_admin_applications(uuid) from public,anon;
grant execute on function public.cfp_admin_applications(uuid) to authenticated;

create function public.cfp_review_application(aid uuid,decision text,reason text,p jsonb default null) returns void language plpgsql security definer set search_path='' as $$
declare a cfp_private.applications; ev public.cfp_events;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado'; end if;
 select * into a from cfp_private.applications where id=aid;
 if not found then raise exception 'Solicitud inexistente'; end if;
 select * into ev from public.cfp_events where id=a.event_id for update;
 perform cfp_private.expire_applications(ev.id);
 select * into a from cfp_private.applications where id=aid;
 if char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica un motivo (3–1000 caracteres).'; end if;
 if decision='reject' and a.state in ('pending','approved','waiting') then update cfp_private.applications set state='rejected' where id=aid;
 elsif decision='confirm' and a.state='pending' then update cfp_private.applications set captain_confirmed=true where id=aid;
 elsif decision='requirements' and a.state='pending' then update cfp_private.applications set requirements_checked=true where id=aid;
 elsif decision='approve' and a.state='pending' and a.captain_confirmed and a.requirements_checked then update cfp_private.applications set state='approved',expires_at=null where id=aid;
 elsif decision='promote' and a.state='waiting' and ev.registration_status='open' and ev.status='published' then
  perform cfp_private.validate_application(ev.id,a.payload,aid,true);
  update cfp_private.applications set state='pending',expires_at=clock_timestamp()+make_interval(hours=>ev.review_hours),captain_confirmed=false,requirements_checked=false where id=aid;
 elsif decision='correct' and a.state in ('pending','approved','waiting') and ev.registration_status='open' and not ev.roster_locked then
  perform cfp_private.validate_application(ev.id,p,aid,a.state<>'waiting');
  update cfp_private.applications set payload=p,captain_confirmed=false,requirements_checked=false,state=case when a.state='approved' then 'pending' else a.state end,expires_at=case when a.state='approved' then clock_timestamp()+make_interval(hours=>ev.review_hours) else a.expires_at end where id=aid;
 else raise exception 'Acción no disponible. Revisa el estado, plazo, confirmación y requisitos.';
 end if;
 insert into cfp_private.application_history(application_id,action,reason,actor) values(aid,decision,reason,auth.uid());
end; $$;
revoke all on function public.cfp_review_application(uuid,text,text,jsonb) from public,anon;
grant execute on function public.cfp_review_application(uuid,text,text,jsonb) to authenticated;

create function cfp_private.guard_event_registration() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  new.roster_locked=old.roster_locked or (old.registration_status='open' and new.registration_status='closed');
  if new.capacity < (select count(*) from cfp_private.applications where event_id=new.id and (state='approved' or (state='pending' and expires_at>clock_timestamp()))) then raise exception 'El cupo no puede ser menor que las reservas activas.'; end if;
 end if;
 if new.registration_status='open' and new.status<>'published' then raise exception 'Publica el evento antes de abrir inscripciones.'; end if;
 return new;
end; $$;
revoke all on function cfp_private.guard_event_registration() from public,anon,authenticated;
create trigger guard_registration before insert or update on public.cfp_events for each row execute function cfp_private.guard_event_registration();
-- Replace only the provisional closed-only CHECK. Existing events stay closed.
alter table public.cfp_events drop constraint cfp_events_registration_status_check;
alter table public.cfp_events add constraint cfp_events_registration_status_check check(registration_status in ('closed','open'));
comment on column public.cfp_events.registration_status is 'Owner-controlled. Atomic reservations enforced by registration RPCs.';

create extension if not exists pg_cron;
create function cfp_private.clean_expired() returns void language plpgsql security definer set search_path='' as $$
declare e uuid;
begin
 for e in select ev.id from public.cfp_events ev where exists(select 1 from cfp_private.applications a where a.event_id=ev.id and a.state='pending' and a.expires_at<=clock_timestamp()) order by ev.id for update loop
  perform cfp_private.expire_applications(e);
 end loop;
end; $$;
revoke all on function cfp_private.clean_expired() from public,anon,authenticated;
select cron.schedule('cfp-expire-reservations','* * * * *','select cfp_private.clean_expired()');
