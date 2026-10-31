-- Only additive data/schema changes. The old public write entry is revoked.
create table cfp_private.ingress_config (
 singleton boolean primary key default true check(singleton),
 signing_key text check(length(signing_key)>=32)
);
insert into cfp_private.ingress_config(singleton) values(true);
alter table cfp_private.ingress_config enable row level security;
revoke all on cfp_private.ingress_config from public,anon,authenticated;

create table cfp_private.privacy_config (
 singleton boolean primary key default true check(singleton),
 active boolean not null default false,
 version text check(version ~ '^[A-Za-z0-9._-]{1,64}$'),
 check(not active or version is not null)
);
insert into cfp_private.privacy_config(singleton) values(true);
alter table cfp_private.privacy_config enable row level security;
revoke all on cfp_private.privacy_config from public,anon,authenticated;

create table cfp_private.submission_limits (
 client_digest text not null check(client_digest ~ '^[a-f0-9]{64}$'),
 window_seconds integer not null check(window_seconds in(60,3600)),
 bucket bigint not null, hits integer not null check(hits>0),
 expires_at timestamptz not null,
 primary key(client_digest,window_seconds,bucket)
);
create index submission_limits_expiry on cfp_private.submission_limits(expires_at);
alter table cfp_private.submission_limits enable row level security;
revoke all on cfp_private.submission_limits from public,anon,authenticated;
alter table cfp_private.applications add column accepted_privacy_version text;
alter table cfp_private.applications add column accepted_privacy_at timestamptz;

create function public.cfp_registration_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enabled',active,'version',case when active then version else null end)
 from cfp_private.privacy_config where singleton;
$$;
revoke all on function public.cfp_registration_status() from public;
grant execute on function public.cfp_registration_status() to anon,authenticated;

create function cfp_private.guard_registration_privacy() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.registration_status='open' and not coalesce((select active from cfp_private.privacy_config where singleton),false) then
  raise exception 'Antes de abrir, confirma el aviso de privacidad, la conservación y la participación de menores.';
 end if;
 return new;
end;
$$;
revoke all on function cfp_private.guard_registration_privacy() from public,anon,authenticated;
create trigger cfp_registration_privacy before insert or update on public.cfp_events
 for each row execute function cfp_private.guard_registration_privacy();

-- A caller cannot choose another client digest or payload: all fields are signed
-- by the server, using a private key unavailable to anon/authenticated.
create function public.cfp_submit_application_secure(
 e uuid,k uuid,raw_payload text,waiting boolean,issued bigint,
 client_digest text,policy_version text,proof text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare secret text; expected text; message text; payload jsonb; existing cfp_private.applications;
 result jsonb; cfg cfp_private.privacy_config; seconds integer; count_hits integer;
 now_seconds bigint=floor(extract(epoch from clock_timestamp()))::bigint;
begin
 if e is null or k is null or raw_payload is null or octet_length(raw_payload)>6000 or waiting is null
    or issued is null or issued<now_seconds-300 or issued>now_seconds+30
    or client_digest is null or client_digest !~ '^[a-f0-9]{64}$'
    or policy_version is null or policy_version !~ '^[A-Za-z0-9._-]{1,64}$'
    or proof is null or proof !~ '^[a-f0-9]{64}$' then
  raise exception 'Envío inválido. Reintenta desde el formulario.';
 end if;
 select signing_key into secret from cfp_private.ingress_config where singleton;
 if secret is null then raise exception 'La recepción de solicitudes está pendiente de configuración.';end if;
 message=e::text||E'\n'||k::text||E'\n'||issued::text||E'\n'||client_digest||E'\n'||case when waiting then '1' else '0' end||E'\n'||raw_payload||E'\n'||policy_version;
 expected=encode(extensions.hmac(message,secret,'sha256'),'hex');
 -- Compare hashes of MACs rather than attacker-chosen MAC prefixes.
 if extensions.digest(proof,'sha256')<>extensions.digest(expected,'sha256') then raise exception 'Envío no autorizado.';end if;
 select * into cfg from cfp_private.privacy_config where singleton;
 if not cfg.active or cfg.version is distinct from policy_version then
  return jsonb_build_object('error','El aviso de privacidad no está confirmado o cambió. Conservamos tus datos; consulta al organizador.');
 end if;
 begin payload=raw_payload::jsonb;exception when others then return jsonb_build_object('error','Revisa los datos del formulario.');end;
 -- A successful exact retry is not charged again and never creates duplicates.
 select * into existing from cfp_private.applications where request_key=k;
 if found then
  if existing.event_id<>e or existing.payload<>payload then return jsonb_build_object('error','Referencia de reintento inválida.');end if;
  return jsonb_build_object('result',jsonb_build_object('id',existing.id,'state',existing.state,'expires_at',existing.expires_at));
 end if;
 perform pg_advisory_xact_lock(hashtextextended(client_digest,71031));
 select * into existing from cfp_private.applications where request_key=k;
 if found and existing.event_id=e and existing.payload=payload then
  return jsonb_build_object('result',jsonb_build_object('id',existing.id,'state',existing.state,'expires_at',existing.expires_at));
 end if;
 delete from cfp_private.submission_limits where expires_at<clock_timestamp();
 foreach seconds in array array[60,3600] loop
  insert into cfp_private.submission_limits as limits(client_digest,window_seconds,bucket,hits,expires_at)
   values(client_digest,seconds,now_seconds/seconds,1,to_timestamp((now_seconds/seconds+1)*seconds))
   on conflict on constraint submission_limits_pkey do update set hits=limits.hits+1 returning hits into count_hits;
  if count_hits>(case when seconds=60 then 6 else 20 end) then
   return jsonb_build_object('error','Has realizado varios envíos desde esta conexión. Espera antes de reintentar; conservamos tus datos.');
  end if;
 end loop;
 -- Failed validation consumes an attempt; only the core mutation rolls back.
 begin
  result=public.cfp_submit_application(e,payload,k,waiting);
  update cfp_private.applications set accepted_privacy_version=policy_version,accepted_privacy_at=clock_timestamp()
   where id=(result->>'id')::uuid and accepted_privacy_version is null;
  return jsonb_build_object('result',result);
 exception when others then return jsonb_build_object('error',sqlerrm);
 end;
end;
$$;
revoke all on function public.cfp_submit_application_secure(uuid,uuid,text,boolean,bigint,text,text,text) from public;
grant execute on function public.cfp_submit_application_secure(uuid,uuid,text,boolean,bigint,text,text,text) to anon,authenticated;
revoke execute on function public.cfp_submit_application(uuid,jsonb,uuid,boolean) from public,anon,authenticated;


-- Security counters are short-lived, independently of participant retention.
do $cleanup$
begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute $schedule$select cron.schedule('cfp-prune-ingress','*/15 * * * *','delete from cfp_private.submission_limits where expires_at<now()')$schedule$;
 end if;
end;
$cleanup$;
