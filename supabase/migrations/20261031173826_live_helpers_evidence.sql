-- Working scores never grant authority over official competition or private applications.
create table cfp_private.event_helpers(event_id uuid not null references public.cfp_events(id),user_id uuid not null references auth.users(id) on delete cascade,active boolean not null default true,assigned_by uuid not null,updated_at timestamptz not null default clock_timestamp(),primary key(event_id,user_id));
create index event_helpers_user on cfp_private.event_helpers(user_id,event_id) where active;
create table cfp_private.live_working(event_id uuid not null references public.cfp_events(id),match_id uuid not null,source_key text not null,needs_reset boolean not null default false,hg integer not null default 0 check(hg between 0 and 99),ag integer not null default 0 check(ag between 0 and 99),called_at timestamptz,revision integer not null default 1,updated_at timestamptz not null default clock_timestamp(),updated_by uuid,primary key(event_id,match_id));
create table cfp_private.live_history(id bigint generated always as identity primary key,event_id uuid not null references public.cfp_events(id),match_id uuid,actor uuid,at timestamptz not null default clock_timestamp(),action text not null,reason text not null,before_value jsonb,after_value jsonb);
create index live_history_event on cfp_private.live_history(event_id,at desc);
create table cfp_private.match_evidence(event_id uuid not null references public.cfp_events(id),match_id uuid not null,url text not null,public_flag boolean not null default false,updated_at timestamptz not null default clock_timestamp(),updated_by uuid not null,primary key(event_id,match_id));
alter table cfp_private.event_helpers enable row level security;
alter table cfp_private.live_working enable row level security;
alter table cfp_private.live_history enable row level security;
alter table cfp_private.match_evidence enable row level security;
revoke all on cfp_private.event_helpers,cfp_private.live_working,cfp_private.live_history,cfp_private.match_evidence from public,anon,authenticated;

create function cfp_private.live_actor(e uuid) returns text language sql stable security definer set search_path='' as $$
 select case when cfp_private.is_owner() then 'owner' when exists(select 1 from cfp_private.event_helpers h join auth.users u on u.id=h.user_id join public.cfp_events ev on ev.id=h.event_id where h.event_id=e and h.user_id=auth.uid() and h.active and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false) and ev.status='published') then 'helper' end;
$$;
revoke all on function cfp_private.live_actor(uuid) from public,anon,authenticated;

