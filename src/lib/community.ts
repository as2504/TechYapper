import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import { useProgress } from './progress'

export interface Row { rank: number; name: string; xp: number; active_days: number; is_me: boolean }
export type Period = 'week' | 'month' | 'all'

/** Server-verified rankings (see leaderboard() in the yapping migration). Refetches when your activity changes. */
export function useLeaderboard(period: Period) {
  const { user } = useAuth()
  const { activities } = useProgress()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const n = activities.length
  useEffect(() => {
    if (!supabase) { setRows([]); return }
    let off = false
    const t = setTimeout(async () => {
      const { data, error } = await supabase!.rpc('leaderboard', { period })
      if (off) return
      if (error) setError(error.message)
      setRows(((data ?? []) as Row[]).map((r) => ({ ...r, rank: Number(r.rank), xp: Number(r.xp), active_days: Number(r.active_days) })))
    }, n ? 600 : 0)
    return () => { off = true; clearTimeout(t) }
  }, [period, user, n])
  return { rows, error }
}

export function useTrending() {
  const [rows, setRows] = useState<{ slug: string; learners: number }[] | null>(null)
  useEffect(() => {
    if (!supabase) { setRows([]); return }
    supabase.rpc('trending_topics').then(({ data }) => setRows(((data ?? []) as { slug: string; learners: number }[]).map((r) => ({ ...r, learners: Number(r.learners) }))))
  }, [])
  return rows
}
