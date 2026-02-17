import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { generateShortCode } from '@/lib/utils'
import type { Venue, Payout, QRCode, PayoutDistribution } from '@/types'

interface VenueWithStats extends Venue {
  employee_count: number
  tip_total: number
}

interface DistributionWithEmployee extends PayoutDistribution {
  employee_name?: string
}

interface PayoutWithVenue extends Payout {
  venue_name: string
  distributions: DistributionWithEmployee[]
}

interface QRCodeWithVenue extends QRCode {
  venue_name: string
  employee_name?: string
}

interface AdminStats {
  totalVenues: number
  totalEmployees: number
  totalTips: number
  platformRevenue: number
  tipsThisWeek: number
}

interface AdminState {
  venues: VenueWithStats[]
  allPayouts: PayoutWithVenue[]
  allQRCodes: QRCodeWithVenue[]
  stats: AdminStats
  loading: boolean

  fetchVenues: () => Promise<void>
  fetchAllPayouts: (venueId?: string) => Promise<void>
  fetchQRCodesForVenue: (venueId: string) => Promise<void>
  createQRCodeForVenue: (data: {
    venue_id: string
    label?: string
    employee_id?: string
  }) => Promise<{ error: string | null }>
  deleteQRCodeAdmin: (id: string) => Promise<{ error: string | null }>
  toggleQRCodeActive: (id: string, isActive: boolean) => Promise<{ error: string | null }>
  triggerPayout: (
    venueId: string,
    periodStart: string,
    periodEnd: string
  ) => Promise<{ error: string | null }>
  executePayout: (payoutId: string) => Promise<{ error: string | null }>
  fetchStats: () => Promise<void>
  reset: () => void
}

const defaultStats: AdminStats = {
  totalVenues: 0,
  totalEmployees: 0,
  totalTips: 0,
  platformRevenue: 0,
  tipsThisWeek: 0,
}

