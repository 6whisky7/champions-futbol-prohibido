create table cfp_private.leagues(event_id uuid primary key references public.cfp_events(id),state text not null default 'preview' check(state in ('preview','active','closed')),teams jsonb not null,format text not null,rounds int not null,qualified int not null,seed uuid not null default gen_random_uuid(),revision int not null default 0,lots jsonb not null default '{}',final_table jsonb,created_at timestamptz not null default now());
create table cfp_private.league_matches(id uuid primary key default gen_random_uuid(),event_id uuid not null references cfp_private.leagues(event_id),round int not null,game_order int not null,home uuid not null,away uuid not null,kind text not null default 'pending' check(kind in ('pending','postponed','sport','null','absence_home','absence_away','abandon_home','abandon_away','replay')),hg int not null default 0 check(hg>=0),ag int not null default 0 check(ag>=0),scheduled_at timestamptz,version int not null default 0,unique(event_id,round,game_order),check(home<>away));
create table cfp_private.league_history(id bigint generated always as identity primary key,event_id uuid not null references cfp_private.leagues(event_id),at timestamptz not null default clock_timestamp(),actor uuid,action text not null,reason text not null,before_value jsonb,after_value jsonb);
alter table cfp_private.leagues enable row level security;
alter table cfp_private.league_matches enable row level security;
alter table cfp_private.league_history enable row level security;
revoke all on cfp_private.leagues,cfp_private.league_matches,cfp_private.league_history from public,anon,authenticated;
create index league_history_event on cfp_private.league_history(event_id,at);

create or replace function cfp_private.league_ready(e uuid) returns jsonb language plpgsql set search_path='' as $$
declare ev public.cfp_events; n int; q int; reasons jsonb='[]';
begin
 select * into ev from public.cfp_events where id=e;
 if not found then raise exception 'Evento inexistente';end if;
 q=case ev.format when 'quarters' then 8 when 'round16' then 16 when 'round32' then 32 else 24 end;
 select count(*) into n from cfp_private.applications where event_id=e and state='approved';
 if ev.registration_status<>'closed' then reasons=reasons||'"Cierra las inscripciones."'::jsonb;end if;
 if not ev.roster_locked then reasons=reasons||'"Fija las plantillas cerrando las inscripciones tras su apertura."'::jsonb;end if;
 if exists(select 1 from cfp_private.applications where event_id=e and state='pending' and expires_at>clock_timestamp()) then reasons=reasons||'"Resuelve las solicitudes pendientes dentro de plazo."'::jsonb;end if;
 if n%2<>0 then reasons=reasons||'"Se necesita un número par de aprobados; no se excluye a nadie automáticamente."'::jsonb;end if;
 if n<q or (not ev.eliminate_after_league and n<>q) then reasons=reasons||jsonb_build_array('Participantes incompatibles: se necesitan al menos '||q||' y, sin eliminación, exactamente '||q||'.');end if;
 return jsonb_build_object('ready',jsonb_array_length(reasons)=0,'reasons',reasons,'participants',n,'qualified',q);
end;$$;
revoke all on function cfp_private.league_ready(uuid) from public,anon,authenticated;

