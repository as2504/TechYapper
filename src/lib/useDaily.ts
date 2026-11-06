import { useMemo } from 'react'
import { useLibrary } from './content'
import { challengesForDay, conceptsForDay, freeConceptSlugs, questionsForDay } from './daily'
import { addDays, dateKey } from './dates'
import { useProgress } from './progress'

export function useDaily() {
  const lib = useLibrary()
  const { activities, isPro } = useProgress()
  const today = dateKey()

  return useMemo(() => {
    const concepts = conceptsForDay(lib.concepts, today)
    const questions = questionsForDay(lib.questions, today)
    const challenges = challengesForDay(lib.challenges, today)
    const done = (kind: string, ids: string[]) => ids.filter((id) => activities.some((a) => a.kind === kind && a.item_id === id)).length
    const freeSlugs = freeConceptSlugs(lib.concepts, today)
    const past = [1, 2, 3, 4, 5, 6].map((k) => ({ date: addDays(today, -k), concepts: conceptsForDay(lib.concepts, addDays(today, -k)) }))
    const progress = {
      read: done('read', concepts.map((c) => c.slug)),
      battle: done('battle', questions.map((q) => q.id)),
      code: done('challenge', challenges.map((c) => c.id)),
    }
    const tasks = [
      { key: 'read', short: 'Read', label: 'Read a yap', done: progress.read >= 1, detail: `${progress.read}/${concepts.length} read` },
      { key: 'battle', short: 'Battle', label: 'Finish the battle', done: progress.battle >= questions.length, detail: `${progress.battle}/${questions.length} answered` },
      { key: 'code', short: 'Code', label: 'Crack a challenge', done: progress.code >= 1, detail: `${progress.code}/${challenges.length} solved` },
    ]
    return {
      today, concepts, questions, challenges, progress, tasks, past,
      completed: tasks.filter((t) => t.done).length,
      // Every concept's Basics and Under the Hood are free; only Pro Deep Dives are locked (see ConceptPage).
      canRead: (slug: string) => isPro || freeSlugs.has(slug) || lib.bySlug.has(slug),
    }
  }, [lib, activities, isPro, today])
}
