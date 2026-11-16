-- Atomic setup for the owner’s private eight-team rehearsal. The production
-- registration gate remains closed and there are no public grants on the helper.
create function cfp_private.prepare_test_event(
  p_name text,
  p_starts_at timestamptz,
  p_teams jsonb
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  event_id uuid;
  application_id uuid;
  roster jsonb;
begin
  if p_name is null or char_length(trim(p_name)) not between 3 and 100
    or p_starts_at is null or not isfinite(p_starts_at)
    or jsonb_typeof(p_teams) is distinct from 'array' then
    raise exception 'Revisa el nombre, la fecha y las plantillas de prueba.';
  end if;
  if jsonb_array_length(p_teams) <> 8 then
    raise exception 'El ensayo de cuartos requiere ocho equipos.';
  end if;

  -- Serialize provisioning so a retry never creates another edition by name.
  perform pg_advisory_xact_lock(hashtextextended('cfp-test-event:' || lower(trim(p_name)), 0));
  if exists (select 1 from public.cfp_events where lower(name) = lower(trim(p_name))) then
    raise exception 'Ya existe un evento con ese nombre. Consulta el panel.';
  end if;
  insert into public.cfp_events
    (name, description, starts_at, capacity, format, eliminate_after_league,
     status, is_test, registration_status, roster_locked)
  values
    (trim(p_name), 'Ensayo privado con plantillas ficticias. Calendario pendiente.',
     p_starts_at, 8, 'quarters', false, 'published', true, 'closed', true)
  returning id into event_id;

  for roster in select value from jsonb_array_elements(p_teams)
  loop
    perform cfp_private.validate_application(event_id, roster, null, true);
    if exists (
      select 1 from jsonb_array_elements(roster->'members') member
      where member->>'roblox' !~ '^CFP_Test[A-Za-z0-9_]+$'
        or member->>'tiktok' !~ '^cfp\.test[a-z0-9_.]+$'
    ) then
      raise exception 'Usa identificadores sintéticos CFP_Test y cfp.test.';
    end if;

    -- Approval here is fixture admission. It does not certify real accounts,
    -- participation requirements, legal consent, or privacy notice acceptance.
    insert into cfp_private.applications (event_id, request_key, payload, state)
    values (event_id, gen_random_uuid(), roster, 'approved')
    returning id into application_id;

    insert into cfp_private.application_history (application_id, action, reason, actor)
    values (application_id, 'test_fixture',
      'Plantilla ficticia admitida para ensayo privado. Sin verificaciones de personas reales.', auth.uid());
  end loop;
  return event_id;
end;
$$;
revoke all on function cfp_private.prepare_test_event(text,timestamptz,jsonb)
  from public, anon, authenticated, service_role;
