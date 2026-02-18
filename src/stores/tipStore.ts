import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { onSignOut } from '@/stores/authStore'
import type { Tip } from '@/types'

interface TipWithEmployee extends Tip {
  employee_name?: string
}

interface TipStats {
  totalTips: number
  avgTip: number
  tipsThisWeek: number
  tipCount: number
  totalScans: number
}

interface TipFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
}

interface TipState {
  tips: TipWithEmployee[]
  stats: TipStats
  loading: boolean
  initialized: boolean

  fetchTips: (venueId: string, filters?: TipFilters) => Promise<void>
  reset: () => void
}

const emptyStats: TipStats = {
  totalTips: 0,
  avgTip: 0,
  tipsThisWeek: 0,
  tipCount: 0,
  totalScans: 0,
}

function computeStats(tips: TipWithEmployee[], totalScans: number): TipStats {
  const succeeded = tips.filter((t) => t.status === 'succeeded')
  if (succeeded.length === 0) return { ...emptyStats, totalScans }

  const totalTips = succeeded.reduce((sum, t) => sum + t.amount, 0)
  const tipCount = succeeded.length
  const avgTip = Math.round(totalTips / tipCount)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const tipsThisWeek = succeeded
    .filter((t) => new Date(t.created_at) >= weekAgo)
    .reduce((sum, t) => sum + t.amount, 0)

  return { totalTips, avgTip, tipsThisWeek, tipCount, totalScans }
}

export const useTipStore = create<TipState>((set) => ({
  tips: [],
  stats: emptyStats,
  loading: false,
  initialized: false,

  fetchTips: async (venueId, filters) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('tips')
        .select('*, employees(name)')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
      }

      const [tipsResult, scansResult] = await Promise.all([
        query,
        supabase
          .from('qr_codes')
          .select('scan_count')
          .eq('venue_id', venueId),
      ])

      if (tipsResult.error) {
        console.error('Failed to fetch tips:', tipsResult.error.message)
        set({ loading: false, initialized: true })
        return
      }

      const tips: TipWithEmployee[] = (tipsResult.data ?? []).map((row: Record<string, unknown>) => {
        const employees = row.employees as { name: string } | null
        return {
          id: row.id as string,
          venue_id: row.venue_id as string,
          employee_id: row.employee_id as string | null,
          amount: row.amount as number,
          currency: row.currency as string,
          tipper_name: row.tipper_name as string | null,
          tipper_message: row.tipper_message as string | null,
          stripe_payment_intent_id: row.stripe_payment_intent_id as string | null,
          stripe_checkout_session_id: row.stripe_checkout_session_id as string | null,
          status: row.status as string,
          created_at: row.created_at as string,
          employee_name: employees?.name ?? undefined,
        }
      })

      const totalScans = (scansResult.data ?? []).reduce(
        (sum, row) => sum + ((row as { scan_count: number }).scan_count ?? 0),
        0
      )

      set({ tips, stats: computeStats(tips, totalScans), loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  reset: () => set({ tips: [], stats: emptyStats, loading: false, initialized: false }),
}))

onSignOut(() => useTipStore.getState().reset())
