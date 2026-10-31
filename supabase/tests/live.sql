begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values('11111111-1111-4111-8111-111111111111','live-owner@example.invalid',now(),false),('22222222-2222-4222-8222-222222222222','live-helper@example.invalid',now(),false);
update cfp_private.owner_config set email='live-owner@example.invalid' where singleton;
insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status,roster_locked) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LIVE revertido',now(),8,'quarters','published','closed',true);
insert into cfp_private.applications(event_id,request_key,payload,state) select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',gen_random_uuid(),jsonb_build_object('name','Fixture '||j,'crest',lpad(j::text,2,'0'),'captain','0','members',jsonb_build_array(jsonb_build_object('roblox','player_'||j||'_a','tiktok','PRIVATE_'||j||'_a'),jsonb_build_object('roblox','player_'||j||'_b','tiktok','PRIVATE_'||j||'_b'),jsonb_build_object('roblox','player_'||j||'_c','tiktok','PRIVATE_'||j||'_c'))),'approved' from generate_series(1,8)j;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.cfp_league_preview('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
select public.cfp_league_action('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','confirm','{"reason":"Inicio de prueba LIVE"}',0);
select public.cfp_live_helper('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','live-helper@example.invalid',true,'Asignación expresa en prueba revertida');
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ declare d jsonb;m jsonb;begin
 d=public.cfp_live_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');m=d->'matches'->0;
 if d->>'role'<>'helper' or d::text like '%PRIVATE_%' or d::text like '%source_key%' or d::text like '%tiktok%' then raise exception 'Helper scope/privacy';end if;
 perform public.cfp_live_save('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'score','{"hg":4,"ag":0,"reason":"Marcador de trabajo de prueba"}',0);
 if public.cfp_live_public('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'matches'->0->>'kind'<>'pending' then raise exception 'Automatic official result';end if;
 begin perform public.cfp_live_save('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'call','{"room_ready":true,"reason":"No permitido"}',1);raise exception 'Helper call bypass';exception when raise_exception then if sqlerrm='Helper call bypass' then raise;end if;end;
 begin perform public.cfp_live_official('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'sport',null,(m->>'official_revision')::int,1,'No permitido');raise exception 'Helper official bypass';exception when raise_exception then if sqlerrm='Helper official bypass' then raise;end if;end;
 begin perform public.cfp_admin_applications('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Helper applications bypass';exception when raise_exception then if sqlerrm='Helper applications bypass' then raise;end if;end;
 begin perform public.cfp_live_admin('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Helper administration bypass';exception when raise_exception then if sqlerrm='Helper administration bypass' then raise;end if;end;
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare m jsonb;begin
 m=public.cfp_live_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'matches'->0;
 perform public.cfp_live_save('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'call','{"room_ready":true,"reason":"Sala y convocatoria confirmadas"}',1);
 begin perform public.cfp_live_official('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'absence',(m->>'home')::uuid,(m->>'official_revision')::int,2,'Debe esperar cinco minutos');raise exception 'Early absence bypass';exception when raise_exception then if sqlerrm='Early absence bypass' then raise;end if;end;
end $$;
reset role;
-- Test clock only, scoped to this transaction/fixture; no host clock or real records change.
update cfp_private.live_working set called_at=now()-interval '6 minutes' where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare m jsonb;begin
 m=public.cfp_live_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'matches'->0;
 perform public.cfp_live_official('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'absence',(m->>'home')::uuid,(m->>'official_revision')::int,2,'Ausencia comprobada con reloj de prueba');
 m=public.cfp_live_public('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'matches'->0;
 if m->>'kind'<>'absence_home' or m->>'hg'<>'0' or m->>'ag'<>'3' or m->'working'->>'called_at' is not null then raise exception 'Absence or invalidation failed';end if;
 perform public.cfp_live_evidence('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(m->>'id')::uuid,'https://example.com/fixture',false,'Clip privado de prueba');
 if jsonb_array_length(public.cfp_public_evidence('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))<>0 then raise exception 'Private evidence leak';end if;
 perform public.cfp_live_helper('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','live-helper@example.invalid',false,'Revocación de prueba');
end $$;
reset role;
update auth.users set email_confirmed_at=null where id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
select public.cfp_live_helper('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','live-helper@example.invalid',false,'Revocación independiente de verificación actual');
reset role;
update auth.users set email_confirmed_at=now() where id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin begin perform public.cfp_live_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Revocation bypass';exception when raise_exception then if sqlerrm='Revocation bypass' then raise;end if;end;end $$;
set local role anon;
do $$ begin
 if public.cfp_live_public('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text like '%actor%' or public.cfp_live_public('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text like '%email%' then raise exception 'Public identity leak';end if;
 begin perform public.cfp_live_read('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');raise exception 'Anonymous private read';exception when insufficient_privilege then null;end;
 begin perform * from cfp_private.live_working;raise exception 'Direct working table bypass';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
