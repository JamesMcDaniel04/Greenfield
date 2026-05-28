-- 0019: 'career' plan tier (enum value only)
--
-- Adds the 'career' value to plan_tier. The career_runs_per_month_quota
-- column, plan_defaults() rewrite, sync_team_plan_defaults() rewrite,
-- career_usage_monthly table + trigger + RLS all live in 0021 — Postgres
-- forbids using a newly-added enum value in the same transaction that added
-- it, so the rest has to happen in a later migration (and therefore later
-- transaction).

alter type public.plan_tier add value if not exists 'career';
