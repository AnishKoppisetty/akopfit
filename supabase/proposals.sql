-- ============================================================
-- AkopFit — client proposes program edits, coach confirms
-- Run once in the Supabase SQL Editor. Idempotent.
-- ============================================================

alter table public.programs
  add column if not exists proposed_days   jsonb,
  add column if not exists proposal_status text not null default 'none' check (proposal_status in ('none','pending')),
  add column if not exists proposal_note   text,
  add column if not exists proposed_at     timestamptz;

-- Clients may edit proposal fields, but NOT the live `days` — only the
-- coach can change that (on approval). This trigger reverts any attempt
-- by a non-coach to modify `days`.
create or replace function public.guard_program_days()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_coach() then
    new.days := old.days;
  end if;
  return new;
end;
$$;

drop trigger if exists program_days_guard on public.programs;
create trigger program_days_guard
  before update on public.programs
  for each row execute function public.guard_program_days();
