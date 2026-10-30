-- Additive migration. No existing data is changed.
create schema if not exists cfp_private;
revoke all on schema cfp_private from public, anon;
grant usage on schema cfp_private to authenticated;

create table cfp_private.owner_config (
  singleton boolean primary key default true check (singleton),
  email text not null check (email = lower(trim(email)))
);
alter table cfp_private.owner_config enable row level security;
revoke all on cfp_private.owner_config from public, anon, authenticated;

-- The only definer function: private lookup of the current verified Auth user.
-- No user-editable JWT metadata participates in authorization.
create function cfp_private.is_owner() returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from auth.users u join cfp_private.owner_config o on lower(u.email) = o.email
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous, false) = false
  );
$$;
revoke all on function cfp_private.is_owner() from public, anon;
grant execute on function cfp_private.is_owner() to authenticated;

create function public.cfp_is_owner() returns boolean language sql stable security invoker
set search_path = '' as $$ select cfp_private.is_owner(); $$;
revoke all on function public.cfp_is_owner() from public, anon;
grant execute on function public.cfp_is_owner() to authenticated;

create table public.cfp_events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 100),
  description text not null default '' check (char_length(description) <= 5000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer not null check (capacity % 2 = 0),
  format text not null check (format in ('quarters','round16','round32','repechage')),
  eliminate_after_league boolean not null default true,
  status text not null default 'draft' check (status in ('draft','published')),
  registration_status text not null default 'closed' check (registration_status = 'closed'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_dates check (ends_at is null or ends_at >= starts_at),
  constraint format_minimum check (capacity >= case format when 'quarters' then 8 when 'round16' then 16 when 'round32' then 32 else 24 end),
  constraint no_league_elimination check (eliminate_after_league or capacity = case format when 'quarters' then 8 when 'round16' then 16 when 'round32' then 32 else 24 end)
);
create index cfp_events_public_dates on public.cfp_events (starts_at, id) where status = 'published';
alter table public.cfp_events enable row level security;
revoke all on public.cfp_events from public, anon, authenticated;
grant select on public.cfp_events to anon;
grant select, insert, update on public.cfp_events to authenticated;
create policy published_events on public.cfp_events for select to anon, authenticated using (status = 'published');
create policy owner_reads on public.cfp_events for select to authenticated using ((select cfp_private.is_owner()));
create policy owner_inserts on public.cfp_events for insert to authenticated with check ((select cfp_private.is_owner()));
create policy owner_updates on public.cfp_events for update to authenticated using ((select cfp_private.is_owner())) with check ((select cfp_private.is_owner()));

create function cfp_private.event_updated_at() returns trigger language plpgsql security invoker
set search_path = '' as $$ begin new.updated_at = clock_timestamp(); return new; end; $$;
revoke all on function cfp_private.event_updated_at() from public, anon, authenticated;
create trigger cfp_event_updated before update on public.cfp_events for each row execute function cfp_private.event_updated_at();
comment on column public.cfp_events.registration_status is 'Closed at database level until public registration, capacity and concurrency controls are implemented.';
