import { CheckCircle2, XCircle } from 'lucide-react'
import type { QuizCheck } from '../content/types'
import { CodeBlock } from './Code'
import { inline, Markdown } from './Markdown'

const KEYS = ['A', 'B', 'C', 'D', 'E']

/** Stateless option list. `chosen` is the user's pick (null = unanswered). */
export function Options({ quiz, chosen, onChoose, disabled }: { quiz: QuizCheck; chosen: number | null; onChoose: (i: number) => void; disabled?: boolean }) {
  const answered = chosen !== null
  return (
    <div className="grid gap-2.5" role="radiogroup">
      {quiz.options.map((opt, i) => {
        let state = ''
        if (answered) state = i === quiz.answer ? 'correct' : i === chosen ? 'wrong' : 'dim'
        return (
          <button key={i} type="button" role="radio" aria-checked={chosen === i} className="option"
            data-state={state} disabled={answered || disabled} onClick={() => onChoose(i)}>
            <span className="option-key">{KEYS[i]}</span>
            <span className="flex-1 text-[15px] leading-snug pt-0.5 [&_code]:inline-code">{inline(opt)}</span>
            {answered && i === quiz.answer && <CheckCircle2 className="text-good shrink-0" size={20} />}
            {answered && i === chosen && i !== quiz.answer && <XCircle className="text-bad shrink-0" size={20} />}
          </button>
        )
      })}
    </div>
  )
}

export function Explanation({ quiz, chosen, xp }: { quiz: QuizCheck; chosen: number; xp?: number }) {
  const right = chosen === quiz.answer
  return (
    <div className="mt-5 border-t border-ink pt-5 rise" aria-live="polite">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className={`kicker ${right ? 'text-good' : 'text-bad'}`}>{right ? 'Correct — nice yap' : `Not quite · answer ${KEYS[quiz.answer]}`}</p>
        {xp !== undefined && <span className="kicker text-ink-2">+{xp} XP</span>}
      </div>
      <Markdown source={quiz.explanation} className="prose-yap !text-[17px] !leading-relaxed" />
    </div>
  )
}

export function QuizPrompt({ quiz, size = 'lg' }: { quiz: QuizCheck; size?: 'lg' | 'md' }) {
  return (
    <div className="grid gap-4 mb-5">
      <h2 className={`${size === 'lg' ? 'text-[26px] sm:text-[32px]' : 'text-[21px] sm:text-[24px]'} font-[family-name:var(--font-display)] leading-[1.12] tracking-[-0.02em] font-medium [&_code]:inline-code`}>
        {inline(quiz.prompt)}
      </h2>
      {quiz.code && <CodeBlock code={quiz.code.source} lang={quiz.code.lang} />}
    </div>
  )
}
