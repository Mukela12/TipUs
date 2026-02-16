import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types'

interface EmployeeState {
  employees: Employee[]
  loading: boolean
  initialized: boolean

  fetchEmployees: (venueId: string) => Promise<void>
  addEmployee: (data: {
    name: string
    email: string
    role?: string
    venue_id: string
  }) => Promise<{ error: string | null }>
  updateEmployee: (
    id: string,
    data: Partial<Pick<Employee, 'name' | 'email' | 'role'>>
  ) => Promise<{ error: string | null }>
  toggleActive: (id: string, isActive: boolean) => Promise<{ error: string | null }>
  deleteEmployee: (id: string) => Promise<{ error: string | null }>
  reset: () => void
}

export const useEmployeeStore = create<EmployeeState>((set, _get) => ({
  employees: [],
  loading: false,
  initialized: false,

  fetchEmployees: async (venueId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch employees:', error.message)
        set({ loading: false, initialized: true })
        return
      }

      set({ employees: data ?? [], loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  addEmployee: async ({ name, email, role, venue_id }) => {
    try {
      const token = crypto.randomUUID()

      const { data, error } = await supabase
        .from('employees')
        .insert({
          venue_id,
          name,
          email,
          role: role || null,
          status: 'invited',
          is_active: false,
          invitation_token: token,
          invitation_sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) return { error: error.message }

      set((s) => ({ employees: [data, ...s.employees] }))

      // Send invite email in the background (don't block on it)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', venue_id)
          .single()

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin

        fetch(`${supabaseUrl}/functions/v1/send-invite-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({
            employee_name: name,
            employee_email: email,
            venue_name: venue?.name || 'your venue',
            role: role || null,
            setup_url: `${appUrl}/invite/${token}`,
          }),
        }).catch((err) => console.error('Failed to send invite email:', err))
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  updateEmployee: async (id, data) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        employees: s.employees.map((e) =>
          e.id === id ? { ...e, ...data } : e
        ),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const now = new Date().toISOString()
      const updates: Record<string, unknown> = {
        is_active: isActive,
        status: isActive ? 'active' : 'inactive',
        updated_at: now,
      }
      if (isActive) {
        updates.activated_at = now
      } else {
        updates.deactivated_at = now
      }

      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        employees: s.employees.map((e) =>
          e.id === id
            ? {
                ...e,
                is_active: isActive,
                status: isActive ? ('active' as const) : ('inactive' as const),
                activated_at: isActive ? now : e.activated_at,
                deactivated_at: isActive ? e.deactivated_at : now,
              }
            : e
        ),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  deleteEmployee: async (id) => {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        employees: s.employees.filter((e) => e.id !== id),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  reset: () => set({ employees: [], loading: false, initialized: false }),
}))
