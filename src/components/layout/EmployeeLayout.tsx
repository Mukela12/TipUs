import { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { EmployeeSidebar } from './EmployeeSidebar'
import { EmployeeMobileHeader } from './EmployeeMobileHeader'
import { EmployeeMobileBottomNav } from './EmployeeMobileBottomNav'
import { useAuthStore } from '@/stores/authStore'
import { useEmployeeDashboardStore } from '@/stores/employeeDashboardStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { employeeSteps } from '@/components/onboarding/tutorialSteps'

export function EmployeeLayout() {
  const user = useAuthStore((s) => s.user)
  const { loading, initialized, fetchProfile } = useEmployeeDashboardStore()
  const { fetchUnreadCount, subscribeToRealtime } = useNotificationStore()

  useEffect(() => {
    if (user?.employee_id) {
      fetchProfile(user.employee_id)
    }
  }, [user?.employee_id, fetchProfile])

  useEffect(() => {
    fetchUnreadCount()
    const unsubscribe = subscribeToRealtime()
    return unsubscribe
  }, [fetchUnreadCount, subscribeToRealtime])

  if (!user?.employee_id) {
    return <Navigate to="/login" replace />
  }

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <OnboardingProvider steps={employeeSteps}>
      <div className="h-screen overflow-hidden bg-surface-50">
        {/* Desktop sidebar */}
        <EmployeeSidebar />

        {/* Mobile header — sticky top */}
        <EmployeeMobileHeader />

        {/* Main content wrapper */}
        <div className="flex flex-col h-full lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile bottom nav — fixed bottom */}
        <EmployeeMobileBottomNav />
      </div>
    </OnboardingProvider>
  )
}
