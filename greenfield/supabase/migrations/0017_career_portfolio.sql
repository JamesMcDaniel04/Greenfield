-- 0017: career_portfolio_profiles
--
-- The public-facing learner profile. One row per user. Stays private (is_public
-- false) until the learner explicitly publishes from /settings/portfolio.
-- Public reads are unauthenticated so recruiters can view by URL.

create table public.career_portfolio_profiles (
  user_id                    uuid primary key references auth.users on delete cascade,
  username                   text unique not null
                               check (username ~ '^[a-z0-9][a-z0-9-]{2,30}$'),
  headline                   text,
  bio                        text,
  is_public                  boolean not null default false,

  -- Track slugs the learner has passed the agent-graded path on.
  verified_track_slugs       jsonb not null default '[]'::jsonb,
  -- Track slugs additionally signed off by a human reviewer.
  human_verified_track_slugs jsonb not null default '[]'::jsonb,

  published_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index career_portfolio_username_idx
  on public.career_portfolio_profiles (username);

create trigger career_portfolio_touch_updated_at
  before update on public.career_portfolio_profiles
  for each row execute function public.touch_updated_at();

----------------------------------------------------------------------
-- RLS: public read of public portfolios, owner CRUD on their own row.
----------------------------------------------------------------------
alter table public.career_portfolio_profiles enable row level security;

create policy "anyone reads public portfolios"
  on public.career_portfolio_profiles for select
  using (is_public = true);

create policy "owner reads own portfolio"
  on public.career_portfolio_profiles for select
  using (user_id = auth.uid() or public.is_current_user_admin());

create policy "owner writes own portfolio"
  on public.career_portfolio_profiles for insert with check (user_id = auth.uid());

create policy "owner updates own portfolio"
  on public.career_portfolio_profiles for update using (user_id = auth.uid());

create policy "owner deletes own portfolio"
  on public.career_portfolio_profiles for delete using (user_id = auth.uid());

----------------------------------------------------------------------
-- Trigger: when the last project in a track passes for a learner, append
-- the track slug to their portfolio's verified_track_slugs.
----------------------------------------------------------------------
create or replace function public.maybe_mark_track_verified()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  learner_user_id uuid;
  this_track_slug text;
  total_projects  integer;
  passed_projects integer;
begin
  if new.status <> 'passed' then
    return new;
  end if;

  select e.user_id, p.track_slug
    into learner_user_id, this_track_slug
    from public.career_enrollments e
    join public.career_projects p on p.slug = new.project_slug
   where e.id = new.enrollment_id;

  select count(*) into total_projects
    from public.career_projects
   where track_slug = this_track_slug and is_active = true;

  -- Count distinct passed projects for this learner+track. A learner can
  -- have multiple attempts; we count "has at least one passed submission".
  select count(distinct s.project_slug) into passed_projects
    from public.career_submissions s
    join public.career_enrollments e on e.id = s.enrollment_id
   where e.user_id    = learner_user_id
     and e.track_slug = this_track_slug
     and s.status     = 'passed';

  if passed_projects >= total_projects then
    -- Mark the track verified on the learner's portfolio (create the row if
    -- the learner hasn't visited /settings/portfolio yet; username will be
    -- a placeholder they can rename later).
    insert into public.career_portfolio_profiles (user_id, username, verified_track_slugs)
    values (
      learner_user_id,
      'learner-' || substr(learner_user_id::text, 1, 8),
      jsonb_build_array(this_track_slug)
    )
    on conflict (user_id) do update
       set verified_track_slugs =
             case
               when career_portfolio_profiles.verified_track_slugs ? this_track_slug
                 then career_portfolio_profiles.verified_track_slugs
               else career_portfolio_profiles.verified_track_slugs || to_jsonb(this_track_slug)
             end,
           updated_at = now();
  end if;

  return new;
end;
$$;

create trigger career_submission_passed_marks_track
  after update of status on public.career_submissions
  for each row
  when (new.status = 'passed')
  execute function public.maybe_mark_track_verified();
