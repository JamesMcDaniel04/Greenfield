-- 0004: opportunity_signals
--
-- Stores public research signals (TechCrunch articles, Reddit threads, X posts,
-- HN discussions, etc.) cited by opportunities. The n8n ingestion pipeline POSTs
-- rows here via the `ingest-signal` edge function. Each row may or may not be
-- linked to a specific opportunity; unlinked rows go into an admin triage queue.

create table public.opportunity_signals (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid references public.opportunities on delete cascade,

  source_type     text not null check (source_type in (
    'techcrunch', 'reddit', 'x', 'hackernews', 'crunchbase',
    'arxiv', 'github', 'blog', 'podcast', 'other'
  )),
  url             text not null,
  title           text not null,
  snippet         text,

  published_at    timestamptz not null,
  ingested_at     timestamptz not null default now(),

  -- Free-form tags / categorisation from n8n (keyword matched, sentiment, etc.)
  metadata        jsonb,

  -- Dedup: same URL shouldn't be ingested twice for the same opportunity.
  unique (opportunity_id, url)
);

create index opportunity_signals_opportunity_idx
  on public.opportunity_signals (opportunity_id, published_at desc);

create index opportunity_signals_unlinked_idx
  on public.opportunity_signals (ingested_at desc)
  where opportunity_id is null;

create index opportunity_signals_source_type_idx
  on public.opportunity_signals (source_type);

----------------------------------------------------------------------
-- Row-level security
----------------------------------------------------------------------
alter table public.opportunity_signals enable row level security;

-- Signals are public: any visitor can read them on opportunity detail pages.
create policy "signals are public"
  on public.opportunity_signals for select using (true);

-- Only admins write via UI; the ingestion edge function uses service-role.
create policy "admins write signals"
  on public.opportunity_signals for insert
  with check (public.is_current_user_admin());

create policy "admins update signals"
  on public.opportunity_signals for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

create policy "admins delete signals"
  on public.opportunity_signals for delete
  using (public.is_current_user_admin());
