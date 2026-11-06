import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseChallenges, parseConcept, parseQuestions, parseTech } from '../content/format'
import type { Challenge, Concept, Question, Tech } from '../content/types'
import { supabase } from './supabase'
import questionsSrc from '../content/questions.txt?raw'
import challengesSrc from '../content/challenges.txt?raw'

// Bundled library: instant first paint, offline support, and a fallback if the DB is unreachable.
const conceptFiles = import.meta.glob('../content/concepts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const topicFiles = import.meta.glob('../content/topics/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const bundled = {
  techs: Object.values(topicFiles).map(parseTech).sort((a, b) => a.title.localeCompare(b.title)),
  concepts: Object.values(conceptFiles).map(parseConcept).sort((a, b) => a.slug.localeCompare(b.slug)),
  questions: parseQuestions(questionsSrc),
  challenges: parseChallenges(challengesSrc),
}

export interface Library {
  techs: Tech[]
  techBySlug: Map<string, Tech>
  concepts: Concept[]
  questions: Question[]
  challenges: Challenge[]
  bySlug: Map<string, Concept>
  source: 'bundled' | 'database'
}

function build(t: Tech[], c: Concept[], q: Question[], ch: Challenge[], source: Library['source']): Library {
  return { techs: t, techBySlug: new Map(t.map((x) => [x.slug, x])), concepts: c, questions: q, challenges: ch, bySlug: new Map(c.map((x) => [x.slug, x])), source }
}

const Ctx = createContext<Library>(build(bundled.techs, bundled.concepts, bundled.questions, bundled.challenges, 'bundled'))

/** Rows in the DB override bundled items with the same id and add new ones, so content can grow without a deploy. */
function merge<T>(base: T[], extra: T[], id: (t: T) => string): T[] {
  const map = new Map(base.map((b) => [id(b), b]))
  extra.forEach((e) => map.set(id(e), e))
  return [...map.values()]
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [lib, setLib] = useState<Library>(() => build(bundled.techs, bundled.concepts, bundled.questions, bundled.challenges, 'bundled'))

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      try {
        const [t, c, q, ch] = await Promise.all([
          supabase.from('topics').select('data').eq('published', true),
          supabase.from('concepts').select('data').eq('published', true),
          supabase.from('questions').select('data').eq('published', true),
          supabase.from('challenges').select('data').eq('published', true),
        ])
        if (cancelled || t.error || c.error || q.error || ch.error) return
        const concepts = merge(bundled.concepts, (c.data ?? []).map((r) => r.data as Concept), (x) => x.slug).sort((a, b) => a.slug.localeCompare(b.slug))
        const questions = merge(bundled.questions, (q.data ?? []).map((r) => r.data as Question), (x) => x.id)
        const challenges = merge(bundled.challenges, (ch.data ?? []).map((r) => r.data as Challenge), (x) => x.id)
        const techs = merge(bundled.techs, (t.data ?? []).map((r) => r.data as Tech), (x) => x.slug).sort((a, b) => a.title.localeCompare(b.title))
        setLib(build(techs, concepts, questions, challenges, 'database'))
      } catch {
        /* keep bundled */
      }
    })()
    return () => { cancelled = true }
  }, [])

  const value = useMemo(() => lib, [lib])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLibrary = () => useContext(Ctx)
