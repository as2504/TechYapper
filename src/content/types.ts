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

/* ───────── Tech topics: the "can I talk about this?" unit ───────── */
export type CategoryId = 'development' | 'ai' | 'data-cloud' | 'backend-infra' | 'enterprise' | 'security' | 'engineering'

export const CATEGORIES: { id: CategoryId; label: string; blurb: string }[] = [
  { id: 'development', label: 'Development', blurb: 'Languages and frameworks you ship with' },
  { id: 'ai', label: 'AI and Machine Learning', blurb: 'LLMs, retrieval and the vocabulary around them' },
  { id: 'data-cloud', label: 'Data and Cloud', blurb: 'Where data lives and where code runs' },
  { id: 'backend-infra', label: 'Backend and Infrastructure', blurb: 'APIs, containers and the plumbing' },
  { id: 'enterprise', label: 'Enterprise Technology', blurb: 'The Power Platform and business apps' },
  { id: 'security', label: 'Security', blurb: 'Who you are and what you are allowed to do' },
  { id: 'engineering', label: 'Software Engineering', blurb: 'How systems and teams fit together' },
]

export interface InterviewQ {
  id: string
  q: string
  level: Difficulty
  pro: boolean
  /** Structured answer: a markdown numbered list of the points to hit */
  answer: string
  /** What you'd actually say, conversationally */
  short: string
  /** Longer explanation (markdown) */
  detail: string
  followups: { q: string; a: string }[]
  mistakes: string[]
}

export interface Tech {
  slug: string
  title: string
  category: CategoryId
  aliases: string[]
  tagline: string
  level: Difficulty
  minutes: number
  /** Existing concept slugs for optional deeper reading */
  concepts: string[]
  related: string[]
  popular: boolean
  what: string
  why: string
  how: string
  where: string[]
  know: string[]
  analogy: string
  talk10: string
  talk30: string
  /** "If they say X → you can say Y" */
  comebacks: { q: string; a: string }[]
  facts: string[]
  deeper: string
  sources: { title: string; url: string }[]
  check: QuizCheck
  interview: InterviewQ[]
}