-- Explicit score DTO. No roster, TikTok, review notes, helper identity or private audit.
create function cfp_private.live_matches(e uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare l cfp_private.leagues;k cfp_private.knockouts;m jsonb;h jsonb;a jsonb;result jsonb='[]';
begin
 if not exists(select 1 from public.cfp_events where id=e and status='published') then return result;end if;
 select * into l from cfp_private.leagues where event_id=e and state in('active','closed');
 if found then
  for m in select value from jsonb_array_elements(cfp_private.effective_matches(e)) loop
   select value into h from jsonb_array_elements(l.teams) where value->>'id'=m->>'home';select value into a from jsonb_array_elements(l.teams) where value->>'id'=m->>'away';
   result=result||jsonb_build_object('id',m->'id','phase','league','phase_label','Liguilla · jornada '||(m->>'round'),'home',m->'home','away',m->'away','home_name',h->>'name','away_name',a->>'name','home_crest',h->>'crest','away_crest',a->>'crest','kind',m->'kind','hg',m->'hg','ag',m->'ag','scheduled_at',m->'scheduled_at','attempt',1,'active',l.state='active','official_revision',l.revision,'source_key',md5(m::text));
  end loop;
 end if;
 select * into k from cfp_private.knockouts where event_id=e and state in('active','finished');
 if found then
  for m in select to_jsonb(x) from cfp_private.knockout_matches x where event_id=e order by round,slot loop
   select value into h from jsonb_array_elements(k.teams) where value->>'id'=m->>'home';select value into a from jsonb_array_elements(k.teams) where value->>'id'=m->>'away';
   result=result||jsonb_build_object('id',m->'id','phase','knockout','phase_label',case when m->>'round'='0' then 'Repesca' else 'Eliminatorias · partido '||(m->>'number') end,'home',m->'home','away',m->'away','home_name',h->>'name','away_name',a->>'name','home_crest',h->>'crest','away_crest',a->>'crest','kind',m->'kind','hg',m->'hg','ag',m->'ag','scheduled_at',m->'scheduled_at','attempt',m->'attempt','active',k.state='active','official_revision',k.revision,'source_key',md5(m::text));
  end loop;
 end if;
 return result;
end;$$;
revoke all on function cfp_private.live_matches(uuid) from public,anon,authenticated;

create function public.cfp_live_public(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events;result jsonb;
begin
 select * into ev from public.cfp_events where id=e and status='published';if not found then return null;end if;
 select coalesce(jsonb_agg((m-'source_key')||jsonb_build_object('working',case when w.match_id is null then null else jsonb_build_object('revision',w.revision,'needs_reset',w.needs_reset or w.source_key is distinct from m->>'source_key','hg',case when not w.needs_reset and w.source_key=m->>'source_key' then w.hg end,'ag',case when not w.needs_reset and w.source_key=m->>'source_key' then w.ag end,'called_at',case when not w.needs_reset and w.source_key=m->>'source_key' then w.called_at end,'updated_at',w.updated_at) end)),'[]') into result from jsonb_array_elements(cfp_private.live_matches(e))m left join cfp_private.live_working w on w.event_id=e and w.match_id=(m->>'id')::uuid;
 return jsonb_build_object('event',jsonb_build_object('id',ev.id,'name',ev.name),'now',clock_timestamp(),'matches',result);
end;$$;
revoke all on function public.cfp_live_public(uuid) from public;grant execute on function public.cfp_live_public(uuid) to anon,authenticated;

create function public.cfp_live_read(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_role text=cfp_private.live_actor(e);doc jsonb;
begin
 if actor_role is null then raise exception 'Acceso no asignado o revocado';end if;
 doc=public.cfp_live_public(e);if doc is null then raise exception 'Publica el evento antes de usar LIVE';end if;
 return doc||jsonb_build_object('role',actor_role);
end;$$;
revoke all on function public.cfp_live_read(uuid) from public,anon;grant execute on function public.cfp_live_read(uuid) to authenticated;

create function public.cfp_my_live_events() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'name',e.name,'starts_at',e.starts_at) order by e.starts_at),'[]') from public.cfp_events e where e.status='published' and cfp_private.live_actor(e.id) is not null;
$$;
revoke all on function public.cfp_my_live_events() from public,anon;grant execute on function public.cfp_my_live_events() to authenticated;

create function public.cfp_live_save(e uuid,mid uuid,action text,p jsonb,expected integer) returns void language plpgsql security definer set search_path='' as $$
declare actor_role text=cfp_private.live_actor(e);m jsonb;w cfp_private.live_working;had boolean;h integer;a integer;called timestamptz;why text;
begin
 if actor_role is null then raise exception 'Acceso no asignado o revocado';end if;
 perform 1 from public.cfp_events where id=e for update;
 select value into m from jsonb_array_elements(cfp_private.live_matches(e)) where value->>'id'=mid::text;
 if m is null or m->>'home' is null or m->>'away' is null or not (m->>'active')::boolean or m->>'kind' not in('pending','postponed','replay','blocked') then raise exception 'Este partido no admite marcador de trabajo';end if;
 if action is null or action not in('score','call','reset') or p is null or jsonb_typeof(p)<>'object' then raise exception 'Acción inválida';end if;
 if actor_role<>'owner' and action<>'score' then raise exception 'El ayudante solo puede editar el marcador de trabajo';end if;
 select * into w from cfp_private.live_working where event_id=e and match_id=mid for update;had=found;
 if expected is null or expected<>coalesce(w.revision,0) then raise exception 'Otro operador cambió el marcador. Actualiza antes de reintentar';end if;
 if action='score' and had and (w.needs_reset or w.source_key is distinct from m->>'source_key') then raise exception 'El partido cambió: el propietario debe preparar este intento';end if;
 why=p->>'reason';if why is null or char_length(trim(why)) not between 3 and 1000 then raise exception 'Indica un motivo de 3–1000 caracteres';end if;
 if action='score' then
  if jsonb_typeof(p->'hg') is distinct from 'number' or jsonb_typeof(p->'ag') is distinct from 'number' or p->>'hg' !~ '^[0-9]{1,2}$' or p->>'ag' !~ '^[0-9]{1,2}$' then raise exception 'Goles enteros de 0 a 99';end if;
  h=(p->>'hg')::integer;a=(p->>'ag')::integer;called=w.called_at;
 elsif action='call' then
  if p->'room_ready' is distinct from 'true'::jsonb then raise exception 'Confirma que convocaste con sala disponible';end if;
  h=0;a=0;called=clock_timestamp();
 else h=0;a=0;called=null;
 end if;
 insert into cfp_private.live_working(event_id,match_id,source_key,hg,ag,called_at,updated_by) values(e,mid,m->>'source_key',h,a,called,auth.uid()) on conflict(event_id,match_id) do update set source_key=excluded.source_key,needs_reset=false,hg=excluded.hg,ag=excluded.ag,called_at=excluded.called_at,revision=live_working.revision+1,updated_at=clock_timestamp(),updated_by=auth.uid();
 insert into cfp_private.live_history(event_id,match_id,actor,action,reason,before_value,after_value) values(e,mid,auth.uid(),action,why,case when had then to_jsonb(w) end,(select to_jsonb(x) from cfp_private.live_working x where event_id=e and match_id=mid));
