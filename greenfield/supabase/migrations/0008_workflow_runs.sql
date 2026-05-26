-- 0008: workflow_runs + workflow_steps
--
-- A "workflow run" is a claim + a workflow template (from src/lib/workflows.ts)
-- executed step by step, where each step delegates to one of the four agents.
-- The orchestrator runs client-side and fires the existing run-agent edge
-- function per step; this table just persists state so the run survives
-- reloads and is visible to the rest of the team.

create table public.workflow_runs (
  id              uuid primary key default gen_random_uuid(),
  claim_id        uuid not null references public.idea_claims on delete cascade,
  workflow_slug   text not null,            -- mirrors WORKFLOW_LIBRARY in code
  workflow_title  text not null,            -- snapshot for history if a template gets renamed
  status          text not null default 'pending'
                    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  current_step    integer not null default 0,
  step_count      integer not null,
  started_by      uuid references auth.users,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  error           text
);

create index workflow_runs_claim_idx
  on public.workflow_runs (claim_id, started_at desc);

create index workflow_runs_status_idx
  on public.workflow_runs (status, started_at desc);

create table public.workflow_steps (
  id              uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references public.workflow_runs on delete cascade,
  ordinal         integer not null,
  owner_role      text not null check (owner_role in ('gtm', 'sales', 'marketing', 'engineering')),
  title           text not null,
  description     text not null,

  status          text not null default 'pending'
                    check (status in ('pending', 'running', 'succeeded', 'failed', 'skipped')),
  agent_run_id    uuid references public.agent_runs on delete set null,
  output_summary  text,                     -- short summary fed into the next step's prompt
  started_at      timestamptz,
  completed_at    timestamptz,
  error           text,

  unique (workflow_run_id, ordinal)
);

create index workflow_steps_run_idx
  on public.workflow_steps (workflow_run_id, ordinal);

----------------------------------------------------------------------
-- RLS — same shape as agent_runs (visible to team members of the claim)
----------------------------------------------------------------------
alter table public.workflow_runs  enable row level security;
alter table public.workflow_steps enable row level security;

create policy "team reads workflow runs"
  on public.workflow_runs for select using (
    public.is_current_user_admin()
    or exists (
      select 1
        from public.idea_claims c
        join public.team_members tm on tm.team_id = c.team_id
       where c.id = workflow_runs.claim_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team reads workflow steps"
  on public.workflow_steps for select using (
    public.is_current_user_admin()
    or exists (
      select 1
        from public.workflow_runs r
        join public.idea_claims c on c.id = r.claim_id
        join public.team_members tm on tm.team_id = c.team_id
       where r.id = workflow_steps.workflow_run_id
         and tm.user_id = auth.uid()
    )
  );

-- Team members can insert and update their own claim's workflow runs/steps
-- (so the client orchestrator can write without needing service-role).
create policy "team writes workflow runs"
  on public.workflow_runs for insert with check (
    exists (
      select 1
        from public.idea_claims c
        join public.team_members tm on tm.team_id = c.team_id
       where c.id = claim_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team updates workflow runs"
  on public.workflow_runs for update using (
    exists (
      select 1
        from public.idea_claims c
        join public.team_members tm on tm.team_id = c.team_id
       where c.id = workflow_runs.claim_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team writes workflow steps"
  on public.workflow_steps for insert with check (
    exists (
      select 1
        from public.workflow_runs r
        join public.idea_claims c on c.id = r.claim_id
        join public.team_members tm on tm.team_id = c.team_id
       where r.id = workflow_run_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team updates workflow steps"
  on public.workflow_steps for update using (
    exists (
      select 1
        from public.workflow_runs r
        join public.idea_claims c on c.id = r.claim_id
        join public.team_members tm on tm.team_id = c.team_id
       where r.id = workflow_steps.workflow_run_id
         and tm.user_id = auth.uid()
    )
  );
