-- 0003: tag opportunities with a YC Request for Startups topic slug.
--
-- The slug references public.yc-rfs.ts on the frontend (and matches the YC
-- anchor in https://www.ycombinator.com/rfs). We don't enforce an FK because
-- the canonical list lives in code, not in the DB.

alter table public.opportunities
  add column if not exists yc_rfs_slug text;

create index if not exists opportunities_yc_rfs_slug_idx
  on public.opportunities (yc_rfs_slug)
  where yc_rfs_slug is not null;
