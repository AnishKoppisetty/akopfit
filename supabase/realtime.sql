-- ============================================================
-- AkopFit — enable realtime on the remaining tables
-- Run once in the Supabase SQL Editor. Idempotent (safe to re-run).
-- (check_ins, weight_logs, daily_logs, plans, programs are already enabled.)
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array['food_entries','workout_sets','profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
