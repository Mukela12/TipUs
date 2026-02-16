import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, DollarSign, Wallet, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', href: '/employee', icon: LayoutDashboard, end: true },
  { label: 'Tips', href: '/employee/tips', icon: DollarSign },
  { label: 'Payouts', href: '/employee/payouts', icon: Wallet },
  { label: 'Profile', href: '/employee/profile', icon: User },
]

export function EmployeeMobileBottomNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-surface-200 shadow-soft">
      <nav className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end}
            className="relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-colors min-w-[48px]"
            style={{ minHeight: '48px' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="employee-mobile-nav-pill"
                    className="absolute inset-1 bg-primary-50 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <motion.div
                  animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5',
                      isActive ? 'text-primary-600' : 'text-surface-400'
                    )}
                  />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px]',
                    isActive
                      ? 'text-primary-600 font-semibold'
                      : 'text-surface-400 font-medium'
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
