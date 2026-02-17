import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Employee, Tip, PayoutDistribution, DistributionStatus } from '@/types'

interface TipWithEmployee extends Tip {
  employee_name?: string
}

interface TipStats {
  totalTips: number
  avgTip: number
  tipsThisWeek: number
  tipCount: number
}

interface TipFilters {
  status?: string
  dateFrom?: string
  dateTo?: string
}

interface PayoutWithPeriod extends PayoutDistribution {
  period_start?: string
  period_end?: string
  payout_status?: string
  processed_at?: string | null
}

interface EmployeeDashboardState {
  profile: Employee | null
  venueName: string
  tips: TipWithEmployee[]
  tipStats: TipStats
  payouts: PayoutWithPeriod[]
  loading: boolean
  initialized: boolean

  fetchProfile: (employeeId: string) => Promise<void>
  fetchVenueTips: (venueId: string, filters?: TipFilters) => Promise<void>
  fetchMyPayouts: (employeeId: string) => Promise<void>
  updateBankDetails: (
    employeeId: string,
    details: { bank_bsb: string; bank_account_number: string; bank_account_name: string }
  ) => Promise<{ error: string | null }>
  reset: () => void
}

const emptyStats: TipStats = {
  totalTips: 0,
  avgTip: 0,
  tipsThisWeek: 0,
  tipCount: 0,
}

function computeStats(tips: TipWithEmployee[]): TipStats {
  const succeeded = tips.filter((t) => t.status === 'succeeded')
  if (succeeded.length === 0) return emptyStats

  const totalTips = succeeded.reduce((sum, t) => sum + t.amount, 0)
  const tipCount = succeeded.length
  const avgTip = Math.round(totalTips / tipCount)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const tipsThisWeek = succeeded
    .filter((t) => new Date(t.created_at) >= weekAgo)
    .reduce((sum, t) => sum + t.amount, 0)

  return { totalTips, avgTip, tipsThisWeek, tipCount }
}

export const useEmployeeDashboardStore = create<EmployeeDashboardState>((set) => ({
  profile: null,
  venueName: '',
  tips: [],
  tipStats: emptyStats,
  payouts: [],
  loading: false,
  initialized: false,

  fetchProfile: async (employeeId) => {
    set({ loading: true })
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single()

      if (error || !employee) {
        console.error('Failed to fetch employee profile:', error?.message)
        set({ loading: false, initialized: true })
        return
      }

      // Fetch venue name
      let venueName = ''
      if (employee.venue_id) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', employee.venue_id)
          .single()
        venueName = venue?.name ?? ''
      }

      set({ profile: employee, venueName, loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  fetchVenueTips: async (venueId, filters) => {
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

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch venue tips:', error.message)
        return
      }

      const tips = (data ?? []).map((row: Record<string, unknown>) => {
        const employees = row.employees as { name: string } | null
        const { employees: _employees, ...tipFields } = row
        return {
          ...(tipFields as unknown as Tip),
          employee_name: employees?.name ?? undefined,
        }
      })
      set({ tips, tipStats: computeStats(tips) })
    } catch {
      // silent
    }
  },

  fetchMyPayouts: async (employeeId) => {
    try {
      const { data: distributions, error } = await supabase
        .from('payout_distributions')
        .select('*, payouts(period_start, period_end, status, processed_at)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch employee payouts:', error.message)
        return
      }

      const payouts: PayoutWithPeriod[] = (distributions ?? []).map(
        (row: Record<string, unknown>) => {
          const payout = row.payouts as {
            period_start: string
            period_end: string
            status: string
            processed_at: string | null
          } | null
          return {
            id: row.id as string,
            payout_id: row.payout_id as string,
            employee_id: row.employee_id as string,
            amount: row.amount as number,
            days_active: row.days_active as number,
            total_period_days: row.total_period_days as number,
            is_prorated: row.is_prorated as boolean,
            status: ((row.status as string) ?? 'pending') as DistributionStatus,
            stripe_transfer_id: (row.stripe_transfer_id as string | null) ?? null,
            error_message: (row.error_message as string | null) ?? null,
            created_at: row.created_at as string,
            period_start: payout?.period_start,
            period_end: payout?.period_end,
            payout_status: payout?.status,
            processed_at: payout?.processed_at,
          }
        }
      )

      set({ payouts })
    } catch {
      // silent
    }
  },

  updateBankDetails: async (employeeId, details) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          bank_bsb: details.bank_bsb,
          bank_account_number: details.bank_account_number,
          bank_account_name: details.bank_account_name,
        })
        .eq('id', employeeId)

      if (error) return { error: error.message }

      // Update local state
      set((s) => ({
        profile: s.profile
          ? {
              ...s.profile,
              bank_bsb: details.bank_bsb,
              bank_account_number: details.bank_account_number,
              bank_account_name: details.bank_account_name,
            }
          : null,
      }))

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  reset: () =>
    set({
      profile: null,
      venueName: '',
      tips: [],
      tipStats: emptyStats,
      payouts: [],
      loading: false,
      initialized: false,
    }),
}))