export const useAdminStore = create<AdminState>((set, get) => ({
  venues: [],
  allPayouts: [],
  allQRCodes: [],
  stats: defaultStats,
  loading: false,

  fetchVenues: async () => {
    set({ loading: true })
    try {
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch venues:', error.message)
        set({ loading: false })
        return
      }

      // Fetch employee counts per venue
      const venueIds = (venues ?? []).map((v) => v.id)

      const { data: employees } = await supabase
        .from('employees')
        .select('venue_id')
        .in('venue_id', venueIds.length > 0 ? venueIds : ['__none__'])

      const { data: tips } = await supabase
        .from('tips')
        .select('venue_id, amount')
        .in('venue_id', venueIds.length > 0 ? venueIds : ['__none__'])
        .eq('status', 'succeeded')

      const empCountMap = new Map<string, number>()
      for (const emp of employees ?? []) {
        empCountMap.set(emp.venue_id, (empCountMap.get(emp.venue_id) ?? 0) + 1)
      }

      const tipTotalMap = new Map<string, number>()
      for (const tip of tips ?? []) {
        tipTotalMap.set(tip.venue_id, (tipTotalMap.get(tip.venue_id) ?? 0) + tip.amount)
      }

      const venuesWithStats: VenueWithStats[] = (venues ?? []).map((v) => ({
        ...v,
        employee_count: empCountMap.get(v.id) ?? 0,
        tip_total: tipTotalMap.get(v.id) ?? 0,
      }))

      set({ venues: venuesWithStats, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchAllPayouts: async (venueId?: string) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('payouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (venueId) {
        query = query.eq('venue_id', venueId)
      }

      const { data: payouts, error } = await query

      if (error) {
        console.error('Failed to fetch payouts:', error.message)
        set({ loading: false })
        return
      }

      if (!payouts || payouts.length === 0) {
        set({ allPayouts: [], loading: false })
        return
      }

      // Get venue names
      const venueIds = [...new Set(payouts.map((p) => p.venue_id))]
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds)

      const venueNameMap = new Map<string, string>()
      for (const v of venues ?? []) {
        venueNameMap.set(v.id, v.name)
      }

      // Get distributions
      const payoutIds = payouts.map((p) => p.id)
      const { data: distributions } = await supabase
        .from('payout_distributions')
        .select('*, employees(name)')
        .in('payout_id', payoutIds)

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
          status: row.status ?? 'pending',
          stripe_transfer_id: row.stripe_transfer_id ?? null,
          error_message: row.error_message ?? null,
          created_at: row.created_at,
          employee_name: employees?.name ?? undefined,
        }
        const existing = distMap.get(row.payout_id) ?? []
        existing.push(dist)
        distMap.set(row.payout_id, existing)
      }

      const payoutsWithVenue: PayoutWithVenue[] = payouts.map((p) => ({
        ...p,
        venue_name: venueNameMap.get(p.venue_id) ?? 'Unknown Venue',
        distributions: distMap.get(p.id) ?? [],
      }))

      set({ allPayouts: payoutsWithVenue, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchQRCodesForVenue: async (venueId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*, employees(name), venues(name)')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch QR codes:', error.message)
        set({ loading: false })
        return
      }

      const qrCodes: QRCodeWithVenue[] = (data ?? []).map((row: Record<string, unknown>) => {
        const employees = row.employees as { name: string } | null
        const venues = row.venues as { name: string } | null
        return {
          id: row.id as string,
          venue_id: row.venue_id as string,
          employee_id: row.employee_id as string | null,
          label: row.label as string | null,
          short_code: row.short_code as string,
          is_active: row.is_active as boolean,
          scan_count: row.scan_count as number,
          created_at: row.created_at as string,
          venue_name: venues?.name ?? 'Unknown Venue',
          employee_name: employees?.name ?? undefined,
        }
      })

      set({ allQRCodes: qrCodes, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  createQRCodeForVenue: async ({ venue_id, label, employee_id }) => {
    try {
      let short_code = generateShortCode()
      let retries = 3
      while (retries > 0) {
        const { data: existing } = await supabase
          .from('qr_codes')
          .select('id')
          .eq('short_code', short_code)
          .maybeSingle()

        if (!existing) break
        short_code = generateShortCode()
        retries--
      }

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          venue_id,
          short_code,
          label: label || null,
          employee_id: employee_id || null,
          is_active: true,
          scan_count: 0,
        })
        .select('*, employees(name), venues(name)')
        .single()

      if (error) return { error: error.message }

      const employees = (data as Record<string, unknown>).employees as { name: string } | null
      const venues = (data as Record<string, unknown>).venues as { name: string } | null
      const qrCode: QRCodeWithVenue = {
        id: data.id,
        venue_id: data.venue_id,
        employee_id: data.employee_id,
        label: data.label,
        short_code: data.short_code,
        is_active: data.is_active,
        scan_count: data.scan_count,
        created_at: data.created_at,
        venue_name: venues?.name ?? 'Unknown Venue',
        employee_name: employees?.name ?? undefined,
      }

      set((s) => ({ allQRCodes: [qrCode, ...s.allQRCodes] }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  deleteQRCodeAdmin: async (id: string) => {
    try {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id)
      if (error) return { error: error.message }

      set((s) => ({
        allQRCodes: s.allQRCodes.filter((qr) => qr.id !== id),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  toggleQRCodeActive: async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        allQRCodes: s.allQRCodes.map((qr) =>
          qr.id === id ? { ...qr, is_active: isActive } : qr
        ),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  triggerPayout: async (venueId, periodStart, periodEnd) => {
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

      // Re-fetch payouts to get the new one
      await get().fetchAllPayouts()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  executePayout: async (payoutId: string) => {
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
      const isPartial = res.status === 207
      if (!res.ok && !isPartial) return { error: data.error || `Request failed (${res.status})` }

      // Re-fetch payouts to get updated statuses
      await get().fetchAllPayouts()

      if (isPartial) return { error: data.error || 'Some transfers failed' }
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  fetchStats: async () => {
    try {
      const [venuesRes, employeesRes, tipsRes, payoutsRes] = await Promise.all([
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('tips').select('amount').eq('status', 'succeeded'),
        supabase.from('payouts').select('platform_fee').eq('status', 'completed'),
      ])

      const totalTips = (tipsRes.data ?? []).reduce((sum, t) => sum + t.amount, 0)
      const platformRevenue = (payoutsRes.data ?? []).reduce((sum, p) => sum + p.platform_fee, 0)

      // Tips this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekTips } = await supabase
        .from('tips')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('created_at', weekAgo.toISOString())

      const tipsThisWeek = (weekTips ?? []).reduce((sum, t) => sum + t.amount, 0)

      set({
        stats: {
          totalVenues: venuesRes.count ?? 0,
          totalEmployees: employeesRes.count ?? 0,
          totalTips,
          platformRevenue,
          tipsThisWeek,
        },
      })
    } catch {
      // stats fetch is non-critical
    }
  },

  reset: () => set({
    venues: [],
    allPayouts: [],
    allQRCodes: [],
    stats: defaultStats,
    loading: false,
  }),
}))
