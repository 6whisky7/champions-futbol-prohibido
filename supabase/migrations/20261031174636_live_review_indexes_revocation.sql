-- Cover review history growth and fixed bracket source lookups without changing data/policies.
create index application_history_application_time on cfp_private.application_history(application_id,at desc);
create index knockout_matches_home_source on cfp_private.knockout_matches(home_source);
create index knockout_matches_away_source on cfp_private.knockout_matches(away_source);
-- Assignment requires verification; revocation must also work after verification is lost.
create or replace function public.cfp_live_helper(e uuid,email text,active boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid;before_doc jsonb;
begin
 if not cfp_private.is_owner() then raise exception 'Acceso denegado';end if;
 perform 1 from public.cfp_events where id=e for update;if not found then raise exception 'Evento inexistente';end if;
 if email is null or active is null or reason is null or char_length(trim(reason)) not between 3 and 1000 then raise exception 'Indica cuenta y motivo';end if;
 if active then
  select id into uid from auth.users u where lower(u.email)=lower(trim(cfp_live_helper.email)) and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false);
  if uid is null then raise exception 'La cuenta debe existir y tener correo verificado. No se creó una cuenta ni se envió invitación';end if;
 else
  select h.user_id into uid from cfp_private.event_helpers h join auth.users u on u.id=h.user_id where h.event_id=e and lower(u.email)=lower(trim(cfp_live_helper.email));
  if uid is null then raise exception 'No existe una asignación de esa cuenta en este evento';end if;
 end if;
 if uid=auth.uid() then raise exception 'El propietario ya tiene acceso; no necesita asignarse como ayudante';end if;
 select to_jsonb(x) into before_doc from cfp_private.event_helpers x where event_id=e and user_id=uid;
 insert into cfp_private.event_helpers(event_id,user_id,active,assigned_by) values(e,uid,active,auth.uid()) on conflict(event_id,user_id) do update set active=excluded.active,assigned_by=excluded.assigned_by,updated_at=clock_timestamp();
 insert into cfp_private.live_history(event_id,actor,action,reason,before_value,after_value) values(e,auth.uid(),case when active then 'grant_helper' else 'revoke_helper' end,reason,before_doc,jsonb_build_object('user_id',uid,'active',active));
end;$$;
revoke all on function public.cfp_live_helper(uuid,text,boolean,text) from public,anon;grant execute on function public.cfp_live_helper(uuid,text,boolean,text) to authenticated;
