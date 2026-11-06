import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Check } from 'lucide-react'
import { useLeaderboard, type Period } from '../lib/community'
import { useAuth } from '../lib/auth'
import { useStats } from '../lib/progress'
import { badges } from '../lib/badges'
import { supabase } from '../lib/supabase'

const PERIODS: { id: Period; label: string }[] = [{ id: 'week', label: 'This week' }, { id: 'month', label: '30 days' }, { id: 'all', label: 'All time' }]

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>('week')
  const { rows, error } = useLeaderboard(period)
  const { user } = useAuth()
  const stats = useStats()
  const list = badges(stats)
  const me = rows?.find((r) => r.is_me)

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1080px]">
      <header className="border-b border-ink pb-6">
        <p className="kicker text-accent-ink">Leaderboard</p>
        <h1 className="display text-[44px] sm:text-[60px] font-semibold mt-2">Who's yapping most.</h1>
        <p className="mt-3 text-ink-2 max-w-2xl">Rankings use verified XP. Answers are re-checked against the answer key on the server, every question counts once, and reading XP is capped per day. Right answers matter more than clicks.</p>
      </header>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <section>
          <div className="flex border border-ink w-fit" role="tablist">
            {PERIODS.map((p) => (
              <button key={p.id} role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)}
                className={`px-4 py-2 text-sm font-medium ${period === p.id ? 'bg-ink text-paper' : 'hover:bg-paper-2'}`}>{p.label}</button>
            ))}
          </div>

          {!user && (
            <p className="mt-5 bg-paper-2 px-4 py-3 text-sm">You're browsing as a guest, so your XP stays on this device and isn't ranked. <Link to="/signup" className="font-semibold underline underline-offset-4">Create a free account</Link> to join the leaderboard.</p>
          )}
          {error && <p className="mt-5 text-bad text-sm">Couldn't load rankings: {error}</p>}

          <ol className="mt-5 border-t border-ink">
            {rows === null && <li className="py-6 text-muted kicker">Counting XP<span className="caret">_</span></li>}
            {rows?.length === 0 && <li className="py-6 text-muted">No one is ranked for this period yet. Answer today's battle and you're first.</li>}
            {rows?.map((r) => (
              <li key={`${r.rank}-${r.name}`} className={`grid grid-cols-[44px_1fr_auto] items-baseline gap-3 py-3.5 border-b border-line ${r.is_me ? 'bg-accent-wash -mx-3 px-3' : ''}`}>
                <span className={`font-mono text-sm ${r.rank <= 3 ? 'text-accent font-semibold' : 'text-muted'}`}>#{r.rank}</span>
                <span className="font-semibold truncate">{r.name}{r.is_me && <span className="kicker text-accent-ink ml-2">You</span>}<span className="block text-xs text-muted font-normal font-mono">{r.active_days} active day{r.active_days === 1 ? '' : 's'}</span></span>
                <span className="font-[family-name:var(--font-display)] text-[22px] font-semibold">{r.xp.toLocaleString('en-IN')}<span className="text-sm text-muted font-normal"> XP</span></span>
              </li>
            ))}
          </ol>
          {user && <NameSettings />}
        </section>

        <aside>
          <div className="border border-ink p-6">
            <p className="kicker text-muted">Your position</p>
            <p className="display text-[56px] font-semibold mt-2">{me ? `#${me.rank}` : '—'}</p>
            <p className="text-muted text-sm">{me ? `${me.xp} verified XP ${PERIODS.find((p) => p.id === period)!.label.toLowerCase()}` : user ? 'Earn XP in battles, challenges and topics to get ranked.' : 'Guests are not ranked.'}</p>
          </div>

          <h2 className="kicker text-muted border-b border-ink pb-2 mt-10 flex items-center gap-2"><Award size={14} /> Badges · {list.filter((b) => b.earned).length}/{list.length}</h2>
          <ul className="divide-y divide-line">
            {list.map((b) => (
              <li key={b.id} className={`flex items-center gap-4 py-3 ${b.earned ? '' : 'opacity-60'}`}>
                <span className={`w-9 h-9 grid place-items-center border shrink-0 ${b.earned ? 'bg-ink text-paper border-ink' : 'border-line-2 text-faint'}`}>{b.earned ? <Check size={16} /> : <Award size={16} />}</span>
                <span className="flex-1"><span className="block font-semibold">{b.title}</span><span className="block text-sm text-muted">{b.body}</span></span>
                <span className="font-mono text-xs text-muted">{b.progress}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

function NameSettings() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [show, setShow] = useState(true)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!supabase || !user) return
    supabase.from('profiles').select('display_name, show_on_leaderboard').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.display_name ?? ''); setShow(data.show_on_leaderboard) }
    })
  }, [user])
  const save = async () => {
    if (!supabase || !user) return
    const { error } = await supabase.from('profiles').update({ display_name: name.trim().slice(0, 40) || null, show_on_leaderboard: show }).eq('id', user.id)
    setMsg(error ? error.message : 'Saved')
    setTimeout(() => setMsg(''), 2000)
  }
  return (
    <details className="mt-8 border border-line p-4">
      <summary className="cursor-pointer text-sm font-semibold">How you appear on the leaderboard</summary>
      <div className="mt-4 grid gap-3 max-w-md">
        <label className="text-sm">Display name<input className="input mt-1" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show me on the leaderboard</label>
        <div className="flex items-center gap-3"><button onClick={save} className="btn btn-primary">Save</button><span className="text-sm text-muted">{msg}</span></div>
        <p className="text-xs text-muted">If your display name matches your email address, we show an anonymous handle instead.</p>
      </div>
    </details>
  )
}
