import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { QRCode } from '@/types'

interface QRCodeWithEmployee extends QRCode {
  employee_name?: string
}

interface QRCodeState {
  qrCodes: QRCodeWithEmployee[]
  loading: boolean
  initialized: boolean

  fetchQRCodes: (venueId: string) => Promise<void>
  createQRCode: (data: {
    venue_id: string
    label?: string
    employee_id?: string
  }) => Promise<{ error: string | null }>
  toggleActive: (id: string, isActive: boolean) => Promise<{ error: string | null }>
  deleteQRCode: (id: string) => Promise<{ error: string | null }>
  reset: () => void
}

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export const useQRCodeStore = create<QRCodeState>((set) => ({
  qrCodes: [],
  loading: false,
  initialized: false,

  fetchQRCodes: async (venueId) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*, employees(name)')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch QR codes:', error.message)
        set({ loading: false, initialized: true })
        return
      }

      const qrCodes: QRCodeWithEmployee[] = (data ?? []).map((row: Record<string, unknown>) => {
        const employees = row.employees as { name: string } | null
        return {
          id: row.id as string,
          venue_id: row.venue_id as string,
          employee_id: row.employee_id as string | null,
          label: row.label as string | null,
          short_code: row.short_code as string,
          is_active: row.is_active as boolean,
          scan_count: row.scan_count as number,
          created_at: row.created_at as string,
          employee_name: employees?.name ?? undefined,
        }
      })

      set({ qrCodes, loading: false, initialized: true })
    } catch {
      set({ loading: false, initialized: true })
    }
  },

  createQRCode: async ({ venue_id, label, employee_id }) => {
    try {
      // Generate short code with collision retry
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
        .select('*, employees(name)')
        .single()

      if (error) return { error: error.message }

      const employees = (data as Record<string, unknown>).employees as { name: string } | null
      const qrCode: QRCodeWithEmployee = {
        id: data.id,
        venue_id: data.venue_id,
        employee_id: data.employee_id,
        label: data.label,
        short_code: data.short_code,
        is_active: data.is_active,
        scan_count: data.scan_count,
        created_at: data.created_at,
        employee_name: employees?.name ?? undefined,
      }

      set((s) => ({ qrCodes: [qrCode, ...s.qrCodes] }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        qrCodes: s.qrCodes.map((qr) =>
          qr.id === id ? { ...qr, is_active: isActive } : qr
        ),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  deleteQRCode: async (id) => {
    try {
      const { error } = await supabase.from('qr_codes').delete().eq('id', id)

      if (error) return { error: error.message }

      set((s) => ({
        qrCodes: s.qrCodes.filter((qr) => qr.id !== id),
      }))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  reset: () => set({ qrCodes: [], loading: false, initialized: false }),
}))
