-- Greenfield migration 0002: admin role + admin-gated writes
-- Adds is_admin to profiles, opens up writes for admins on opportunities & build_briefs,
-- and allows authenticated users to read build_briefs IF they're Pro OR admin.

----------------------------------------------------------------------
-- Admin flag
----------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

----------------------------------------------------------------------
-- Helper: is the current user an admin?
-- (Defined as SECURITY DEFINER so RLS policies can call it without recursion.)
----------------------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;

----------------------------------------------------------------------
-- Opportunities: admin can write
----------------------------------------------------------------------
drop policy if exists "admins insert opportunities" on public.opportunities;
create policy "admins insert opportunities"
  on public.opportunities for insert
  with check (public.is_current_user_admin());

drop policy if exists "admins update opportunities" on public.opportunities;
create policy "admins update opportunities"
  on public.opportunities for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "admins delete opportunities" on public.opportunities;
create policy "admins delete opportunities"
  on public.opportunities for delete
  using (public.is_current_user_admin());

----------------------------------------------------------------------
-- Build briefs: replace the Pro-only read policy to also let admins read,
-- and allow admins to write (the edge function will use service-role anyway,
-- but this lets the admin UI work without one).
----------------------------------------------------------------------
drop policy if exists "pro users read briefs" on public.build_briefs;

create policy "pro or admin reads briefs"
  on public.build_briefs for select using (
    public.is_current_user_admin()
    or exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.is_pro = true
    )
  );

drop policy if exists "admins write briefs" on public.build_briefs;
create policy "admins write briefs"
  on public.build_briefs for insert
  with check (public.is_current_user_admin());

drop policy if exists "admins update briefs" on public.build_briefs;
create policy "admins update briefs"
  on public.build_briefs for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "admins delete briefs" on public.build_briefs;
create policy "admins delete briefs"
  on public.build_briefs for delete
  using (public.is_current_user_admin());

----------------------------------------------------------------------
-- Profiles: admin can read/update any profile (e.g. to grant Pro)
----------------------------------------------------------------------
drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());
