-- 0013: user_ideas + user_projects
--
-- Private, team-owned BYO entities. Unlike the curated `opportunities` table,
-- these never appear in /browse for users outside the owning team. They are
-- the subject of agent_runs (extended in 0014) for founders bringing their
-- own idea or in-flight project to the platform.

----------------------------------------------------------------------
-- user_ideas: a concept the founder is exploring (no shipping evidence yet)
----------------------------------------------------------------------
create table public.user_ideas (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams    on delete cascade,
  created_by  uuid not null references auth.users      on delete set null,

  title       text not null,
  one_liner   text not null,

  the_gap              text,
  the_play             text,
  market_size_summary  text,
  timing_rationale     text,
  build_path           text,

  model_type        text,
  audience          text,
  industry          text,
  niche             text,
  founder_path      text,
  starting_capital  text,
  time_to_launch    text,
  distribution_play text,
  demand_trend      text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index user_ideas_team_idx on public.user_ideas (team_id, created_at desc);

----------------------------------------------------------------------
-- user_projects: in-flight work (has a repo / deploy / metrics)
----------------------------------------------------------------------
create table public.user_projects (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams    on delete cascade,
  created_by  uuid not null references auth.users      on delete set null,

  title       text not null,
  summary     text not null,
  stage       text not null default 'prototype'
                check (stage in ('prototype', 'live', 'scaling')),

  repo_url        text,
  deploy_url      text,
  current_metrics jsonb not null default '{}'::jsonb,
  build_brief_md  text,

  -- Same context fields user_ideas has, so the persona builder works for both.
  model_type        text,
  audience          text,
  industry          text,
  niche             text,
  founder_path      text,
  starting_capital  text,
  time_to_launch    text,
  distribution_play text,
  demand_trend      text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index user_projects_team_idx on public.user_projects (team_id, created_at desc);

----------------------------------------------------------------------
-- updated_at triggers
----------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_ideas_touch_updated_at
  before update on public.user_ideas
  for each row execute function public.touch_updated_at();

create trigger user_projects_touch_updated_at
  before update on public.user_projects
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------------
-- RLS — team members read/write their own; admins read all.
----------------------------------------------------------------------
alter table public.user_ideas    enable row level security;
alter table public.user_projects enable row level security;

create policy "team or admin reads user_ideas"
  on public.user_ideas for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
       where tm.team_id = user_ideas.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team writes user_ideas"
  on public.user_ideas for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.team_members tm
       where tm.team_id = user_ideas.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team updates user_ideas"
  on public.user_ideas for update using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = user_ideas.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team deletes user_ideas"
  on public.user_ideas for delete using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = user_ideas.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team or admin reads user_projects"
  on public.user_projects for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
       where tm.team_id = user_projects.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team writes user_projects"
  on public.user_projects for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.team_members tm
       where tm.team_id = user_projects.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team updates user_projects"
  on public.user_projects for update using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = user_projects.team_id
         and tm.user_id = auth.uid()
    )
  );

create policy "team deletes user_projects"
  on public.user_projects for delete using (
    exists (
      select 1 from public.team_members tm
       where tm.team_id = user_projects.team_id
         and tm.user_id = auth.uid()
    )
  );
