import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { todayISO, addDaysISO } from '../utils'

interface SelectedDateState {
  date: string // YYYY-MM-DD
  isToday: boolean
  goPrev: () => void
  goNext: () => void
  goToday: () => void
}

const Ctx = createContext<SelectedDateState | null>(null)

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [date, setDate] = useState<string>(todayISO())

  const goPrev = useCallback(() => setDate(d => addDaysISO(d, -1)), [])
  const goNext = useCallback(() => setDate(d => {
    const next = addDaysISO(d, 1)
    return next > todayISO() ? d : next // never go past today
  }), [])
  const goToday = useCallback(() => setDate(todayISO()), [])

  const value: SelectedDateState = { date, isToday: date === todayISO(), goPrev, goNext, goToday }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// Falls back to today when no provider is present (e.g. Home).
export function useSelectedDate(): SelectedDateState {
  const ctx = useContext(Ctx)
  if (!ctx) {
    const today = todayISO()
    return { date: today, isToday: true, goPrev: () => {}, goNext: () => {}, goToday: () => {} }
  }
  return ctx
}
