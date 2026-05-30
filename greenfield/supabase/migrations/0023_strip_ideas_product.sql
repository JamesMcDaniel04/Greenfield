-- 0023: strip the ideas-generator + BYO product, leaving only Career / certificates
--
-- The product was refocused on the Learning / Certificates surface (the Career
-- track: enrollment, mentor + evaluator agent runs, rubric grading, verified
-- portfolio). Everything that powered the startup-opportunity catalogue and the
-- "bring your own idea/project" agent team is removed here.
--
-- Kept: profiles, teams, team_members, agent_runs (mentor/evaluator only),
--       career_tracks, career_projects, career_enrollments, career_submissions,
--       career_submission_evaluations, career_portfolio_profiles,
--       career_usage_monthly, stripe_webhook_events.
--
-- This migration is additive history — it does NOT rewrite 0001–0022, which
-- have already been applied to the linked project. The plan_tier enum keeps its
-- old values (Postgres can't easily drop enum values); the app only ever uses
-- 'scout' (free default) and 'career' now.

----------------------------------------------------------------------
-- 1. Drop the BYO usage trigger + function (depends on dropped objects)
----------------------------------------------------------------------
drop trigger if exists agent_runs_bump_byo_usage on public.agent_runs;
drop function if exists public.bump_byo_usage() cascade;

----------------------------------------------------------------------
-- 2. Drop the agent_runs SELECT policy — it references idea_claims /
--    user_ideas / user_projects, which are dropped below. Recreated in §6.
----------------------------------------------------------------------
drop policy if exists "team or admin reads agent runs" on public.agent_runs;

----------------------------------------------------------------------
-- 3. Drop ideas/claims/team-invite RPCs that reference dropped tables
----------------------------------------------------------------------
drop function if exists public.claim_idea(uuid, uuid) cascade;
drop function if exists public.release_claim(uuid) cascade;
drop function if exists public.accept_team_invitation(uuid) cascade;

----------------------------------------------------------------------
-- 4. Drop ideas + BYO tables / views (CASCADE clears dependent FKs,
--    indexes, policies — including the agent_runs subject FK constraints)
----------------------------------------------------------------------
drop view  if exists public.visible_opportunities cascade;
drop table if exists public.workflow_steps        cascade;
drop table if exists public.workflow_runs         cascade;
drop table if exists public.byo_usage_monthly     cascade;
drop table if exists public.user_projects         cascade;
drop table if exists public.user_ideas            cascade;
drop table if exists public.team_invitations      cascade;
drop table if exists public.idea_claims           cascade;
drop table if exists public.opportunity_signals   cascade;
drop table if exists public.saved_opportunities   cascade;
drop table if exists public.build_briefs          cascade;
drop table if exists public.opportunities         cascade;

----------------------------------------------------------------------
-- 5. Reduce agent_runs to the submission-only subject
----------------------------------------------------------------------
alter table public.agent_runs
  drop constraint if exists agent_runs_exactly_one_subject;

alter table public.agent_runs drop column if exists claim_id;
alter table public.agent_runs drop column if exists user_idea_id;
alter table public.agent_runs drop column if exists user_project_id;

alter table public.agent_runs
  add constraint agent_runs_submission_required check (submission_id is not null) not valid;

----------------------------------------------------------------------
-- 6. Recreate the agent_runs SELECT policy — owning learner only
----------------------------------------------------------------------
create policy "learner or admin reads agent runs"
  on public.agent_runs for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.career_submissions s
        join public.career_enrollments e on e.id = s.enrollment_id
       where s.id = agent_runs.submission_id and e.user_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- 7. Drop ideas/BYO quota columns from teams
----------------------------------------------------------------------
alter table public.teams drop column if exists claims_per_week_quota;
alter table public.teams drop column if exists byo_runs_per_month_quota;

----------------------------------------------------------------------
-- 8. Slim plan_defaults() to the two columns teams still carries
----------------------------------------------------------------------
drop function if exists public.plan_defaults(public.plan_tier);

create function public.plan_defaults(p public.plan_tier)
returns table (
  seat_limit                  integer,
  career_runs_per_month_quota integer
)
language sql immutable
as $$
  select
    case p
      when 'venture_studio' then 5
      when 'university'     then 25
      else 1
    end as seat_limit,
    case p
      when 'career'         then 60
      when 'venture_studio' then 60
      when 'university'     then 200
      else 0
    end as career_runs_per_month_quota;
$$;

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
     set seat_limit                  = defaults.seat_limit,
         career_runs_per_month_quota = defaults.career_runs_per_month_quota
   where id = team;
end;
$$;

----------------------------------------------------------------------
-- 9. handle_new_user no longer sets the dropped claims_per_week_quota
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

  insert into public.teams (name, plan, seat_limit)
  values (display || ' (personal)', 'scout', 1)
  returning id into new_team_id;

  insert into public.profiles (user_id, display_name, personal_team_id, plan)
  values (new.id, display, new_team_id, 'scout');

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'owner');

  return new;
end;
$$;
