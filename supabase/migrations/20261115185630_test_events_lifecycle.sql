-- Additive. No existing row is changed. Adds a private test/demo flag to events,
-- a controlled terminal lifecycle, and excludes test events from every public
-- projection (SECURITY DEFINER functions bypass RLS, so each one is explicit).

-- Keep pre-existing event purpose unclassified; in particular do not turn the
-- existing production "Prueba Evento" into an official or private test event.
alter table public.cfp_events add column is_test boolean;
alter table public.cfp_events alter column is_test set default false;
alter table public.cfp_events add column finished_at timestamptz;
alter table public.cfp_events add column cancelled_at timestamptz;

-- Widen the publication status to include controlled terminal states.
alter table public.cfp_events drop constraint if exists cfp_events_status_check;
alter table public.cfp_events add constraint cfp_events_status_check
  check (status in ('draft','published','finished','cancelled'));

comment on column public.cfp_events.is_test is 'Owner-only rehearsal event. Never visible to anon, even when status=published.';

-- A published test event must never reach the public surface through RLS.
drop policy if exists published_events on public.cfp_events;
create policy published_events on public.cfp_events for select to anon, authenticated
  using (status in ('published','finished') and not coalesce(is_test,false));

create table cfp_private.event_lifecycle_history (
 id bigint generated always as identity primary key,
 event_id uuid not null references public.cfp_events(id),
 actor uuid,
 action text not null check(action in ('cancel','finish','restore')),
 reason text not null,
 at timestamptz not null default clock_timestamp()
);
alter table cfp_private.event_lifecycle_history enable row level security;
revoke all on cfp_private.event_lifecycle_history from public,anon,authenticated;

-- Extend the existing registration guard with lifecycle safety.
create or replace function cfp_private.guard_event_registration() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if new.is_test is distinct from old.is_test then raise exception 'La clasificación de prueba u oficial no se puede cambiar después de crear el evento.'; end if;
  new.roster_locked=old.roster_locked or (old.registration_status='open' and new.registration_status='closed');
  if new.capacity < (select count(*) from cfp_private.applications where event_id=new.id and (state='approved' or (state='pending' and expires_at>clock_timestamp()))) then raise exception 'El cupo no puede ser menor que las reservas activas.'; end if;
  if old.status='published' and new.status='draft' and (
   exists(select 1 from cfp_private.leagues l where l.event_id=new.id and l.state<>'preview') or
   exists(select 1 from cfp_private.knockouts k where k.event_id=new.id and k.state<>'preview')) then
   raise exception 'La competición ya comenzó. No puedes despublicar; finaliza o cancela el evento.';
  end if;
  if new.status in ('finished','cancelled') then new.registration_status='closed'; end if;
 end if;
 if new.registration_status='open' and new.status<>'published' then raise exception 'Publica el evento antes de abrir inscripciones.'; end if;
 return new;
end; $$;

-- Public teams: explicit projection, now also excluding test events.
create or replace function public.cfp_public_teams(e uuid) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.payload->>'name','crest',a.payload->>'crest','number',a.payload->>'number','captain',a.payload->'captain','state',a.state,'members',(select jsonb_agg(jsonb_build_object('roblox',m->>'roblox')) from jsonb_array_elements(a.payload->'members') m)) order by a.created_at),'[]'::jsonb)
from cfp_private.applications a join public.cfp_events ev on ev.id=a.event_id where a.event_id=e and ev.status in ('published','finished') and not coalesce(ev.is_test,false) and (a.state='approved' or (a.state='pending' and a.expires_at>now())); $$;

