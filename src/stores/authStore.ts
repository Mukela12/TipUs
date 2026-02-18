import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  initialized: boolean

  initialize: () => Promise<void>
  refreshUser: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const authUser = mapSessionToUser(session)
        set({ user: authUser, session, loading: false, initialized: true })
      } else {
        set({ user: null, session: null, loading: false, initialized: true })
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, session: null })
          return
        }
        if (session?.user) {
          const authUser = mapSessionToUser(session)
          set({ user: authUser, session })
        }
      })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  refreshUser: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const authUser = mapSessionToUser(session)
      set({ user: authUser, session })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'venue_owner' },
      },
    })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    set({ user: null, session: null })
    await supabase.auth.signOut()
  },

  setUser: (user) => set({ user }),
}))

function mapSessionToUser(session: Session): AuthUser {
  const { user } = session
  return {
    id: user.id,
    email: user.email ?? '',
    role: user.user_metadata?.role ?? 'venue_owner',
    venue_id: user.user_metadata?.venue_id,
    employee_id: user.user_metadata?.employee_id,
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
  }
}
