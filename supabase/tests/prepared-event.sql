begin;
do $$
declare
  e uuid;
  roster jsonb;
  bad jsonb;
  title text := 'Fixture privado de verificación';
begin
  if has_function_privilege('anon', 'cfp_private.prepare_test_event(text,timestamptz,jsonb)', 'execute')
    or has_function_privilege('authenticated', 'cfp_private.prepare_test_event(text,timestamptz,jsonb)', 'execute')
    or has_function_privilege('service_role', 'cfp_private.prepare_test_event(text,timestamptz,jsonb)', 'execute') then
    raise exception 'La preparación privilegiada debe mantenerse fuera de la API';
  end if;
  select jsonb_agg(jsonb_build_object(
    'name', 'Fixture ' || chr(64+n), 'crest', lpad(n::text, 2, '0'),
    'captain', '0', 'number', '',
    'members', (select jsonb_agg(jsonb_build_object('roblox', 'CFP_Test' || n || j, 'tiktok', 'cfp.test' || n || j))
      from generate_series(1, 3) j)
  ) order by n) into roster from generate_series(1, 8) n;

  bad := jsonb_set(roster, '{1,members,1,roblox}', roster->0->'members'->0->'roblox');
  begin
    perform cfp_private.prepare_test_event(title, now(), bad);
    raise exception 'Se aceptó el usuario duplicado';
  exception when raise_exception then
    if sqlerrm not like 'Un integrante ya tiene una reserva%' then raise; end if;
  end;
  if exists(select 1 from public.cfp_events where name = title) then raise exception 'El lote inválido dejó un evento'; end if;

  e := cfp_private.prepare_test_event(title, now(), roster);
  if (select count(*) from cfp_private.applications a where a.event_id=e and state='approved'
        and not captain_confirmed and not requirements_checked and accepted_privacy_at is null) <> 8
    or (cfp_private.league_ready(e)->>'ready') is distinct from 'true'
    or exists(select 1 from cfp_private.leagues where event_id=e)
    or public.cfp_public_teams(e) <> '[]' then
    raise exception 'El ensayo debe tener ocho plantillas ficticias y quedar listo, cerrado y privado';
  end if;

  begin
    perform cfp_private.prepare_test_event(title, now(), roster);
    raise exception 'Se creó un ensayo duplicado';
  exception when raise_exception then
    if sqlerrm not like 'Ya existe un evento%' then raise; end if;
  end;
end;
$$;
rollback;
