-- ============================================================
-- AkopFit — per-exercise personal notes (seat height, settings…)
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

create table if not exists public.exercise_notes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  exercise   text not null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise)
);

alter table public.exercise_notes enable row level security;

-- Owner manages their own notes; the coach may read them too.
drop policy if exists exercise_notes_select on public.exercise_notes;
create policy exercise_notes_select on public.exercise_notes for select
  using (user_id = auth.uid() or public.is_coach());

drop policy if exists exercise_notes_insert on public.exercise_notes;
create policy exercise_notes_insert on public.exercise_notes for insert
  with check (user_id = auth.uid());

drop policy if exists exercise_notes_update on public.exercise_notes;
create policy exercise_notes_update on public.exercise_notes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists exercise_notes_delete on public.exercise_notes;
create policy exercise_notes_delete on public.exercise_notes for delete
  using (user_id = auth.uid());

-- Live sync across devices.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'exercise_notes'
  ) then
    alter publication supabase_realtime add table public.exercise_notes;
  end if;
end $$;
