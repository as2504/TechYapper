import type { Challenge, Concept, Question } from '../content/types'
import { addDays, dayNumber } from './dates'

export const FREE_ARCHIVE_DAYS = 3

const pick = <T,>(pool: T[], start: number, count: number): T[] => {
  if (!pool.length) return []
  const out: T[] = []
  for (let i = 0; i < Math.min(count, pool.length); i++) out.push(pool[(((start + i) % pool.length) + pool.length) % pool.length])
  return out
}

export function conceptsForDay(concepts: Concept[], key: string): Concept[] {
  return pick(concepts, dayNumber(key) * 3, 3)
}

export function questionsForDay(questions: Question[], key: string): Question[] {
  const d = dayNumber(key)
  const free = questions.filter((q) => !q.pro)
  const by = (lvl: Question['difficulty']) => free.filter((q) => q.difficulty === lvl)
  return [...pick(by('beginner'), d * 2, 2), ...pick(by('intermediate'), d * 2, 2), ...pick(by('advanced'), d, 1)]
}

export function challengesForDay(challenges: Challenge[], key: string): Challenge[] {
  const free = challenges.filter((c) => !c.pro)
  return pick(free, dayNumber(key) * 3, 3)
}

/** Slugs a free user may open: today's plus the previous FREE_ARCHIVE_DAYS-1 days. */
export function freeConceptSlugs(concepts: Concept[], today: string): Set<string> {
  const s = new Set<string>()
  for (let k = 0; k < FREE_ARCHIVE_DAYS; k++) conceptsForDay(concepts, addDays(today, -k)).forEach((c) => s.add(c.slug))
  return s
}
