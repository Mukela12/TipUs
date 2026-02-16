import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import type { Venue } from '@/types'

interface VenueState {
  venue: Venue | null
  loading: boolean
  initialized: boolean

  createVenue: (
    name: string,
    address?: string,
    description?: string
  ) => Promise<{ error: string | null }>

  connectStripe: () => Promise<{ error: string | null }>
  updateVenue: (data: { name?: string; address?: string | null; description?: string | null }) => Promise<{ error: string | null }>
  updatePayoutSchedule: (venueId: string, schedule: {
    auto_payout_enabled: boolean
    payout_frequency: 'weekly' | 'fortnightly' | 'monthly'
    payout_day: number
  }) => Promise<{ error: string | null }>
  fetchUserVenue: () => Promise<void>
  reset: () => void
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6)
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venue: null,
  loading: false,
  initialized: false,

  createVenue: async (name, address, description) => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ loading: false })
        return { error: 'Not authenticated' }
      }

      // Generate slug with conflict handling
      let slug = generateSlug(name)
      const { data: existing } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        slug = `${slug}-${randomSuffix()}`
      }

      const { data: venue, error } = await supabase
        .from('venues')
        .insert({
          owner_id: user.id,
          name,
          slug,
          address: address || null,
          description: description || null,
        })
        .select()
        .single()

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // Update auth user_metadata with venue_id
      await supabase.auth.updateUser({
        data: { venue_id: venue.id },
      })

      set({ venue, loading: false, initialized: true })
      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  connectStripe: async () => {
    const venue = get().venue
    if (!venue) return { error: 'No venue found' }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { error: 'Not authenticated' }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(`${supabaseUrl}/functions/v1/create-stripe-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ venue_id: venue.id }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.error || `Request failed (${res.status})` }

      // Redirect to Stripe onboarding
      if (data?.url) {
        window.location.href = data.url
      }

      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  updateVenue: async (data: { name?: string; address?: string | null; description?: string | null }) => {
    const venue = get().venue
    if (!venue) return { error: 'No venue found' }

    try {
      const { error } = await supabase
        .from('venues')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', venue.id)

      if (error) return { error: error.message }

      set({ venue: { ...venue, ...data, updated_at: new Date().toISOString() } })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  updatePayoutSchedule: async (venueId, schedule) => {
    const venue = get().venue
    if (!venue) return { error: 'No venue found' }

    try {
      const { error } = await supabase
        .from('venues')
        .update({
          auto_payout_enabled: schedule.auto_payout_enabled,
          payout_frequency: schedule.payout_frequency,
          payout_day: schedule.payout_day,
          updated_at: new Date().toISOString(),
        })
        .eq('id', venueId)

      if (error) return { error: error.message }

      set({
        venue: {
          ...venue,
          auto_payout_enabled: schedule.auto_payout_enabled,
          payout_frequency: schedule.payout_frequency,
          payout_day: schedule.payout_day,
          updated_at: new Date().toISOString(),
        },
      })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  },

  fetchUserVenue: async () => {
    // Skip if already initialized with a venue
    if (get().initialized && get().venue) return

    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ venue: null, loading: false, initialized: true })
        return
      }

      const { data: venue } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      set({ venue: venue ?? null, loading: false, initialized: true })
    } catch {
      set({ venue: null, loading: false, initialized: true })
    }
  },

  reset: () => set({ venue: null, loading: false, initialized: false }),
}))
