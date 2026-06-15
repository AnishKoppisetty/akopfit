import { supabase } from '../lib/supabase'
import { CoachData, CoachClient, WorkoutSession } from './types'
import { Targets, CheckIn, TrainingDay, SetEntry } from '../types'
import { todayISO, daysBetween, toISO } from '../utils'
import { seedData } from '../seed'

const DEFAULT_PROGRAM = seedData().split

// ---- DB row shapes ----
interface ProfileRow { id: string; name: string | null; email: string | null; unit: 'lb' | 'kg'; start_weight: number | null; created_at: string; status: 'pending' | 'active' | 'removed'; age: number | null; sex: string | null; height_cm: number | null }
interface PlanRow { user_id: string; goal: 'cut' | 'maintain' | 'bulk'; goal_weight: number | null; split_name: string; calories: number; protein: number; carbs: number; fat: number; steps: number; cardio_minutes: number; water: number }
interface WeightRow { user_id: string; date: string; weight: number }
interface CheckInRow { id: string; user_id: string; date: string; weight: number | null; message: string | null; energy: number | null; sleep: number | null; hunger: number | null; adherence: number | null; coach_reply: string | null; photo_paths: string[] }
interface DailyRow { user_id: string; date: string; steps: number | null; cardio_minutes: number | null; water: number | null; workout_done: boolean | null }
interface FoodRow { user_id: string; calories: number | null; protein: number | null; carbs: number | null; fat: number | null }

const DEFAULT_TARGETS: Targets = { calories: 2200, protein: 180, carbs: 200, fat: 60, steps: 10000, cardioMinutes: 30, water: 8 }

async function signPhotos(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return []
  const { data } = await supabase.storage.from('check-in-photos').createSignedUrls(paths, 3600)
  return (data ?? []).map(d => d.signedUrl).filter(Boolean) as string[]
}

export async function fetchCoachData(coachName: string): Promise<CoachData> {
  const today = todayISO()
  const [profiles, plans, programs, weights, checkIns, daily, foods] = await Promise.all([
    supabase.from('profiles').select('id, name, email, unit, start_weight, created_at, status, age, sex, height_cm').eq('role', 'client'),
    supabase.from('plans').select('*'),
    supabase.from('programs').select('user_id, days, proposal_status, proposed_days, proposal_note'),
    supabase.from('weight_logs').select('user_id, date, weight').order('date', { ascending: true }),
    supabase.from('check_ins').select('*').order('date', { ascending: false }),
    supabase.from('daily_logs').select('user_id, date, steps, cardio_minutes, water, workout_done').eq('date', today),
    supabase.from('food_entries').select('user_id, calories, protein, carbs, fat').eq('date', today),
  ])

  const planBy = new Map<string, PlanRow>()
  ;(plans.data as PlanRow[] | null)?.forEach(p => planBy.set(p.user_id, p))

  const programBy = new Map<string, TrainingDay[]>()
  const proposalBy = new Map<string, { days: TrainingDay[] | null; note: string | null; pending: boolean }>()
  ;(programs.data as { user_id: string; days: TrainingDay[]; proposal_status?: string; proposed_days?: TrainingDay[]; proposal_note?: string }[] | null)?.forEach(p => {
    if (p.days && p.days.length > 0) programBy.set(p.user_id, p.days)
    proposalBy.set(p.user_id, { pending: p.proposal_status === 'pending', days: p.proposed_days ?? null, note: p.proposal_note ?? null })
  })

  const weightsBy = new Map<string, WeightRow[]>()
  ;(weights.data as WeightRow[] | null)?.forEach(w => {
    const arr = weightsBy.get(w.user_id) ?? []
    arr.push(w); weightsBy.set(w.user_id, arr)
  })

  const checkInsBy = new Map<string, CheckInRow[]>()
  ;(checkIns.data as CheckInRow[] | null)?.forEach(c => {
    const arr = checkInsBy.get(c.user_id) ?? []
    arr.push(c); checkInsBy.set(c.user_id, arr)
  })

  const dailyBy = new Map<string, DailyRow>()
  ;(daily.data as DailyRow[] | null)?.forEach(d => dailyBy.set(d.user_id, d))

  const foodBy = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>()
  ;(foods.data as FoodRow[] | null)?.forEach(f => {
    const cur = foodBy.get(f.user_id) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
    cur.calories += f.calories ?? 0
    cur.protein += f.protein ?? 0
    cur.carbs += f.carbs ?? 0
    cur.fat += f.fat ?? 0
    foodBy.set(f.user_id, cur)
  })

  // Fetch all clients (incl. removed) — the UI separates active / pending / removed.
  const profileRows = (profiles.data as ProfileRow[] | null) ?? []

  const clients: CoachClient[] = await Promise.all(profileRows.map(async (p): Promise<CoachClient> => {
    const plan = planBy.get(p.id)
    const targets: Targets = plan
      ? { calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fat: plan.fat, steps: plan.steps, cardioMinutes: plan.cardio_minutes, water: plan.water }
      : { ...DEFAULT_TARGETS }
    const wlogs = (weightsBy.get(p.id) ?? []).map(w => ({ date: w.date, weight: Number(w.weight) }))
    const startWeight = p.start_weight ?? wlogs[0]?.weight ?? 0
    const food = foodBy.get(p.id)
    const d = dailyBy.get(p.id)

    const cins: CheckIn[] = await Promise.all((checkInsBy.get(p.id) ?? []).map(async (c): Promise<CheckIn> => ({
      id: c.id,
      date: c.date,
      weight: c.weight ?? undefined,
      message: c.message ?? '',
      photos: await signPhotos(c.photo_paths),
      energy: c.energy ?? undefined,
      sleep: c.sleep ?? undefined,
      hunger: c.hunger ?? undefined,
      adherence: c.adherence ?? undefined,
      coachReply: c.coach_reply ?? undefined,
    })))

    return {
      id: p.id,
      name: p.name || p.email || 'Client',
      status: p.status,
      age: p.age,
      sex: p.sex,
      heightCm: p.height_cm,
      goal: plan?.goal ?? 'maintain',
      unit: p.unit ?? 'lb',
      startWeight,
      goalWeight: plan?.goal_weight ?? startWeight,
      joinedDaysAgo: Math.max(0, daysBetween(toISO(new Date(p.created_at)), today)),
      splitName: plan?.split_name ?? 'Push / Pull / Legs',
      targets,
      program: programBy.get(p.id) ?? DEFAULT_PROGRAM,
      proposalPending: proposalBy.get(p.id)?.pending ?? false,
      proposedDays: proposalBy.get(p.id)?.days ?? null,
      proposalNote: proposalBy.get(p.id)?.note ?? null,
      weightLogs: wlogs,
      checkIns: cins,
      today: {
        calories: food?.calories ?? 0,
        protein: food?.protein ?? 0,
        carbs: food?.carbs ?? 0,
        fat: food?.fat ?? 0,
        steps: d?.steps ?? 0,
        cardioMinutes: d?.cardio_minutes ?? 0,
        water: d?.water ?? 0,
        workoutDone: d?.workout_done ?? false,
      },
    }
  }))

  return { coachName, clients }
}

