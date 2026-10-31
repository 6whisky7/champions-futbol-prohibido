-- Additive private review detail. Existing approved teams retain their status and legacy global review.
alter table cfp_private.applications add column member_checks jsonb not null default '[]' check(jsonb_typeof(member_checks)='array');
alter table cfp_private.application_history add column before_checks jsonb,add column after_checks jsonb;
create function cfp_private.member_checks(n integer,checked boolean) returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('follow',checked,'group',checked,'friend',checked) order by j),'[]') from generate_series(1,n)j;
$$;
revoke all on function cfp_private.member_checks(integer,boolean) from public,anon,authenticated;
create function cfp_private.checks_complete(checks jsonb,n integer) returns boolean language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(checks)='array' and jsonb_array_length(checks)=n and n between 3 and 4 and not exists(select 1 from jsonb_array_elements(checks)v where v->'follow' is distinct from 'true'::jsonb or v->'group' is distinct from 'true'::jsonb or v->'friend' is distinct from 'true'::jsonb),false);
$$;
revoke all on function cfp_private.checks_complete(jsonb,integer) from public,anon,authenticated;
create or replace function public.cfp_review_application(aid uuid,decision text,reason text,p jsonb default null) returns void language plpgsql security definer set search_path='' as $$
declare a cfp_private.applications; ev public.cfp_events;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado'; end if;
 select * into a from cfp_private.applications where id=aid;
 if not found then raise exception 'Solicitud inexistente'; end if;
 select * into ev from public.cfp_events where id=a.event_id for update;
 perform cfp_private.expire_applications(ev.id);
 select * into a from cfp_private.applications where id=aid;
 if reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica un motivo (3–1000 caracteres).'; end if;
 if decision='reject' and a.state in ('pending','approved','waiting') then update cfp_private.applications set state='rejected' where id=aid;
 elsif decision='confirm' and a.state='pending' then update cfp_private.applications set captain_confirmed=true where id=aid;
 elsif decision='requirements' and a.state='pending' then update cfp_private.applications set requirements_checked=true,member_checks=cfp_private.member_checks(jsonb_array_length(a.payload->'members'),true) where id=aid;
 elsif decision='approve' and a.state='pending' and a.captain_confirmed and a.requirements_checked and cfp_private.checks_complete(a.member_checks,jsonb_array_length(a.payload->'members')) then update cfp_private.applications set state='approved',expires_at=null where id=aid;
 elsif decision='promote' and a.state='waiting' and ev.registration_status='open' and ev.status='published' then
  perform cfp_private.validate_application(ev.id,a.payload,aid,true);
  update cfp_private.applications set state='pending',expires_at=clock_timestamp()+make_interval(hours=>ev.review_hours),captain_confirmed=false,requirements_checked=false,member_checks='[]' where id=aid;
 elsif decision='correct' and a.state in ('pending','approved','waiting') and ev.registration_status='open' and not ev.roster_locked then
  perform cfp_private.validate_application(ev.id,p,aid,a.state<>'waiting');
  update cfp_private.applications set payload=p,captain_confirmed=false,requirements_checked=false,member_checks='[]',state=case when a.state='approved' then 'pending' else a.state end,expires_at=case when a.state='approved' then clock_timestamp()+make_interval(hours=>ev.review_hours) else a.expires_at end where id=aid;
 else raise exception 'Acción no disponible. Revisa el estado, plazo, confirmación y requisitos.';
 end if;
 insert into cfp_private.application_history(application_id,action,reason,actor,before_payload,after_payload,before_checks,after_checks) values(aid,decision,reason,auth.uid(),case when decision in('correct','requirements') then a.payload end,case when decision='correct' then p when decision='requirements' then a.payload end,a.member_checks,(select member_checks from cfp_private.applications where id=aid));
end; $$;

