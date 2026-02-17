import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  QrCode,
  Wallet,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Venues', href: '/admin/venues', icon: Store },
  { label: 'QR Codes', href: '/admin/qr-codes', icon: QrCode },
  { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
]

export function AdminSidebar() {
  const signOut = useAuthStore((s) => s.signOut)
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:w-64 bg-white border-r border-surface-200 shadow-soft">
      {/* Logo */}
      <div className="border-b border-surface-200 px-5 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/savings.png" alt="TipUs" className="h-9 w-9 rounded-lg shrink-0" />
          <div className="min-w-0">
            <span className="text-lg font-semibold text-surface-900">TipUs</span>
            <p className="truncate text-xs text-surface-500 -mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="border-b border-surface-200 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 shrink-0">
              {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate leading-tight">
                {user.full_name || 'Admin'}
              </p>
              <p className="text-[11px] text-surface-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-primary-600' : 'text-surface-400')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-surface-200 px-3 py-2 shrink-0">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-error hover:bg-error-light transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
