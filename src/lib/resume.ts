// Resume Yapping engine. Deterministic and honest: it rewrites only what the user wrote,
// never adds technologies, metrics or responsibilities, and marks gaps as [placeholders].

/** Canonical spellings. Matching is case-insensitive on word boundaries. */
export const TECH = [
  'Power Automate', 'Power Apps', 'Power BI', 'Power Pages', 'Copilot Studio', 'Dataverse', 'SharePoint', 'Microsoft Teams', 'Outlook', 'Excel', 'Microsoft 365', 'Dynamics 365',
  'Azure', 'Azure Functions', 'Azure DevOps', 'AWS', 'Lambda', 'S3', 'GCP', 'Google Cloud', 'Firebase', 'Supabase', 'Vercel', 'Netlify',
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Node.js', 'Express', 'HTML', 'CSS', 'Tailwind CSS', 'Redux',
  'Python', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'Java', 'Spring Boot', 'C#', '.NET', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Laravel', 'Ruby on Rails',
  'SQL', 'PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'GraphQL', 'REST API', 'REST APIs',
  'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'GitHub Actions', 'CI/CD', 'Git', 'GitHub', 'Linux',
  'LLM', 'LLMs', 'RAG', 'OpenAI', 'LangChain', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Machine Learning', 'NLP',
  'Selenium', 'Playwright', 'Cypress', 'Jest', 'Postman', 'Jira', 'Figma', 'Tableau', 'Salesforce', 'ServiceNow', 'SAP', 'UiPath',
]

/** Skills a sentence can genuinely claim, keyed by the words that justify them. */
const SKILLS: [RegExp, string][] = [
  [/\b(automat\w*|flow|workflow|bot|script)\b/i, 'Workflow automation'],
  [/\b(email|notification|notify|alert)\w*/i, 'Automated notifications'],
  [/\bapprov\w*/i, 'Approval workflows'],
  [/\b(dashboard|report|visuali[sz]\w*|chart)\w*/i, 'Reporting and data visualisation'],
  [/\b(api|integrat\w*|connector|webhook)\b/i, 'API integration'],
  [/\b(test\w*|qa|quality)\b/i, 'Testing'],
  [/\b(deploy\w*|pipeline|ci\/cd|release)\b/i, 'Deployment and CI/CD'],
  [/\b(migrat\w*)\b/i, 'Data migration'],
  [/\b(database|schema|table|query|queries|sql)\b/i, 'Database design'],
  [/\b(ui|interface|screen|front[- ]?end|responsive)\b/i, 'Front-end development'],
  [/\b(folder|file|document)s?\b/i, 'Document management'],
  [/\b(security|auth\w*|permission|role)s?\b/i, 'Access control'],
  [/\b(performance|optimi[sz]\w*|faster|latency)\b/i, 'Performance optimisation'],
  [/\b(stakeholder|client|business user)s?\b/i, 'Stakeholder collaboration'],
]

