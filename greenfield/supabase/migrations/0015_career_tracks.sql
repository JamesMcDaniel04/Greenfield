-- 0015: career tracks + projects
--
-- The "Career" surface replaces the lightweight Practice page with a focused,
-- role-based curriculum. A track is a hireable role (AI Automation Specialist
-- at MVP); each track has an ordered set of projects with their own rubric,
-- anti-cheat questions, and required artifacts. Learners enroll once per
-- track (see 0016) and submit one project at a time.

----------------------------------------------------------------------
-- career_tracks: one row per role-based curriculum
----------------------------------------------------------------------
create table public.career_tracks (
  slug          text primary key,
  title         text not null,
  target_role   text not null,
  summary       text not null,
  hero_promise  text not null,
  est_duration  text not null,
  project_count integer not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

----------------------------------------------------------------------
-- career_projects: ordered projects inside a track
----------------------------------------------------------------------
create table public.career_projects (
  slug                 text primary key,
  track_slug           text not null references public.career_tracks on delete cascade,
  ordinal              integer not null,

  title                text not null,
  summary              text not null,
  hireable_skill       text not null,

  -- jsonb of required artifact keys, e.g. ["repo_url","deploy_url","demo_url"]
  required_artifacts   jsonb not null default '[]'::jsonb,

  -- jsonb array: [{ id, prompt, min_words }]
  anti_cheat_questions jsonb not null default '[]'::jsonb,

  -- jsonb array: [{ id, criterion, weight, pass_threshold, max }]
  rubric               jsonb not null default '[]'::jsonb,

  -- Markdown briefing the learner reads before starting
  starter_brief_md     text,

  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  unique (track_slug, ordinal)
);

create index career_projects_track_idx
  on public.career_projects (track_slug, ordinal);

----------------------------------------------------------------------
-- RLS: tracks + projects are publicly readable so the /career landing
-- page and /pricing page can show them without auth.
----------------------------------------------------------------------
alter table public.career_tracks   enable row level security;
alter table public.career_projects enable row level security;

create policy "anyone reads active tracks"
  on public.career_tracks for select
  using (is_active = true or public.is_current_user_admin());

create policy "anyone reads active projects"
  on public.career_projects for select
  using (is_active = true or public.is_current_user_admin());

-- Writes via service-role only (admin can edit via the admin UI later).

----------------------------------------------------------------------
-- Seed: AI Automation Specialist track + 5 projects
----------------------------------------------------------------------
insert into public.career_tracks (slug, title, target_role, summary, hero_promise, est_duration, project_count)
values (
  'ai-automation-specialist',
  'AI Automation Specialist',
  'AI Automation Specialist',
  'Build 5 production-grade AI automation systems. Get evaluated like a junior AI engineer would be. Leave with a verified portfolio employers can actually trust.',
  'In 30 days, build 5 AI automation projects and walk away with a verified portfolio for AI Automation Specialist roles.',
  '~30 days',
  5
);

insert into public.career_projects
  (slug, track_slug, ordinal, title, summary, hireable_skill, required_artifacts, anti_cheat_questions, rubric, starter_brief_md)
values
(
  'rag-customer-support-bot',
  'ai-automation-specialist',
  1,
  'RAG customer support chatbot',
  'A customer-support chatbot that answers from a private knowledge base. Retrieval over a real docs corpus, grounded answers with citations, and a deployed demo.',
  'Retrieval-augmented generation (RAG) over private docs',
  '["repo_url","deploy_url","demo_url"]'::jsonb,
  $$[
    {"id":"chunking","prompt":"How did you chunk the source documents, and what tradeoff did your chunk size close?","min_words":80},
    {"id":"retrieval","prompt":"Walk through one query end-to-end: what gets embedded, what the retriever returns, and how you handled a near-miss.","min_words":120},
    {"id":"failure","prompt":"Describe one query where your bot was wrong. Why was it wrong, and what would you change to fix it without ballooning context?","min_words":100}
  ]$$::jsonb,
  $$[
    {"id":"grounding","criterion":"Answers are grounded in retrieved chunks with visible citations","weight":3,"pass_threshold":3,"max":5},
    {"id":"chunking_quality","criterion":"Chunking strategy fits the corpus and is defended in writing","weight":2,"pass_threshold":3,"max":5},
    {"id":"deploy","criterion":"Bot is reachable at a live URL and answers a held-out test query correctly","weight":3,"pass_threshold":3,"max":5},
    {"id":"failure_analysis","criterion":"Learner identifies a concrete failure case and a credible fix","weight":2,"pass_threshold":3,"max":5}
  ]$$::jsonb,
  $$# RAG customer support chatbot

Build a chatbot that answers questions about a real product or knowledge base, grounded in the actual source documents. The goal is **answers a customer can act on**, not a clever-sounding hallucination.

## What ships
- A live URL where someone can ask a question.
- Visible citations on every answer, pointing back to the source chunk.
- A README explaining your chunking + retrieval choices.

## Constraints
- Use a real corpus (10+ docs). Don't fake it with one PDF.
- Embeddings + a vector store (your choice — pgvector, Chroma, Pinecone).
- No fine-tuning. The wedge is retrieval quality, not training.

## Anti-cheat checkpoints
You'll be asked to explain your chunking strategy, walk through one query end-to-end, and analyze a failure case. Generic answers fail. Specifics — chunk sizes, retriever k, observed near-miss — pass.
$$
),
(
  'sales-research-crm-automation',
  'ai-automation-specialist',
  2,
  'Sales research + CRM automation',
  'An agent that researches inbound leads, enriches them, and updates a CRM. Web search + structured extraction + an API write. The kind of automation a real revenue team would deploy.',
  'Agent-driven research + structured data extraction + write-back to a CRM',
  '["repo_url","deploy_url","demo_url"]'::jsonb,
  $$[
    {"id":"trigger","prompt":"What triggers your automation, and why is that trigger reliable in production?","min_words":80},
    {"id":"extraction","prompt":"Show one extracted record and explain how you'd validate the model's output before writing to the CRM.","min_words":120},
    {"id":"failure_mode","prompt":"What is the worst-case failure of this automation, and how does your code prevent it from silently corrupting the CRM?","min_words":120}
  ]$$::jsonb,
  $$[
    {"id":"end_to_end","criterion":"Automation runs end-to-end: trigger → research → extraction → CRM write","weight":3,"pass_threshold":3,"max":5},
    {"id":"validation","criterion":"Extracted fields are validated before write-back","weight":3,"pass_threshold":3,"max":5},
    {"id":"observability","criterion":"Run logs / audit trail exist for every automated write","weight":2,"pass_threshold":3,"max":5},
    {"id":"failure_handling","criterion":"Failure modes are anticipated and contained","weight":2,"pass_threshold":3,"max":5}
  ]$$::jsonb,
  $$# Sales research + CRM automation

Build the automation a real revenue team would actually deploy: an inbound lead comes in, the agent researches the company, extracts structured fields, validates them, and writes back to a CRM (real or mocked). The hard part is **not corrupting the CRM**.

## What ships
- A trigger (form submit, webhook, or scheduled poll).
- A research step using web_search + fetch_url.
- A validation step (schema, plausibility checks).
- A CRM write (HubSpot / Salesforce sandbox / a Postgres "crm" table is fine).
- A run log of every automated write.

## Anti-cheat checkpoints
You'll explain the trigger, walk one extraction end-to-end, and identify the failure mode that would corrupt the CRM silently. "It just works" answers fail.
$$
),
(
  'ai-meeting-summarizer',
  'ai-automation-specialist',
  3,
  'AI meeting summarizer',
  'Takes a meeting recording or transcript, produces a faithful summary + action items, and ships the summary to a destination (email, Slack, Notion).',
  'Audio/transcript ingestion + structured summarization + delivery',
  '["repo_url","deploy_url","demo_url"]'::jsonb,
  $$[
    {"id":"faithfulness","prompt":"How do you keep the summary faithful to the source and not invent action items?","min_words":100},
    {"id":"action_items","prompt":"Show one extracted action item with its source quote. How would you handle a meeting that has no real action items?","min_words":80},
    {"id":"prod_constraints","prompt":"What are the production constraints (cost, latency, privacy) and how did your design choices address them?","min_words":120}
  ]$$::jsonb,
  $$[
    {"id":"ingest","criterion":"Real audio or transcript ingestion works (not hand-typed input)","weight":2,"pass_threshold":3,"max":5},
    {"id":"faithfulness","criterion":"Summaries reflect the source; action items have source quotes","weight":3,"pass_threshold":3,"max":5},
    {"id":"delivery","criterion":"Summary is delivered to at least one real destination (email/Slack/Notion)","weight":2,"pass_threshold":3,"max":5},
    {"id":"prod_design","criterion":"Production constraints (cost, latency, privacy) are addressed in writing","weight":3,"pass_threshold":3,"max":5}
  ]$$::jsonb,
  $$# AI meeting summarizer

Build the thing every team eventually asks for: turn a meeting recording or transcript into a faithful summary + action items, and **deliver it somewhere a human will actually see it**.

## What ships
- Ingestion path for audio (Whisper or equivalent) or a transcript file.
- A summary + action items, each action linked to a source quote.
- Delivery to at least one real destination.

## Anti-cheat checkpoints
You'll be asked how you keep the summary faithful (no invented actions), what production constraints shaped your design, and how you'd handle a meeting with no real action items. Vague answers fail.
$$
),
(
  'internal-kb-assistant',
  'ai-automation-specialist',
  4,
  'Internal knowledge-base assistant',
  'A multi-source assistant that answers from a company''s internal docs (Notion + Slack + Drive, or real equivalents). Real auth, real sources, real freshness handling.',
  'Multi-source retrieval + auth + freshness handling',
  '["repo_url","deploy_url","demo_url"]'::jsonb,
  $$[
    {"id":"sources","prompt":"List your sources and explain how you keep them fresh without re-indexing everything every time.","min_words":120},
    {"id":"auth","prompt":"Walk through how a user authenticates and what they're authorized to see. What happens if a doc's permissions change after indexing?","min_words":120},
    {"id":"answer_quality","prompt":"Show one query where the answer required combining info from two sources. Why does combination work here?","min_words":100}
  ]$$::jsonb,
  $$[
    {"id":"sources","criterion":"At least 2 real sources are wired up","weight":2,"pass_threshold":3,"max":5},
    {"id":"freshness","criterion":"Incremental refresh is implemented (not full re-index every run)","weight":2,"pass_threshold":3,"max":5},
    {"id":"auth","criterion":"User auth + per-source permissions are respected","weight":3,"pass_threshold":3,"max":5},
    {"id":"answer_quality","criterion":"At least one demo query combines info across sources correctly","weight":3,"pass_threshold":3,"max":5}
  ]$$::jsonb,
  $$# Internal knowledge-base assistant

Build the assistant a real ops or engineering team would deploy: pulls from multiple internal sources, respects who can see what, and stays fresh as docs change. This is the project employers care most about for AI Automation Specialist roles.

## What ships
- At least 2 sources (Notion + Slack export, Drive + Confluence, etc.).
- Auth so different users see different answers.
- Incremental refresh so re-index isn't every-run.
- A demo query that genuinely requires combining sources.

## Anti-cheat checkpoints
You'll explain your sources + freshness strategy, your auth model, and walk through one cross-source query. Generic RAG answers won't fly here.
$$
),
(
  'production-ai-app',
  'ai-automation-specialist',
  5,
  'Production AI app with auth, database, and evals',
  'A small but real product: AI feature, user auth, persistent database, and a written eval harness for the AI part. The capstone — proves you can ship.',
  'Full-stack AI app + auth + DB + evals',
  '["repo_url","deploy_url","demo_url"]'::jsonb,
  $$[
    {"id":"product","prompt":"What does the product do and who is the target user? Be specific about the smallest useful version.","min_words":80},
    {"id":"eval","prompt":"Describe your eval harness. What does pass/fail look like, how often does it run, and what did it catch?","min_words":150},
    {"id":"tradeoffs","prompt":"What did you cut from v1 to ship, and why was that the right cut?","min_words":100}
  ]$$::jsonb,
  $$[
    {"id":"product_scope","criterion":"Product has a clear user, a clear job, and a working flow end-to-end","weight":3,"pass_threshold":3,"max":5},
    {"id":"auth_db","criterion":"Real auth + persistent DB are wired up (not in-memory)","weight":2,"pass_threshold":3,"max":5},
    {"id":"evals","criterion":"An eval harness exists, runs against the AI feature, and has caught at least one regression","weight":3,"pass_threshold":3,"max":5},
    {"id":"deploy","criterion":"App is live at a real URL; a guest user can complete the core flow","weight":2,"pass_threshold":3,"max":5}
  ]$$::jsonb,
  $$# Production AI app with auth, database, and evals

The capstone. Pick a small, real product idea — keep the scope tight — and ship it with auth, a database, and an eval harness for the AI part. This project is what an employer will spend the most time on.

## What ships
- A live app with a clear user + clear job-to-be-done.
- Real auth (Supabase / Clerk / Auth0).
- Real persistent storage.
- An eval harness for the AI feature, with a README explaining what passes and what fails.

## Anti-cheat checkpoints
You'll describe your product scope, your eval harness, and what you cut to ship. "I built everything" answers fail — the test is what you said no to.
$$
);
