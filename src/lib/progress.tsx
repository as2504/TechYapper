import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Difficulty } from '../content/types'
import { useAuth } from './auth'
import { supabase } from './supabase'
import { addDays, dateKey } from './dates'

export type ActivityKind = 'read' | 'check' | 'battle' | 'challenge'

export interface Activity {
  kind: ActivityKind
  item_id: string
  correct: boolean | null
  choice: number | null
  xp: number
  activity_date: string
  created_at: string
}

export interface Subscription {
  plan: 'free' | 'pro_monthly' | 'pro_yearly' | 'pro_preview'
  status: 'active' | 'trialing' | 'canceled' | 'expired'
  provider: 'demo' | 'razorpay' | 'manual'
  current_period_end: string | null
}

export const XP = {
  read: 15,
  check: 10,
  battle: { beginner: 10, intermediate: 20, advanced: 30 } as Record<Difficulty, number>,
  challenge: { beginner: 20, intermediate: 30, advanced: 45 } as Record<Difficulty, number>,
  attempt: 2,
}

interface ProgressState {
  ready: boolean
  activities: Activity[]
  saved: string[]
  subscription: Subscription | null
  isPro: boolean
  error: string | null
  find: (kind: ActivityKind, id: string) => Activity | undefined
  record: (a: Omit<Activity, 'activity_date' | 'created_at'>) => Promise<void>
  toggleSave: (slug: string) => Promise<void>
  startPreview: () => Promise<{ error?: string }>
}

const Ctx = createContext<ProgressState | null>(null)
const LOCAL_KEY = 'ty:guest-progress:v1'

interface LocalData { activities: Activity[]; saved: string[]; subscription: Subscription | null }
const emptyLocal: LocalData = { activities: [], saved: [], subscription: null }
function readLocal(): LocalData {
  try { return { ...emptyLocal, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') } } catch { return emptyLocal }
}
function writeLocal(d: LocalData) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(d)) } catch { /* ignore */ } }

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ready, setReady] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    ;(async () => {
      if (!user || !supabase) {
        const d = readLocal()
        setActivities(d.activities); setSaved(d.saved); setSubscription(d.subscription); setReady(true)
        return
      }
      // Carry guest progress into the new account once.
      const local = readLocal()
      if (local.activities.length || local.saved.length) {
        await supabase.from('user_activity').upsert(local.activities.map((a) => ({ ...a, user_id: user.id })), { onConflict: 'user_id,kind,item_id', ignoreDuplicates: true })
        if (local.saved.length) await supabase.from('saved_concepts').upsert(local.saved.map((s) => ({ user_id: user.id, concept_slug: s })), { ignoreDuplicates: true })
        writeLocal({ ...emptyLocal })
      }
      const [a, s, sub] = await Promise.all([
        supabase.from('user_activity').select('kind,item_id,correct,choice,xp,activity_date,created_at').order('created_at', { ascending: true }).limit(5000),
        supabase.from('saved_concepts').select('concept_slug,created_at').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('plan,status,provider,current_period_end').maybeSingle(),
      ])
      if (cancelled) return
      if (a.error || s.error) setError((a.error || s.error)!.message)
      setActivities((a.data as Activity[]) ?? [])
      setSaved((s.data ?? []).map((r) => r.concept_slug as string))
      setSubscription((sub.data as Subscription) ?? null)
      setReady(true)
    })()
    return () => { cancelled = true }
  }, [user])

  const persistLocal = useCallback((patch: Partial<LocalData>) => {
    if (user) return
    writeLocal({ ...readLocal(), ...patch })
  }, [user])

  const find = useCallback((kind: ActivityKind, id: string) => activities.find((a) => a.kind === kind && a.item_id === id), [activities])

  const record: ProgressState['record'] = async (input) => {
    if (activities.some((a) => a.kind === input.kind && a.item_id === input.item_id)) return
    const row: Activity = { ...input, activity_date: dateKey(), created_at: new Date().toISOString() }
    const next = [...activities, row]
    setActivities(next)
    if (user && supabase) {
      const { error } = await supabase.from('user_activity').insert({ ...row, user_id: user.id })
      if (error && !error.message.includes('duplicate')) setError('Could not save progress: ' + error.message)
    } else persistLocal({ activities: next })
  }

  const toggleSave: ProgressState['toggleSave'] = async (slug) => {
    const has = saved.includes(slug)
    const next = has ? saved.filter((s) => s !== slug) : [slug, ...saved]
    setSaved(next)
    if (user && supabase) {
      const q = has
        ? supabase.from('saved_concepts').delete().eq('user_id', user.id).eq('concept_slug', slug)
        : supabase.from('saved_concepts').insert({ user_id: user.id, concept_slug: slug })
      const { error } = await q
      if (error) { setSaved(saved); setError('Could not update library: ' + error.message) }
    } else persistLocal({ saved: next })
  }

  const startPreview: ProgressState['startPreview'] = async () => {
    if (!user || !supabase) return { error: 'Create a free account first — Pro preview is tied to your account.' }
    const { data, error } = await supabase.rpc('start_pro_preview')
    if (error) return { error: error.message }
    setSubscription(data as Subscription)
    return {}
  }

  const isPro = !!subscription && ['active', 'trialing'].includes(subscription.status) && subscription.plan !== 'free' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

  const value = { ready, activities, saved, subscription, isPro, error, find, record, toggleSave, startPreview }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProgress() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProgress outside ProgressProvider')
  return v
}

/* ───────── Derived stats ───────── */
export function useStats() {
  const { activities, saved } = useProgress()
  return useMemo(() => computeStats(activities, saved.length), [activities, saved.length])
}

export function computeStats(activities: Activity[], savedCount: number) {
  const today = dateKey()
  const byDay = new Map<string, number>()
  let xp = 0
  for (const a of activities) { xp += a.xp; byDay.set(a.activity_date, (byDay.get(a.activity_date) ?? 0) + a.xp) }
  const answered = activities.filter((a) => a.kind === 'battle' || a.kind === 'check')
  const correct = answered.filter((a) => a.correct).length
  const challenges = activities.filter((a) => a.kind === 'challenge')

  // Streak: consecutive active days ending today (or yesterday, if today isn't done yet).
  let streak = 0
  let cursor = byDay.has(today) ? today : addDays(today, -1)
  while (byDay.has(cursor)) { streak++; cursor = addDays(cursor, -1) }

  let longest = 0
  const days = [...byDay.keys()].sort()
  let run = 0
  let prev = ''
  for (const d of days) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; longest = Math.max(longest, run); prev = d }

  return {
    xp,
    level: Math.floor(Math.sqrt(xp / 40)) + 1,
    streak,
    longest,
    activeToday: byDay.has(today),
    byDay,
    conceptsRead: activities.filter((a) => a.kind === 'read').length,
    questionsAnswered: answered.length,
    accuracy: answered.length ? Math.round((correct / answered.length) * 100) : 0,
    challengesDone: challenges.length,
    challengesSolved: challenges.filter((c) => c.correct).length,
    savedCount,
  }
}

export const levelXp = (level: number) => 40 * (level - 1) ** 2
