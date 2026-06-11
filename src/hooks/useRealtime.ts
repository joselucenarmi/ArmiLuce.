import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type UserLike = { id: string } | null | undefined

export function useRealtime(user: UserLike) {
  useEffect(() => {
    if (!user?.id) return

    const userId = user.id

    const alertsChannel = supabase
      .channel(`realtime-alerts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => console.log('Alert INSERT:', payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => console.log('Alert UPDATE:', payload.new)
      )

    const notificationsChannel = supabase
      .channel(`realtime-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => console.log('Notification INSERT:', payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => console.log('Notification UPDATE:', payload.new)
      )

    alertsChannel.subscribe()
    notificationsChannel.subscribe()

    return () => {
      supabase.removeChannel(alertsChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [user?.id])
}