-- Business-rule fixture uses the internal function as postgres. Public ingress is tested separately in ingress.sql.
begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values ('11111111-1111-4111-8111-111111111111','cfp-fixture@example.invalid',now(),false);
update cfp_private.owner_config set email='cfp-fixture@example.invalid';
update cfp_private.privacy_config set active=true,version='test-only-v1' where singleton;
insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Prueba revertida',now(),8,'quarters','published','open');
-- No anonymous grant is restored to the legacy function.
do $$ declare p jsonb; r jsonb; id uuid; begin
 p='{"name":"Los azules","crest":"01","number":"07","captain":"0","members":[{"roblox":"player_one","tiktok":"player.one"},{"roblox":"player_two","tiktok":"player.two"},{"roblox":"player_three","tiktok":"player.three"}]}';
 r=public.cfp_submit_application('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 if r->>'state'<>'pending' then raise exception 'submission failed'; end if;
 if public.cfp_submit_application('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',p,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')->>'id'<>r->>'id' then raise exception 'idempotency failed'; end if;
 if public.cfp_public_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')::text like '%tiktok%' then raise exception 'privacy leak'; end if;
 begin
  perform public.cfp_submit_application('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',jsonb_set(p,'{name}','"Otro nombre"'),'cccccccc-cccc-4ccc-8ccc-cccccccccccc');raise exception 'duplicate accepted';
 exception when raise_exception then if sqlerrm='duplicate accepted' then raise; end if; end;
 execute 'set local role anon';
 begin perform public.cfp_review_application((r->>'id')::uuid,'approve','No permitido');raise exception 'anon review accepted'; exception when insufficient_privilege then null; end;
 begin perform * from cfp_private.applications;raise exception 'private table exposed';exception when insufficient_privilege then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare a jsonb; id uuid; begin
 a=public.cfp_admin_applications('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->0;id=(a->>'id')::uuid;
 begin perform public.cfp_review_application(id,'approve','Sin revisar');raise exception 'approval bypass';exception when raise_exception then if sqlerrm='approval bypass' then raise;end if;end;
 perform public.cfp_review_application(id,'confirm','Capitán confirmó desde su perfil');
 perform public.cfp_review_application(id,'requirements','Todos los integrantes cumplen los tres requisitos');
 perform public.cfp_review_application(id,'approve','Revisión completa');
 if public.cfp_public_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->0->>'state'<>'approved' then raise exception 'approve failed'; end if;
 perform public.cfp_review_application(id,'reject','Prueba de liberación');
 if jsonb_array_length(public.cfp_public_teams('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'))<>0 then raise exception 'reject release failed';end if;
end $$;
reset role;
rollback;
