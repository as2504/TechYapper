import { useEffect, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
const KEY = 'ty:theme'

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const root = document.documentElement
  if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#131210' : '#F3EFE6')
  return dark
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => { try { return (localStorage.getItem(KEY) as ThemePref) || 'system' } catch { return 'system' } })
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  useEffect(() => {
    setDark(apply(pref))
    try { localStorage.setItem(KEY, pref) } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('ty:theme', { detail: pref }))
    if (pref !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setDark(apply('system'))
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [pref])
  // Keep every toggle on the page in sync.
  useEffect(() => {
    const on = (e: Event) => setPref((e as CustomEvent<ThemePref>).detail)
    window.addEventListener('ty:theme', on)
    return () => window.removeEventListener('ty:theme', on)
  }, [])
  /** Toggle flips relative to what's showing now and pins that choice. */
  const toggle = () => setPref(dark ? 'light' : 'dark')
  return { pref, dark, setPref, toggle }
}
