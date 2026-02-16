import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard, Users, DollarSign, Wallet, QrCode, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useVenueStore } from '@/stores/venueStore'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', href: '/dashboard/employees', icon: Users },
  { label: 'Tips', href: '/dashboard/tips', icon: DollarSign },
  { label: 'Payouts', href: '/dashboard/payouts', icon: Wallet },
  { label: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const signOut = useAuthStore((s) => s.signOut)
  const venue = useVenueStore((s) => s.venue)

  // Close on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-200/60">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-xl p-2.5 hover:bg-surface-100 transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? (
            <X className="h-5 w-5 text-surface-600" />
          ) : (
            <Menu className="h-5 w-5 text-surface-600" />
          )}
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/savings.png" alt="TipUs" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold text-surface-900">TipUs</span>
        </Link>

        {/* Spacer to balance the layout */}
        <div style={{ width: '44px' }} />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-surface-200/60 bg-white/95 backdrop-blur-md"
          >
            <nav className="px-4 py-3 space-y-0.5 max-h-[70vh] overflow-y-auto">
              {venue && (
                <div className="px-3 pb-2 mb-2 border-b border-surface-200">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">Venue</p>
                  <p className="text-sm font-medium text-surface-700 truncate">{venue.name}</p>
                </div>
              )}

              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-surface-700 hover:bg-surface-50'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              ))}

              <div className="border-t border-surface-200 my-2" />

              <button
                onClick={signOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-error hover:bg-error-light transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
