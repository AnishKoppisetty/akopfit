-- ============================================================
-- AkopFit — activity level + water in ounces
-- Run once in the Supabase SQL Editor. (The water conversion is
-- guarded to only touch values that still look like glass counts.)
-- ============================================================

alter table public.profiles add column if not exists activity_level text;

-- Water targets/logs move from "glasses" to "ounces" (1 glass ≈ 8 oz).
alter table public.plans alter column water set default 128;

-- Convert existing small (glass-count) values to ounces, once.
update public.plans      set water = water * 8 where water is not null and water <= 20;
update public.daily_logs set water = water * 8 where water is not null and water <= 30;
