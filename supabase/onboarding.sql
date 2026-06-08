-- ============================================================
-- AkopFit — client approval + intake stats
-- Run once in the Supabase SQL Editor.
-- ============================================================

-- New profile columns: approval status, onboarding flag, and intake stats.
alter table public.profiles
  add column if not exists status    text not null default 'pending' check (status in ('pending','active','removed')),
  add column if not exists onboarded boolean not null default false,
  add column if not exists age       int,
  add column if not exists sex       text;

-- Grandfather everyone who already exists so nobody gets locked out:
-- existing accounts become active + onboarded. (New signups will be
-- pending + not-onboarded via the trigger below.)
update public.profiles set status = 'active' where status = 'pending';
update public.profiles set onboarded = true where onboarded = false;

-- New-user trigger: coach is active+onboarded; clients start pending and
-- must complete intake, then await coach approval.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare is_the_coach boolean := lower(new.email) = lower('anishkoppisetty@gmail.com');
begin
  insert into public.profiles (id, email, name, role, status, onboarded)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case when is_the_coach then 'coach' else 'client' end,
    case when is_the_coach then 'active' else 'pending' end,
    is_the_coach
  )
  on conflict (id) do nothing;

  insert into public.plans (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.programs (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;
