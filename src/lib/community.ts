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

/* ───────── Leagues ───────── */
export const DIVISIONS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const
export interface LeagueRow { division: number; week_start: string; week_end: string; rank: number; name: string; xp: number; is_me: boolean; group_size: number }

export function useLeague() {
  const { user } = useAuth()
  const { activities } = useProgress()
  const [rows, setRows] = useState<LeagueRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const n = activities.length
  useEffect(() => {
    if (!user || !supabase) { setRows(null); return }
    let off = false
    const t = setTimeout(async () => {
      const { data, error } = await supabase!.rpc('my_league')
      if (off) return
      if (error) setError(error.message)
      setRows(((data ?? []) as LeagueRow[]).map((r) => ({ ...r, rank: Number(r.rank), xp: Number(r.xp), group_size: Number(r.group_size) })))
    }, n ? 600 : 0)
    return () => { off = true; clearTimeout(t) }
  }, [user, n])
  return { rows, error }
}

/* ───────── Duels ───────── */
export interface DuelInfo { code: string; question_ids: string[]; creator_name: string; expires_at: string; expired: boolean }
export interface DuelResult { name: string; is_me: boolean; is_creator: boolean; answered: number; correct: number; total_ms: number; marks: boolean[] }

export async function createDuel(): Promise<{ code?: string; error?: string }> {
  if (!supabase) return { error: 'Duels need the online service.' }
  const { data, error } = await supabase.rpc('create_duel')
  return error ? { error: error.message } : { code: data as string }
}
export async function getDuel(code: string): Promise<DuelInfo | null> {
  if (!supabase) return null
  const { data } = await supabase.rpc('get_duel', { p_code: code })
  return ((data ?? []) as DuelInfo[])[0] ?? null
}
export async function answerDuel(code: string, index: number, choice: number | null, ms: number) {
  if (!supabase) return { error: 'offline' }
  const { data, error } = await supabase.rpc('answer_duel', { p_code: code, p_index: index, p_choice: choice, p_ms: Math.round(ms) })
  return error ? { error: error.message } : { correct: data as boolean }
}
export async function duelResults(code: string): Promise<DuelResult[]> {
  if (!supabase) return []
  const { data } = await supabase.rpc('duel_results', { p_code: code })
  return ((data ?? []) as DuelResult[]).map((r) => ({ ...r, total_ms: Number(r.total_ms) }))
}
