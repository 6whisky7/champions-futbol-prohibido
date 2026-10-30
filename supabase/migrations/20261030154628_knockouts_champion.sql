create table cfp_private.knockouts(event_id uuid primary key references cfp_private.leagues(event_id),state text not null default 'preview' check(state in ('preview','active','finished')),origin_table jsonb not null,teams jsonb not null,format text not null,revision int not null default 0,champion jsonb,created_at timestamptz not null default now());
create table cfp_private.knockout_matches(id uuid primary key default gen_random_uuid(),event_id uuid not null references cfp_private.knockouts(event_id),number int not null,round int not null,slot int not null,home_seed int,away_seed int,home_source uuid references cfp_private.knockout_matches(id),away_source uuid references cfp_private.knockout_matches(id),home uuid,away uuid,winner uuid,loser uuid,kind text not null default 'pending' check(kind in ('pending','postponed','sport','absence_home','absence_away','abandon_home','abandon_away','replay','classification','bye','void','blocked')),hg int check(hg>=0),ag int check(ag>=0),attempt int not null default 1 check(attempt in (1,2)),scheduled_at timestamptz,unique(event_id,number),unique(event_id,round,slot));
create table cfp_private.knockout_history(id bigint generated always as identity primary key,event_id uuid not null references cfp_private.knockouts(event_id),at timestamptz not null default clock_timestamp(),actor uuid,action text not null,reason text not null,before_value jsonb,after_value jsonb);
alter table cfp_private.knockouts enable row level security;
alter table cfp_private.knockout_matches enable row level security;
alter table cfp_private.knockout_history enable row level security;
revoke all on cfp_private.knockouts,cfp_private.knockout_matches,cfp_private.knockout_history from public,anon,authenticated;
create index knockout_history_event on cfp_private.knockout_history(event_id,at);
create or replace function cfp_private.knockout_snapshot(e uuid) returns jsonb language sql stable set search_path='' as $$ select to_jsonb(k)||jsonb_build_object('matches',(select coalesce(jsonb_agg(to_jsonb(m) order by round,slot),'[]') from cfp_private.knockout_matches m where event_id=e)) from cfp_private.knockouts k where event_id=e $$;
revoke all on function cfp_private.knockout_snapshot(uuid) from public,anon,authenticated;

-- Forward propagation uses fixed source IDs, never a new ranking or draw.
create or replace function cfp_private.knockout_refresh(e uuid) returns void language plpgsql set search_path='' as $$
declare k cfp_private.knockouts;m cfp_private.knockout_matches;hs cfp_private.knockout_matches;asrc cfp_private.knockout_matches;h uuid;a uuid;hr bool;ar bool;hd bool;ad bool;w uuid;lo uuid;typ text;gh int;ga int;
begin
 select * into k from cfp_private.knockouts where event_id=e;
 for m in select * from cfp_private.knockout_matches where event_id=e order by round,slot loop
  hs=null;asrc=null;h=null;a=null;hr=true;ar=true;
  if m.home_seed is not null then select (t->>'id')::uuid into h from jsonb_array_elements(k.teams)t where (t->>'seed')::int=m.home_seed;
  else select * into hs from cfp_private.knockout_matches where id=m.home_source;h=hs.winner;hr=hs.kind in ('sport','absence_home','absence_away','abandon_home','abandon_away','classification','bye','void');end if;
  if m.away_seed is not null then select (t->>'id')::uuid into a from jsonb_array_elements(k.teams)t where (t->>'seed')::int=m.away_seed;
  else select * into asrc from cfp_private.knockout_matches where id=m.away_source;a=asrc.winner;ar=asrc.kind in ('sport','absence_home','absence_away','abandon_home','abandon_away','classification','bye','void');end if;
  if (m.home is distinct from h or m.away is distinct from a) and (m.kind not in ('pending','postponed','bye','void','blocked') or (m.attempt>1 and m.kind<>'pending')) then raise exception 'Dependencia: el partido % ya tiene un intento o resultado. Revísalo y retíralo explícitamente antes de cambiar su origen.',m.number;end if;
  select coalesce(bool_or((t->>'dq')::boolean),false) into hd from jsonb_array_elements(k.teams)t where t->>'id'=h::text;
  select coalesce(bool_or((t->>'dq')::boolean),false) into ad from jsonb_array_elements(k.teams)t where t->>'id'=a::text;
  typ=m.kind;w=m.winner;lo=m.loser;gh=m.hg;ga=m.ag;
  if m.home is distinct from h or m.away is distinct from a or typ in ('bye','void','blocked') then typ='pending';w=null;lo=null;gh=null;ga=null;end if;
  if hr and ar and ((h is null or hd) and (a is null or ad)) then typ='void';w=null;lo=null;gh=null;ga=null;
  elsif hr and ar and ((h is null and not ad) or (a is null and not hd)) then typ='bye';w=coalesce(h,a);lo=null;gh=null;ga=null;
  elsif (hd or ad) then
   if w is null or (w=h and hd) or (w=a and ad) then typ='blocked';w=null;lo=null;gh=null;ga=null;end if;
  end if;
  update cfp_private.knockout_matches set home=h,away=a,kind=typ,winner=w,loser=lo,hg=gh,ag=ga where id=m.id;
 end loop;