end;$$;
revoke all on function public.cfp_live_save(uuid,uuid,text,jsonb,integer) from public,anon;grant execute on function public.cfp_live_save(uuid,uuid,text,jsonb,integer) to authenticated;

-- An official correction/reprogramming invalidates prior calls even if later restored to identical scores.
create function cfp_private.invalidate_live_working() returns trigger language plpgsql set search_path='' as $$
declare w cfp_private.live_working;
begin
 if old is not distinct from new then return new;end if;
 select * into w from cfp_private.live_working where event_id=new.event_id and match_id=new.id for update;
 if found then
  update cfp_private.live_working set needs_reset=true,called_at=null,revision=revision+1,updated_at=clock_timestamp() where event_id=new.event_id and match_id=new.id;
  insert into cfp_private.live_history(event_id,match_id,actor,action,reason,before_value,after_value) values(new.event_id,new.id,auth.uid(),'official_change','Cambió el partido oficial; se invalida su convocatoria de trabajo',to_jsonb(w),(select to_jsonb(x) from cfp_private.live_working x where event_id=new.event_id and match_id=new.id));
 end if;return new;
end;$$;
revoke all on function cfp_private.invalidate_live_working() from public,anon,authenticated;
create trigger invalidate_live_after_league after update on cfp_private.league_matches for each row execute function cfp_private.invalidate_live_working();
create trigger invalidate_live_after_knockout after update on cfp_private.knockout_matches for each row execute function cfp_private.invalidate_live_working();

-- Official actions remain owner-only and use the existing phase actions under the same event lock.
create function public.cfp_live_official(e uuid,mid uuid,kind text,absent uuid,expected integer,working_expected integer,reason text) returns void language plpgsql security definer set search_path='' as $$
declare m jsonb;w cfp_private.live_working;typ text;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;
 select value into m from jsonb_array_elements(cfp_private.live_matches(e)) where value->>'id'=mid::text;
 if m is null or m->>'home' is null or m->>'away' is null or not (m->>'active')::boolean or m->>'kind' not in('pending','postponed','replay','blocked') then raise exception 'Revisa el estado del partido';end if;
 select * into w from cfp_private.live_working where event_id=e and match_id=mid for update;
 if not found or working_expected is null or w.revision<>working_expected or w.needs_reset or w.source_key is distinct from m->>'source_key' then raise exception 'El marcador cambió. Actualiza antes de confirmar';end if;
 if reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica un motivo de 3–1000 caracteres';end if;
 if kind='sport' then typ='sport';
 elsif kind='absence' then
  if absent is null or absent::text not in(m->>'home',m->>'away') then raise exception 'Selecciona el equipo ausente';end if;
  if w.called_at is null or clock_timestamp()<w.called_at+interval '5 minutes' then raise exception 'La espera de cinco minutos desde convocatoria con sala disponible no ha terminado';end if;
  typ=case when absent::text=m->>'home' then 'absence_home' else 'absence_away' end;
 else raise exception 'Resolución no admitida en LIVE';end if;
 if m->>'phase'='league' then perform public.cfp_league_action(e,'match',jsonb_build_object('id',mid,'kind',typ,'hg',w.hg,'ag',w.ag,'scheduled_at',m->'scheduled_at','reason',reason),expected);
 else perform public.cfp_knockout_action(e,'match',jsonb_build_object('id',mid,'kind',typ,'hg',w.hg,'ag',w.ag,'scheduled_at',m->'scheduled_at','reason',reason),expected);end if;
 insert into cfp_private.live_history(event_id,match_id,actor,action,reason,before_value,after_value) values(e,mid,auth.uid(),'official_'||kind,reason,to_jsonb(w),jsonb_build_object('kind',typ,'absent',absent));
