// Project Yapping: turns what the user tells us about their project into a script they can say.
// Rule: only the user's facts go in. Anything missing becomes a visible [gap], never an invention.

export interface ProjectInput {
  name: string
  oneLiner: string
  context: string
  problem: string
  users: string
  motivation: string
  stack: { tech: string; why: string }[]
  architecture: string
  features: string
  contribution: string
  team: string
  decisions: string
  challenges: { challenge: string; solution: string }[]
  results: string
  improvements: string
}

export const EMPTY_PROJECT: ProjectInput = {
  name: '', oneLiner: '', context: '', problem: '', users: '', motivation: '', stack: [{ tech: '', why: '' }], architecture: '', features: '',
  contribution: '', team: '', decisions: '', challenges: [{ challenge: '', solution: '' }], results: '', improvements: '',
}

export interface ScriptSection {
  key: string
  title: string
  explain: string
  script: string
  points: string[]
  followups: string[]
  defend: string[]
  gaps: string[]
  edited?: boolean
}

const gap = (what: string) => `[${what}]`
const clean = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/[.]+$/, '')
const sentence = (s: string) => { const c = clean(s); return c ? c.charAt(0).toUpperCase() + c.slice(1) + '.' : '' }
// Lower-case the first letter for mid-sentence use, but keep "I", acronyms and proper names like React.
const lower = (s: string) => { const c = clean(s); return !c || /^(I\b|I'|[A-Z]{2}|[A-Z][a-z]+[A-Z.])/.test(c) ? c : c.charAt(0).toLowerCase() + c.slice(1) }
const list = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
const lines = (s: string) => s.split(/\r?\n|;|•/).map((x) => clean(x.replace(/^[-*\d.)\s]+/, ''))).filter(Boolean)

/** Follow-ups interviewers commonly ask about specific technologies. Linked to TechYapper topics where we have them. */
const TECH_Q: [RegExp, string[], string?][] = [
  [/\breact\b/i, ['Why React rather than plain JavaScript or another framework?', 'How did you manage state, and where did it live?'], 'react'],
  [/next\.?js/i, ['Which pages are server-rendered, and why?'], 'react'],
  [/typescript/i, ['What did TypeScript catch for you that JavaScript wouldn\'t have?'], 'typescript'],
  [/node|express/i, ['How does your server handle many requests at once?'], 'javascript'],
  [/postgres|mysql|sql server|\bsql\b/i, ['Walk me through your schema. Which tables, and how are they related?', 'Which queries did you index for?'], 'postgresql'],
  [/supabase/i, ['How do you stop one user reading another user\'s data? Did you use Row Level Security?'], 'auth-jwt'],
  [/firebase|mongo/i, ['Why a document database for this data?']],
  [/docker/i, ['What does your Dockerfile do, and how do you run the app locally versus in production?'], 'docker'],
  [/kubernetes|k8s/i, ['Why did this project need Kubernetes rather than a simpler host?'], 'kubernetes'],
  [/aws|azure|gcp|vercel|netlify|cloud/i, ['How is it deployed, and what happens if a server goes down?'], 'cloud-computing'],
  [/\brag\b|retriev/i, ['How did you chunk the documents, and how did you check retrieval quality?'], 'rag'],
  [/llm|gpt|openai|claude|gemini/i, ['How do you handle wrong or made-up answers from the model?', 'What does a request cost, and how did you keep it down?'], 'llms'],
  [/vector|pgvector|pinecone|embedding/i, ['Which embedding model did you use, and why that similarity measure?'], 'vector-databases'],
  [/power automate|flow/i, ['What happens when the flow fails halfway through?', 'Whose account does the flow run under?'], 'power-automate'],
  [/power apps|canvas|model-driven/i, ['Did you run into delegation limits? How did you handle large lists?'], 'power-apps'],
  [/dataverse/i, ['How did you set up security roles?'], 'dataverse'],
  [/sharepoint/i, ['Why SharePoint for storage, and what happens as the list grows?']],
  [/jwt|oauth|auth/i, ['Where are tokens stored, and how do they expire?'], 'auth-jwt'],
  [/rest|api/i, ['Show me one endpoint. What does it accept and return, and what status codes?'], 'rest-apis'],
  [/git\b|github/i, ['How did you use branches and reviews on this project?'], 'git'],
]

export function techLinks(stack: string[]): { tech: string; slug: string }[] {
  const out: { tech: string; slug: string }[] = []
  for (const t of stack) for (const [re, , slug] of TECH_Q) if (slug && re.test(t) && !out.some((o) => o.slug === slug)) out.push({ tech: t, slug })
  return out
}

export function generate(p: ProjectInput): ScriptSection[] {
  const name = clean(p.name) || 'this project'
  const stack = p.stack.filter((s) => s.tech.trim())
  const features = lines(p.features)
  const challenges = p.challenges.filter((c) => c.challenge.trim())
  const techQs = stack.flatMap((s) => TECH_Q.filter(([re]) => re.test(s.tech)).flatMap(([, qs]) => qs))

  const S = (key: string, title: string, explain: string, script: string, points: string[], followups: string[], defend: string[], gaps: string[]): ScriptSection =>
    ({ key, title, explain, script: script.replace(/\s{2,}/g, ' ').trim(), points: points.filter(Boolean), followups, defend, gaps })

  const intro = S('intro', 'Project introduction', 'Name it and say what it does in one breath. No tech yet.',
    `${name} is ${lower(p.oneLiner) || gap('one line: what it does')}. ${p.context.trim() ? sentence(`I built it ${lower(p.context).replace(/^i built it\s+/i, '')}`) : gap('where you built it: a personal project, college, work or a hackathon')}`,
    [p.oneLiner && `What it does: ${clean(p.oneLiner)}`],
    ['What made you pick this project?'], ['That the one-liner matches what the project actually does today'],
    [!p.oneLiner.trim() && 'Add a one-line description', !p.context.trim() && 'Say where you built it'].filter(Boolean) as string[])

  const problem = S('problem', 'Problem statement', 'Describe the pain before your project existed, from the user\'s point of view.',
    `${p.problem.trim() ? sentence(p.problem) : gap('the problem, from the user\'s side')} ${p.users.trim() ? `The people who feel this most are ${lower(p.users)}.` : gap('who has this problem')}`,
    [p.users && `Users: ${clean(p.users)}`], ['How did people handle this before?', 'How do you know it was a real problem?'],
    ['Evidence the problem is real: something you saw, were told or experienced yourself'],
    [!p.problem.trim() && 'Describe the problem', !p.users.trim() && 'Say who the users are'].filter(Boolean) as string[])

  const why = S('why', 'Why it was needed', 'Connect the problem to why building something was worth it, and why you.',
    p.motivation.trim() ? sentence(p.motivation) : gap('why this needed building: what existing options were missing, and why you took it on'),
    [], ['Why not use an existing tool?'], ['Why existing tools fell short. Have one concrete example ready'],
    [!p.motivation.trim() && 'Say why it was worth building'].filter(Boolean) as string[])

  const stackSec = S('stack', 'Technology stack and why', 'For each choice, give one reason that\'s specific to this project.',
    stack.length ? stack.map((s) => (s.why.trim() ? `I used ${clean(s.tech)} because ${lower(s.why).replace(/^because\s+/i, '')}.` : `I used ${clean(s.tech)} ${gap(`why ${clean(s.tech)}?`)}.`)).join(' ') : gap('the main technologies you used'),
    stack.map((s) => clean(s.tech)), [...new Set(techQs)].slice(0, 5), stack.map((s) => `Why ${clean(s.tech)} over the obvious alternative`),
    [!stack.length && 'List your tech stack', ...stack.filter((s) => !s.why.trim()).map((s) => `Give a reason for ${clean(s.tech)}`)].filter(Boolean) as string[])

  const arch = S('architecture', 'Architecture and system design', 'Walk through one request or one user action from start to finish.',
    p.architecture.trim() ? sentence(p.architecture) : gap('how the pieces connect, e.g. the front end calls an API, which reads from the database'),
    lines(p.architecture).slice(0, 4), ['What would break first if usage grew ten times?', 'Where is the data stored, and who can access it?'],
    ['Draw it on a whiteboard: boxes and arrows, in under a minute'], [!p.architecture.trim() && 'Describe how the components connect'].filter(Boolean) as string[])

  const feat = S('features', 'Important features', 'Pick the 2–3 features that matter most to users. Don\'t list everything.',
    features.length ? `The main features are ${list(features.slice(0, 3).map(lower))}.${features.length > 3 ? ` There's more, but those are the ones people use most.` : ''}` : gap('the 2–3 most important features'),
    features, ['Which feature was hardest to build?', 'Which feature do users use most?'], ['How each feature works, one level below the UI'],
    [!features.length && 'List your main features'].filter(Boolean) as string[])

  const impl = S('implementation', 'How you built it, and your part', 'Be precise about what you did yourself versus the team. Interviewers check this.',
    `${p.team.trim() ? `I worked on this ${lower(p.team).replace(/^(with|as)\s+/i, (m) => m)}. ` : ''}${p.contribution.trim() ? (/^i\s/i.test(p.contribution.trim()) ? sentence(p.contribution) : `My part was ${lower(p.contribution).replace(/^(was responsible for|did)\s+/i, '')}.`) : gap('exactly what you built or owned')}`,
    lines(p.contribution), ['Which part of the code would you show me first?', 'What would you have done differently?'],
    ['Every “I” in this section. Be ready to go into detail on each one'], [!p.contribution.trim() && 'Say what you personally did'].filter(Boolean) as string[])

  const dec = S('decisions', 'Interesting technical decisions', 'One decision, the options you considered, and why you chose this one.',
    p.decisions.trim() ? sentence(p.decisions) : gap('one decision you made, what else you considered, and why'),
    [], ['What was the trade-off?', 'Would you make the same decision again?'], ['The alternative you rejected and its downside'],
    [!p.decisions.trim() && 'Describe at least one technical decision'].filter(Boolean) as string[])

  const chal = S('challenges', 'Challenges and how you solved them', 'Use problem → what you tried → what worked. Specific beats impressive.',
    challenges.length ? challenges.map((c) => `One challenge was ${lower(c.challenge)}. ${c.solution.trim() ? `I solved it by ${lower(c.solution).replace(/^(i\s+)?(solved it by|by)\s+/i, '')}.` : gap('how you solved it')}`).join(' ') : gap('a real problem you hit and how you fixed it'),
    [], ['How did you debug it?', 'How long did it take you?'], ['The details of the fix. Expect “how exactly?”'],
    [!challenges.length && 'Add at least one challenge', ...challenges.filter((c) => !c.solution.trim()).map(() => 'Say how you solved each challenge')].filter(Boolean) as string[])

  const res = S('results', 'Results and impact', 'Only real outcomes: users, feedback, time saved, a grade, what you learned. No guessed numbers.',
    p.results.trim() ? sentence(p.results) : gap('a real result. If you have no numbers, say what changed or what you learned'),
    [], ['How did you measure that?'], ['Where every number came from'],
    [!p.results.trim() && 'Add a real result. Leave numbers out if you don\'t have them'].filter(Boolean) as string[])

  const next = S('future', 'Future improvements', 'Show judgement: what you\'d improve next and why, not a wishlist.',
    p.improvements.trim() ? `If I kept going, I'd ${lower(p.improvements).replace(/^(i would|i'd)\s+/i, '')}.` : gap('the next thing you\'d improve, and why it matters most'),
    lines(p.improvements), ['Why is that the most important next step?'], ['How you would actually build the improvement'],
    [!p.improvements.trim() && 'Add what you would improve next'].filter(Boolean) as string[])

  return [intro, problem, why, stackSec, arch, feat, impl, dec, chal, res, next]
}

/** A 60-second version stitched from the user's own sections. */
export function pitch(sections: ScriptSection[]): string {
  const get = (k: string) => sections.find((s) => s.key === k)?.script ?? ''
  const first = (s: string) => (s.match(/^[^.!?]+[.!?]/)?.[0] ?? s).trim()
  const keep = (x: string) => x.replace(/\[[^\]]*\]\.?/g, '').trim()
  return [keep(get('intro')), first(keep(get('problem'))), first(keep(get('stack'))), first(keep(get('features'))), first(keep(get('results')))].filter(Boolean).join(' ')
}

export const gapCount = (sections: ScriptSection[]) => sections.reduce((n, s) => n + (s.script.match(/\[[^\]]+\]/g)?.length ?? 0), 0)
