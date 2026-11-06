export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type TopicId =
  | 'frontend' | 'backend' | 'languages' | 'ai' | 'genai' | 'cloud' | 'devops'
  | 'databases' | 'security' | 'lowcode' | 'system-design' | 'fundamentals'

export interface QuizCheck {
  prompt: string
  code?: { lang: string; source: string }
  options: string[]
  answer: number
  explanation: string
}

export interface Concept {
  slug: string
  title: string
  topic: TopicId
  difficulty: Difficulty
  minutes: number
  /** Deep Dive (level 3) requires Pro */
  pro: boolean
  related: string[]
  dek: string
  hook: string
  yap: string
  basics: string
  hood: string
  deep: string
  myths: { myth: string; truth: string }[]
  facts: string[]
  realWorld: string[]
  check: QuizCheck
}

export interface Question extends QuizCheck {
  id: string
  topic: TopicId
  difficulty: Difficulty
  pro: boolean
}

export type ChallengeKind = 'predict' | 'bug' | 'explain' | 'implementation' | 'complexity' | 'approach'

export interface Challenge extends QuizCheck {
  id: string
  kind: ChallengeKind
  title: string
  topic: TopicId
  difficulty: Difficulty
  pro: boolean
}

export const TOPICS: Record<TopicId, { label: string; short: string }> = {
  frontend: { label: 'Frontend', short: 'FE' },
  backend: { label: 'Backend', short: 'BE' },
  languages: { label: 'Languages', short: 'LANG' },
  ai: { label: 'AI & ML', short: 'AI' },
  genai: { label: 'GenAI & RAG', short: 'GENAI' },
  cloud: { label: 'Cloud', short: 'CLOUD' },
  devops: { label: 'DevOps', short: 'OPS' },
  databases: { label: 'Databases', short: 'DB' },
  security: { label: 'Security', short: 'SEC' },
  lowcode: { label: 'Power Platform', short: 'LOW' },
  'system-design': { label: 'System Design', short: 'SYS' },
  fundamentals: { label: 'Fundamentals', short: 'CS' },
}

export const KIND_LABEL: Record<ChallengeKind, string> = {
  predict: 'Predict the output',
  bug: 'Find the bug',
  explain: 'Explain it',
  implementation: 'Pick the right implementation',
  complexity: 'Name the complexity',
  approach: 'Choose the approach',
}
