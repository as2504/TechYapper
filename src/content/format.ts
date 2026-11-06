// Plain-text content format parser. Shared by the browser bundle (fallback content)
// and scripts/generate-seed.ts (Node, type-stripped) — keep it dependency-free.
import type { Challenge, Concept, Difficulty, InterviewQ, Question, QuizCheck, Tech } from './types.ts'

function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  let current = ''
  let buf: string[] = []
  for (const line of body.split(/\r?\n/)) {
    const m = /^::(\w+)\s*$/.exec(line)
    if (m) {
      if (current) out[current] = buf.join('\n').trim()
      current = m[1]
      buf = []
    } else buf.push(line)
  }
  if (current) out[current] = buf.join('\n').trim()
  return out
}

function parseFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src.trim())
  if (!m) return { meta: {}, body: src }
  const meta: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: m[2] }
}

const bullets = (s = '') =>
  s.split(/\r?\n(?=- )/).map((l) => l.replace(/^- /, '').replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)

/** Parses a quiz block: prompt (optionally with one ```fenced``` code), options `- [ ]`/`- [x]`, explanation `> ` lines. */
export function parseQuiz(src: string): QuizCheck {
  const lines = src.split(/\r?\n/)
  const prompt: string[] = []
  const options: string[] = []
  const expl: string[] = []
  let answer = -1
  let code: QuizCheck['code']
  let inCode = false
  let codeLang = ''
  let codeBuf: string[] = []
  for (const line of lines) {
    if (inCode) {
      if (/^```\s*$/.test(line)) { inCode = false; code = { lang: codeLang || 'text', source: codeBuf.join('\n') } }
      else codeBuf.push(line)
      continue
    }
    const fence = /^```(\w*)/.exec(line)
    if (fence) { inCode = true; codeLang = fence[1]; codeBuf = []; continue }
    const opt = /^- \[( |x)\] (.*)$/.exec(line)
    if (opt) { if (opt[1] === 'x') answer = options.length; options.push(opt[2].trim()); continue }
    if (line.startsWith('> ')) { expl.push(line.slice(2)); continue }
    if (line.trim() === '>') { expl.push(''); continue }
    if (options.length === 0) prompt.push(line)
  }
  if (answer < 0) throw new Error('Quiz without a correct answer: ' + prompt.join(' ').slice(0, 80))
  return { prompt: prompt.join('\n').trim(), code, options, answer, explanation: expl.join('\n').trim() }
}

export function parseConcept(src: string): Concept {
  const { meta, body } = parseFrontmatter(src)
  const s = splitSections(body)
  const myths = bullets(s.myths).map((b) => {
    const [myth, truth] = b.split('||').map((x) => x.trim())
    return { myth, truth }
  })
  return {
    slug: meta.slug,
    title: meta.title,
    topic: meta.topic as Concept['topic'],
    difficulty: (meta.difficulty || 'intermediate') as Concept['difficulty'],
    minutes: Number(meta.minutes || 6),
    pro: meta.pro === 'true',
    related: (meta.related || '').replace(/[[\]]/g, '').split(',').map((x) => x.trim()).filter(Boolean),
    dek: s.dek ?? '',
    hook: s.hook ?? '',
    yap: s.yap ?? '',
    basics: s.basics ?? '',
    hood: s.hood ?? '',
    deep: s.deep ?? '',
    myths,
    facts: bullets(s.facts),
    realWorld: bullets(s.realworld),
    check: parseQuiz(s.check ?? ''),
  }
}

function parseHeader(line: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of line.replace(/^===\s*/, '').split('|')) {
    const i = part.indexOf(':')
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

function splitItems(src: string): { head: Record<string, string>; body: string }[] {
  return src
    .split(/\r?\n(?====\s)/)
    .map((chunk) => chunk.trim())
    .filter((c) => c.startsWith('==='))
    .map((c) => {
      const nl = c.indexOf('\n')
      return { head: parseHeader(c.slice(0, nl)), body: c.slice(nl + 1) }
    })
}

export function parseQuestions(src: string): Question[] {
  return splitItems(src).map(({ head, body }) => ({
    id: head.id,
    topic: head.topic as Question['topic'],
    difficulty: head.level as Question['difficulty'],
    pro: head.pro === 'true',
    ...parseQuiz(body),
  }))
}

export function parseChallenges(src: string): Challenge[] {
  return splitItems(src).map(({ head, body }) => ({
    id: head.id,
    kind: head.kind as Challenge['kind'],
    title: head.title,
    topic: head.topic as Challenge['topic'],
    difficulty: head.level as Challenge['difficulty'],
    pro: head.pro === 'true',
    ...parseQuiz(body),
  }))
}

const pairs = (s = '') => bullets(s).map((b) => { const [q, a] = b.split('||').map((x) => x.trim()); return { q, a } })

function parseInterview(src: string, slug: string): InterviewQ[] {
  return splitItems(src).map(({ head, body }, n) => {
    const parts: Record<string, string> = {}
    let cur = ''
    let buf: string[] = []
    for (const line of body.split(/\r?\n/)) {
      const m = /^#(\w+)\s*$/.exec(line)
      if (m) { if (cur) parts[cur] = buf.join('\n').trim(); cur = m[1]; buf = [] } else buf.push(line)
    }
    if (cur) parts[cur] = buf.join('\n').trim()
    return {
      id: `${slug}-iq${n + 1}`,
      q: head.q,
      level: (head.level || 'beginner') as Difficulty,
      pro: head.pro === 'true',
      answer: parts.answer ?? '',
      short: parts.short ?? '',
      detail: parts.detail ?? '',
      followups: pairs(parts.followups),
      mistakes: bullets(parts.mistakes),
    }
  })
}

export function parseTech(src: string): Tech {
  const { meta, body } = parseFrontmatter(src)
  const s = splitSections(body)
  const list = (v = '') => v.split(',').map((x) => x.trim()).filter(Boolean)
  return {
    slug: meta.slug,
    title: meta.title,
    category: meta.category as Tech['category'],
    aliases: list(meta.aliases),
    tagline: meta.tagline ?? '',
    level: (meta.level || 'beginner') as Difficulty,
    minutes: Number(meta.minutes || 5),
    concepts: list(meta.concepts),
    related: list(meta.related),
    popular: meta.popular === 'true',
    what: s.what ?? '',
    why: s.why ?? '',
    how: s.how ?? '',
    where: bullets(s.where),
    know: bullets(s.know),
    analogy: s.analogy ?? '',
    talk10: s.talk10 ?? '',
    talk30: s.talk30 ?? '',
    comebacks: pairs(s.comebacks),
    facts: bullets(s.facts),
    deeper: s.deeper ?? '',
    sources: bullets(s.sources).map((b) => { const m = /^\[(.+?)\]\((.+?)\)/.exec(b); return { title: m?.[1] ?? b, url: m?.[2] ?? '' } }),
    check: parseQuiz(s.check ?? ''),
    interview: parseInterview(s.interview ?? '', meta.slug),
  }
}
