-- Update the coach email to anishkoppisetty@icloud.com.
-- Safe to run anytime (also promotes an existing account with this email).

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
    case when lower(new.email) = lower('anishkoppisetty@icloud.com') then 'coach' else 'client' end
  )
  on conflict (id) do nothing;

  insert into public.plans (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- If you already signed up with this email, make that profile the coach.
update public.profiles set role = 'coach'
where lower(email) = lower('anishkoppisetty@icloud.com');
