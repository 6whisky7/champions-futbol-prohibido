create function cfp_private.team_key(value text) returns text language sql immutable set search_path='' as $$ select regexp_replace(cfp_private.normal(regexp_replace(lower(value),'\m(fc|cf|team|equipo|club)\M','','g')),'[0-9]','','g'); $$;
revoke all on function cfp_private.team_key(text) from public,anon,authenticated;
create or replace function cfp_private.validate_application(e uuid,p jsonb,exclude_id uuid default null, reserve boolean default true) returns void language plpgsql set search_path='' as $$
declare member jsonb; n text; t text; seen_r text[]='{}'; seen_t text[]='{}'; count_members int;
begin
 if p is null or jsonb_typeof(p)<>'object' or coalesce(char_length(p->>'name'),0) not between 3 and 60 or char_length(cfp_private.normal(p->>'name'))<3 then raise exception 'Nombre inválido (3–60 caracteres).'; end if;
 if (p->>'crest') !~ '^(0[1-9]|[1-3][0-9]|4[0-8])$' or p->>'crest' is null then raise exception 'Elige un escudo válido.'; end if;
 if coalesce(p->>'number','')<>'' and (p->>'number') !~ '^(0[1-9]|[1-9][0-9])$' then raise exception 'Número opcional del 01 al 99.'; end if;
 if coalesce(jsonb_typeof(p->'members'),'')<>'array' then raise exception 'Plantilla inválida.'; end if;
 count_members=jsonb_array_length(p->'members');
 if count_members not in (3,4) or coalesce(p->>'captain','') !~ '^[0-2]$' then raise exception 'Tres titulares, un capitán y un suplente opcional.'; end if;
 for member in select value from jsonb_array_elements(p->'members') loop
  n=regexp_replace(lower(trim(member->>'roblox')),'^@|\s','','g'); t=regexp_replace(lower(trim(member->>'tiktok')),'^@|\s','','g');
  if n is null or t is null or n !~ '^[a-z0-9_]{3,20}$' or t !~ '^[a-z0-9_.]{2,24}$' then raise exception 'Revisa los usuarios de Roblox y TikTok.'; end if;
  if n=any(seen_r) or t=any(seen_t) then raise exception 'Hay un usuario repetido en la plantilla.'; end if;
  seen_r=array_append(seen_r,n);seen_t=array_append(seen_t,t);
 end loop;
 if not reserve then return; end if;
 if exists(select 1 from cfp_private.applications a where a.event_id=e and a.id is distinct from exclude_id and (a.state='approved' or (a.state='pending' and a.expires_at>clock_timestamp())) and (a.payload->>'crest'=p->>'crest' or cfp_private.normal(a.payload->>'name')=cfp_private.normal(p->>'name') or cfp_private.team_key(a.payload->>'name')=cfp_private.team_key(p->>'name'))) then raise exception 'Escudo o nombre reservado. Elige otro sin perder tu plantilla.'; end if;
 if exists(select 1 from cfp_private.applications a cross join lateral jsonb_array_elements(a.payload->'members') m where a.event_id=e and a.id is distinct from exclude_id and (a.state='approved' or (a.state='pending' and a.expires_at>clock_timestamp())) and (regexp_replace(lower(trim(m->>'roblox')),'^@|\s','','g')=any(seen_r) or regexp_replace(lower(trim(m->>'tiktok')),'^@|\s','','g')=any(seen_t))) then raise exception 'Un integrante ya tiene una reserva activa en este evento.'; end if;
 if (select count(*) from cfp_private.applications a where event_id=e and a.id is distinct from exclude_id and (state='approved' or (state='pending' and expires_at>clock_timestamp()))) >= (select capacity from public.cfp_events where id=e) then raise exception 'No quedan plazas. Puedes enviar a lista de espera.'; end if;
end; $$;
