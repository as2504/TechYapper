import { useMemo } from 'react'
import type { Tech } from '../content/types'
import { useLibrary } from './content'
import { readRecent, useProgress, type Activity } from './progress'
import { dateKey } from './dates'

/** 0 unexplored · 1 heard of it · 2 can explain · 3 interview ready */
export type Level = 0 | 1 | 2 | 3
export const LEVEL_LABEL: Record<Level, string> = { 0: 'Not started', 1: 'Heard of it', 2: 'Can explain', 3: 'Interview ready' }
export const RUSTY_AFTER_DAYS = 7

export interface Mastery { level: Level; rusty: boolean; days: number | null; iqs: number }

/** Periodic-table symbols. Anything new falls back to its first two letters. */
const SYMBOL: Record<string, string> = {
  react: 'Re', javascript: 'Js', typescript: 'Ts', llms: 'Lm', rag: 'Rg', 'vector-databases': 'Vd', postgresql: 'Pg',
  'cloud-computing': 'Cl', docker: 'Dk', kubernetes: 'K8', 'rest-apis': 'Ap', 'power-apps': 'Pa', 'power-automate': 'Pf',
  dataverse: 'Dv', 'auth-jwt': 'Jw', 'system-design': 'Sd', git: 'Gt',
}
export const symbolOf = (t: Tech) => SYMBOL[t.slug] ?? t.title.slice(0, 2).replace(/^./, (c) => c.toUpperCase())

const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 864e5)

export function masteryOf(t: Tech, activities: Activity[], seen: Set<string>): Mastery {
  let last: string | null = null
  let explained = false
  let iqs = 0
  let touched = false
  for (const a of activities) {
    const mine = a.item_id === t.slug || a.item_id.startsWith(t.slug + '@') || a.item_id.startsWith(t.slug + '-iq')
    if (!mine || !['topic', 'tcheck', 'iq', 'say'].includes(a.kind)) continue
    touched = true
    if (!last || a.activity_date > last) last = a.activity_date
    if (a.kind === 'topic' || (a.kind === 'say' && a.correct)) explained = true
    if (a.kind === 'iq') iqs++
  }
  const level: Level = explained ? (iqs >= 2 ? 3 : 2) : touched || seen.has(t.slug) ? 1 : 0
  const days = last ? daysBetween(last, dateKey()) : null
  return { level, rusty: level >= 2 && days != null && days >= RUSTY_AFTER_DAYS, days, iqs }
}

export function useMastery() {
  const { techs } = useLibrary()
  const { activities } = useProgress()
  return useMemo(() => {
    const seen = new Set(readRecent().map((r) => r.slug))
    const map = new Map(techs.map((t) => [t.slug, masteryOf(t, activities, seen)]))
    const rusty = techs.filter((t) => map.get(t.slug)!.rusty).sort((a, b) => (map.get(b.slug)!.days ?? 0) - (map.get(a.slug)!.days ?? 0))
    const counts = [0, 0, 0, 0] as number[]
    map.forEach((m) => counts[m.level]++)
    return { map, rusty, counts }
  }, [techs, activities])
}
