-- ============================================================
-- AkopFit — Supabase schema + row-level security
-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- IMPORTANT: set your coach email below. The account that signs in
-- with this email becomes the coach (sees all clients). Everyone else
-- is a client (sees only their own data).
-- ============================================================

-- >>> CHANGE THIS to your email <<<
--     (used by the new-user trigger to assign the coach role)
--     Coach: anishkoppisetty@gmail.com

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'client' check (role in ('client','coach')),
  name        text,
  email       text,
  unit        text not null default 'lb' check (unit in ('lb','kg')),
  height_cm   numeric,
  start_weight numeric,
  created_at  timestamptz not null default now()
);

-- Coach-owned plan / daily targets (1:1 with a client)
create table if not exists public.plans (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  goal           text not null default 'maintain' check (goal in ('cut','maintain','bulk')),
  goal_weight    numeric,
  split_name     text not null default 'Push / Pull / Legs',
  calories       int not null default 2200,
  protein        int not null default 180,
  carbs          int not null default 200,
  fat            int not null default 60,
  steps          int not null default 10000,
  cardio_minutes int not null default 30,
  water          int not null default 8,
  updated_at     timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  weight     numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.daily_logs (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  date           date not null,
  steps          int,
  cardio_minutes int,
  cardio_type    text,
  water          int,
  workout_done   boolean,
  training_day_id text,
  primary key (user_id, date)
);

create table if not exists public.food_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  meal       text check (meal in ('Breakfast','Lunch','Dinner','Snacks')),
  name       text,
  calories   int default 0,
  protein    int default 0,
  carbs      int default 0,
  fat        int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  date      date not null,
  exercise  text not null,
  set_index int not null,
  weight    numeric default 0,
  reps      int default 0,
  unique (user_id, date, exercise, set_index)
);

create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  weight      numeric,
  message     text,
  energy      int,
  sleep       int,
  hunger      int,
  adherence   int,
  coach_reply text,
  photo_paths text[] not null default '{}',
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- New-user bootstrap: create a profile (+ default plan) on signup.
-- The coach email gets role = 'coach'.
-- ----------------------------------------------------------------

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

  insert into public.plans (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user the coach?
create or replace function public.is_coach()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;

-- ----------------------------------------------------------------
-- Row-level security
-- ----------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.plans        enable row level security;
alter table public.weight_logs  enable row level security;
alter table public.daily_logs   enable row level security;
alter table public.food_entries enable row level security;
alter table public.workout_sets enable row level security;
alter table public.check_ins    enable row level security;

-- profiles: owner or coach can read; owner or coach can update
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_coach());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_coach())
  with check (id = auth.uid() or public.is_coach());

-- plans: owner or coach can read; owner or coach can write
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select
  using (user_id = auth.uid() or public.is_coach());
drop policy if exists plans_upsert on public.plans;
create policy plans_upsert on public.plans for insert
  with check (user_id = auth.uid() or public.is_coach());
drop policy if exists plans_update on public.plans;
create policy plans_update on public.plans for update
  using (user_id = auth.uid() or public.is_coach())
  with check (user_id = auth.uid() or public.is_coach());

-- Generic client-data tables: owner full access, coach read (+ update for replies).
-- Applied to weight_logs, daily_logs, food_entries, workout_sets, check_ins.
do $$
declare t text;
begin
  foreach t in array array['weight_logs','daily_logs','food_entries','workout_sets','check_ins']
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select using (user_id = auth.uid() or public.is_coach())', t);

    execute format('drop policy if exists %1$s_insert on public.%1$s', t);
    execute format('create policy %1$s_insert on public.%1$s for insert with check (user_id = auth.uid())', t);

    execute format('drop policy if exists %1$s_update on public.%1$s', t);
    execute format('create policy %1$s_update on public.%1$s for update using (user_id = auth.uid() or public.is_coach()) with check (user_id = auth.uid() or public.is_coach())', t);

    execute format('drop policy if exists %1$s_delete on public.%1$s', t);
    execute format('create policy %1$s_delete on public.%1$s for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- ----------------------------------------------------------------
-- Storage bucket for check-in photos (private; path = <user_id>/<file>)
-- ----------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('check-in-photos', 'check-in-photos', false)
on conflict (id) do nothing;

drop policy if exists checkin_photos_select on storage.objects;
create policy checkin_photos_select on storage.objects for select
  using (
    bucket_id = 'check-in-photos'
    and (split_part(name, '/', 1) = auth.uid()::text or public.is_coach())
  );

drop policy if exists checkin_photos_insert on storage.objects;
create policy checkin_photos_insert on storage.objects for insert
  with check (
    bucket_id = 'check-in-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists checkin_photos_delete on storage.objects;
create policy checkin_photos_delete on storage.objects for delete
  using (
    bucket_id = 'check-in-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Done. Enable Realtime for live coach updates (optional, can also do in Dashboard):
alter publication supabase_realtime add table public.check_ins;
alter publication supabase_realtime add table public.weight_logs;
alter publication supabase_realtime add table public.daily_logs;
alter publication supabase_realtime add table public.plans;
