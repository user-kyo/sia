import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useGlobalRealtimeSubscription = () => {
  const qc = useQueryClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Global realtime change received:', payload.table, payload.eventType)
          qc.invalidateQueries()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [qc])
}
