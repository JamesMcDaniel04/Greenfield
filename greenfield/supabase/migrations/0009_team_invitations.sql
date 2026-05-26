-- 0009: team_invitations — pending seat assignments for Venture Studio teams
--
-- Companion to the `invite-team-member` edge function. Stores one row per
-- (team, email) so an invitee can claim their seat at first sign-in via the
-- `accept_team_invitation` RPC. Pending invitations also surface in the /team
-- page so owners can see who they've invited.

create table public.team_invitations (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams on delete cascade,
  email        text not null,
  invited_by   uuid not null references auth.users,
  status       text not null default 'pending'
                 check (status in ('pending', 'accepted', 'revoked')),
  accepted_by  uuid references auth.users,
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (team_id, email)
);

create index team_invitations_team_idx
  on public.team_invitations (team_id, status);

create index team_invitations_email_idx
  on public.team_invitations (lower(email), status);

----------------------------------------------------------------------
-- RPC: accept_team_invitation(invitation_id)
-- Caller (a freshly signed-up user) accepts an invite by id; checks the
-- email matches, inserts into team_members, marks the invitation accepted.
----------------------------------------------------------------------
create or replace function public.accept_team_invitation(invitation uuid)
returns public.team_members
language plpgsql security definer set search_path = public
as $$
declare
  inv         public.team_invitations;
  user_email  text;
  inserted    public.team_members;
begin
  select * into inv from public.team_invitations
   where id = invitation and status = 'pending';
  if not found then
    raise exception 'INVITATION_NOT_FOUND_OR_USED';
  end if;

  select email into user_email from auth.users where id = auth.uid();
  if lower(coalesce(user_email, '')) <> lower(inv.email) then
    raise exception 'INVITATION_EMAIL_MISMATCH';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (inv.team_id, auth.uid(), 'member')
  on conflict (team_id, user_id) do nothing
  returning * into inserted;

  update public.team_invitations
     set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
   where id = invitation;

  return inserted;
end;
$$;

----------------------------------------------------------------------
-- RLS
----------------------------------------------------------------------
alter table public.team_invitations enable row level security;

-- Team members can see invites for their team; an invitee can see their own.
create policy "team reads invitations"
  on public.team_invitations for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_invitations.team_id
        and tm.user_id = auth.uid()
    )
    or lower(email) = (select lower(email) from auth.users where id = auth.uid())
  );

-- Direct insert/update/delete blocked from client; the edge function uses
-- service role (and the accept_team_invitation RPC handles transitions).
