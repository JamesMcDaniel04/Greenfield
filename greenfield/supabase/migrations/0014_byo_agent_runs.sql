-- 0014: BYO agent runs
--
-- Extends agent_runs so a run can target a claim, a user_idea, or a user_project
-- (exactly one of the three). Adds a monthly usage counter table + trigger so
-- the run-agent edge function can enforce the team's byo_runs_per_month_quota.

----------------------------------------------------------------------
-- 1. Make claim_id nullable + add BYO subject FKs
----------------------------------------------------------------------
alter table public.agent_runs alter column claim_id drop not null;

alter table public.agent_runs
  add column if not exists user_idea_id    uuid references public.user_ideas    on delete cascade,
  add column if not exists user_project_id uuid references public.user_projects on delete cascade;

alter table public.agent_runs
  drop constraint if exists agent_runs_exactly_one_subject;

alter table public.agent_runs
  add constraint agent_runs_exactly_one_subject check (
    (claim_id is not null)::int +
    (user_idea_id is not null)::int +
    (user_project_id is not null)::int = 1
  );

create index if not exists agent_runs_user_idea_idx
  on public.agent_runs (user_idea_id, agent_role, started_at desc);

create index if not exists agent_runs_user_project_idx
  on public.agent_runs (user_project_id, agent_role, started_at desc);

----------------------------------------------------------------------
-- 2. Widen the SELECT RLS policy so team members of the owning user_idea /
--    user_project can read their BYO runs.
----------------------------------------------------------------------
drop policy if exists "team or admin reads agent runs" on public.agent_runs;

create policy "team or admin reads agent runs"
  on public.agent_runs for select using (
    public.is_current_user_admin()
    or exists (
      select 1
        from public.idea_claims c
        join public.team_members tm on tm.team_id = c.team_id
       where c.id = agent_runs.claim_id
         and tm.user_id = auth.uid()
    )
    or exists (
      select 1
        from public.user_ideas i
        join public.team_members tm on tm.team_id = i.team_id
       where i.id = agent_runs.user_idea_id
         and tm.user_id = auth.uid()
    )
    or exists (
      select 1
        from public.user_projects p
        join public.team_members tm on tm.team_id = p.team_id
       where p.id = agent_runs.user_project_id
         and tm.user_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- 3. Monthly BYO usage counter
----------------------------------------------------------------------
create table public.byo_usage_monthly (
  team_id    uuid not null references public.teams on delete cascade,
  year_month text not null,                         -- "YYYY-MM"
  runs_used  integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (team_id, year_month)
);

----------------------------------------------------------------------
-- 4. Trigger: on every BYO agent_runs insert, bump the counter for the
--    owning team and current month. Catalogue claim runs do not count.
----------------------------------------------------------------------
create or replace function public.bump_byo_usage()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  target_team uuid;
  ym          text;
begin
  if new.user_idea_id is not null then
    select team_id into target_team from public.user_ideas where id = new.user_idea_id;
  elsif new.user_project_id is not null then
    select team_id into target_team from public.user_projects where id = new.user_project_id;
  else
    return new;  -- catalogue claim run, no BYO bump
  end if;

  ym := to_char(now(), 'YYYY-MM');

  insert into public.byo_usage_monthly (team_id, year_month, runs_used)
  values (target_team, ym, 1)
  on conflict (team_id, year_month)
    do update set runs_used = public.byo_usage_monthly.runs_used + 1,
                  updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_runs_bump_byo_usage on public.agent_runs;

create trigger agent_runs_bump_byo_usage
  after insert on public.agent_runs
  for each row execute function public.bump_byo_usage();

----------------------------------------------------------------------
-- 5. RLS on the counter — team members + admins can read; writes only via the
--    SECURITY DEFINER trigger above (no client-side policy needed for INSERT).
----------------------------------------------------------------------
alter table public.byo_usage_monthly enable row level security;

create policy "team or admin reads byo usage"
  on public.byo_usage_monthly for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
       where tm.team_id = byo_usage_monthly.team_id
         and tm.user_id = auth.uid()
    )
  );
