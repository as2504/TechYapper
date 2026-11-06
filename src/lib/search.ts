import type { Library } from './content'
import { CATEGORIES } from '../content/types'

export interface Hit {
  kind: 'topic' | 'concept' | 'interview'
  title: string
  sub: string
  to: string
  score: number
}

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}+#.]+/gu, ' ').trim()
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? ''

function scoreText(q: string, tokens: string[], title: string, alt: string[], body: string): number {
  const t = norm(title)
  let s = 0
  if (t === q) s = 100
  else if (alt.some((a) => norm(a) === q)) s = 92
  else if (t.startsWith(q)) s = 80
  else if (alt.some((a) => norm(a).startsWith(q))) s = 70
  else if (t.includes(q)) s = 60
  else if (alt.some((a) => norm(a).includes(q))) s = 50
  const b = norm(body)
  const hits = tokens.filter((tok) => tok.length > 1 && (t.includes(tok) || b.includes(tok) || alt.some((a) => norm(a).includes(tok))))
  if (!s && hits.length === tokens.length) s = 20 + hits.length * 4
  else s += hits.length * 2
  return s
}

/** Client-side search across topics, concepts and interview questions. Small library → no index needed. */
export function search(lib: Library, raw: string, limit = 8): Hit[] {
  const q = norm(raw)
  if (!q) return []
  const tokens = q.split(' ').filter(Boolean)
  const hits: Hit[] = []
  for (const t of lib.techs) {
    const s = scoreText(q, tokens, t.title, t.aliases, `${t.tagline} ${catLabel(t.category)}`)
    if (s) hits.push({ kind: 'topic', title: t.title, sub: t.tagline, to: `/app/yap/${t.slug}`, score: s + 15 })
    for (const iq of t.interview) {
      const si = scoreText(q, tokens, iq.q, [], t.title)
      if (si >= 40) hits.push({ kind: 'interview', title: iq.q, sub: `${t.title} · interview`, to: `/app/yap/${t.slug}?tab=interview#${iq.id}`, score: si - 12 })
    }
  }
  for (const c of lib.concepts) {
    const s = scoreText(q, tokens, c.title, [], c.dek)
    if (s) hits.push({ kind: 'concept', title: c.title, sub: c.dek, to: `/app/concept/${c.slug}`, score: s - 5 })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