// Load a single client's logged workout history (sets grouped by date) so the
// coach can review what they actually did.
export async function fetchClientWorkouts(clientId: string): Promise<WorkoutSession[]> {
  const [dailyRes, setsRes, programRes] = await Promise.all([
    supabase.from('daily_logs').select('date, workout_done, training_day_id, workout_name').eq('user_id', clientId),
    supabase.from('workout_sets').select('date, exercise, set_index, weight, reps').eq('user_id', clientId),
    supabase.from('programs').select('days').eq('user_id', clientId).maybeSingle(),
  ])

  const programDays = (programRes.data as { days: TrainingDay[] } | null)?.days ?? []
  const focusFor = (id?: string | null) => programDays.find(d => d.id === id)?.focus

  // group sets by date -> exercise (sparse by set_index, then compacted)
  const setsByDate = new Map<string, Record<string, SetEntry[]>>()
  for (const s of (setsRes.data as { date: string; exercise: string; set_index: number; weight: number | null; reps: number | null }[] | null) ?? []) {
    const byEx = setsByDate.get(s.date) ?? {}
    ;(byEx[s.exercise] ??= [])[s.set_index] = { weight: Number(s.weight) || 0, reps: s.reps ?? 0 }
    setsByDate.set(s.date, byEx)
  }

  const dailyByDate = new Map<string, { workout_done: boolean | null; training_day_id: string | null; workout_name: string | null }>()
  for (const d of (dailyRes.data as { date: string; workout_done: boolean | null; training_day_id: string | null; workout_name: string | null }[] | null) ?? []) {
    dailyByDate.set(d.date, d)
  }

  const dates = new Set<string>([...setsByDate.keys()])
  for (const [date, d] of dailyByDate) if (d.workout_done) dates.add(date)

  const sessions: WorkoutSession[] = [...dates].map(date => {
    const d = dailyByDate.get(date)
    const byEx = setsByDate.get(date) ?? {}
    const exercises = Object.entries(byEx).map(([name, sets]) => ({
      name,
      sets: sets.filter(Boolean).filter(x => x.weight > 0 || x.reps > 0),
    })).filter(e => e.sets.length > 0)
    return {
      date,
      name: d?.workout_name || focusFor(d?.training_day_id) || 'Workout',
      exercises,
    }
  })

  return sessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
}

// ---- writes ----

export async function cloudUpdatePlan(userId: string, patch: Partial<Targets & { goal: string; goalWeight: number; splitName: string }>) {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.calories != null) row.calories = patch.calories
  if (patch.protein != null) row.protein = patch.protein
  if (patch.carbs != null) row.carbs = patch.carbs
  if (patch.fat != null) row.fat = patch.fat
  if (patch.steps != null) row.steps = patch.steps
  if (patch.cardioMinutes != null) row.cardio_minutes = patch.cardioMinutes
  if (patch.water != null) row.water = patch.water
  if (patch.goal != null) row.goal = patch.goal
  if (patch.goalWeight != null) row.goal_weight = patch.goalWeight
  if (patch.splitName != null) row.split_name = patch.splitName
  const { error } = await supabase.from('plans').update(row).eq('user_id', userId)
  if (error) throw error
}

export async function cloudReplyToCheckIn(checkInId: string, reply: string) {
  const { error } = await supabase.from('check_ins').update({ coach_reply: reply }).eq('id', checkInId)
  if (error) throw error
}

export async function cloudSetClientStatus(userId: string, status: 'pending' | 'active' | 'removed') {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) throw error
}

export async function cloudUpdateProgram(userId: string, days: TrainingDay[]) {
  const { error } = await supabase.from('programs')
    .upsert({ user_id: userId, days, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function cloudApproveProposal(userId: string, days: TrainingDay[]) {
  const { error } = await supabase.from('programs').update({
    days, proposed_days: null, proposal_status: 'none', proposal_note: null, updated_at: new Date().toISOString(),
  }).eq('user_id', userId)
  if (error) throw error
}

export async function cloudRejectProposal(userId: string) {
  const { error } = await supabase.from('programs').update({
    proposed_days: null, proposal_status: 'none', proposal_note: null,
  }).eq('user_id', userId)
  if (error) throw error
}

export async function cloudResetClientPassword(clientId: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('reset-client-password', { body: { clientId, password } })
  if (error) return { ok: false, error: error.message }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true }
}
