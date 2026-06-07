import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { CoachData } from './types'
import { Targets } from '../types'
import { coachSeed } from './seed'

const STORAGE_KEY = 'akopfit:coach:v1'
const AUTH_KEY = 'akopfit:coach:auth'

function load(): CoachData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CoachData
  } catch (e) {
    console.warn('Failed to load coach data, seeding fresh.', e)
  }
  return coachSeed()
}

interface CoachStore {
  data: CoachData
  authed: boolean
  login: (passcode: string) => boolean
  logout: () => void
  getClient: (id: string) => CoachData['clients'][number] | undefined
  replyToCheckIn: (clientId: string, checkInId: string, reply: string) => void
  updateClientTargets: (clientId: string, targets: Partial<Targets>) => void
  resetCoach: () => void
}

const Ctx = createContext<CoachStore | null>(null)

// Demo passcode. (Real auth comes with the Supabase backend.)
const DEMO_PASSCODE = 'coach'

export function CoachProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CoachData>(load)
  const [authed, setAuthed] = useState<boolean>(() => localStorage.getItem(AUTH_KEY) === '1')

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (e) { console.warn(e) }
  }, [data])

  const login = useCallback((passcode: string) => {
    if (passcode.trim().toLowerCase() === DEMO_PASSCODE) {
      localStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setAuthed(false)
  }, [])

  const getClient = useCallback((id: string) => data.clients.find(c => c.id === id), [data.clients])

  const replyToCheckIn = useCallback((clientId: string, checkInId: string, reply: string) => {
    setData(d => ({
      ...d,
      clients: d.clients.map(c =>
        c.id !== clientId ? c : {
          ...c,
          checkIns: c.checkIns.map(ci => ci.id === checkInId ? { ...ci, coachReply: reply } : ci),
        },
      ),
    }))
  }, [])

  const updateClientTargets = useCallback((clientId: string, targets: Partial<Targets>) => {
    setData(d => ({
      ...d,
      clients: d.clients.map(c => c.id !== clientId ? c : { ...c, targets: { ...c.targets, ...targets } }),
    }))
  }, [])

  const resetCoach = useCallback(() => setData(coachSeed()), [])

  const value: CoachStore = { data, authed, login, logout, getClient, replyToCheckIn, updateClientTargets, resetCoach }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoach(): CoachStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCoach must be used within CoachProvider')
  return ctx
}

export { DEMO_PASSCODE }
