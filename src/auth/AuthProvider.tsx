import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { subscribeToTables, debounce } from '../lib/realtime'
import { withTimeout } from '../utils'

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
  recovery: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  clearRecovery: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<CloudProfile | null>(null)
  const [recovery, setRecovery] = useState(false)
  const profileLoadedRef = useRef(false)

  // Load the profile with a timeout + retry — the first network call after a
  // cold PWA launch on iOS can stall, which previously left the app stuck on
  // the loading screen until you reopened it.
  const loadProfile = useCallback(async (userId: string, attempt = 0) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, role, status, onboarded, name, email, unit, height_cm, start_weight, age, sex, activity_level')
          .eq('id', userId)
          .maybeSingle(),
        7000,
      )
      if (error) throw error
      profileLoadedRef.current = true
      setProfile(data as CloudProfile | null)
    } catch (e) {
      if (attempt < 4) {
        setTimeout(() => loadProfile(userId, attempt + 1), 800 * (attempt + 1))
      } else {
        console.warn('[auth] profile load failed after retries:', (e as Error).message)
      }
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let done = false
    const finishLoading = () => { if (!done) { done = true; setLoading(false) } }
    // Safety net: never sit on the loading screen indefinitely.
    const safety = setTimeout(finishLoading, 4000)

    supabase.auth.getSession()
      .then(({ data }) => {
        supabase.realtime.setAuth(data.session?.access_token ?? '')
        setSession(data.session)
        finishLoading() // the session is known locally — don't block the UI on the profile fetch
        if (data.session?.user) loadProfile(data.session.user.id)
      })
      .catch(finishLoading)

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      supabase.realtime.setAuth(sess?.access_token ?? '')
      setSession(sess)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (sess?.user) {
        profileLoadedRef.current = false
        loadProfile(sess.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => { clearTimeout(safety); sub.subscription.unsubscribe() }
  }, [loadProfile])

  // When the app regains focus (iOS PWA resume), retry anything that didn't load.
  useEffect(() => {
    const uid = session?.user?.id
    if (!isSupabaseConfigured || !uid) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !profileLoadedRef.current) loadProfile(uid)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onVisible)
    }
  }, [session?.user?.id, loadProfile])

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

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    return { error: error?.message ?? null }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  }, [])

  const clearRecovery = useCallback(() => setRecovery(false), [])

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
    recovery,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    updatePassword,
    clearRecovery,
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
