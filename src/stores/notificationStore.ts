import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { onSignOut } from '@/stores/authStore'
import type { Notification, NotificationType } from '@/types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  filter: NotificationType | 'all'
  dropdownOpen: boolean

  fetchNotifications: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  setFilter: (filter: NotificationType | 'all') => void
  setDropdownOpen: (open: boolean) => void
  subscribeToRealtime: () => () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  filter: 'all',
  dropdownOpen: false,

  fetchNotifications: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    set({ notifications: (data as Notification[]) ?? [], loading: false })
  },

  fetchUnreadCount: async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
    set({ unreadCount: count ?? 0 })
  },

  markAsRead: async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllAsRead: async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }))
  },

  setFilter: (filter) => set({ filter }),
  setDropdownOpen: (open) => {
    set({ dropdownOpen: open })
    if (open && get().notifications.length === 0) {
      get().fetchNotifications()
    }
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notification = payload.new as Notification
          set((s) => ({
            notifications: [notification, ...s.notifications],
            unreadCount: s.unreadCount + 1,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))

onSignOut(() => {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    loading: false,
    filter: 'all',
    dropdownOpen: false,
  })
})
