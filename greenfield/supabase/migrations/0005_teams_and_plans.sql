-- 0005: teams + plan tiers
--
-- Every Greenfield account belongs to one or more teams. Individual plans use
-- a personal "team of one" so the same code path handles personal vs. studio
-- accounts. The plan tier drives claim quotas, seat limits, and gating.

----------------------------------------------------------------------
-- Plan tier enum
----------------------------------------------------------------------
do $$ begin
  create type public.plan_tier as enum ('scout', 'entrepreneur', 'venture_studio', 'university');
exception when duplicate_object then null; end $$;

----------------------------------------------------------------------
-- teams: the unit of claim ownership
----------------------------------------------------------------------
create table public.teams (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  plan                     public.plan_tier not null default 'scout',
  claims_per_week_quota    integer not null default 0,
  seat_limit               integer not null default 1,
  stripe_subscription_id   text,
  created_at               timestamptz not null default now()
);

----------------------------------------------------------------------
-- team_members: who's on which team
----------------------------------------------------------------------
create table public.team_members (
  team_id   uuid not null references public.teams on delete cascade,
  user_id   uuid not null references auth.users   on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index team_members_user_idx on public.team_members (user_id);

----------------------------------------------------------------------
-- profiles: link to personal team + plan
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists personal_team_id uuid references public.teams,
  add column if not exists plan public.plan_tier not null default 'scout';

----------------------------------------------------------------------
-- Replace handle_new_user trigger: create profile + personal team + membership
----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_team_id uuid;
  display     text;
begin
  display := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.teams (name, plan, claims_per_week_quota, seat_limit)
  values (display || ' (personal)', 'scout', 0, 1)
  returning id into new_team_id;

  insert into public.profiles (user_id, display_name, personal_team_id, plan)
  values (new.id, display, new_team_id, 'scout');

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$;

-- Trigger already exists (from 0001); re-bind to make sure it points at the new function body.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

----------------------------------------------------------------------
-- Helpers: caller's teams
----------------------------------------------------------------------
create or replace function public.current_user_team_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select team_id from public.team_members where user_id = auth.uid();
$$;

----------------------------------------------------------------------
-- RLS
----------------------------------------------------------------------
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;

-- A user can read teams they belong to; admins read all.
create policy "team members read team"
  on public.teams for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
  );

-- Owners can rename their team; everything else is service-role.
create policy "team owners update team"
  on public.teams for update using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid() and tm.role = 'owner'
    )
  );

-- A user can read their own memberships + memberships of their teams.
create policy "members read own team membership"
  on public.team_members for select using (
    public.is_current_user_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_members.team_id and tm.user_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- Plan-tier metadata: keep the canonical quota/seat numbers in SQL so DB
-- enforcement matches the marketing copy. The frontend reads from lib/pricing.ts.
----------------------------------------------------------------------
create or replace function public.plan_defaults(p public.plan_tier)
returns table (claims_per_week_quota integer, seat_limit integer)
language sql immutable
as $$
  select
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 1          -- 1 claim per *year* policed in claim_idea() below
      when 'venture_studio' then 10
      when 'university'     then 50
    end as claims_per_week_quota,
    case p
      when 'scout'          then 1
      when 'entrepreneur'   then 1
      when 'venture_studio' then 5
      when 'university'     then 25
    end as seat_limit;
$$;

-- Sync helper: keep team.quota / seat_limit consistent with its plan.
create or replace function public.sync_team_plan_defaults(team uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  current_plan public.plan_tier;
  defaults     record;
begin
  select plan into current_plan from public.teams where id = team;
  select * into defaults from public.plan_defaults(current_plan);
  update public.teams
     set claims_per_week_quota = defaults.claims_per_week_quota,
         seat_limit            = defaults.seat_limit
   where id = team;
end;
$$;
