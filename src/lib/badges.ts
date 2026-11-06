import type { computeStats } from './progress'

type Stats = ReturnType<typeof computeStats>

export interface Badge { id: string; title: string; body: string; earned: boolean; progress: string }

/** Badges reward learning milestones, not clicks: each maps to real, de-duplicated activity. */
export function badges(s: Stats): Badge[] {
  const b = (id: string, title: string, body: string, have: number, need: number): Badge =>
    ({ id, title, body, earned: have >= need, progress: `${Math.min(have, need)}/${need}` })
  return [
    b('first-yap', 'First yap', 'Said you can talk about your first topic', s.topicsYapped, 1),
    b('five-topics', 'Conversationalist', 'Can talk about 5 topics', s.topicsYapped, 5),
    b('ten-topics', 'Generalist', 'Can talk about 10 topics', s.topicsYapped, 10),
    b('interview-10', 'Interview ready', 'Practised 10 interview answers', s.interviewPracticed, 10),
    b('battle-25', 'Sharp', '25 correct Yap Battle answers', s.battlesCorrect, 25),
    b('code-10', 'Code reader', 'Solved 10 Code or Explain challenges', s.challengesSolved, 10),
    b('streak-7', 'Habit', 'A 7-day streak', s.longest, 7),
    b('streak-30', 'Committed', 'A 30-day streak', s.longest, 30),
  ]
}
