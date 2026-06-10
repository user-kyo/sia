import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { supabase } from '../lib/supabase'

/**
 * Notifications are derived from live inventory data:
 *   - `out-<productId>`  → product quantity is 0
 *   - `low-<productId>`  → quantity at or below its reorder point
 *
 * Per-notification UI state (read / dismissed / first-seen time) lives in
 * localStorage so it survives refreshes. When a product is restocked above
 * its reorder point, its entries are cleaned up so a future stock drop
 * produces a fresh notification.
 */
const STORAGE_KEY = 'sia_notifications_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        read: parsed.read ?? {},
        dismissed: parsed.dismissed ?? {},
        seen: parsed.seen ?? {},
      }
    }
  } catch {}
  return { read: {}, dismissed: {}, seen: {} }
}

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [state, setState] = useState(loadState)
  const qc = useQueryClient()

  const persist = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // Inventory snapshot for stock alerts. Realtime invalidation below keeps
  // it fresh; the interval is a fallback when realtime is unavailable.
  const { data } = useQuery({
    queryKey: ['notification-inventory'],
    queryFn: () => fetchInventory({ limit: 100, offset: 0 }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  useEffect(() => {
    const channel = supabase
      .channel('notification-inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => qc.invalidateQueries({ queryKey: ['notification-inventory'] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  // Active alert candidates derived from current stock levels
  const candidates = useMemo(() => {
    const items = data?.data ?? []
    const list = []
    for (const p of items) {
      const qty = Number(p.quantity) || 0
      const reorder = Number(p.reorder_point) || 0
      if (qty === 0) {
        list.push({ id: `out-${p.id}`, type: 'out_of_stock', product: p })
      } else if (qty <= reorder) {
        list.push({ id: `low-${p.id}`, type: 'low_stock', product: p })
      }
    }
    return list
  }, [data])

  // Stamp first-seen time for new alerts; drop state for resolved ones so
  // the same product can alert again after being restocked.
  useEffect(() => {
    if (!data) return
    const activeIds = new Set(candidates.map(c => c.id))
    persist(prev => {
      let changed = false
      const next = { read: { ...prev.read }, dismissed: { ...prev.dismissed }, seen: { ...prev.seen } }
      for (const c of candidates) {
        if (!next.seen[c.id]) { next.seen[c.id] = Date.now(); changed = true }
      }
      for (const key of ['read', 'dismissed', 'seen']) {
        for (const id of Object.keys(next[key])) {
          if (!activeIds.has(id)) { delete next[key][id]; changed = true }
        }
      }
      return changed ? next : prev
    })
  }, [candidates, data, persist])

  const notifications = useMemo(() => {
    return candidates
      .filter(c => !state.dismissed[c.id])
      .map(c => ({
        ...c,
        unread: !state.read[c.id],
        time: state.seen[c.id] ?? Date.now(),
      }))
      .sort((a, b) => {
        // Out-of-stock first, then newest first
        if (a.type !== b.type) return a.type === 'out_of_stock' ? -1 : 1
        return b.time - a.time
      })
  }, [candidates, state])

  const unreadCount = notifications.filter(n => n.unread).length

  const markRead = useCallback((id) => {
    persist(prev => ({ ...prev, read: { ...prev.read, [id]: true } }))
  }, [persist])

  const markAllRead = useCallback(() => {
    persist(prev => {
      const read = { ...prev.read }
      for (const c of candidates) read[c.id] = true
      return { ...prev, read }
    })
  }, [persist, candidates])

  const dismiss = useCallback((id) => {
    persist(prev => ({ ...prev, dismissed: { ...prev.dismissed, [id]: true } }))
  }, [persist])

  const clearAll = useCallback(() => {
    persist(prev => {
      const dismissed = { ...prev.dismissed }
      for (const c of candidates) dismissed[c.id] = true
      return { ...prev, dismissed }
    })
  }, [persist, candidates])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      markRead, markAllRead, dismiss, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