-- Public league read: only the published guard changes.
create or replace function public.cfp_league_read(e uuid,admin boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare l cfp_private.leagues;
begin
 admin=coalesce(admin,false);
 if admin then if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 elsif not exists(select 1 from public.cfp_events where id=e and status in ('published','finished') and not coalesce(is_test,false)) then return null;end if;
 select * into l from cfp_private.leagues where event_id=e;
 if not found or (not admin and l.state='preview') then return case when admin then jsonb_build_object('readiness',cfp_private.league_ready(e)) else null end;end if;
 return jsonb_build_object('state',l.state,'revision',l.revision,'seed',l.seed,'rounds',l.rounds,'qualified',l.qualified,'format',l.format,'teams',l.teams,'matches',cfp_private.effective_matches(e),'table',case when l.state='closed' then l.final_table else cfp_private.league_table(e) end,'readiness',case when admin then cfp_private.league_ready(e) end,'history',case when admin then (select jsonb_agg(to_jsonb(h) order by at desc) from cfp_private.league_history h where event_id=e) end);
end;$$;

-- Public knockout read: only the published guard changes.
create or replace function public.cfp_knockout_read(e uuid,admin boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
 admin=coalesce(admin,false);
 if admin then if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 elsif not exists(select 1 from public.cfp_events where id=e and status in ('published','finished') and not coalesce(is_test,false)) then return null;end if;
 doc=cfp_private.knockout_snapshot(e);
 if doc is null or (not admin and doc->>'state'='preview') then return null;end if;
 if admin then doc=doc||jsonb_build_object('history',(select jsonb_agg(to_jsonb(h) order by at desc) from cfp_private.knockout_history h where event_id=e));end if;return doc;
end;$$;

-- LIVE public document is shared by the anon view and the authenticated workspace.
create or replace function cfp_private.live_public_doc(e uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare ev public.cfp_events;result jsonb;
begin
 select * into ev from public.cfp_events where id=e and status='published';if not found then return null;end if;
 select coalesce(jsonb_agg((m-'source_key')||jsonb_build_object('working',case when w.match_id is null then null else jsonb_build_object('revision',w.revision,'needs_reset',w.needs_reset or w.source_key is distinct from m->>'source_key','hg',case when not w.needs_reset and w.source_key=m->>'source_key' then w.hg end,'ag',case when not w.needs_reset and w.source_key=m->>'source_key' then w.ag end,'called_at',case when not w.needs_reset and w.source_key=m->>'source_key' then w.called_at end,'updated_at',w.updated_at) end)),'[]') into result from jsonb_array_elements(cfp_private.live_matches(e))m left join cfp_private.live_working w on w.event_id=e and w.match_id=(m->>'id')::uuid;
 return jsonb_build_object('event',jsonb_build_object('id',ev.id,'name',ev.name),'now',clock_timestamp(),'matches',result);
end;$$;
revoke all on function cfp_private.live_public_doc(uuid) from public,anon,authenticated;

create or replace function public.cfp_live_public(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.cfp_events where id=e and is_test) then return null;end if;
 return cfp_private.live_public_doc(e);
end;$$;
revoke all on function public.cfp_live_public(uuid) from public;grant execute on function public.cfp_live_public(uuid) to anon,authenticated;

create or replace function public.cfp_live_read(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_role text=cfp_private.live_actor(e);doc jsonb;
begin
 if actor_role is null then raise exception 'Acceso no asignado o revocado';end if;
 doc=cfp_private.live_public_doc(e);if doc is null then raise exception 'Publica el evento antes de usar LIVE';end if;
 return doc||jsonb_build_object('role',actor_role);
end;$$;
revoke all on function public.cfp_live_read(uuid) from public,anon;grant execute on function public.cfp_live_read(uuid) to authenticated;

create or replace function public.cfp_public_evidence(e uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('match_id',x.match_id,'url',x.url,'updated_at',x.updated_at)),'[]') from cfp_private.match_evidence x join public.cfp_events ev on ev.id=x.event_id and ev.status in ('published','finished') and not coalesce(ev.is_test,false) where x.event_id=e and x.public_flag and exists(select 1 from jsonb_array_elements(cfp_private.live_matches(e))m where m->>'id'=x.match_id::text);
$$;

-- The secure ingress never accepts a test event, even if its registration is open.
create or replace function public.cfp_submit_application(e uuid,p jsonb,k uuid,waiting boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events; a cfp_private.applications; payload_size int;
begin
 select * into ev from public.cfp_events where id=e for update;
 select * into a from cfp_private.applications where request_key=k;
 if found then
  if a.event_id<>e or a.payload<>p then raise exception 'Referencia de reintento inválida.'; end if;
  return jsonb_build_object('id',a.id,'state',a.state,'expires_at',a.expires_at);
 end if;
 if ev.id is null or ev.status<>'published' or ev.registration_status<>'open' or coalesce(ev.is_test,false) then raise exception 'Las inscripciones están cerradas.'; end if;
 if k is null or octet_length(p::text)>6000 then raise exception 'Solicitud inválida.'; end if;
 perform cfp_private.expire_applications(e);
 if exists(select 1 from cfp_private.applications where event_id=e and created_at>clock_timestamp()-interval '1 minute' and cfp_private.normal(payload->'members'->((payload->>'captain')::int)->>'tiktok')=cfp_private.normal(p->'members'->((p->>'captain')::int)->>'tiktok')) then raise exception 'Espera un minuto antes de enviar otra solicitud.'; end if;
 perform cfp_private.validate_application(e,p,null,not waiting);
 insert into cfp_private.applications(event_id,request_key,payload,state,expires_at) values(e,k,p,case when waiting then 'waiting' else 'pending' end,case when waiting then null else clock_timestamp()+make_interval(hours=>ev.review_hours) end) returning * into a;
 insert into cfp_private.application_history(application_id,action,reason) values(a.id,a.state,'Solicitud enviada');
 return jsonb_build_object('id',a.id,'state',a.state,'expires_at',a.expires_at);
end; $$;

-- Owner-only fictitious teams. Only inside a test event, never in an official one.
create function public.cfp_test_seed_applications(p_event uuid,p_count integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events; i int; cap int; st text; cr text; nm text; newid uuid; members jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 if p_count is null or p_count<1 or p_count>64 then raise exception 'Indica entre 1 y 64 equipos ficticios.';end if;
 select * into ev from public.cfp_events where id=p_event for update;
 if not found then raise exception 'Evento inexistente';end if;
 if ev.is_test is distinct from true then raise exception 'Solo un evento clasificado como prueba puede generar equipos ficticios.';end if;
 if ev.registration_status<>'closed' or ev.roster_locked then raise exception 'Cierra las inscripciones antes de cargar equipos ficticios.';end if;
 if exists(select 1 from cfp_private.applications where event_id=p_event) then raise exception 'Este evento de prueba ya tiene solicitudes; no se duplican los datos ficticios.';end if;
 cap=ev.capacity;
 for i in 1..p_count loop
  nm='Prueba '||chr(65+((i-1)/26)%26)||chr(65+((i-1)%26));
  cr=lpad((((i-1)%48)+1)::text,2,'0');
  members=jsonb_build_array(
   jsonb_build_object('roblox','prueba'||i||'a','tiktok','prueba'||i||'a'),
   jsonb_build_object('roblox','prueba'||i||'b','tiktok','prueba'||i||'b'),
   jsonb_build_object('roblox','prueba'||i||'c','tiktok','prueba'||i||'c'));
  st=case when i<=cap then 'pending' else 'waiting' end;
  insert into cfp_private.applications(event_id,request_key,payload,state,expires_at)
   values(p_event,gen_random_uuid(),jsonb_build_object('name',nm,'crest',cr,'number','','captain','0','members',members),st,case when st='pending' then clock_timestamp()+make_interval(hours=>ev.review_hours) else null end)
   returning id into newid;
  insert into cfp_private.application_history(application_id,action,reason) values(newid,st,'Solicitud ficticia de prueba');
 end loop;
 return jsonb_build_object('created',p_count,'pending',least(p_count,cap),'waiting',greatest(0,p_count-cap));
end;$$;
revoke all on function public.cfp_test_seed_applications(uuid,integer) from public,anon;
grant execute on function public.cfp_test_seed_applications(uuid,integer) to authenticated;

-- Owner-only controlled lifecycle. Every change needs a written reason.
create function public.cfp_event_lifecycle(p_event uuid,p_action text,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 if coalesce(char_length(trim(p_reason)),0) not between 3 and 1000 then raise exception 'Indica un motivo (3–1000 caracteres).';end if;
 select * into ev from public.cfp_events where id=p_event for update;
 if not found then raise exception 'Evento inexistente';end if;
 if p_action='cancel' then
  if ev.status='cancelled' then raise exception 'El evento ya está cancelado.';end if;
  if ev.status='finished' then raise exception 'Un evento finalizado no se puede cancelar.';end if;
  update public.cfp_events set status='cancelled',registration_status='closed',cancelled_at=clock_timestamp() where id=p_event;
 elsif p_action='finish' then
  if ev.status='finished' then raise exception 'El evento ya está finalizado.';end if;
  if ev.status<>'published' then raise exception 'Publica el evento antes de finalizarlo.';end if;
  if not exists(select 1 from cfp_private.knockouts k where k.event_id=p_event and k.state='finished' and k.champion is not null) then raise exception 'Confirma primero el resultado de la final y el campeón.';end if;
  update public.cfp_events set status='finished',registration_status='closed',finished_at=clock_timestamp() where id=p_event;
 elsif p_action='restore' then
  if ev.status not in ('finished','cancelled') then raise exception 'Solo se restaura un evento finalizado o cancelado.';end if;
  if exists(select 1 from cfp_private.leagues l where l.event_id=p_event and l.state<>'preview') or exists(select 1 from cfp_private.knockouts k where k.event_id=p_event and k.state<>'preview') then raise exception 'La competición ya comenzó; no se puede restaurar a borrador.';end if;
  update public.cfp_events set status='draft',finished_at=null,cancelled_at=null where id=p_event;
 else raise exception 'Acción no válida.';end if;
 insert into cfp_private.event_lifecycle_history(event_id,actor,action,reason) values(p_event,auth.uid(),p_action,trim(p_reason));
end;$$;
revoke all on function public.cfp_event_lifecycle(uuid,text,text) from public,anon;
grant execute on function public.cfp_event_lifecycle(uuid,text,text) to authenticated;
