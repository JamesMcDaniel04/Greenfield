-- 0022: fix infinite recursion on team_members RLS
--
-- The SELECT policy on team_members from 0005 (`members read own team
-- membership`) queries team_members in its USING clause, which re-triggers
-- the same policy and Postgres aborts with `infinite recursion detected in
-- policy for relation "team_members"`. The fix is to route the
-- "am I on this team?" check through current_user_team_ids(), which is
-- SECURITY DEFINER and therefore bypasses RLS on team_members.

drop policy if exists "members read own team membership" on public.team_members;

create policy "members read own team membership"
  on public.team_members for select using (
    public.is_current_user_admin()
    or user_id = auth.uid()
    or team_id in (select public.current_user_team_ids())
  );
