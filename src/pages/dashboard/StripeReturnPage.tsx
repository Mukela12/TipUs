import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVenueStore } from '@/stores/venueStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'

export default function StripeReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fetchUserVenue = useVenueStore((s) => s.fetchUserVenue)
  const connectStripe = useVenueStore((s) => s.connectStripe)
  const addToast = useUIStore((s) => s.addToast)

  const isRefresh = searchParams.get('refresh') === 'true'
  const isSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    async function handleReturn() {
      if (isRefresh) {
        addToast({
          type: 'info',
          title: 'Stripe session expired',
          description: 'Redirecting you back to Stripe to continue setup...',
        })
        const { error } = await connectStripe()
        if (error) {
          addToast({ type: 'error', title: 'Failed to reconnect Stripe', description: error })
          navigate('/dashboard', { replace: true })
        }
        return
      }

      if (isSuccess) {
        const venue = useVenueStore.getState().venue
        if (!venue) {
          navigate('/dashboard', { replace: true })
          return
        }

        // Directly check Stripe account status via Edge Function
        // (don't rely solely on webhook which may be delayed)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

          const res = await fetch(`${supabaseUrl}/functions/v1/create-stripe-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': anonKey,
            },
            body: JSON.stringify({ venue_id: venue.id, action: 'check_status' }),
          })
          const data = res.ok ? await res.json() : null

          if (data?.onboarding_complete) {
            // Update local state to reflect completion
            useVenueStore.setState({
              venue: { ...venue, stripe_onboarding_complete: true },
              initialized: false,
            })
            await fetchUserVenue()
            addToast({
              type: 'success',
              title: 'Stripe connected!',
              description: 'Your account is ready to accept tips.',
            })
            navigate('/dashboard', { replace: true })
            return
          }
        }

        // Fallback: re-fetch venue in case webhook already updated it
        useVenueStore.setState({ initialized: false })
        await fetchUserVenue()

        const updatedVenue = useVenueStore.getState().venue
        if (updatedVenue?.stripe_onboarding_complete) {
          addToast({
            type: 'success',
            title: 'Stripe connected!',
            description: 'Your account is ready to accept tips.',
          })
        } else {
          addToast({
            type: 'info',
            title: 'Stripe setup in progress',
            description: 'Your account is being verified. This may take a few minutes.',
          })
        }

        navigate('/dashboard', { replace: true })
      }
    }

    handleReturn()
  }, [isRefresh, isSuccess, navigate, fetchUserVenue, connectStripe, addToast])

  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
        <p className="mt-4 text-sm text-surface-500">
          {isRefresh ? 'Reconnecting to Stripe...' : 'Verifying your Stripe account...'}
        </p>
      </motion.div>
    </div>
  )
}
