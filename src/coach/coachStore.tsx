import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { CoachData, CoachClient, WorkoutSession } from './types'
import { Targets, TrainingDay } from '../types'
import { withTimeout } from '../utils'
import { coachSeed } from './seed'
import { useAuth } from '../auth/AuthProvider'
import { isSupabaseConfigured } from '../lib/supabase'
import { subscribeToTables, debounce } from '../lib/realtime'
import { sendPush } from '../lib/push'
import { fetchCoachData, fetchClientWorkouts, cloudUpdatePlan, cloudReplyToCheckIn, cloudUpdateProgram, cloudSetClientStatus, cloudApproveProposal, cloudRejectProposal } from './cloud'

type ClientStatus = 'pending' | 'active' | 'removed'

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
  updateProgram: (clientId: string, days: TrainingDay[]) => void
  setClientStatus: (clientId: string, status: ClientStatus) => void
  approveProposal: (clientId: string, days: TrainingDay[]) => void
  rejectProposal: (clientId: string) => void
  loadClientWorkouts: (clientId: string) => Promise<WorkoutSession[]>
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
  const loadedRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const fresh = await withTimeout(fetchCoachData(coachName), 8000)
      setData(fresh)
      loadedRef.current = true
    } catch (e) {
      console.warn('[coach] failed to load clients', e)
      if (!loadedRef.current) setTimeout(() => refresh(), 2000)
    } finally {
      setLoading(false)
    }
  }, [coachName])

  useEffect(() => { refresh() }, [refresh])

  // Refetch when the dashboard regains focus (resume / recover from a stall).
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [refresh])

  // Live dashboard: refetch when any client logs data, checks in, or signs up.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const onChange = debounce(refresh, 400)
    return subscribeToTables('coach', [
      { table: 'profiles' }, { table: 'check_ins' }, { table: 'weight_logs' },
      { table: 'daily_logs' }, { table: 'food_entries' }, { table: 'workout_sets' },
      { table: 'plans' }, { table: 'programs' },
    ], onChange)
  }, [refresh])

  const getClient = useCallback((id: string) => data.clients.find(c => c.id === id), [data.clients])

  const updateClientTargets = useCallback((clientId: string, targets: Partial<Targets>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, targets: { ...c.targets, ...targets } }) }))
    cloudUpdatePlan(clientId, targets).catch(e => console.warn('[coach] plan update failed', e))
    sendPush({ target: 'client', clientId, title: 'Plan updated', body: 'Your coach updated your nutrition targets.', url: '/nutrition' })
  }, [])

  const updateClient = useCallback((clientId: string, patch: Partial<Pick<CoachClient, 'goal' | 'goalWeight' | 'splitName'>>) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, ...patch }) }))
    cloudUpdatePlan(clientId, patch).catch(e => console.warn('[coach] plan update failed', e))
    sendPush({ target: 'client', clientId, title: 'Plan updated', body: 'Your coach updated your plan.', url: '/' })
  }, [])

  const replyToCheckIn = useCallback((clientId: string, checkInId: string, reply: string) => {
    setData(d => ({
      ...d,
      clients: d.clients.map(c => c.id !== clientId ? c : {
        ...c, checkIns: c.checkIns.map(ci => ci.id === checkInId ? { ...ci, coachReply: reply } : ci),
      }),
    }))
    cloudReplyToCheckIn(checkInId, reply).catch(e => console.warn('[coach] reply failed', e))
    sendPush({ target: 'client', clientId, title: 'New message 💬', body: 'Your coach replied to your check-in.', url: '/checkin' })
  }, [])

  const updateProgram = useCallback((clientId: string, days: TrainingDay[]) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, program: days }) }))
    cloudUpdateProgram(clientId, days).catch(e => console.warn('[coach] program update failed', e))
    sendPush({ target: 'client', clientId, title: 'Program updated', body: 'Your coach updated your training program.', url: '/training' })
  }, [])

  const setClientStatus = useCallback((clientId: string, status: ClientStatus) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, status }) }))
    cloudSetClientStatus(clientId, status).catch(e => console.warn('[coach] status update failed', e))
    if (status === 'active') sendPush({ target: 'client', clientId, title: 'You’re approved 🎉', body: 'Your coach approved your account — you’re in!', url: '/' })
  }, [])

  const approveProposal = useCallback((clientId: string, days: TrainingDay[]) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, program: days, proposalPending: false, proposedDays: null, proposalNote: null }) }))
    cloudApproveProposal(clientId, days).catch(e => console.warn('[coach] approve failed', e))
    sendPush({ target: 'client', clientId, title: 'Plan changes approved ✅', body: 'Your coach approved your program edits.', url: '/training' })
  }, [])

  const rejectProposal = useCallback((clientId: string) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, proposalPending: false, proposedDays: null, proposalNote: null }) }))
    cloudRejectProposal(clientId).catch(e => console.warn('[coach] reject failed', e))
    sendPush({ target: 'client', clientId, title: 'Plan request reviewed', body: 'Your coach kept your current program for now.', url: '/training' })
  }, [])

  const loadClientWorkouts = useCallback((clientId: string) => fetchClientWorkouts(clientId), [])

  const value: CoachStore = {
    data, loading, authed: true,
    login: () => true, logout: () => {},
    getClient, replyToCheckIn, updateClientTargets, updateClient, updateProgram, setClientStatus,
    approveProposal, rejectProposal, loadClientWorkouts,
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
  const updateProgram = useCallback((clientId: string, days: TrainingDay[]) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, program: days }) }))
  }, [])
  const setClientStatus = useCallback((clientId: string, status: ClientStatus) => {
    setData(d => ({ ...d, clients: d.clients.map(c => c.id !== clientId ? c : { ...c, status }) }))
  }, [])
  const resetCoach = useCallback(() => setData(coachSeed()), [])

  const value: CoachStore = {
    data, loading: false, authed, login, logout, getClient,
    replyToCheckIn, updateClientTargets, updateClient, updateProgram, setClientStatus,
    approveProposal: () => {}, rejectProposal: () => {}, loadClientWorkouts: () => Promise.resolve([]),
    resetCoach, refresh: () => {},
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCoach(): CoachStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCoach must be used within CoachProvider')
  return ctx
}

export { DEMO_PASSCODE }
