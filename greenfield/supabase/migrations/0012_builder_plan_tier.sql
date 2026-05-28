-- 0012: builder plan tier (enum value only)
--
-- Adds the 'builder' value to plan_tier. The column on teams, plan_defaults()
-- rewrite, and sync_team_plan_defaults() rewrite live in 0020 — Postgres
-- forbids using a newly-added enum value in the same transaction that added
-- it, so the rest has to happen in a later migration (and therefore later
-- transaction).

alter type public.plan_tier add value if not exists 'builder';
