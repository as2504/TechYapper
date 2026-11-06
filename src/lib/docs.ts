import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export interface Doc<T> { id: string; title: string; data: T; updated_at: string }

/** Saved Project Yapping scripts and Resume Yapping bullet sets (table user_docs, RLS + Pro-gated writes). */
export function useDocs<T>(kind: 'project' | 'resume') {
  const { user } = useAuth()
  const [docs, setDocs] = useState<Doc<T>[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !supabase) { setDocs([]); return }
    supabase.from('user_docs').select('id,title,data,updated_at').eq('kind', kind).order('updated_at', { ascending: false })
      .then(({ data, error }) => { if (error) setError(error.message); setDocs((data as Doc<T>[]) ?? []) })
  }, [user, kind])

  const save = useCallback(async (title: string, data: T, id?: string): Promise<string | null> => {
    if (!user || !supabase) { setError('Sign in to save.'); return null }
    const row = { kind, title: title.slice(0, 120) || 'Untitled', data, updated_at: new Date().toISOString() }
    const q = id ? supabase.from('user_docs').update(row).eq('id', id).select('id,title,data,updated_at').single()
      : supabase.from('user_docs').insert(row).select('id,title,data,updated_at').single()
    const { data: saved, error } = await q
    if (error) { setError(error.message.includes('row-level security') ? 'Saving needs an active Pro plan or preview.' : error.message); return null }
    setError(null)
    setDocs((d) => [saved as Doc<T>, ...d.filter((x) => x.id !== (saved as Doc<T>).id)])
    return (saved as Doc<T>).id
  }, [user, kind])

  const remove = useCallback(async (id: string) => {
    if (!supabase) return
    const { error } = await supabase.from('user_docs').delete().eq('id', id)
    if (error) setError(error.message); else setDocs((d) => d.filter((x) => x.id !== id))
  }, [])

  return { docs, save, remove, error }
}

/** Local draft so a half-filled form survives a refresh. */
export function useDraft<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => { try { const s = localStorage.getItem(key); return s ? { ...initial, ...JSON.parse(s) } : initial } catch { return initial } })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ } }, [key, v])
  return [v, setV] as const
}
