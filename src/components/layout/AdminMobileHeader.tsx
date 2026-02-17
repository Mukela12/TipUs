import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard, Store, QrCode, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Venues', href: '/admin/venues', icon: Store },
  { label: 'QR Codes', href: '/admin/qr-codes', icon: QrCode },
  { label: 'Payouts', href: '/admin/payouts', icon: Wallet },
]

export function AdminMobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const signOut = useAuthStore((s) => s.signOut)

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

        <Link to="/admin" className="flex items-center gap-2">
          <img src="/savings.png" alt="TipUs" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold text-surface-900">TipUs Admin</span>
        </Link>

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
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin'}
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