end;$$;
revoke all on function public.cfp_live_official(uuid,uuid,text,uuid,integer,integer,text) from public,anon;grant execute on function public.cfp_live_official(uuid,uuid,text,uuid,integer,integer,text) to authenticated;

create function public.cfp_live_helper(e uuid,email text,active boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;before_doc jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;if not found then raise exception 'Evento inexistente';end if;
 if email is null or active is null or reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica cuenta y motivo';end if;
 select id into uid from auth.users u where lower(u.email)=lower(trim(cfp_live_helper.email)) and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false);
 if uid is null then raise exception 'La cuenta debe existir y tener correo verificado. No se creó una cuenta ni se envió invitación';end if;
 if uid=auth.uid() then raise exception 'El propietario ya tiene acceso; no necesita asignarse como ayudante';end if;
 select to_jsonb(x) into before_doc from cfp_private.event_helpers x where event_id=e and user_id=uid;
 insert into cfp_private.event_helpers(event_id,user_id,active,assigned_by) values(e,uid,active,auth.uid()) on conflict(event_id,user_id) do update set active=excluded.active,assigned_by=excluded.assigned_by,updated_at=clock_timestamp();
 insert into cfp_private.live_history(event_id,actor,action,reason,before_value,after_value) values(e,auth.uid(),case when active then 'grant_helper' else 'revoke_helper' end,reason,before_doc,jsonb_build_object('user_id',uid,'active',active));
end;$$;
revoke all on function public.cfp_live_helper(uuid,text,boolean,text) from public,anon;grant execute on function public.cfp_live_helper(uuid,text,boolean,text) to authenticated;

create function public.cfp_live_evidence(e uuid,mid uuid,url text,public_flag boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
declare before_doc jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;
 if not exists(select 1 from jsonb_array_elements(cfp_private.live_matches(e))m where m->>'id'=mid::text) then raise exception 'Partido confirmado no disponible';end if;
 if public_flag is null or reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica visibilidad y motivo';end if;
 if url is not null and (char_length(url)>2000 or url ~ '[[:space:][:cntrl:]]' or url !~ '^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?([/?#]|$)') then raise exception 'Usa un enlace HTTPS válido, sin credenciales ni espacios';end if;
 select to_jsonb(x) into before_doc from cfp_private.match_evidence x where event_id=e and match_id=mid;
 if url is null then delete from cfp_private.match_evidence where event_id=e and match_id=mid;
 else insert into cfp_private.match_evidence(event_id,match_id,url,public_flag,updated_by) values(e,mid,url,public_flag,auth.uid()) on conflict(event_id,match_id) do update set url=excluded.url,public_flag=excluded.public_flag,updated_at=clock_timestamp(),updated_by=auth.uid();end if;
 insert into cfp_private.live_history(event_id,match_id,actor,action,reason,before_value,after_value) values(e,mid,auth.uid(),'evidence',reason,before_doc,(select to_jsonb(x) from cfp_private.match_evidence x where event_id=e and match_id=mid));
end;$$;
revoke all on function public.cfp_live_evidence(uuid,uuid,text,boolean,text) from public,anon;grant execute on function public.cfp_live_evidence(uuid,uuid,text,boolean,text) to authenticated;

create function public.cfp_public_evidence(e uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('match_id',x.match_id,'url',x.url,'updated_at',x.updated_at)),'[]') from cfp_private.match_evidence x join public.cfp_events ev on ev.id=x.event_id and ev.status='published' where x.event_id=e and x.public_flag and exists(select 1 from jsonb_array_elements(cfp_private.live_matches(e))m where m->>'id'=x.match_id::text);
$$;
revoke all on function public.cfp_public_evidence(uuid) from public;grant execute on function public.cfp_public_evidence(uuid) to anon,authenticated;

create function public.cfp_live_admin(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 return jsonb_build_object('helpers',(select coalesce(jsonb_agg(jsonb_build_object('user_id',h.user_id,'email',u.email,'active',h.active,'updated_at',h.updated_at)),'[]') from cfp_private.event_helpers h join auth.users u on u.id=h.user_id where h.event_id=e),'evidence',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from cfp_private.match_evidence x where x.event_id=e),'history',(select coalesce(jsonb_agg(to_jsonb(x) order by at desc),'[]') from(select * from cfp_private.live_history where event_id=e order by at desc limit 100)x),'history_total',(select count(*) from cfp_private.live_history where event_id=e));
end;$$;
revoke all on function public.cfp_live_admin(uuid) from public,anon;grant execute on function public.cfp_live_admin(uuid) to authenticated;
