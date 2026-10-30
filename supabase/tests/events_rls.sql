-- Controlled fixtures, all inside one transaction. No test account/event persists.
begin;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
('11111111-1111-4111-8111-111111111111','cfp-fixture@example.invalid',now(),false),
('22222222-2222-4222-8222-222222222222','cfp-outsider@example.invalid',now(),false),
('33333333-3333-4333-8333-333333333333','cfp-unverified@example.invalid',null,false);
update cfp_private.owner_config set email='cfp-fixture@example.invalid' where singleton;
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ begin
  if not public.cfp_is_owner() then raise exception 'Owner denied'; end if;
end $$;
insert into public.cfp_events(id,name,starts_at,capacity,format) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','CFP fixture private','2027-01-01T20:00:00-06:00',8,'quarters');
update public.cfp_events set name='CFP fixture edited' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
  if not exists(select 1 from public.cfp_events where name='CFP fixture edited') then raise exception 'Owner edit failed'; end if;
  begin
    update public.cfp_events set registration_status='open' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'Registration opened';
  exception when raise_exception then if sqlerrm='Registration opened' then raise;end if; end;
  begin
    update public.cfp_events set capacity=10,eliminate_after_league=false where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'No-elimination capacity bypass';
  exception when check_violation then null; end;
  begin
    update public.cfp_events set format='round16',capacity=8 where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'Format minimum bypass';
  exception when check_violation then null; end;
end $$;
set local role anon;
do $$ begin
  if exists(select 1 from public.cfp_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Anon read draft'; end if;
  begin
    insert into public.cfp_events(name,starts_at,capacity,format) values('Unauthorized fixture',now(),8,'quarters');
    raise exception 'Anon insert succeeded';
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
  if public.cfp_is_owner() then raise exception 'Outsider became owner'; end if;
  if exists(select 1 from public.cfp_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Outsider read draft'; end if;
  begin
    insert into public.cfp_events(name,starts_at,capacity,format) values('Unauthorized fixture',now(),8,'quarters');
    raise exception 'Outsider insert succeeded';
  exception when insufficient_privilege then null; end;
  update public.cfp_events set name='Tampered' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
end $$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ begin
  if not exists(select 1 from public.cfp_events where name='CFP fixture edited') then raise exception 'Outsider edited event'; end if;
end $$;
update public.cfp_events set status='published' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role anon;
do $$ begin
  if not exists(select 1 from public.cfp_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') then raise exception 'Anon cannot see published'; end if;
end $$;
reset role;
update cfp_private.owner_config set email='cfp-unverified@example.invalid' where singleton;
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ begin if public.cfp_is_owner() then raise exception 'Unverified owner allowed'; end if; end $$;
rollback;
