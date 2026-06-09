import { supabase } from './supabase'

export interface TableSub {
  table: string
  filter?: string // e.g. 'user_id=eq.<uuid>'
}

// Subscribe to postgres changes on several tables; calls onChange on any event.
// Returns a cleanup function that removes the channel.
export function subscribeToTables(channelName: string, subs: TableSub[], onChange: () => void): () => void {
  const channel = supabase.channel(channelName)
  for (const s of subs) {
    channel.on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: s.table, ...(s.filter ? { filter: s.filter } : {}) },
      onChange,
    )
  }
  channel.subscribe()
  return () => { supabase.removeChannel(channel) }
}

export function debounce(fn: () => void, ms: number): () => void {
  let t: ReturnType<typeof setTimeout> | null = null
  return () => { if (t) clearTimeout(t); t = setTimeout(fn, ms) }
}
