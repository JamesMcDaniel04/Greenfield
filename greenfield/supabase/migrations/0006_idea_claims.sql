-- 0006: idea_claims + visible_opportunities + claim_idea function
--
-- Claims gate visibility of opportunities. An "active" claim on an opportunity
-- makes that opportunity disappear from /browse for everyone outside the
-- owning team. Releasing the claim restores public visibility.

----------------------------------------------------------------------
-- Table
----------------------------------------------------------------------
create table public.idea_claims (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities on delete cascade,
  team_id         uuid not null references public.teams on delete cascade,
  claimed_by      uuid not null references auth.users,
  status          text not null default 'active' check (status in ('active', 'released', 'expired')),
  claimed_at      timestamptz not null default now(),
  released_at     timestamptz,
  expires_at      timestamptz
);

-- Exclusivity: only one *active* claim per opportunity at any time.
create unique index idea_claims_one_active_per_opp
  on public.idea_claims (opportunity_id) where status = 'active';

create index idea_claims_team_active_idx
  on public.idea_claims (team_id, claimed_at desc) where status = 'active';

create index idea_claims_opp_idx
  on public.idea_claims (opportunity_id, status);

----------------------------------------------------------------------
-- View: opportunities currently visible to the caller
----------------------------------------------------------------------
create or replace view public.visible_opportunities
with (security_invoker = true) as
  select o.*
    from public.opportunities o
   where not exists (
     select 1
       from public.idea_claims c
      where c.opportunity_id = o.id
        and c.status         = 'active'
        and not exists (
          select 1
            from public.team_members tm
           where tm.team_id = c.team_id
             and tm.user_id = auth.uid()
        )
   );

----------------------------------------------------------------------
-- Atomic claim function: checks plan + quota + exclusivity, then inserts.
-- Returns the new claim row.
----------------------------------------------------------------------
create or replace function public.claim_idea(opp_id uuid, team uuid)
returns public.idea_claims
language plpgsql security definer set search_path = public
as $$
declare
  caller_team_plan public.plan_tier;
  team_quota       integer;
  used             integer;
  existing         public.idea_claims;
  inserted         public.idea_claims;
begin
  -- Caller must be a member of the team.
  if not exists (
    select 1 from public.team_members
     where team_id = team and user_id = auth.uid()
  ) then
    raise exception 'NOT_TEAM_MEMBER';
  end if;

  -- Scout can't claim (quota = 0).
  select plan, claims_per_week_quota into caller_team_plan, team_quota
    from public.teams where id = team;
  if team_quota <= 0 then
    raise exception 'PLAN_LACKS_CLAIMING';
  end if;

  -- For Entrepreneur, the meaningful unit is "1 active claim at a time" — at
  -- $497 per additional claim, we don't want background expiry surprising users.
  -- For Venture Studio / University, enforce the rolling 7-day quota.
  if caller_team_plan = 'entrepreneur' then
    if exists (
      select 1 from public.idea_claims
       where team_id = team and status = 'active'
    ) then
      raise exception 'CLAIM_SLOT_TAKEN';
    end if;
  else
    select count(*) into used
      from public.idea_claims
     where team_id = team
       and claimed_at > now() - interval '7 days';
    if used >= team_quota then
      raise exception 'WEEKLY_QUOTA_EXHAUSTED used=% quota=%', used, team_quota;
    end if;
  end if;

  -- Exclusivity check + insert under a row lock to prevent the race.
  select * into existing
    from public.idea_claims
   where opportunity_id = opp_id and status = 'active'
   for update;
  if found then
    raise exception 'ALREADY_CLAIMED';
  end if;

  insert into public.idea_claims (opportunity_id, team_id, claimed_by)
  values (opp_id, team, auth.uid())
  returning * into inserted;

  return inserted;
end;
$$;

----------------------------------------------------------------------
-- Release a claim — only the owning team's members (or admins) can.
----------------------------------------------------------------------
create or replace function public.release_claim(claim uuid)
returns public.idea_claims
language plpgsql security definer set search_path = public
as $$
declare
  row public.idea_claims;
begin
  select * into row from public.idea_claims where id = claim and status = 'active';
  if not found then
    raise exception 'CLAIM_NOT_ACTIVE';
  end if;

  if not (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members
       where team_id = row.team_id and user_id = auth.uid()
    )
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  update public.idea_claims
     set status = 'released', released_at = now()
   where id = claim
   returning * into row;
  return row;
end;
$$;

----------------------------------------------------------------------
-- RLS
----------------------------------------------------------------------
alter table public.idea_claims enable row level security;

-- Team members + admins see their team's claims. Everyone authenticated can
-- see released claims as public history (useful for "previously claimed" badges later).
create policy "team or admin reads claims"
  on public.idea_claims for select using (
    status <> 'active'
    or public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
       where tm.team_id = idea_claims.team_id
         and tm.user_id = auth.uid()
    )
  );

-- All writes go through the service-role claim_idea() / release_claim() functions.
-- No direct insert/update/delete from the client.