-- One-factorization of K_n after random permutation: every selected round is a perfect matching.
create or replace function public.cfp_league_preview(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events; ids uuid[]; ring uuid[]; n int; r int; j int; d int; teams jsonb; ready jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 select * into ev from public.cfp_events where id=e for update;
 if exists(select 1 from cfp_private.leagues where event_id=e) then return jsonb_build_object('existing',true);end if;
 ready=cfp_private.league_ready(e);if not (ready->>'ready')::boolean then raise exception '%',ready->'reasons';end if;
 select array_agg(id order by random()) into ids from cfp_private.applications where event_id=e and state='approved';n=cardinality(ids);
 select jsonb_agg(jsonb_build_object('id',a.id,'name',a.payload->>'name','crest',a.payload->>'crest','dq',false) order by a.id) into teams from cfp_private.applications a where a.id=any(ids);
 d=case ev.format when 'quarters' then 4 when 'round16' then 6 else 8 end;
 insert into cfp_private.leagues(event_id,teams,format,rounds,qualified) values(e,teams,ev.format,d,(ready->>'qualified')::int);
 ring=ids;
 for r in 1..d loop
  for j in 1..n/2 loop insert into cfp_private.league_matches(event_id,round,game_order,home,away) values(e,r,j,ring[j],ring[n+1-j]);end loop;
  ring=array[ring[1],ring[n]]||ring[2:n-1];
 end loop;
 insert into cfp_private.league_history(event_id,actor,action,reason,after_value) values(e,auth.uid(),'preview','Sorteo conjunto de rivales y jornadas',jsonb_build_object('permutation',ids));
 return jsonb_build_object('created',true);
end;$$;
revoke all on function public.cfp_league_preview(uuid) from public,anon;
grant execute on function public.cfp_league_preview(uuid) to authenticated;

create or replace function cfp_private.effective_matches(e uuid) returns jsonb language sql stable set search_path='' as $$
with dq as (select (t->>'id')::uuid id from cfp_private.leagues l,jsonb_array_elements(l.teams)t where l.event_id=e and (t->>'dq')::boolean), m as(select m.*,exists(select 1 from dq where id=m.home) hd,exists(select 1 from dq where id=m.away) ad from cfp_private.league_matches m where event_id=e)
select coalesce(jsonb_agg((to_jsonb(m)-'hd'-'ad')||jsonb_build_object('kind',case when hd and ad then 'null' when hd then 'absence_home' when ad then 'absence_away' else kind end,'hg',case when hd then 0 when ad then 3 else hg end,'ag',case when ad then 0 when hd then 3 else ag end) order by round,game_order),'[]') from m;
$$;
revoke all on function cfp_private.effective_matches(uuid) from public,anon,authenticated;

-- Recursive ranking preserves separated subgroups. Direct games / mini-wins first, then overall DG/GF.
create or replace function cfp_private.rank_ties(rows jsonb,matches jsonb,lots jsonb,allow_direct boolean default true) returns jsonb language plpgsql set search_path='' as $$
declare n int=jsonb_array_length(rows); ids text[]; x jsonb; g record; groups jsonb; result jsonb='[]'; enriched jsonb; pair jsonb; key text; lot jsonb; complete boolean;
begin
 if n<=1 then return rows;end if;
 select array_agg(v->>'id' order by v->>'id') into ids from jsonb_array_elements(rows)v;
 if allow_direct then
  if n=2 then
   select m into pair from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind' not in ('pending','postponed','replay','null') limit 1;
   if pair is not null then
    return (select jsonb_agg(v||jsonb_build_object('tie_reason','Enfrentamiento directo') order by case when v->>'id'=case when (pair->>'hg')::int>(pair->>'ag')::int then pair->>'home' else pair->>'away' end then 0 else 1 end) from jsonb_array_elements(rows)v);
   end if;
  else
   select count(*)=n*(n-1)/2 into complete from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind' not in ('pending','postponed','replay');
   if complete then
    select jsonb_agg(v||jsonb_build_object('mini',(select count(*) from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind'<>'null' and ((m->>'home'=v->>'id' and (m->>'hg')::int>(m->>'ag')::int) or (m->>'away'=v->>'id' and (m->>'ag')::int>(m->>'hg')::int))))) into enriched from jsonb_array_elements(rows)v;
    if (select count(distinct v->>'mini') from jsonb_array_elements(enriched)v)>1 then
     for g in select (v->>'mini')::int score,jsonb_agg(v) arr from jsonb_array_elements(enriched)v group by 1 order by 1 desc loop
      result=result||cfp_private.rank_ties((select jsonb_agg(z||jsonb_build_object('tie_reason','Minitabla de victorias')) from jsonb_array_elements(g.arr)z),matches,lots,true);
     end loop;return result;
    end if;
   end if;
  end if;
 end if;
 for g in select (v->>'dg')::bigint dg,(v->>'gf')::bigint gf,jsonb_agg(v) arr from jsonb_array_elements(rows)v group by 1,2 order by 1 desc,2 desc loop
  if jsonb_array_length(g.arr)=1 then result=result||(g.arr->0||jsonb_build_object('tie_reason','DG y GF generales'));
  else
   select string_agg(v->>'id',',' order by v->>'id') into key from jsonb_array_elements(g.arr)v;lot=lots->key;
   select jsonb_agg(v||jsonb_build_object('tie_reason',case when lot is null then 'Sorteo pendiente' else 'Sorteo registrado' end,'tie_pending',lot is null,'tie_key',key) order by case when lot is null then 0 else array_position(array(select jsonb_array_elements_text(lot)),v->>'id') end,v->>'id') into groups from jsonb_array_elements(g.arr)v;
   result=result||groups;
  end if;
 end loop;return result;
end;$$;
revoke all on function cfp_private.rank_ties(jsonb,jsonb,jsonb,boolean) from public,anon,authenticated;

create or replace function cfp_private.league_table(e uuid) returns jsonb language plpgsql stable set search_path='' as $$
declare l cfp_private.leagues; ms jsonb; rows jsonb; r jsonb='[]'; g record; item jsonb; pos int=0; tie_start int; lastkey text='';
begin
 select * into l from cfp_private.leagues where event_id=e;ms=cfp_private.effective_matches(e);
 with stats as(select t,coalesce(sum(case when m->>'kind' not in ('pending','postponed','replay') then 1 else 0 end),0) pj,coalesce(sum(case when m->>'kind'='null' then 1 else 0 end),0) pn,
 coalesce(sum(case when m->>'kind' not in ('pending','postponed','replay','null') and ((m->>'home'=t->>'id' and (m->>'hg')::int>(m->>'ag')::int) or (m->>'away'=t->>'id' and (m->>'ag')::int>(m->>'hg')::int)) then 1 else 0 end),0) pg,
 coalesce(sum(case when m->>'kind' not in ('pending','postponed','replay','null') then case when m->>'home'=t->>'id' then (m->>'hg')::int else (m->>'ag')::int end else 0 end),0) gf,
 coalesce(sum(case when m->>'kind' not in ('pending','postponed','replay','null') then case when m->>'home'=t->>'id' then (m->>'ag')::int else (m->>'hg')::int end else 0 end),0) gc from jsonb_array_elements(l.teams)t left join jsonb_array_elements(ms)m on m->>'home'=t->>'id' or m->>'away'=t->>'id' group by t)
 select jsonb_agg(t||jsonb_build_object('pj',pj,'pg',pg,'pp',pj-pg-pn,'pn',pn,'gf',gf,'gc',gc+case when (t->>'dq')::boolean then 100 else 0 end,'administrative_gc',case when (t->>'dq')::boolean then 100 else 0 end,'dg',gf-gc-case when (t->>'dq')::boolean then 100 else 0 end,'points',case when (t->>'dq')::boolean then -12 else pg*3 end)) into rows from stats;
 for g in select (v->>'dq')::boolean dq,(v->>'points')::int pts,jsonb_agg(v) arr from jsonb_array_elements(rows)v group by 1,2 order by 1,2 desc loop
  if g.dq then r=r||g.arr;else r=r||cfp_private.rank_ties(g.arr,ms,l.lots,true);end if;
 end loop;rows='[]';
 for item in select value from jsonb_array_elements(r) loop
  pos=pos+1;if coalesce((item->>'tie_pending')::boolean,false) and lastkey=coalesce(item->>'tie_key','') then null;else tie_start=pos;end if;
  rows=rows||jsonb_build_array(item||jsonb_build_object('position',tie_start));lastkey=coalesce(item->>'tie_key','');
 end loop;return rows;
end;$$;
revoke all on function cfp_private.league_table(uuid) from public,anon,authenticated;

create or replace function public.cfp_league_read(e uuid,admin boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare l cfp_private.leagues;
begin
 admin=coalesce(admin,false);
 if admin then if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 elsif not exists(select 1 from public.cfp_events where id=e and status='published') then return null;end if;
 select * into l from cfp_private.leagues where event_id=e;
 if not found or (not admin and l.state='preview') then return case when admin then jsonb_build_object('readiness',cfp_private.league_ready(e)) else null end;end if;
 return jsonb_build_object('state',l.state,'revision',l.revision,'seed',l.seed,'rounds',l.rounds,'qualified',l.qualified,'format',l.format,'teams',l.teams,'matches',cfp_private.effective_matches(e),'table',case when l.state='closed' then l.final_table else cfp_private.league_table(e) end,'readiness',case when admin then cfp_private.league_ready(e) end,'history',case when admin then (select jsonb_agg(to_jsonb(h) order by at desc) from cfp_private.league_history h where event_id=e) end);
end;$$;
revoke all on function public.cfp_league_read(uuid,boolean) from public;
grant execute on function public.cfp_league_read(uuid,boolean) to anon,authenticated;

create or replace function cfp_private.regenerate_preview(e uuid) returns void language plpgsql set search_path='' as $$
declare ev public.cfp_events; ids uuid[]; ring uuid[]; team_snapshot jsonb; n int; d int; r int; j int;
begin
 select * into ev from public.cfp_events where id=e;
 select array_agg(id order by random()) into ids from cfp_private.applications where event_id=e and state='approved';n=cardinality(ids);
 select jsonb_agg(jsonb_build_object('id',a.id,'name',a.payload->>'name','crest',a.payload->>'crest','dq',false) order by a.id) into team_snapshot from cfp_private.applications a where a.id=any(ids);
 d=case ev.format when 'quarters' then 4 when 'round16' then 6 else 8 end;
 update cfp_private.leagues set teams=team_snapshot,format=ev.format,rounds=d,qualified=case ev.format when 'quarters' then 8 when 'round16' then 16 when 'round32' then 32 else 24 end,seed=gen_random_uuid(),lots='{}' where event_id=e;
 ring=ids;for r in 1..d loop for j in 1..n/2 loop insert into cfp_private.league_matches(event_id,round,game_order,home,away) values(e,r,j,ring[j],ring[n+1-j]);end loop;ring=array[ring[1],ring[n]]||ring[2:n-1];end loop;
end;$$;
revoke all on function cfp_private.regenerate_preview(uuid) from public,anon,authenticated;

create or replace function public.cfp_league_action(e uuid,action text,p jsonb,expected int) returns jsonb language plpgsql security definer set search_path='' as $$
declare ev public.cfp_events; l cfp_private.leagues; m cfp_private.league_matches; reason text=trim(p->>'reason'); before_doc jsonb; new_kind text; h int; a int; ids text[]; key text; lot jsonb; standings jsonb; ready jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 select * into ev from public.cfp_events where id=e for update;select * into l from cfp_private.leagues where event_id=e;
 if not found then raise exception 'Genera primero una revisión del calendario';end if;
 if action='confirm' and l.state in ('active','closed') then return jsonb_build_object('existing',true);end if;
 if expected is null or expected<0 or l.revision<>expected then raise exception 'La competición cambió en otra pestaña. Recarga antes de guardar.';end if;
 if coalesce(char_length(reason),0) not between 3 and 1000 then raise exception 'Indica un motivo de 3–1000 caracteres';end if;
 if l.state='closed' then raise exception 'Liguilla cerrada: clasificación conservada';end if;
 before_doc=to_jsonb(l)||jsonb_build_object('matches',cfp_private.effective_matches(e));
 if action='regenerate' and l.state='preview' then
  ready=cfp_private.league_ready(e);if not (ready->>'ready')::boolean then raise exception '%',ready->'reasons';end if;
  -- The new source is captured under the same event lock; old preview is retained in this audit.
  update cfp_private.leagues set state='preview' where event_id=e;
  delete from cfp_private.league_matches where event_id=e;
  perform cfp_private.regenerate_preview(e);
 elsif action='confirm' and l.state='preview' then
  ready=cfp_private.league_ready(e);if not (ready->>'ready')::boolean then raise exception '%',ready->'reasons';end if;
  if l.format<>ev.format or exists(select 1 from cfp_private.applications where event_id=e and state='approved' and not exists(select 1 from jsonb_array_elements(l.teams)t where t->>'id'=id::text)) or jsonb_array_length(l.teams)<>(ready->>'participants')::int then raise exception 'Participantes o formato cambiaron; revisa el borrador del sorteo.';end if;
  update cfp_private.leagues set state='active' where event_id=e;
 elsif l.state<>'active' then raise exception 'Confirma primero el calendario';
 elsif action='match' then
  select * into m from cfp_private.league_matches where id=(p->>'id')::uuid and event_id=e;
  if not found then raise exception 'Partido inexistente';end if;
  if exists(select 1 from jsonb_array_elements(l.teams)t where (t->>'dq')::boolean and t->>'id' in(m.home::text,m.away::text)) then raise exception 'Partido sustituido por descalificación';end if;
  new_kind=p->>'kind';h=coalesce((p->>'hg')::int,0);a=coalesce((p->>'ag')::int,0);
  if new_kind not in ('pending','postponed','sport','null','absence_home','absence_away','abandon_home','abandon_away','replay') or new_kind is null then raise exception 'Estado inválido';end if;
  if h<0 or a<0 or (new_kind='sport' and (h=a or abs(h::bigint-a::bigint)>4)) then raise exception 'Marcador inválido: ganador y diferencia máxima de cuatro, sin límite de cuatro goles totales.';end if;
  if new_kind<>'sport' then h=case when new_kind='absence_away' then 3 when new_kind='abandon_away' then 4 else 0 end;a=case when new_kind='absence_home' then 3 when new_kind='abandon_home' then 4 else 0 end;end if;
  update cfp_private.league_matches set kind=new_kind,hg=h,ag=a,scheduled_at=nullif(p->>'scheduled_at','')::timestamptz,version=version+1 where id=m.id;
  if m.kind<>new_kind or m.hg<>h or m.ag<>a then update cfp_private.leagues set lots='{}' where event_id=e;end if;
 elsif action='disqualify' then
  if not exists(select 1 from jsonb_array_elements(l.teams)t where t->>'id'=p->>'id' and not (t->>'dq')::boolean) then raise exception 'Equipo inexistente o ya descalificado';end if;
  update cfp_private.leagues set teams=(select jsonb_agg(case when t->>'id'=p->>'id' then t||'{"dq":true}'::jsonb else t end) from jsonb_array_elements(l.teams)t),lots='{}' where event_id=e;
 elsif action='lot' then
  if exists(select 1 from jsonb_array_elements(cfp_private.effective_matches(e))mx where mx->>'kind' in ('pending','postponed','replay')) then raise exception 'Resuelve todos los partidos antes del sorteo final';end if;
  key=p->>'key';standings=cfp_private.league_table(e);
  if not exists(select 1 from jsonb_array_elements(standings)t where t->>'tie_key'=key and (t->>'tie_pending')::boolean) then raise exception 'Ese empate ya no está pendiente';end if;
  select jsonb_agg(v order by random()) into lot from unnest(string_to_array(key,','))v;
  update cfp_private.leagues set lots=jsonb_set(lots,array[key],lot) where event_id=e;
 elsif action='close' then
  if exists(select 1 from jsonb_array_elements(cfp_private.effective_matches(e))mx where mx->>'kind' in ('pending','postponed','replay')) then raise exception 'Faltan encuentros por resolver';end if;
  standings=cfp_private.league_table(e);if exists(select 1 from jsonb_array_elements(standings)t where coalesce((t->>'tie_pending')::boolean,false)) then raise exception 'Faltan sorteos de desempate';end if;
  update cfp_private.leagues set state='closed',final_table=standings where event_id=e;
 else raise exception 'Acción no disponible';end if;
 update cfp_private.leagues set revision=revision+1 where event_id=e;
 insert into cfp_private.league_history(event_id,actor,action,reason,before_value,after_value) values(e,auth.uid(),action,reason,before_doc-'history',(select to_jsonb(z)||jsonb_build_object('matches',cfp_private.effective_matches(e)) from cfp_private.leagues z where z.event_id=e));
 return jsonb_build_object('saved',true);
end;$$;
revoke all on function public.cfp_league_action(uuid,text,jsonb,int) from public,anon;
grant execute on function public.cfp_league_action(uuid,text,jsonb,int) to authenticated;

create or replace function cfp_private.freeze_league_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from cfp_private.leagues where event_id=old.id and state<>'preview') and (new.registration_status<>'closed' or new.format<>old.format or new.capacity<>old.capacity or new.eliminate_after_league<>old.eliminate_after_league or not new.roster_locked) then raise exception 'Competición confirmada: inscripciones, formato y participantes fijados';end if;return new;
end;$$;
revoke all on function cfp_private.freeze_league_event() from public,anon,authenticated;
create trigger freeze_league before update on public.cfp_events for each row execute function cfp_private.freeze_league_event();
create or replace function cfp_private.freeze_league_team() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.cfp_events where id=old.event_id for update;
 if old.state='approved' and exists(select 1 from cfp_private.leagues where event_id=old.event_id and state<>'preview') and (new.state<>old.state or new.payload<>old.payload) then raise exception 'Participante fijado. Usa la decisión de descalificación de la liguilla.';end if;return new;
end;$$;
revoke all on function cfp_private.freeze_league_team() from public,anon,authenticated;
create trigger freeze_league_team before update on cfp_private.applications for each row execute function cfp_private.freeze_league_team();
