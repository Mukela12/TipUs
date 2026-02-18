import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { useVenueStore } from '@/stores/venueStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { venueOwnerSteps } from '@/components/onboarding/tutorialSteps'

export function DashboardLayout() {
  const { venue, loading, initialized, fetchUserVenue } = useVenueStore()
  const { fetchUnreadCount, subscribeToRealtime } = useNotificationStore()

  useEffect(() => {
    fetchUserVenue()
  }, [fetchUserVenue])

  useEffect(() => {
    fetchUnreadCount()
    const unsubscribe = subscribeToRealtime()
    return unsubscribe
  }, [fetchUnreadCount, subscribeToRealtime])

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!venue) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <OnboardingProvider steps={venueOwnerSteps}>
      <div className="h-screen overflow-hidden bg-surface-50">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile header — sticky top */}
        <MobileHeader />

        {/* Main content wrapper */}
        <div className="flex flex-col h-full lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav — fixed bottom */}
        <MobileBottomNav />
      </div>
    </OnboardingProvider>
  )
}