create function public.cfp_set_requirement(aid uuid,member_index integer,requirement text,checked boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
declare a cfp_private.applications; checks jsonb; complete boolean;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 select * into a from cfp_private.applications where id=aid;
 if not found then raise exception 'Solicitud inexistente';end if;
 perform 1 from public.cfp_events where id=a.event_id for update;
 perform cfp_private.expire_applications(a.event_id);
 select * into a from cfp_private.applications where id=aid;
 if a.state<>'pending' then raise exception 'Solo se revisan requisitos de solicitudes pendientes';end if;
 if member_index is null or member_index<0 or member_index>=jsonb_array_length(a.payload->'members') or checked is null or requirement is null or requirement not in('follow','group','friend') or reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Revisa integrante, requisito y motivo (3–1000 caracteres)';end if;
 checks=case when jsonb_array_length(a.member_checks)=jsonb_array_length(a.payload->'members') then a.member_checks else cfp_private.member_checks(jsonb_array_length(a.payload->'members'),false) end;
 checks=jsonb_set(checks,array[member_index::text,requirement],to_jsonb(checked));
 complete=cfp_private.checks_complete(checks,jsonb_array_length(a.payload->'members'));
 update cfp_private.applications set member_checks=checks,requirements_checked=complete where id=aid;
 insert into cfp_private.application_history(application_id,action,reason,actor,before_payload,after_payload,before_checks,after_checks) values(aid,'requirement',reason,auth.uid(),a.payload,a.payload,a.member_checks,checks);
end;$$;
revoke all on function public.cfp_set_requirement(uuid,integer,text,boolean,text) from public,anon;
grant execute on function public.cfp_set_requirement(uuid,integer,text,boolean,text) to authenticated;

create or replace function cfp_private.rank_ties(rows jsonb,matches jsonb,lots jsonb,allow_direct boolean default true) returns jsonb language plpgsql set search_path='' as $$
declare n int=jsonb_array_length(rows); ids text[]; x jsonb; g record; groups jsonb; result jsonb='[]'; enriched jsonb; pair jsonb; key text; lot jsonb; complete boolean;
begin
 if n<=1 then return rows;end if;
 select array_agg(v->>'id' order by v->>'id') into ids from jsonb_array_elements(rows)v;
 if allow_direct then
  if n=2 then
   select m into pair from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind' not in ('pending','postponed','replay','null') limit 1;
   if pair is not null then
    return (select jsonb_agg(v||jsonb_build_object('tie_reason','Enfrentamiento directo','tie_opponent',case when v->>'id'=pair->>'home' then pair->>'away' else pair->>'home' end) order by case when v->>'id'=case when (pair->>'hg')::int>(pair->>'ag')::int then pair->>'home' else pair->>'away' end then 0 else 1 end) from jsonb_array_elements(rows)v);
   end if;
  else
   select count(*)=n*(n-1)/2 into complete from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind' not in ('pending','postponed','replay');
   if complete then
    select jsonb_agg(v||jsonb_build_object('mini',(select count(*) from jsonb_array_elements(matches)m where m->>'home'=any(ids) and m->>'away'=any(ids) and m->>'kind'<>'null' and ((m->>'home'=v->>'id' and (m->>'hg')::int>(m->>'ag')::int) or (m->>'away'=v->>'id' and (m->>'ag')::int>(m->>'hg')::int))))) into enriched from jsonb_array_elements(rows)v;
    if (select count(distinct v->>'mini') from jsonb_array_elements(enriched)v)>1 then
     for g in select (v->>'mini')::int score,jsonb_agg(v) arr from jsonb_array_elements(enriched)v group by 1 order by 1 desc loop
      result=result||cfp_private.rank_ties((select jsonb_agg(z||jsonb_build_object('tie_reason','Minitabla de victorias','tie_mini_teams',to_jsonb(ids),'tie_mini_wins',(z->>'mini')::int)) from jsonb_array_elements(g.arr)z),matches,lots,true);
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
