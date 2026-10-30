alter table cfp_private.application_history add column before_payload jsonb, add column after_payload jsonb;
create or replace function public.cfp_review_application(aid uuid,decision text,reason text,p jsonb default null) returns void language plpgsql security definer set search_path='' as $$
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
 insert into cfp_private.application_history(application_id,action,reason,actor,before_payload,after_payload) values(aid,decision,reason,auth.uid(),case when decision='correct' then a.payload end,case when decision='correct' then p end);
end; $$;
