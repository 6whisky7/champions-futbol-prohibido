-- Complete transaction only. No email sent, real owner/data/config preserved.
begin;
update cfp_private.ingress_config set signing_key='fixture-only-signing-key-never-used-outside-this-transaction';
update cfp_private.privacy_config set active=true,version='fixture-v1';
do $$declare e uuid=gen_random_uuid();u uuid=gen_random_uuid();begin
 insert into auth.users(id,email,email_confirmed_at,is_anonymous) values(u,'cfp-audit-'||u||'@example.invalid',now(),false);
 update cfp_private.owner_config set email='cfp-audit-'||u||'@example.invalid';
 perform set_config('cfp.audit_owner',u::text,true);
 insert into public.cfp_events(id,name,starts_at,capacity,format,status,registration_status) values(e,'Auditoría de ingreso (rollback)',now(),8,'quarters','published','open');
 perform set_config('cfp.audit_event',e::text,true);
end$$;
do $$declare e uuid=current_setting('cfp.audit_event')::uuid;k uuid=gen_random_uuid();issued bigint=floor(extract(epoch from clock_timestamp()));
 p text='{"name":"Los Élite FC","crest":"01","captain":"0","members":[{"roblox":"fixture_one","tiktok":"PRIVATE.one"},{"roblox":"fixture_two","tiktok":"PRIVATE.two"},{"roblox":"fixture_three","tiktok":"PRIVATE.three"}]}';
 client text=repeat('d',64);message text;proof text;r jsonb;r2 jsonb;begin
 message=e::text||E'\n'||k::text||E'\n'||issued::text||E'\n'||client||E'\n0\n'||p||E'\nfixture-v1';
 proof=encode(extensions.hmac(convert_to(message,'UTF8'),convert_to('fixture-only-signing-key-never-used-outside-this-transaction','UTF8'),'sha256'),'hex');
 execute 'set local role anon';
 begin perform public.cfp_submit_application(e,p::jsonb,k,false);raise exception 'Legacy RPC accepted';exception when insufficient_privilege then null;end;
 r=public.cfp_submit_application_secure(e,k,p,false,issued,client,'fixture-v1',proof);
 if r->'result'->>'state'<>'pending' then raise exception 'Signed submission failed: %',r;end if;
 r2=public.cfp_submit_application_secure(e,k,p,false,issued,client,'fixture-v1',proof);
 if r2->'result'->>'id'<>r->'result'->>'id' then raise exception 'Retry duplicate';end if;
 begin perform public.cfp_submit_application_secure(e,k,p,false,issued,client,'fixture-v1',repeat('0',64));raise exception 'Forged signature accepted';exception when raise_exception then if sqlerrm='Forged signature accepted' then raise;end if;end;
 begin perform public.cfp_submit_application_secure(e,k,p,false,issued-301,client,'fixture-v1',proof);raise exception 'Expired signature accepted';exception when raise_exception then if sqlerrm='Expired signature accepted' then raise;end if;end;
 if public.cfp_public_teams(e)::text ~ '(PRIVATE|tiktok|accepted_privacy|history)' then raise exception 'Public projection leaked';end if;
 begin perform 1 from cfp_private.applications;raise exception 'Private SELECT accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
do $$begin
 if not exists(select 1 from cfp_private.applications where event_id=current_setting('cfp.audit_event')::uuid and accepted_privacy_version='fixture-v1' and accepted_privacy_at is not null) then raise exception 'Acceptance receipt missing';end if;
 if exists(select 1 from cfp_private.submission_limits where client_digest=repeat('d',64) and hits<>1) then raise exception 'Retry charged twice';end if;
end$$;
update cfp_private.privacy_config set active=false;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('cfp.audit_owner'),true);
do $$begin
 if not public.cfp_is_owner() then raise exception 'Owner missing';end if;
 begin update public.cfp_events set registration_status='open' where id=current_setting('cfp.audit_event')::uuid;raise exception 'Pending policy opened';exception when raise_exception then if sqlerrm='Pending policy opened' then raise;end if;end;
end$$;
reset role;
select 'PASS: gateway, unicode, retry, privacy, policy guard; transaction reverted' as result;
rollback;
