-- Greenfield initial schema
-- Run via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

----------------------------------------------------------------------
-- opportunities: the catalogue of unbuilt product opportunities
----------------------------------------------------------------------
create table public.opportunities (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text unique not null,
  title                 text not null,
  one_liner             text not null,

  the_gap               text not null,
  the_play              text not null,
  market_size_summary   text not null,
  timing_rationale      text not null,
  build_path            text not null,

  model_type            text not null,
  audience              text not null,
  industry              text not null,
  niche                 text,

  revenue_ceiling       text not null,
  founder_path          text not null,
  difficulty            text not null,
  starting_capital      text not null,
  time_to_launch        text not null,
  build_stack_hint      text not null,
  moat                  text not null,
  distribution_play     text not null,
  demand_trend          text not null,

  featured              boolean not null default false,
  rank                  integer not null default 100,
  cover_image_url       text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index opportunities_industry_idx       on public.opportunities (industry);
create index opportunities_audience_idx       on public.opportunities (audience);
create index opportunities_difficulty_idx     on public.opportunities (difficulty);
create index opportunities_featured_rank_idx  on public.opportunities (featured desc, rank asc);

----------------------------------------------------------------------
-- profiles: per-user metadata + Pro flag
----------------------------------------------------------------------
create table public.profiles (
  user_id            uuid primary key references auth.users on delete cascade,
  display_name       text,
  avatar_url         text,
  is_pro             boolean not null default false,
  pro_since          timestamptz,
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

----------------------------------------------------------------------
-- saved_opportunities: bookmarks
----------------------------------------------------------------------
create table public.saved_opportunities (
  user_id        uuid not null references auth.users on delete cascade,
  opportunity_id uuid not null references public.opportunities on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create index saved_opportunities_user_idx on public.saved_opportunities (user_id, created_at desc);

----------------------------------------------------------------------
-- build_briefs: paid Pro feature — Claude-ready implementation prompt
----------------------------------------------------------------------
create table public.build_briefs (
  opportunity_id uuid primary key references public.opportunities on delete cascade,
  markdown       text not null,
  model          text,
  generated_at   timestamptz not null default now()
);

----------------------------------------------------------------------
-- Row-level security
----------------------------------------------------------------------
alter table public.opportunities       enable row level security;
alter table public.profiles            enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.build_briefs        enable row level security;

-- opportunities: readable by anyone
create policy "opportunities are public"
  on public.opportunities for select using (true);

-- profiles: each user reads/updates their own; everyone can read display_name (for future social features)
create policy "profiles are readable"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = user_id);

-- saved: each user manages their own bookmarks
create policy "users read own bookmarks"
  on public.saved_opportunities for select using (auth.uid() = user_id);
create policy "users insert own bookmarks"
  on public.saved_opportunities for insert with check (auth.uid() = user_id);
create policy "users delete own bookmarks"
  on public.saved_opportunities for delete using (auth.uid() = user_id);

-- build_briefs: only Pro users may read; nobody writes via RLS (writes go through service role from generator script / edge function)
create policy "pro users read briefs"
  on public.build_briefs for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_pro = true
    )
  );
