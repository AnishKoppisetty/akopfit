-- ============================================================
-- AkopFit — coach-assigned training programs
-- Run once in the Supabase SQL Editor.
-- ============================================================

-- One program per client; days stored as JSONB (array of training days,
-- each: { id, label, focus, rest, exercises: [{ name, sets, reps, notes }] }).
create table if not exists public.programs (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  days       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.programs enable row level security;

drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select
  using (user_id = auth.uid() or public.is_coach());

drop policy if exists programs_insert on public.programs;
create policy programs_insert on public.programs for insert
  with check (user_id = auth.uid() or public.is_coach());

drop policy if exists programs_update on public.programs;
create policy programs_update on public.programs for update
  using (user_id = auth.uid() or public.is_coach())
  with check (user_id = auth.uid() or public.is_coach());

-- Give every existing client an (empty) program row; the app shows a
-- default template until the coach customizes it.
insert into public.programs (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- Make sure new signups also get a program row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when lower(new.email) = lower('anishkoppisetty@gmail.com') then 'coach' else 'client' end
  )
  on conflict (id) do nothing;

  insert into public.plans (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.programs (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Live updates so a client sees program changes without a manual refresh.
-- (idempotent — safe to re-run)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'programs'
  ) then
    alter publication supabase_realtime add table public.programs;
  end if;
end $$;
