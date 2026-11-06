import type { ReactNode } from 'react'
import { CodeBlock } from './Code'

/** Inline: `code`, **bold**, *italic* */
export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (m[1]) out.push(<code key={i++}>{t.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={i++}>{t.slice(2, -2)}</strong>)
    else out.push(<em key={i++}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Block-level mini markdown: ###, paragraphs, - lists, 1. lists, > quotes, ``` fences. */
export function Markdown({ source, className = 'prose-yap' }: { source: string; className?: string }) {
  const lines = source.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    const fence = /^```(\w*)/.exec(line)
    if (fence) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++])
      i++
      blocks.push(<CodeBlock key={k++} code={buf.join('\n')} lang={fence[1] || 'text'} />)
      continue
    }
    if (line.startsWith('### ')) { blocks.push(<h3 key={k++}>{inline(line.slice(4))}</h3>); i++; continue }
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || (lines[i].startsWith('  ') && items.length))) {
        if (lines[i].startsWith('- ')) items.push(lines[i].slice(2))
        else items[items.length - 1] += ' ' + lines[i].trim()
        i++
      }
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>)
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ''))
      blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>)
      continue
    }
    if (line.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i++].slice(2))
      blocks.push(<blockquote key={k++}>{inline(buf.join(' '))}</blockquote>)
      continue
    }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(```|### |- |> |\d+\. )/.test(lines[i])) buf.push(lines[i++])
    blocks.push(<p key={k++}>{inline(buf.join(' '))}</p>)
  }
  return <div className={className}>{blocks}</div>
}
