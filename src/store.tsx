import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { AppData, DailyLog, CheckIn, WeightLog, Targets, Profile, TrainingDay, FoodEntry, SavedFood, SetEntry } from './types'
import { seedData } from './seed'
import { todayISO, uid } from './utils'
import { useAuth } from './auth/AuthProvider'
import {
  fetchClientData, cloudUpsertDaily, cloudAddWeight, cloudAddFood, cloudRemoveFood,
  cloudSetExerciseSets, cloudAddCheckIn, cloudUpdateProfile,
} from './cloudClient'

const STORAGE_KEY = 'akopfit:data:v2'

interface StoreContext {
  data: AppData
  loading: boolean
  upsertDailyLog: (date: string, patch: Partial<DailyLog>) => void
  getDailyLog: (date: string) => DailyLog
  addFood: (date: string, food: Omit<FoodEntry, 'id'>) => void
  removeFood: (date: string, foodId: string) => void
  saveToLibrary: (food: Omit<SavedFood, 'id'>) => void
  setWater: (date: string, glasses: number) => void
  setExerciseSets: (date: string, exercise: string, sets: SetEntry[]) => void
  lastSetsFor: (exercise: string, beforeDate: string) => SetEntry[] | null
  addWeight: (log: WeightLog) => void
  addCheckIn: (c: Omit<CheckIn, 'id'>) => void
  updateTargets: (t: Partial<Targets>) => void
  updateProfile: (p: Partial<Profile>) => void
  setSplit: (s: TrainingDay[]) => void
  resetAll: () => void
}

const Ctx = createContext<StoreContext | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { configured, session } = useAuth()
  if (configured && session?.user) {
    return <CloudStoreProvider userId={session.user.id}>{children}</CloudStoreProvider>
  }
  return <LocalStoreProvider>{children}</LocalStoreProvider>
}

// helper: merge a patch into a day's log within a dailyLogs map
function patchDaily(logs: Record<string, DailyLog>, date: string, patch: Partial<DailyLog>): Record<string, DailyLog> {
  return { ...logs, [date]: { ...logs[date], ...patch, date } }
}

function lastSets(logs: Record<string, DailyLog>, exercise: string, beforeDate: string): SetEntry[] | null {
  const dates = Object.keys(logs).filter(dt => dt < beforeDate).sort().reverse()
  for (const dt of dates) {
    const s = logs[dt].sets?.[exercise]
    if (s && s.length > 0) return s
  }
  return null
}

// ----------------------------------------------------------------
// Cloud-backed client store
// ----------------------------------------------------------------
function emptyData(): AppData {
  const s = seedData()
  return { profile: s.profile, targets: s.targets, split: s.split, weightLogs: [], dailyLogs: {}, checkIns: [], foodLibrary: s.foodLibrary }
}

function CloudStoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const fresh = await fetchClientData(userId)
      setData(fresh)
    } catch (e) {
      console.warn('[store] failed to load client data', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { reload() }, [reload])

  const getDailyLog = useCallback((date: string): DailyLog => data.dailyLogs[date] ?? { date }, [data.dailyLogs])

  const upsertDailyLog = useCallback((date: string, patch: Partial<DailyLog>) => {
    setData(d => ({ ...d, dailyLogs: patchDaily(d.dailyLogs, date, patch) }))
    cloudUpsertDaily(userId, date, patch).catch(e => console.warn('[store] daily upsert failed', e))
  }, [userId])

  const setWater = useCallback((date: string, glasses: number) => {
    const water = Math.max(0, glasses)
    setData(d => ({ ...d, dailyLogs: patchDaily(d.dailyLogs, date, { water }) }))
    cloudUpsertDaily(userId, date, { water }).catch(e => console.warn(e))
  }, [userId])

  const addWeight = useCallback((log: WeightLog) => {
    setData(d => {
      const others = d.weightLogs.filter(w => w.date !== log.date)
      return { ...d, weightLogs: [...others, log].sort((a, b) => a.date.localeCompare(b.date)) }
    })
    cloudAddWeight(userId, log.date, log.weight).catch(e => console.warn(e))
  }, [userId])

  const addFood = useCallback((date: string, food: Omit<FoodEntry, 'id'>) => {
    const tempId = 'tmp-' + uid()
    setData(d => {
      const log = d.dailyLogs[date] ?? { date }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...log, date, foods: [...(log.foods ?? []), { ...food, id: tempId }] } } }
    })
    cloudAddFood(userId, date, food)
      .then(realId => setData(d => {
        const log = d.dailyLogs[date]
        if (!log?.foods) return d
        return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...log, foods: log.foods.map(f => f.id === tempId ? { ...f, id: realId } : f) } } }
      }))
      .catch(e => console.warn('[store] add food failed', e))
  }, [userId])

  const removeFood = useCallback((date: string, foodId: string) => {
    setData(d => {
      const log = d.dailyLogs[date]
      if (!log?.foods) return d
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...log, foods: log.foods.filter(f => f.id !== foodId) } } }
    })
    if (!foodId.startsWith('tmp-')) cloudRemoveFood(foodId).catch(e => console.warn(e))
  }, [])

  const setExerciseSets = useCallback((date: string, exercise: string, sets: SetEntry[]) => {
    setData(d => {
      const log = d.dailyLogs[date] ?? { date }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...log, date, sets: { ...(log.sets ?? {}), [exercise]: sets } } } }
    })
    cloudSetExerciseSets(userId, date, exercise, sets).catch(e => console.warn(e))
  }, [userId])

  const lastSetsFor = useCallback((exercise: string, beforeDate: string) => lastSets(data.dailyLogs, exercise, beforeDate), [data.dailyLogs])

  const addCheckIn = useCallback((c: Omit<CheckIn, 'id'>) => {
    setData(d => ({ ...d, checkIns: [{ ...c, id: 'tmp-' + uid() }, ...d.checkIns] }))
    cloudAddCheckIn(userId, c).then(reload).catch(e => console.warn('[store] check-in failed', e))
  }, [userId, reload])

  const saveToLibrary = useCallback((food: Omit<SavedFood, 'id'>) => {
    setData(d => ({ ...d, foodLibrary: [{ ...food, id: uid() }, ...d.foodLibrary] }))
  }, [])

  const updateTargets = useCallback((t: Partial<Targets>) => {
    setData(d => ({ ...d, targets: { ...d.targets, ...t } }))
  }, [])

  const updateProfile = useCallback((p: Partial<Profile>) => {
    setData(d => ({ ...d, profile: { ...d.profile, ...p } }))
    const patch: any = {}
    if (p.name != null) patch.name = p.name
    if (p.unit != null) patch.unit = p.unit
    if (p.startWeight != null) patch.start_weight = p.startWeight
    if (p.heightCm != null) patch.height_cm = p.heightCm
    if (Object.keys(patch).length) cloudUpdateProfile(userId, patch).catch(e => console.warn(e))
  }, [userId])

  const setSplit = useCallback((s: TrainingDay[]) => setData(d => ({ ...d, split: s })), [])

  const value: StoreContext = {
    data, loading, upsertDailyLog, getDailyLog, addFood, removeFood, saveToLibrary,
    setWater, setExerciseSets, lastSetsFor, addWeight, addCheckIn, updateTargets,
    updateProfile, setSplit, resetAll: reload,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ----------------------------------------------------------------
// Local-only client store (no backend) — demo mode
// ----------------------------------------------------------------
function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch (e) { console.warn('Failed to load saved data, seeding fresh.', e) }
  return seedData()
}

function LocalStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (e) { console.warn('Failed to persist data.', e) }
  }, [data])

  const upsertDailyLog = useCallback((date: string, patch: Partial<DailyLog>) => {
    setData(d => ({ ...d, dailyLogs: patchDaily(d.dailyLogs, date, patch) }))
  }, [])
  const getDailyLog = useCallback((date: string): DailyLog => data.dailyLogs[date] ?? { date }, [data.dailyLogs])
  const addWeight = useCallback((log: WeightLog) => {
    setData(d => {
      const others = d.weightLogs.filter(w => w.date !== log.date)
      return { ...d, weightLogs: [...others, log].sort((a, b) => a.date.localeCompare(b.date)) }
    })
  }, [])
  const addCheckIn = useCallback((c: Omit<CheckIn, 'id'>) => {
    setData(d => ({ ...d, checkIns: [{ ...c, id: uid() }, ...d.checkIns] }))
  }, [])
  const addFood = useCallback((date: string, food: Omit<FoodEntry, 'id'>) => {
    setData(d => {
      const existing = d.dailyLogs[date] ?? { date }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, date, foods: [...(existing.foods ?? []), { ...food, id: uid() }] } } }
    })
  }, [])
  const removeFood = useCallback((date: string, foodId: string) => {
    setData(d => {
      const existing = d.dailyLogs[date]
      if (!existing?.foods) return d
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, foods: existing.foods.filter(f => f.id !== foodId) } } }
    })
  }, [])
  const saveToLibrary = useCallback((food: Omit<SavedFood, 'id'>) => {
    setData(d => ({ ...d, foodLibrary: [{ ...food, id: uid() }, ...d.foodLibrary] }))
  }, [])
  const setWater = useCallback((date: string, glasses: number) => {
    setData(d => ({ ...d, dailyLogs: patchDaily(d.dailyLogs, date, { water: Math.max(0, glasses) }) }))
  }, [])
  const setExerciseSets = useCallback((date: string, exercise: string, sets: SetEntry[]) => {
    setData(d => {
      const existing = d.dailyLogs[date] ?? { date }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, date, sets: { ...(existing.sets ?? {}), [exercise]: sets } } } }
    })
  }, [])
  const lastSetsFor = useCallback((exercise: string, beforeDate: string) => lastSets(data.dailyLogs, exercise, beforeDate), [data.dailyLogs])
  const updateTargets = useCallback((t: Partial<Targets>) => setData(d => ({ ...d, targets: { ...d.targets, ...t } })), [])
  const updateProfile = useCallback((p: Partial<Profile>) => setData(d => ({ ...d, profile: { ...d.profile, ...p } })), [])
  const setSplit = useCallback((s: TrainingDay[]) => setData(d => ({ ...d, split: s })), [])
  const resetAll = useCallback(() => setData(seedData()), [])

  const value: StoreContext = {
    data, loading: false, upsertDailyLog, getDailyLog, addFood, removeFood, saveToLibrary,
    setWater, setExerciseSets, lastSetsFor, addWeight, addCheckIn, updateTargets,
    updateProfile, setSplit, resetAll,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export { todayISO }
