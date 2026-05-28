-- 0020: builder plan tier — column + plan_defaults rewrite
--
-- Second half of 0012. Split out because the 'builder' enum value added
-- there can't be referenced in the same transaction; this migration runs
-- in a later transaction and so can use the value.

----------------------------------------------------------------------
-- 1. New quota column on teams
----------------------------------------------------------------------
alter table public.teams
  add column if not exists byo_runs_per_month_quota integer not null default 0;

----------------------------------------------------------------------
-- 2. Update plan_defaults() to include builder + return the new column
----------------------------------------------------------------------
-- Drop first because Postgres can't change a function's OUT-parameter
-- signature via CREATE OR REPLACE.
drop function if exists public.plan_defaults(public.plan_tier);

create or replace function public.plan_defaults(p public.plan_tier)
returns table (
  claims_per_week_quota    integer,
  seat_limit               integer,
  byo_runs_per_month_quota integer
)
language sql immutable
as $$
  select
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 1
      when 'builder'        then 1
      when 'venture_studio' then 10
      when 'university'     then 50
    end as claims_per_week_quota,
    case p
      when 'scout'          then 1
      when 'entrepreneur'   then 1
      when 'builder'        then 1
      when 'venture_studio' then 5
      when 'university'     then 25
    end as seat_limit,
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 0
      when 'builder'        then 25
      when 'venture_studio' then 100
      when 'university'     then 200
    end as byo_runs_per_month_quota;
$$;

----------------------------------------------------------------------
-- 3. Update sync_team_plan_defaults() to mirror the new column onto teams
----------------------------------------------------------------------
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
     set claims_per_week_quota    = defaults.claims_per_week_quota,
         seat_limit               = defaults.seat_limit,
         byo_runs_per_month_quota = defaults.byo_runs_per_month_quota
   where id = team;
end;
$$;
