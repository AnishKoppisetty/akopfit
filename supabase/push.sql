-- ============================================================
-- AkopFit — Web Push subscriptions
-- Run once in the Supabase SQL Editor.
-- ============================================================

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Owners manage their own device subscriptions. The notify Edge Function
-- reads across users with the service-role key (which bypasses RLS).
drop policy if exists push_select on public.push_subscriptions;
create policy push_select on public.push_subscriptions for select
  using (user_id = auth.uid());

drop policy if exists push_insert on public.push_subscriptions;
create policy push_insert on public.push_subscriptions for insert
  with check (user_id = auth.uid());

drop policy if exists push_delete on public.push_subscriptions;
create policy push_delete on public.push_subscriptions for delete
  using (user_id = auth.uid());
