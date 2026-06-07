-- Coach = anishkoppisetty@gmail.com.
-- Also demotes the earlier iCloud account to a client (handy test client).
-- Safe to run anytime.

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

-- Promote the gmail account to coach (if it already signed in).
update public.profiles set role = 'coach'
where lower(email) = lower('anishkoppisetty@gmail.com');

-- Demote the iCloud account to a client so it shows up in your roster as a test client.
update public.profiles set role = 'client'
where lower(email) = lower('anishkoppisetty@icloud.com');
