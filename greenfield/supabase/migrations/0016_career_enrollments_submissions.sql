-- 0016: career_enrollments + career_submissions + career_submission_evaluations
--
-- A learner enrolls in a track (one enrollment per user per track). For each
-- project they create a submission row (starts in 'draft' so mentor runs can
-- be scoped to it; transitions to 'submitted' when artifacts are posted, then
-- 'grading' / 'passed' / 'needs_revision' as the evaluator agent grades).
-- Every grading run is captured in career_submission_evaluations, which can
-- also carry an optional human review state.

----------------------------------------------------------------------
-- career_enrollments
----------------------------------------------------------------------
create table public.career_enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  track_slug   text not null references public.career_tracks on delete cascade,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  status       text not null default 'active'
                 check (status in ('active','completed','paused','withdrawn')),
  unique (user_id, track_slug)
);

create index career_enrollments_user_idx
  on public.career_enrollments (user_id, started_at desc);

----------------------------------------------------------------------
-- career_submissions: a learner's attempt at one project
----------------------------------------------------------------------
create table public.career_submissions (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.career_enrollments on delete cascade,
  project_slug    text not null references public.career_projects on delete cascade,

  repo_url        text,
  deploy_url      text,
  demo_url        text,
  written_answers jsonb not null default '{}'::jsonb,

  status          text not null default 'draft'
                    check (status in ('draft','submitted','grading','passed','needs_revision','failed','withdrawn')),
  attempt_no      integer not null default 1,

  submitted_at    timestamptz,
  graded_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (enrollment_id, project_slug, attempt_no)
);

create index career_submissions_enrollment_idx
  on public.career_submissions (enrollment_id, project_slug, attempt_no desc);

create trigger career_submissions_touch_updated_at
  before update on public.career_submissions
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------------
-- career_submission_evaluations
----------------------------------------------------------------------
create table public.career_submission_evaluations (
  id                     uuid primary key default gen_random_uuid(),
  submission_id          uuid not null references public.career_submissions on delete cascade,
  evaluator_agent_run_id uuid references public.agent_runs on delete set null,

  rubric_scores          jsonb not null default '[]'::jsonb,  -- [{ criterion_id, score, max, notes }]
  overall_pass           boolean not null,
  model_feedback_md      text,

  human_reviewer_id      uuid references auth.users,
  human_review_state     text not null default 'none'
                           check (human_review_state in ('none','requested','in_review','approved','rejected')),
  human_review_notes     text,
  reviewed_at            timestamptz,

  created_at             timestamptz not null default now()
);

create index career_evaluations_submission_idx
  on public.career_submission_evaluations (submission_id, created_at desc);

----------------------------------------------------------------------
-- RLS: learner owns their enrollment + submissions + evaluations.
-- Admins can read all (for human review). Writes via service-role from
-- the submit-project edge function.
----------------------------------------------------------------------
alter table public.career_enrollments              enable row level security;
alter table public.career_submissions              enable row level security;
alter table public.career_submission_evaluations   enable row level security;

create policy "owner or admin reads enrollments"
  on public.career_enrollments for select using (
    user_id = auth.uid()
    or public.is_current_user_admin()
  );

create policy "owner writes own enrollment"
  on public.career_enrollments for insert with check (user_id = auth.uid());

create policy "owner updates own enrollment"
  on public.career_enrollments for update using (user_id = auth.uid());

create policy "owner or admin reads submissions"
  on public.career_submissions for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.career_enrollments e
       where e.id = career_submissions.enrollment_id
         and e.user_id = auth.uid()
    )
  );

-- Learners create draft submissions client-side so mentor runs have a
-- subject; the submit-project edge function flips status to 'submitted'.
create policy "owner writes own submission draft"
  on public.career_submissions for insert with check (
    exists (
      select 1 from public.career_enrollments e
       where e.id = career_submissions.enrollment_id
         and e.user_id = auth.uid()
    )
  );

create policy "owner updates own submission draft"
  on public.career_submissions for update using (
    status = 'draft' and exists (
      select 1 from public.career_enrollments e
       where e.id = career_submissions.enrollment_id
         and e.user_id = auth.uid()
    )
  );

create policy "owner or admin reads evaluations"
  on public.career_submission_evaluations for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.career_submissions s
        join public.career_enrollments e on e.id = s.enrollment_id
       where s.id = career_submission_evaluations.submission_id
         and e.user_id = auth.uid()
    )
  );

-- Evaluation writes via service-role only (submit-project edge function).
