import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, dismissNotification, dismissAllNotifications } from '../features/notifications/api/notificationsApi'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

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
  const { user } = useAuth()

  const persist = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // --- 1. LOCAL INVENTORY ALERTS ---
  const { data: invData } = useQuery({
    queryKey: ['notification-inventory'],
    queryFn: () => fetchInventory({ limit: 100, offset: 0 }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  useEffect(() => {
    const invChannel = supabase
      .channel('notification-inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' },
        () => qc.invalidateQueries({ queryKey: ['notification-inventory'] })
      )
      .subscribe()
      
    const dbNotifChannel = supabase
      .channel('notification-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' },
        () => qc.invalidateQueries({ queryKey: ['db-notifications'] })
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(invChannel) 
      supabase.removeChannel(dbNotifChannel)
    }
  }, [qc])

  const localCandidates = useMemo(() => {
    const items = invData?.data ?? []
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
  }, [invData])

  useEffect(() => {
    if (!invData) return
    const activeIds = new Set(localCandidates.map(c => c.id))
    persist(prev => {
      let changed = false
      const next = { read: { ...prev.read }, dismissed: { ...prev.dismissed }, seen: { ...prev.seen } }
      for (const c of localCandidates) {
        if (!next.seen[c.id]) { next.seen[c.id] = Date.now(); changed = true }
      }
      for (const key of ['read', 'dismissed', 'seen']) {
        for (const id of Object.keys(next[key])) {
          if (!activeIds.has(id)) { delete next[key][id]; changed = true }
        }
      }
      return changed ? next : prev
    })
  }, [localCandidates, invData, persist])

  const localNotifications = useMemo(() => {
    return localCandidates
      .filter(c => !state.dismissed[c.id])
      .map(c => ({
        ...c,
        unread: !state.read[c.id],
        time: state.seen[c.id] ?? Date.now(),
      }))
  }, [localCandidates, state])

  // --- 2. BACKEND DB NOTIFICATIONS ---
  const { data: dbData } = useQuery({
    queryKey: ['db-notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-notifications'] })
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-notifications'] })
  })

  const dismissMutation = useMutation({
    mutationFn: dismissNotification,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-notifications'] })
  })

  const dismissAllMutation = useMutation({
    mutationFn: dismissAllNotifications,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['db-notifications'] })
  })

  const dbNotifications = useMemo(() => {
    if (!dbData) return []
    return dbData.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      unread: !n.is_read,
      time: new Date(n.created_at).getTime(),
      is_db: true
    }))
  }, [dbData])

  // --- MERGE & SORT ---
  const notifications = useMemo(() => {
    return [...localNotifications, ...dbNotifications].sort((a, b) => {
      if (a.type !== b.type && (a.type === 'out_of_stock' || b.type === 'out_of_stock')) {
        return a.type === 'out_of_stock' ? -1 : 1
      }
      return b.time - a.time
    })
  }, [localNotifications, dbNotifications])

  const unreadCount = notifications.filter(n => n.unread).length

  // --- UNIFIED ACTIONS ---
  const markRead = useCallback((id) => {
    const isDb = dbNotifications.find(n => n.id === id)
    if (isDb) {
      readMutation.mutate(id)
    } else {
      persist(prev => ({ ...prev, read: { ...prev.read, [id]: true } }))
    }
  }, [persist, dbNotifications, readMutation])

  const markAllRead = useCallback(() => {
    readAllMutation.mutate()
    persist(prev => {
      const read = { ...prev.read }
      for (const c of localCandidates) read[c.id] = true
      return { ...prev, read }
    })
  }, [persist, localCandidates, readAllMutation])

  const dismiss = useCallback((id) => {
    const isDb = dbNotifications.find(n => n.id === id)
    if (isDb) {
      dismissMutation.mutate(id)
    } else {
      persist(prev => ({ ...prev, dismissed: { ...prev.dismissed, [id]: true } }))
    }
  }, [persist, dbNotifications, dismissMutation])

  const clearAll = useCallback(() => {
    dismissAllMutation.mutate()
    persist(prev => {
      const dismissed = { ...prev.dismissed }
      for (const c of localCandidates) dismissed[c.id] = true
      return { ...prev, dismissed }
    })
  }, [persist, localCandidates, dismissAllMutation])

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