end;$$;
revoke all on function cfp_private.knockout_refresh(uuid) from public,anon,authenticated;

create or replace function public.cfp_knockout_preview(e uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare l cfp_private.leagues;n int;order_seeds int[];next_order int[];s int;r int;i int;num int=0;h uuid;aid uuid;prev uuid[];curr uuid[];rep uuid[];tm jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;
 if exists(select 1 from cfp_private.knockouts where event_id=e) then return jsonb_build_object('existing',true);end if;
 select * into l from cfp_private.leagues where event_id=e;
 if not found or l.state<>'closed' or l.final_table is null or exists(select 1 from jsonb_array_elements(l.final_table)t where coalesce((t->>'tie_pending')::boolean,false)) then raise exception 'Cierra primero la liguilla y resuelve sus desempates.';end if;
 n=case l.format when 'quarters' then 8 when 'round16' then 16 when 'round32' then 32 else 24 end;
 if (select count(*) from jsonb_array_elements(l.final_table)t where not (t->>'dq')::boolean)<n then raise exception 'Faltan equipos habilitados para completar el formato. No se generan sustitutos ni pases libres.';end if;
 select jsonb_agg(t||jsonb_build_object('seed',pos,'members',(select jsonb_agg(jsonb_build_object('roblox',p->>'roblox','role',case when j=4 then 'Suplente' else 'Titular' end,'captain',(j-1)::text=a.payload->>'captain') order by j) from jsonb_array_elements(a.payload->'members') with ordinality mm(p,j)))) into tm from (select v t,row_number() over(order by ord) pos from jsonb_array_elements(l.final_table) with ordinality src(v,ord) where not (v->>'dq')::boolean order by ord limit n) ranked join cfp_private.applications a on a.id=(t->>'id')::uuid and a.event_id=e and a.state='approved';
 if jsonb_array_length(tm)<>n then raise exception 'La plantilla de origen está incompleta';end if;
 insert into cfp_private.knockouts(event_id,origin_table,teams,format) values(e,l.final_table,tm,l.format);
 if l.format='repechage' then
  rep='{}';for i in 9..16 loop num=num+1;insert into cfp_private.knockout_matches(event_id,number,round,slot,home_seed,away_seed) values(e,num,0,i-8,i,33-i) returning id into aid;rep=array_append(rep,aid);end loop;
  order_seeds=array[1,8,3,6,2,7,4,5];n=16;
 else order_seeds=array[1,3,2,4];if n>=16 then order_seeds=array[1,8,3,6,2,7,4,5];end if;
  if n=32 then next_order='{}';foreach s in array order_seeds loop next_order=next_order||array[s,17-s];end loop;order_seeds=next_order;end if;
 end if;
 curr='{}';for i in 1..cardinality(order_seeds) loop num=num+1;s=order_seeds[i];
  if l.format='repechage' then insert into cfp_private.knockout_matches(event_id,number,round,slot,home_seed,away_source) values(e,num,1,i,s,rep[9-s]) returning id into aid;
  else insert into cfp_private.knockout_matches(event_id,number,round,slot,home_seed,away_seed) values(e,num,1,i,s,n+1-s) returning id into aid;end if;curr=array_append(curr,aid);
 end loop;
 r=2;while cardinality(curr)>1 loop prev=curr;curr='{}';for i in 1..cardinality(prev)/2 loop num=num+1;insert into cfp_private.knockout_matches(event_id,number,round,slot,home_source,away_source) values(e,num,r,i,prev[2*i-1],prev[2*i]) returning id into aid;curr=array_append(curr,aid);end loop;r=r+1;end loop;
 perform cfp_private.knockout_refresh(e);
 insert into cfp_private.knockout_history(event_id,actor,action,reason,after_value) values(e,auth.uid(),'preview','Cuadro fijo desde clasificación final',cfp_private.knockout_snapshot(e));
 return jsonb_build_object('created',true);
end;$$;
revoke all on function public.cfp_knockout_preview(uuid) from public,anon;
grant execute on function public.cfp_knockout_preview(uuid) to authenticated;

create or replace function public.cfp_knockout_read(e uuid,admin boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
 admin=coalesce(admin,false);
 if admin then if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 elsif not exists(select 1 from public.cfp_events where id=e and status='published') then return null;end if;
 doc=cfp_private.knockout_snapshot(e);
 if doc is null or (not admin and doc->>'state'='preview') then return null;end if;
 -- Public snapshot contains only Roblox roster; private reasons remain in the separate audit table.
 if admin then doc=doc||jsonb_build_object('history',(select jsonb_agg(to_jsonb(h) order by at desc) from cfp_private.knockout_history h where event_id=e));end if;return doc;
end;$$;
revoke all on function public.cfp_knockout_read(uuid,boolean) from public;
grant execute on function public.cfp_knockout_read(uuid,boolean) to anon,authenticated;

create or replace function public.cfp_knockout_action(e uuid,action text,p jsonb,expected int) returns jsonb language plpgsql security definer set search_path='' as $$
declare k cfp_private.knockouts;m cfp_private.knockout_matches;f cfp_private.knockout_matches;before_doc jsonb;reason text=trim(p->>'reason');typ text;w uuid;lo uuid;h int;a int;champ jsonb;runner jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;select * into k from cfp_private.knockouts where event_id=e;
 if not found then raise exception 'Genera primero la revisión del cuadro';end if;
 if action='confirm' and k.state in ('active','finished') then return jsonb_build_object('existing',true);end if;
 if expected is null or expected<0 or k.revision<>expected then raise exception 'El cuadro cambió en otra pestaña. Recarga antes de guardar.';end if;
 if coalesce(char_length(reason),0) not between 3 and 1000 then raise exception 'Indica un motivo de 3–1000 caracteres';end if;
 if k.state='finished' then raise exception 'Evento terminado: campeón conservado. Los casos posteriores requieren una decisión aún no definida.';end if;
 before_doc=cfp_private.knockout_snapshot(e);
 if action='confirm' and k.state='preview' then
  if not exists(select 1 from cfp_private.leagues where event_id=e and state='closed' and final_table=k.origin_table and format=k.format) then raise exception 'La clasificación de origen cambió';end if;
  update cfp_private.knockouts set state='active' where event_id=e;
 elsif k.state<>'active' then raise exception 'Confirma primero el cuadro';
 elsif action='schedule' then
  update cfp_private.knockout_matches set scheduled_at=nullif(p->>'scheduled_at','')::timestamptz where event_id=e and id=(p->>'id')::uuid;
  if not found then raise exception 'Encuentro inexistente';end if;
 elsif action in ('match','reset','double_absence') then
  select * into m from cfp_private.knockout_matches where id=(p->>'id')::uuid and event_id=e;
  if not found then raise exception 'Encuentro inexistente';end if;
  if action='reset' then update cfp_private.knockout_matches set kind='pending',hg=null,ag=null,winner=null,loser=null where id=m.id;
  elsif action='double_absence' then
   if m.home is null or m.away is null or m.kind in ('bye','void','blocked') then raise exception 'Faltan participantes habilitados';end if;
   if m.attempt=1 then update cfp_private.knockout_matches set attempt=2,kind='postponed',hg=null,ag=null,winner=null,loser=null,scheduled_at=null where id=m.id;
   else
    select (t->>'id')::uuid into w from jsonb_array_elements(k.teams)t where t->>'id' in(m.home::text,m.away::text) and not (t->>'dq')::boolean order by (t->>'seed')::int limit 1;
    if w is null then raise exception 'No hay ganador habilitado: pendiente de decisión administrativa';end if;
    update cfp_private.knockout_matches set kind='classification',hg=null,ag=null,winner=w,loser=case when w=m.home then m.away else m.home end where id=m.id;
   end if;
  else
   typ=p->>'kind';if typ is null or typ not in ('pending','postponed','sport','absence_home','absence_away','abandon_home','abandon_away','replay') then raise exception 'Decisión inválida';end if;
   h=null; a=null;w=null;lo=null;
   if typ not in ('pending','postponed','replay') then
    if m.home is null or m.away is null then raise exception 'Falta conocer un participante';end if;
    if typ='sport' then h=(p->>'hg')::int;a=(p->>'ag')::int;if h is null or a is null or h<0 or a<0 or h=a or abs(h::bigint-a::bigint)>4 then raise exception 'Marcador deportivo inválido: ganador, enteros no negativos y diferencia máxima de cuatro.';end if;
    else h=case when typ='absence_away' then 3 when typ='abandon_away' then 4 else 0 end;a=case when typ='absence_home' then 3 when typ='abandon_home' then 4 else 0 end;end if;
    w=case when h>a then m.home else m.away end;lo=case when w=m.home then m.away else m.home end;
    if exists(select 1 from jsonb_array_elements(k.teams)t where t->>'id'=w::text and (t->>'dq')::boolean) then raise exception 'Un equipo inhabilitado no puede avanzar';end if;
   end if;
   update cfp_private.knockout_matches set kind=typ,hg=h,ag=a,winner=w,loser=lo,scheduled_at=nullif(p->>'scheduled_at','')::timestamptz where id=m.id;
  end if;
  perform cfp_private.knockout_refresh(e);
 elsif action='ineligible' then
  if not exists(select 1 from jsonb_array_elements(k.teams)t where t->>'id'=p->>'id' and not (t->>'dq')::boolean) then raise exception 'Equipo inexistente o ya inhabilitado';end if;
  update cfp_private.knockouts set teams=(select jsonb_agg(case when t->>'id'=p->>'id' then t||'{"dq":true}' else t end) from jsonb_array_elements(k.teams)t) where event_id=e;
  perform cfp_private.knockout_refresh(e);
 elsif action='close' then
  select * into f from cfp_private.knockout_matches where event_id=e order by round desc,slot limit 1;
  if f.winner is null or f.kind not in ('sport','absence_home','absence_away','abandon_home','abandon_away','classification','bye') or exists(select 1 from jsonb_array_elements(k.teams)t where t->>'id'=f.winner::text and (t->>'dq')::boolean) then raise exception 'La final no tiene campeón habilitado. Pendiente de decisión administrativa.';end if;
  select t into champ from jsonb_array_elements(k.teams)t where t->>'id'=f.winner::text;select t into runner from jsonb_array_elements(k.teams)t where t->>'id'=f.loser::text;
  update cfp_private.knockouts set state='finished',champion=jsonb_build_object('team',champ,'runner_up',runner,'final',to_jsonb(f),'event_name',(select name from public.cfp_events where id=e),'closed_at',clock_timestamp()) where event_id=e;
 else raise exception 'Acción no disponible';end if;
 update cfp_private.knockouts set revision=revision+1 where event_id=e;
 insert into cfp_private.knockout_history(event_id,actor,action,reason,before_value,after_value) values(e,auth.uid(),action,reason,before_doc,cfp_private.knockout_snapshot(e));
 return jsonb_build_object('saved',true);
end;$$;
revoke all on function public.cfp_knockout_action(uuid,text,jsonb,int) from public,anon;
grant execute on function public.cfp_knockout_action(uuid,text,jsonb,int) to authenticated;
