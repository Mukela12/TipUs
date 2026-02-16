import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Payout, PayoutDistribution } from '@/types'

interface DistributionWithEmployee extends PayoutDistribution {
  employee_name?: string
}

interface PayoutWithDistributions extends Payout {
  distributions: DistributionWithEmployee[]
}

interface PayoutState {
  payouts: PayoutWithDistributions[]
  loading: boolean
  initialized: boolean

  fetchPayouts: (venueId: string) => Promise<void>
  createPayout: (
    venueId: string,
    periodStart: string,
    periodEnd: string
  ) => Promise<{ error: string | null }>
  completePayout: (payoutId: string) => Promise<{ error: string | null }>
  reset: () => void
}

export const usePayoutStore = create<PayoutState>((set) => ({
  payouts: [],
  loading: false,
  initialized: false,

  fetchPayouts: async (venueId) => {
    set({ loading: true })
    try {
      const { data: payouts, error: payoutError } = await supabase
        .from('payouts')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })

      if (payoutError) {
        console.error('Failed to fetch payouts:', payoutError.message)
        set({ loading: false, initialized: true })
        return
      }

      if (!payouts || payouts.length === 0) {
        set({ payouts: [], loading: false, initialized: true })
        return
      }

      // Fetch distributions for all payouts
      const payoutIds = payouts.map((p) => p.id)
      const { data: distributions, error: distError } = await supabase
        .from('payout_distributions')
        .select('*, employees(name)')
        .in('payout_id', payoutIds)

      if (distError) {
        console.error('Failed to fetch distributions:', distError.message)
      }

      const distMap = new Map<string, DistributionWithEmployee[]>()
      for (const row of distributions ?? []) {
        const employees = (row as Record<string, unknown>).employees as { name: string } | null
        const dist: DistributionWithEmployee = {
          id: row.id,
          payout_id: row.payout_id,
          employee_id: row.employee_id,
          amount: row.amount,
          days_active: row.days_active,
          total_period_days: row.total_period_days,
          is_prorated: row.is_prorated,
          created_at: row.created_at,
          employee_name: employees?.name ?? undefined,
        }
        const existing = distMap.get(row.payout_id) ?? []
        existing.push(dist)
        distMap.set(row.payout_id, existing)
      }

      const payoutsWithDists: PayoutWithDistributions[] = payouts.map((p) => ({
        ...p,
        distributions: distMap.get(p.id) ?? [],
      }))

      set({ payouts: payoutsWithDists, loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  createPayout: async (venueId, periodStart, periodEnd) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/process-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          venue_id: venueId,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.error || `Request failed (${res.status})` }

      // Add the new payout to the list
      if (data.payout) {
        set((s) => ({ payouts: [data.payout, ...s.payouts] }))
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  completePayout: async (payoutId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/complete-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ payout_id: payoutId }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.error || `Request failed (${res.status})` }

      // Update the payout in state
      set((s) => ({
        payouts: s.payouts.map((p) =>
          p.id === payoutId
            ? { ...p, status: 'completed' as const, processed_at: new Date().toISOString() }
            : p
        ),
      }))

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  reset: () => set({ payouts: [], loading: false, initialized: false }),
}))
