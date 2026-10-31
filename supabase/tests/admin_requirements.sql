begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('11111111-1111-4111-8111-111111111111','requirements-fixture@example.invalid',now(),false);
update cfp_private.owner_config set email='requirements-fixture@example.invalid' where singleton;
insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Revisión revertida',now(),8,'quarters','published','closed');
insert into cfp_private.applications(id,event_id,request_key,payload,state,expires_at) values('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',gen_random_uuid(),'{"name":"Equipo de prueba","crest":"01","captain":"0","members":[{"roblox":"fixture_a","tiktok":"PRIVATE_a"},{"roblox":"fixture_b","tiktok":"PRIVATE_b"},{"roblox":"fixture_c","tiktok":"PRIVATE_c"}]}','pending',now()+interval '48 hours');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare i integer; key text; a jsonb;begin
 perform public.cfp_review_application('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','confirm','Perfil confirmado en prueba');
 perform public.cfp_set_requirement('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,'follow',true,'Seguimiento revisado');
 begin perform public.cfp_review_application('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approve','Debe permanecer bloqueado');raise exception 'Approval bypass';exception when raise_exception then if sqlerrm='Approval bypass' then raise;end if;end;
 for i in 0..2 loop foreach key in array array['follow','group','friend'] loop perform public.cfp_set_requirement('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',i,key,true,'Verificación aislada por integrante');end loop;end loop;
 a=public.cfp_admin_applications('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->0;
 if not (a->>'requirements_checked')::boolean or jsonb_array_length(a->'member_checks')<>3 then raise exception 'Checks incomplete';end if;
 if exists(select 1 from jsonb_array_elements(a->'history')h where h->>'action'='requirement' and (h->>'actor' is null or h->'after_checks' is null)) then raise exception 'Audit missing';end if;
 perform public.cfp_review_application('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approve','Revisión completa y capitán confirmado');
 begin perform public.cfp_set_requirement('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,'follow',false,'No debe editar aprobado');raise exception 'Approved edit bypass';exception when raise_exception then if sqlerrm='Approved edit bypass' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin begin perform public.cfp_set_requirement('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,'follow',true,'Intento ajeno');raise exception 'Outsider bypass';exception when raise_exception then if sqlerrm='Outsider bypass' then raise;end if;end;end $$;
set local role anon;
do $$ declare p text;begin
 p=public.cfp_public_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text;
 if p like '%member_checks%' or p like '%before_checks%' or p like '%PRIVATE_%' or p like '%tiktok%' then raise exception 'Public privacy leak';end if;
 begin perform public.cfp_set_requirement('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,'follow',true,'Intento anónimo');raise exception 'Anon bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ declare ranked jsonb;begin
 ranked=cfp_private.rank_ties('[{"id":"a","name":"Azul","dg":0,"gf":1},{"id":"b","name":"Marino","dg":3,"gf":5}]','[{"home":"a","away":"b","kind":"sport","hg":2,"ag":1}]','{}',true);
 if ranked->0->>'id'<>'a' or ranked->0->>'tie_opponent'<>'b' then raise exception 'Applied direct context missing';end if;
end $$;
rollback;
