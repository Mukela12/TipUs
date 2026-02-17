import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import EmployeesPage from '@/pages/dashboard/EmployeesPage'
import TipsPage from '@/pages/dashboard/TipsPage'
import PayoutsPage from '@/pages/dashboard/PayoutsPage'
import QRCodesPage from '@/pages/dashboard/QRCodesPage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import TipPage from '@/pages/tip/TipPage'
import EmployeeSetupPage from '@/pages/invite/EmployeeSetupPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Employee Pages
import EmployeeDashboardPage from '@/pages/employee/EmployeeDashboardPage'
import EmployeeTipsPage from '@/pages/employee/EmployeeTipsPage'
import EmployeePayoutsPage from '@/pages/employee/EmployeePayoutsPage'
import EmployeeProfilePage from '@/pages/employee/EmployeeProfilePage'

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmployeeLayout } from '@/components/layout/EmployeeLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ToastContainer } from '@/components/ui/ToastContainer'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public tipping page — accessed via QR code */}
        <Route path="/tip/:shortCode" element={<TipPage />} />

        {/* Employee invitation setup — accessed via invite email */}
        <Route path="/invite/:token" element={<EmployeeSetupPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Venue owner dashboard */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/employees" element={<EmployeesPage />} />
            <Route path="/dashboard/tips" element={<TipsPage />} />
            <Route path="/dashboard/payouts" element={<PayoutsPage />} />
            <Route path="/dashboard/qr-codes" element={<QRCodesPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
          </Route>

          {/* Employee dashboard */}
          <Route element={<EmployeeLayout />}>
            <Route path="/employee" element={<EmployeeDashboardPage />} />
            <Route path="/employee/tips" element={<EmployeeTipsPage />} />
            <Route path="/employee/payouts" element={<EmployeePayoutsPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer />
    </>
  )
}
