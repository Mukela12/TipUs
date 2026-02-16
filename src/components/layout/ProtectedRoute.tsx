import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute() {
  const { user, loading, initialized } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Role-based routing: redirect employees away from venue-owner dashboard
  if (user.role === 'employee' && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/employee" replace />
  }

  // Role-based routing: redirect venue owners away from employee dashboard
  if (user.role === 'venue_owner' && location.pathname.startsWith('/employee')) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
