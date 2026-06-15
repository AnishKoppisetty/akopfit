-- ============================================================
-- AkopFit — snapshot the training-day name onto each logged workout
-- so workout history shows "Push", "Pull + Biceps", etc. even after the
-- coach rebuilds the program (day ids change). Run once in the Supabase
-- SQL Editor. Idempotent.
-- ============================================================

alter table public.daily_logs add column if not exists workout_name text;
