import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { subscribeToTables, debounce } from '../lib/realtime'

export interface CloudProfile {
  id: string
  role: 'client' | 'coach'
  status: 'pending' | 'active' | 'removed'
  onboarded: boolean
  name: string | null
  email: string | null
  unit: 'lb' | 'kg'
  height_cm: number | null
  start_weight: number | null
  age: number | null
  sex: string | null
  activity_level: string | null
}

interface AuthState {
  configured: boolean
  loading: boolean
  session: Session | null
  profile: CloudProfile | null
  isCoach: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<CloudProfile | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, status, onboarded, name, email, unit, height_cm, start_weight, age, sex, activity_level')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.warn('[auth] profile load error:', error.message)
      setProfile(null)
      return
    }
    setProfile(data as CloudProfile | null)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      supabase.realtime.setAuth(data.session?.access_token ?? '')
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      supabase.realtime.setAuth(sess?.access_token ?? '')
      setSession(sess)
      if (sess?.user) await loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  // Live profile updates (approval status, coach stat edits) for the signed-in user.
  useEffect(() => {
    const uid = session?.user?.id
    if (!isSupabaseConfigured || !uid) return
    const reload = debounce(() => { loadProfile(uid) }, 300)
    return subscribeToTables(`profile:${uid}`, [{ table: 'profiles', filter: `id=eq.${uid}` }], reload)
  }, [session?.user?.id, loadProfile])

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    return { error: error?.message ?? null }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return { error: error?.message ?? null }
  }, [])

  const signUpWithPassword = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    })
    return { error: error?.message ?? null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const value: AuthState = {
    configured: isSupabaseConfigured,
    loading,
    session,
    profile,
    isCoach: profile?.role === 'coach',
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    updatePassword,
    signOut,
    refreshProfile,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
