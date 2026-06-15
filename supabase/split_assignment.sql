-- ============================================================
-- AkopFit — allow a client to set their INITIAL program (onboarding),
-- while still blocking edits to an established program (proposals only).
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

create or replace function public.guard_program_days()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_coach() then
    -- A non-coach may populate an empty program (first-time assignment at
    -- onboarding), but may not change a program that already has days.
    if old.days is not null and jsonb_array_length(old.days) > 0 then
      new.days := old.days;
    end if;
  end if;
  return new;
end;
$$;
