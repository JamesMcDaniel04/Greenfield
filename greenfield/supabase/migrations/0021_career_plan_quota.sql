-- 0021: career plan tier — column + plan_defaults rewrite + usage counter
--
-- Second half of 0019. Split out because the 'career' enum value added
-- there can't be referenced in the same transaction; this migration runs
-- in a later transaction and so can use the value.

----------------------------------------------------------------------
-- 1. New per-team quota column
----------------------------------------------------------------------
alter table public.teams
  add column if not exists career_runs_per_month_quota integer not null default 0;

----------------------------------------------------------------------
-- 2. Extend plan_defaults() with the new tier + column
----------------------------------------------------------------------
-- Drop first because Postgres can't change a function's OUT-parameter
-- signature via CREATE OR REPLACE.
drop function if exists public.plan_defaults(public.plan_tier);

create or replace function public.plan_defaults(p public.plan_tier)
returns table (
  claims_per_week_quota       integer,
  seat_limit                  integer,
  byo_runs_per_month_quota    integer,
  career_runs_per_month_quota integer
)
language sql immutable
as $$
  select
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 1
      when 'builder'        then 1
      when 'career'         then 0
      when 'venture_studio' then 10
      when 'university'     then 50
    end as claims_per_week_quota,
    case p
      when 'scout'          then 1
      when 'entrepreneur'   then 1
      when 'builder'        then 1
      when 'career'         then 1
      when 'venture_studio' then 5
      when 'university'     then 25
    end as seat_limit,
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 0
      when 'builder'        then 25
      when 'career'         then 0
      when 'venture_studio' then 100
      when 'university'     then 200
    end as byo_runs_per_month_quota,
    case p
      when 'scout'          then 0
      when 'entrepreneur'   then 0
      when 'builder'        then 0
      when 'career'         then 60
      when 'venture_studio' then 60
      when 'university'     then 200
    end as career_runs_per_month_quota;
$$;

----------------------------------------------------------------------
-- 3. sync_team_plan_defaults: mirror the new column onto teams
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
     set claims_per_week_quota       = defaults.claims_per_week_quota,
         seat_limit                  = defaults.seat_limit,
         byo_runs_per_month_quota    = defaults.byo_runs_per_month_quota,
         career_runs_per_month_quota = defaults.career_runs_per_month_quota
   where id = team;
end;
$$;

----------------------------------------------------------------------
-- 4. Monthly career usage counter, parallel to byo_usage_monthly
----------------------------------------------------------------------
create table if not exists public.career_usage_monthly (
  team_id    uuid not null references public.teams on delete cascade,
  year_month text not null,                         -- "YYYY-MM"
  runs_used  integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (team_id, year_month)
);

----------------------------------------------------------------------
-- 5. Trigger: bump career_usage_monthly on every submission-scoped agent_run
--    (mentor + evaluator) for the owning learner's personal team.
----------------------------------------------------------------------
create or replace function public.bump_career_usage()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  learner_user_id uuid;
  target_team     uuid;
  ym              text;
begin
  if new.submission_id is null then
    return new;  -- not a career-scoped run
  end if;

  select e.user_id into learner_user_id
    from public.career_submissions s
    join public.career_enrollments e on e.id = s.enrollment_id
   where s.id = new.submission_id;

  if learner_user_id is null then
    return new;
  end if;

  -- The learner's personal team carries the quota.
  select personal_team_id into target_team
    from public.profiles where user_id = learner_user_id;

  if target_team is null then
    return new;
  end if;

  ym := to_char(now(), 'YYYY-MM');

  insert into public.career_usage_monthly (team_id, year_month, runs_used)
  values (target_team, ym, 1)
  on conflict (team_id, year_month)
    do update set runs_used  = public.career_usage_monthly.runs_used + 1,
                  updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_runs_bump_career_usage on public.agent_runs;

create trigger agent_runs_bump_career_usage
  after insert on public.agent_runs
  for each row execute function public.bump_career_usage();

----------------------------------------------------------------------
-- 6. RLS on the counter
----------------------------------------------------------------------
alter table public.career_usage_monthly enable row level security;

drop policy if exists "team or admin reads career usage" on public.career_usage_monthly;

create policy "team or admin reads career usage"
  on public.career_usage_monthly for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
       where tm.team_id = career_usage_monthly.team_id
         and tm.user_id = auth.uid()
    )
  );
