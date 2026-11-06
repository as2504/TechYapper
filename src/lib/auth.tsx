import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'

const GUEST_KEY = 'ty:guest'

interface AuthState {
  user: User | null
  loading: boolean
  guest: boolean
  configured: boolean
  displayName: string
  enterGuest: () => void
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; needsConfirm?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

const safeGet = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const safeSet = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* private mode */ } }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [guest, setGuest] = useState(() => safeGet(GUEST_KEY) === '1')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  const enterGuest = useCallback(() => { safeSet(GUEST_KEY, '1'); setGuest(true) }, [])

  const signUp: AuthState['signUp'] = async (email, password, name) => {
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name }, emailRedirectTo: `${location.origin}/app` },
    })
    if (error) return { error: error.message }
    return { needsConfirm: !data.session }
  }

  const signIn: AuthState['signIn'] = async (email, password) => {
    if (!supabase) return { error: 'Accounts are not configured on this deployment.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  const signOut = async () => {
    safeSet(GUEST_KEY, null)
    setGuest(false)
    if (supabase) await supabase.auth.signOut()
  }

  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split('@')[0] || 'Guest yapper'

  return (
    <Ctx.Provider value={{ user, loading, guest: guest && !user, configured: supabaseConfigured, displayName, enterGuest, signUp, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
