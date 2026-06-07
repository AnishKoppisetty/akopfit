import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { CoachData, CoachClient } from './types'
import { Targets } from '../types'
import { coachSeed } from './seed'
import { useAuth } from '../auth/AuthProvider'
import { fetchCoachData, cloudUpdatePlan, cloudReplyToCheckIn } from './cloud'

const STORAGE_KEY = 'akopfit:coach:v1'
const AUTH_KEY = 'akopfit:coach:auth'
const DEMO_PASSCODE = 'coach'

interface CoachStore {
  data: CoachData
  loading: boolean
  authed: boolean
  login: (passcode: string) => boolean
  logout: () => void
  getClient: (id: string) => CoachClient | undefined
  replyToCheckIn: (clientId: string, checkInId: string, reply: string) => void
  updateClientTargets: (clientId: string, targets: Partial<Targets>) => void
  updateClient: (clientId: string, patch: Partial<Pick<CoachClient, 'goal' | 'goalWeight' | 'splitName'>>) => void
  resetCoach: () => void
  refresh: () => void
}

const Ctx = createContext<CoachStore | null>(null)

export function CoachProvider({ children }: { children: ReactNode }) {
  const { configured, profile } = useAuth()
  if (configured) return <CloudCoachProvider coachName={profile?.name || 'Coach'}>{children}</CloudCoachProvider>
  return <LocalCoachProvider>{children}</LocalCoachProvider>
}

// ----------------------------------------------------------------
// Cloud-backed coach store (real Supabase data)
// ----------------------------------------------------------------
function CloudCoachProvider({ coachName, children }: { coachName: string; children: ReactNode }) {
  const [data, setData] = useState<CoachData>({ coachName, clients: [] })
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchCoachData(coachName)
      setData(fresh)
    } catch (e) {
      console.warn('[coach] failed to load clients', e)
    } finally {
      setLoading(false)
    }
  }, [coachName])

  useEffect(() => { refresh() }, [refresh])

  const getClient = useCallback((id: string) => data.clients.find(c => c.id === id), [data.clients])

  const updateClientTargets = useCallback((clientId: string, targets: Partial<Targets>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, targets: { ...c.targets, ...targets } }) }))
    cloudUpdatePlan(clientId, targets).catch(e => console.warn('[coach] plan update failed', e))
  }, [])

  const updateClient = useCallback((clientId: string, patch: Partial<Pick<CoachClient, 'goal' | 'goalWeight' | 'splitName'>>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, ...patch }) }))
    cloudUpdatePlan(clientId, patch).catch(e => console.warn('[coach] plan update failed', e))
  }, [])

  const replyToCheckIn = useCallback((clientId: string, checkInId: string, reply: string) => {
    setData(d => ({
      ...d,
      clients: d.clients.map(c => c.id !== clientId ? c : {
        ...c, checkIns: c.checkIns.map(ci => ci.id === checkInId ? { ...ci, coachReply: reply } : ci),
      }),
    }))
    cloudReplyToCheckIn(checkInId, reply).catch(e => console.warn('[coach] reply failed', e))
  }, [])

  const value: CoachStore = {
    data, loading, authed: true,
    login: () => true, logout: () => {},
    getClient, replyToCheckIn, updateClientTargets, updateClient,
    resetCoach: () => {}, refresh,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ----------------------------------------------------------------
// Local demo coach store (no backend) — passcode gate + seed data
// ----------------------------------------------------------------
function load(): CoachData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CoachData
  } catch (e) { console.warn('Failed to load coach data, seeding fresh.', e) }
  return coachSeed()
}

function LocalCoachProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CoachData>(load)
  const [authed, setAuthed] = useState<boolean>(() => localStorage.getItem(AUTH_KEY) === '1')

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch (e) { console.warn(e) }
  }, [data])

  const login = useCallback((passcode: string) => {
    if (passcode.trim().toLowerCase() === DEMO_PASSCODE) {
      localStorage.setItem(AUTH_KEY, '1'); setAuthed(true); return true
    }
    return false
  }, [])
  const logout = useCallback(() => { localStorage.removeItem(AUTH_KEY); setAuthed(false) }, [])
  const getClient = useCallback((id: string) => data.clients.find(c => c.id === id), [data.clients])

  const replyToCheckIn = useCallback((clientId: string, checkInId: string, reply: string) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, checkIns: c.checkIns.map(ci => ci.id === checkInId ? { ...ci, coachReply: reply } : ci) }) }))
  }, [])
  const updateClientTargets = useCallback((clientId: string, targets: Partial<Targets>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, targets: { ...c.targets, ...targets } }) }))
  }, [])
  const updateClient = useCallback((clientId: string, patch: Partial<Pick<CoachClient, 'goal' | 'goalWeight' | 'splitName'>>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, ...patch }) }))
  }, [])
  const resetCoach = useCallback(() => setData(coachSeed()), [])

  const value: CoachStore = {
    data, loading: false, authed, login, logout, getClient,
    replyToCheckIn, updateClientTargets, updateClient, resetCoach, refresh: () => {},
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoach(): CoachStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCoach must be used within CoachProvider')
  return ctx
}

export { DEMO_PASSCODE }
