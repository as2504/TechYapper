import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

const KW: Record<string, string> = {
  js: 'const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this null undefined true false yield delete void static get set',
  py: 'def return if elif else for while in not and or is import from as class with try except finally raise lambda None True False pass yield global nonlocal async await print',
  sql: 'select from where join left right inner outer on group by order having limit insert into values update set delete create table index unique primary key references not null and or as begin commit rollback alter add drop policy enable row level security using with check explain analyze returning distinct count exists in grant to auth uid',
  sh: 'git docker cd ls echo run from copy cmd workdir expose env npm node pip FROM RUN COPY CMD WORKDIR EXPOSE ENV ENTRYPOINT',
}
KW.ts = KW.js + ' interface type enum implements private public readonly as keyof never unknown any string number boolean'
KW.jsx = KW.js
KW.tsx = KW.ts
KW.python = KW.py
KW.dockerfile = KW.sh
KW.bash = KW.sh
KW.powerfx = 'If Filter Search LookUp Patch Collect ClearCollect ForAll Sort SortByColumns StartsWith Set Navigate true false And Or Not in exactin With Concurrent First CountRows'

function lineComment(lang: string) {
  if (['py', 'python', 'sh', 'bash', 'dockerfile', 'yaml'].includes(lang)) return '#[^\\n]*'
  if (lang === 'sql') return '--[^\\n]*'
  return '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'
}

export function highlight(code: string, lang = 'text'): ReactNode[] {
  if (lang === 'text' || lang === 'http' || lang === 'json-plain') return [code]
  const words = new Set((KW[lang] ?? KW.js).split(' ').map((w) => (lang === 'sql' ? w.toLowerCase() : w)))
  const re = new RegExp(`(${lineComment(lang)})|("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$]*)(?=\\s*\\()|([A-Za-z_$][\\w$]*)`, 'g')
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const [tok, c, s, n, f, w] = m
    const key = i++
    if (c) out.push(<span key={key} className="tok-c">{tok}</span>)
    else if (s) out.push(<span key={key} className="tok-s">{tok}</span>)
    else if (n) out.push(<span key={key} className="tok-n">{tok}</span>)
    else if (f) out.push(words.has(lang === 'sql' ? f.toLowerCase() : f) ? <span key={key} className="tok-k">{tok}</span> : <span key={key} className="tok-f">{tok}</span>)
    else if (w && words.has(lang === 'sql' ? w.toLowerCase() : w)) out.push(<span key={key} className="tok-k">{tok}</span>)
    else out.push(tok)
    last = m.index + tok.length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function CodeBlock({ code, lang = 'text', caption }: { code: string; lang?: string; caption?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <figure className="codeblock not-prose my-0">
      <div className="cb-head">
        <span>{caption ?? lang}</span>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-white"
          aria-label="Copy code"
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400) }).catch(() => {})
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre><code>{highlight(code, lang)}</code></pre>
    </figure>
  )
}