const WEAK: Record<string, string> = {
  'worked on': 'Developed', 'helped with': 'Supported', 'helped': 'Supported', 'was responsible for': 'Owned', 'responsible for': 'Owned',
  'was involved in': 'Contributed to', 'involved in': 'Contributed to', 'did': 'Delivered', 'made': 'Built', 'make': 'Built',
}
const PAST: Record<string, string> = {
  build: 'Built', built: 'Built', create: 'Created', develop: 'Developed', design: 'Designed', automate: 'Automated', implement: 'Implemented',
  write: 'Wrote', wrote: 'Wrote', fix: 'Fixed', improve: 'Improved', migrate: 'Migrated', integrate: 'Integrated', lead: 'Led', led: 'Led',
  manage: 'Managed', reduce: 'Reduced', increase: 'Increased', launch: 'Launched', deploy: 'Deployed', configure: 'Configured', set: 'Set',
  analyse: 'Analysed', analyze: 'Analyzed', test: 'Tested', maintain: 'Maintained', optimise: 'Optimised', optimize: 'Optimized', refactor: 'Refactored',
  train: 'Trained', mentor: 'Mentored', document: 'Documented', streamline: 'Streamlined', replace: 'Replaced', add: 'Added', convert: 'Converted',
  run: 'Ran', ran: 'Ran', own: 'Owned', establish: 'Established', standardise: 'Standardised', standardize: 'Standardized', support: 'Supported',
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const techRe = (t: string) => new RegExp(`(^|[^\\w.#])(${escape(t)})(?![\\w#])`, 'i')

export function detectTech(text: string): string[] {
  const found: string[] = []
  for (const t of [...TECH].sort((a, b) => b.length - a.length)) {
    if (techRe(t).test(text) && !found.some((f) => f.toLowerCase().includes(t.toLowerCase()))) found.push(t)
  }
  return found
}

export const detectSkills = (text: string) => [...new Set(SKILLS.filter(([re]) => re.test(text)).map(([, s]) => s))]
export const hasMetric = (text: string) => /\d|\b(percent|half|double|twice|hundreds|thousands)\b/i.test(text)

function canonicalise(text: string): string {
  let out = text
  for (const t of [...TECH].sort((a, b) => b.length - a.length)) out = out.replace(new RegExp(techRe(t).source, 'gi'), (_m, pre) => pre + t)
  return out
}

function gerund(verb: string): string {
  const v = verb.toLowerCase()
  const irregular: Record<string, string> = { runs: 'running', gets: 'getting', sets: 'setting', puts: 'putting', lets: 'letting', is: 'being', has: 'having' }
  if (irregular[v]) return irregular[v]
  let stem = v
  if (/ies$/.test(v)) stem = v.slice(0, -3) + 'y'
  else if (/(ch|sh|ss|x|z)es$/.test(v)) stem = v.slice(0, -2)
  else if (/s$/.test(v) && !/ss$/.test(v)) stem = v.slice(0, -1)
  if (/[^e]e$/.test(stem)) stem = stem.slice(0, -1)
  return stem + 'ing'
}

export interface Parsed { verb: string; rest: string; note?: string }

/** Turns "I built a flow that…" into { verb: 'Built', rest: 'a flow that…' }. */
export function parse(raw: string): Parsed {
  let s = raw.trim().replace(/\s+/g, ' ').replace(/[.。]+$/, '')
  s = s.replace(/^(i\s+(have|had)\s+|i've\s+|i\s+|we\s+|my\s+(role|job|task)\s+was\s+to\s+)/i, '')
  for (const [weak, strong] of Object.entries(WEAK)) {
    const m = new RegExp(`^${escape(weak)}\\s+`, 'i').exec(s)
    if (m) {
      const rest = s.slice(m[0].length)
      const g = /^(\w+)ing\s+/i.exec(rest)
      const stem = g?.[1].toLowerCase() ?? ''
      const fromGerund = g && (PAST[stem] ?? PAST[stem + 'e'] ?? PAST[stem.replace(/(.)$/, '$1')])
      if (fromGerund) return { verb: fromGerund, rest: canonicalise(rest.slice(g![0].length)) }
      return { verb: strong, rest: canonicalise(rest), note: `Replaced “${weak}” with “${strong}”. Check it describes what you actually did.` }
    }
  }
  const first = s.split(' ')[0]?.toLowerCase() ?? ''
  const base = first.replace(/(ed|ing|s)$/, '')
  const verb = PAST[first] ?? PAST[base] ?? PAST[base + 'e'] ?? (/ed$/.test(first) ? first[0].toUpperCase() + first.slice(1) : '')
  if (verb) {
    const rest = s.slice(first.length).trim()
    if (verb === 'Set' && /^up\b/i.test(rest)) return { verb: 'Set up', rest: canonicalise(rest.slice(2).trim()) }
    return { verb, rest: canonicalise(rest) }
  }
  return { verb: 'Built', rest: canonicalise(s.charAt(0).toLowerCase() + s.slice(1)), note: 'No action verb found, so we started with “Built”. Change it if another verb fits better.' }
}

const FILLER: [RegExp, string][] = [
  [/\bin order to\b/gi, 'to'], [/\bdifferent\s+/gi, ''], [/\bvarious\s+/gi, ''], [/\ba lot of\b/gi, 'many'], [/\bbasically\s+/gi, ''],
  [/\bthat (is|was) used to\b/gi, 'to'], [/\bwhich\b/gi, 'that'], [/\s{2,}/g, ' '],
]
const tidy = (s: string) => FILLER.reduce((acc, [re, r]) => acc.replace(re, r), s).trim()

function concise(p: Parsed): string {
  let rest = tidy(p.rest).replace(/^(a|an|the)\s+/i, '')
  rest = rest.replace(/\b(that|who)\s+(\w+s)\b/gi, (_m, _w, v) => gerund(v))
  rest = rest.replace(/\band\s+(\w+s)\b/gi, (m, v) => (/(ss|us|is)$/i.test(v) ? m : 'and ' + gerund(v)))
  const words = `${p.verb} ${rest}`.split(' ')
  return words.length > 20 ? words.slice(0, 20).join(' ').replace(/[,;]?\s*\w*$/, '') : words.join(' ')
}

export interface Context { scope?: string; result?: string; tech?: string[] }

export interface Variant { id: 'technical' | 'impact' | 'concise'; label: string; text: string; communicates: string }

export function variants(raw: string, ctx: Context = {}): { variants: Variant[]; tech: string[]; skills: string[]; notes: string[] } {
  const p = parse(raw)
  const core = `${p.verb} ${tidy(p.rest)}`
  const inText = detectTech(raw)
  const extra = (ctx.tech ?? []).filter((t) => !inText.some((x) => x.toLowerCase() === t.toLowerCase()))
  const tech = [...inText, ...extra]
  const techClause = extra.length ? ` using ${extra.join(', ').replace(/, ([^,]*)$/, ' and $1')}` : ''
  const scope = ctx.scope?.trim() ? ` for ${ctx.scope.trim().replace(/^for\s+/i, '')}` : ''
  const result = ctx.result?.trim()
  const notes: string[] = []
  if (p.note) notes.push(p.note)

  const technical = `${core}${techClause}${scope}`
  const impact = !result && hasMetric(raw)
    ? `${core}${scope}`
    : result
    ? `${core}${scope}, ${result.replace(/^(resulting in|which|that)\s+/i, 'resulting in ')}`.replace(/, (?!resulting)/, ', ').replace(/,\s*resulting in resulting in/, ', resulting in')
    : `${core}${scope}, [add the real result: time saved, errors reduced, people served]`
  if (!result && !hasMetric(raw)) notes.push('No result yet. Add one only if it really happened, like hours saved, a manual step removed or the number of users. Leave the placeholder out if you don\'t know.')
  if (!tech.length) notes.push('No technology named. ATS filters often look for tools, so name the ones you used.')
  if (!scope && !/\b(team|users?|customers?|clients?|department|stakeholders?|students?)\b/i.test(raw)) notes.push('Who used it or benefited? A short scope, like “for a 12-person delivery team”, makes the bullet concrete.')

  const v: Variant[] = [
    { id: 'technical', label: 'Technical', text: finish(technical), communicates: 'Leads with what you built and the tools, for engineering readers and keyword filters.' },
    { id: 'impact', label: 'Impact', text: finish(impact), communicates: 'Ties the work to an outcome. This is what hiring managers remember.' },
    { id: 'concise', label: 'Concise', text: finish(concise({ verb: p.verb, rest: p.rest + techClause + scope })), communicates: 'A shorter version for a dense one-page resume.' },
  ]
  return { variants: v, tech, skills: detectSkills(raw + ' ' + (ctx.result ?? '')), notes }
}

const finish = (s: string) => {
  const t = s.trim().replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export interface Check { ok: boolean; label: string }

/** ATS-conscious checks. These are heuristics, not a score. */
export function checks(text: string): Check[] {
  const words = text.split(/\s+/).filter(Boolean).length
  const first = text.split(' ')[0]?.toLowerCase() ?? ''
  return [
    { ok: Object.values(PAST).map((v) => v.toLowerCase()).includes(first) || /ed$/.test(first), label: 'Starts with a clear action verb' },
    { ok: !/\b(i|me|my|we|our)\b/i.test(text), label: 'No first-person pronouns' },
    { ok: words >= 8 && words <= 32, label: `Length is readable (${words} words, aim for 12–28)` },
    { ok: detectTech(text).length > 0, label: 'Names a specific technology' },
    { ok: hasMetric(text) && !/\[add/.test(text), label: 'Includes a real, measurable result' },
    { ok: !/\[[^\]]+\]/.test(text), label: 'No placeholders left to fill' },
  ]
}

/** Keywords a job description asks for, limited to known technologies and skills so it stays explainable. */
export function jdKeywords(jd: string): string[] {
  if (!jd.trim()) return []
  const skills = SKILLS.filter(([re]) => re.test(jd)).map(([, s]) => s)
  return [...new Set([...detectTech(jd), ...skills])]
}

export function coverage(jd: string, bullets: string[]) {
  const asked = jdKeywords(jd)
  const all = bullets.join(' ')
  const mine = new Set([...detectTech(all), ...detectSkills(all)].map((x) => x.toLowerCase()))
  return { asked, matched: asked.filter((k) => mine.has(k.toLowerCase())), missing: asked.filter((k) => !mine.has(k.toLowerCase())) }
}
