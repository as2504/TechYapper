import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Award, Check, Shield, Swords } from 'lucide-react'
import { DIVISIONS, useLeague, useLeaderboard, type Period } from '../lib/community'
import { useAuth } from '../lib/auth'
import { useStats } from '../lib/progress'
import { badges } from '../lib/badges'
import { supabase } from '../lib/supabase'

const PERIODS: { id: Period; label: string }[] = [{ id: 'week', label: 'Global · week' }, { id: 'month', label: '30 days' }, { id: 'all', label: 'All time' }]
const DIV_COLOR = ['#A86A3D', '#8C93A0', '#C9A227', '#5FA8A0', '#7AA7E0']

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period | 'league'>('league')
  const { rows, error } = useLeaderboard(period === 'league' ? 'week' : period)
  const { user } = useAuth()
  const stats = useStats()
  const list = badges(stats)
  const me = rows?.find((r) => r.is_me)

  return (
    <div className="px-5 sm:px-10 lg:px-14 py-10 sm:py-16 max-w-[1080px]">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-[38px] sm:text-[54px] font-semibold">Rankings</h1>
          <p className="mt-3 text-muted max-w-lg">Verified XP only: answers are re-checked on the server and every question counts once.</p>
        </div>
        <Link to="/app/duel" className="btn btn-accent"><Swords size={16} /> Duel a friend</Link>
      </header>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <section>
          <div className="flex flex-wrap gap-1 p-1 rounded-full bg-paper-2 w-fit" role="tablist">
            <button role="tab" aria-selected={period === 'league'} onClick={() => setPeriod('league')}
              className={`px-4 h-9 rounded-full text-sm font-medium ${period === 'league' ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>My league</button>
            {PERIODS.map((p) => (
              <button key={p.id} role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)}
                className={`px-4 h-9 rounded-full text-sm font-medium ${period === p.id ? 'bg-card text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{p.label}</button>
            ))}
          </div>

          {!user && period !== 'league' && (
            <p className="mt-5 bg-paper-2 px-4 py-3 text-sm">You're browsing as a guest, so your XP stays on this device and isn't ranked. <Link to="/signup" className="font-semibold underline underline-offset-4">Create a free account</Link> to join the leaderboard.</p>
          )}
          {error && <p className="mt-5 text-bad text-sm">Couldn't load rankings: {error}</p>}

          {period === 'league' ? <League /> : <>
          <ol className="mt-5 border-t border-line-2">
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
          </>}
          {user && <NameSettings />}
        </section>

        <aside>
          <div className="border border-ink p-6">
            <p className="kicker text-muted">Your position</p>
            <p className="display text-[56px] font-semibold mt-2">{me ? `#${me.rank}` : '—'}</p>
            <p className="text-muted text-sm">{me ? `${me.xp} verified XP ${PERIODS.find((p) => p.id === period)!.label.toLowerCase()}` : user ? 'Earn XP in battles, challenges and topics to get ranked.' : 'Guests are not ranked.'}</p>
          </div>

          <h2 className="section-title mt-10 flex items-center gap-2"><Award size={14} /> Badges · {list.filter((b) => b.earned).length}/{list.length}</h2>
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

function League() {
  const { user } = useAuth()
  const { rows, error } = useLeague()
  if (!user) return (
    <div className="mt-6 rounded-[6px] bg-spot text-on-spot p-7">
      <p className="kicker text-accent">Weekly leagues</p>
      <p className="font-[family-name:var(--font-display)] text-[26px] font-semibold mt-2 leading-tight">Compete with 20 people at your level.</p>
      <p className="mt-2 text-on-spot/70 text-sm">Top 5 move up a division every Monday. Bronze to Diamond.</p>
      <Link to="/signup?next=/app/leaderboard" className="btn btn-accent mt-6">Join a league, free</Link>
    </div>
  )
  if (error) return <p className="mt-6 text-bad text-sm">Couldn't load your league: {error}</p>
  if (!rows) return <p className="mt-6 kicker text-muted">Finding your league<span className="caret">_</span></p>
  const div = rows[0]?.division ?? 0
  const size = rows[0]?.group_size ?? 1
  const end = rows[0] ? new Date(rows[0].week_end + 'T23:59:59Z') : new Date()
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 864e5))
  const canDemote = size >= 10 && div > 0
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4 p-5 rounded-[6px] bg-spot text-on-spot">
        <Shield size={44} strokeWidth={1.5} style={{ color: DIV_COLOR[div], fill: DIV_COLOR[div] + '33' }} />
        <div className="flex-1">
          <p className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-none">{DIVISIONS[div]} league</p>
          <p className="mt-1.5 text-sm text-on-spot/70">{size} {size === 1 ? 'yapper' : 'yappers'} · ends in {daysLeft} day{daysLeft === 1 ? '' : 's'}</p>
        </div>
        {div < 4 && <p className="hidden sm:block text-xs text-on-spot/60 text-right">Top 5 move up<br />to {DIVISIONS[div + 1]}</p>}
      </div>
      <ol className="mt-4 grid gap-1.5">
        {rows.map((r) => {
          const up = r.rank <= 5 && div < 4 && r.xp > 0
          const down = canDemote && r.rank > size - 5
          return (
            <li key={r.rank + r.name} className={`flex items-center gap-3 px-4 py-3 rounded-[4px] border ${r.is_me ? 'border-accent bg-accent-wash' : 'border-line bg-card'}`}>
              <span className={`w-7 font-[family-name:var(--font-display)] text-[19px] font-semibold ${up ? 'text-good' : down ? 'text-bad' : 'text-muted'}`}>{r.rank}</span>
              <span className="flex-1 min-w-0 truncate font-semibold">{r.name}{r.is_me && <span className="kicker text-accent-ink ml-2">You</span>}</span>
              {up && <ArrowUp size={14} className="text-good" aria-label="Promotion zone" />}
              {down && <ArrowDown size={14} className="text-bad" aria-label="Demotion zone" />}
              <span className="font-mono text-sm w-20 text-right">{r.xp} XP</span>
            </li>
          )
        })}
      </ol>
      {size < 5 && <p className="mt-4 text-sm text-muted">Your league fills up as more people join this week. Invite friends with a duel to fill it faster.</p>}
    </div>
  )
}
