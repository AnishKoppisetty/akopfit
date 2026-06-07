import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { AppData, DailyLog, CheckIn, WeightLog, Targets, Profile, TrainingDay, FoodEntry, SavedFood, SetEntry } from './types'
import { seedData } from './seed'
import { todayISO, uid } from './utils'

const STORAGE_KEY = 'akopfit:data:v2'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch (e) {
    console.warn('Failed to load saved data, seeding fresh.', e)
  }
  return seedData()
}

interface StoreContext {
  data: AppData
  // daily logs
  upsertDailyLog: (date: string, patch: Partial<DailyLog>) => void
  getDailyLog: (date: string) => DailyLog
  // food diary
  addFood: (date: string, food: Omit<FoodEntry, 'id'>) => void
  removeFood: (date: string, foodId: string) => void
  saveToLibrary: (food: Omit<SavedFood, 'id'>) => void
  // water
  setWater: (date: string, glasses: number) => void
  // workout sets
  setExerciseSets: (date: string, exercise: string, sets: SetEntry[]) => void
  lastSetsFor: (exercise: string, beforeDate: string) => SetEntry[] | null
  // weight
  addWeight: (log: WeightLog) => void
  // check-ins
  addCheckIn: (c: Omit<CheckIn, 'id'>) => void
  // settings
  updateTargets: (t: Partial<Targets>) => void
  updateProfile: (p: Partial<Profile>) => void
  setSplit: (s: TrainingDay[]) => void
  resetAll: () => void
}

const Ctx = createContext<StoreContext | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to persist data (storage may be full).', e)
    }
  }, [data])

  const upsertDailyLog = useCallback((date: string, patch: Partial<DailyLog>) => {
    setData(d => ({
      ...d,
      dailyLogs: {
        ...d.dailyLogs,
        [date]: { ...d.dailyLogs[date], ...patch, date },
      },
    }))
  }, [])

  const getDailyLog = useCallback((date: string): DailyLog => {
    return data.dailyLogs[date] ?? { date }
  }, [data.dailyLogs])

  const addFood = useCallback((date: string, food: Omit<FoodEntry, 'id'>) => {
    setData(d => {
      const existing = d.dailyLogs[date] ?? { date }
      const foods = [...(existing.foods ?? []), { ...food, id: uid() }]
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, date, foods } } }
    })
  }, [])

  const removeFood = useCallback((date: string, foodId: string) => {
    setData(d => {
      const existing = d.dailyLogs[date]
      if (!existing?.foods) return d
      const foods = existing.foods.filter(f => f.id !== foodId)
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, foods } } }
    })
  }, [])

  const saveToLibrary = useCallback((food: Omit<SavedFood, 'id'>) => {
    setData(d => ({ ...d, foodLibrary: [{ ...food, id: uid() }, ...d.foodLibrary] }))
  }, [])

  const setWater = useCallback((date: string, glasses: number) => {
    setData(d => {
      const existing = d.dailyLogs[date] ?? { date }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, date, water: Math.max(0, glasses) } } }
    })
  }, [])

  const setExerciseSets = useCallback((date: string, exercise: string, sets: SetEntry[]) => {
    setData(d => {
      const existing = d.dailyLogs[date] ?? { date }
      const allSets = { ...(existing.sets ?? {}), [exercise]: sets }
      return { ...d, dailyLogs: { ...d.dailyLogs, [date]: { ...existing, date, sets: allSets } } }
    })
  }, [])

  const lastSetsFor = useCallback((exercise: string, beforeDate: string): SetEntry[] | null => {
    const dates = Object.keys(data.dailyLogs).filter(dt => dt < beforeDate).sort().reverse()
    for (const dt of dates) {
      const s = data.dailyLogs[dt].sets?.[exercise]
      if (s && s.length > 0) return s
    }
    return null
  }, [data.dailyLogs])

  const addWeight = useCallback((log: WeightLog) => {
    setData(d => {
      const others = d.weightLogs.filter(w => w.date !== log.date)
      return { ...d, weightLogs: [...others, log].sort((a, b) => a.date.localeCompare(b.date)) }
    })
  }, [])

  const addCheckIn = useCallback((c: Omit<CheckIn, 'id'>) => {
    setData(d => ({ ...d, checkIns: [{ ...c, id: uid() }, ...d.checkIns] }))
  }, [])

  const updateTargets = useCallback((t: Partial<Targets>) => {
    setData(d => ({ ...d, targets: { ...d.targets, ...t } }))
  }, [])

  const updateProfile = useCallback((p: Partial<Profile>) => {
    setData(d => ({ ...d, profile: { ...d.profile, ...p } }))
  }, [])

  const setSplit = useCallback((s: TrainingDay[]) => {
    setData(d => ({ ...d, split: s }))
  }, [])

  const resetAll = useCallback(() => {
    const fresh = seedData()
    setData(fresh)
  }, [])

  const value: StoreContext = {
    data, upsertDailyLog, getDailyLog,
    addFood, removeFood, saveToLibrary, setWater, setExerciseSets, lastSetsFor,
    addWeight, addCheckIn, updateTargets, updateProfile, setSplit, resetAll,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export { todayISO }
