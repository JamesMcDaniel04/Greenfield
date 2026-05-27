-- 0018: widen agent_runs for Career — mentor + evaluator roles, submission subject
--
-- The Career surface adds two agent roles (mentor for Socratic help, evaluator
-- for rubric grading) and a fourth subject (submission). Both pieces flow
-- through the existing run-agent edge function and tool pipeline.

----------------------------------------------------------------------
-- 1. Widen agent_role + workflow_steps.owner_role CHECKs
----------------------------------------------------------------------
alter table public.agent_runs
  drop constraint if exists agent_runs_agent_role_check;

alter table public.agent_runs
  add constraint agent_runs_agent_role_check
  check (agent_role in ('research','gtm','sales','marketing','engineering','mentor','evaluator'));

alter table public.workflow_steps
  drop constraint if exists workflow_steps_owner_role_check;

alter table public.workflow_steps
  add constraint workflow_steps_owner_role_check
  check (owner_role in ('research','gtm','sales','marketing','engineering','mentor','evaluator'));

----------------------------------------------------------------------
-- 2. Add submission_id subject FK + widen the exactly-one-subject CHECK
----------------------------------------------------------------------
alter table public.agent_runs
  add column if not exists submission_id uuid references public.career_submissions on delete cascade;

alter table public.agent_runs
  drop constraint if exists agent_runs_exactly_one_subject;

alter table public.agent_runs
  add constraint agent_runs_exactly_one_subject check (
    (claim_id is not null)::int +
    (user_idea_id is not null)::int +
    (user_project_id is not null)::int +
    (submission_id is not null)::int = 1
  );

create index if not exists agent_runs_submission_idx
  on public.agent_runs (submission_id, agent_role, started_at desc);

----------------------------------------------------------------------
-- 3. Widen SELECT RLS so submission-scoped reads land for the owner
----------------------------------------------------------------------
drop policy if exists "team or admin reads agent runs" on public.agent_runs;

create policy "team or admin reads agent runs"
  on public.agent_runs for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.idea_claims c
        join public.team_members tm on tm.team_id = c.team_id
       where c.id = agent_runs.claim_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.user_ideas i
        join public.team_members tm on tm.team_id = i.team_id
       where i.id = agent_runs.user_idea_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.user_projects p
        join public.team_members tm on tm.team_id = p.team_id
       where p.id = agent_runs.user_project_id and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.career_submissions s
        join public.career_enrollments e on e.id = s.enrollment_id
       where s.id = agent_runs.submission_id and e.user_id = auth.uid()
    )
  );
