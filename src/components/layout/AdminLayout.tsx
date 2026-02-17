import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './AdminSidebar'
import { AdminMobileHeader } from './AdminMobileHeader'
import { AdminMobileBottomNav } from './AdminMobileBottomNav'

export function AdminLayout() {
  return (
    <div className="h-screen overflow-hidden bg-surface-50">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Mobile header — sticky top */}
      <AdminMobileHeader />

      {/* Main content wrapper */}
      <div className="flex flex-col h-full lg:pl-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — fixed bottom */}
      <AdminMobileBottomNav />
    </div>
  )
}
