import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Users,
  TrendingUp,
  Wallet,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency } from '@/lib/utils'
import { useVenueStore } from '@/stores/venueStore'
import { useAuthStore } from '@/stores/authStore'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useTipStore } from '@/stores/tipStore'

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function DashboardPage() {
  const venue = useVenueStore((s) => s.venue)
  const user = useAuthStore((s) => s.user)

  const { employees, fetchEmployees } = useEmployeeStore()
  const { stats: tipStats, fetchTips } = useTipStore()

  useEffect(() => {
    if (venue?.id) {
      fetchEmployees(venue.id)
      fetchTips(venue.id)
    }
  }, [venue?.id, fetchEmployees, fetchTips])

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const hasTips = tipStats.tipCount > 0

  const dynamicSubtitle = hasTips
    ? `Your team earned ${formatCurrency(tipStats.tipsThisWeek)} this week`
    : 'Add employees and start collecting tips'

  const stats = [
    {
      label: 'Total Tips',
      value: formatCurrency(tipStats.totalTips),
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
      href: '/dashboard/tips',
    },
    {
      label: 'Employees',
      value: String(employees.length),
      icon: Users,
      color: 'bg-accent-100 text-accent-600',
      href: '/dashboard/employees',
    },
    {
      label: 'Payouts',
      value: formatCurrency(tipStats.totalTips),
      icon: Wallet,
      color: 'bg-info-light text-info',
      href: '/dashboard/payouts',
    },
    {
      label: 'This Week',
      value: formatCurrency(tipStats.tipsThisWeek),
      icon: TrendingUp,
      color: 'bg-success-light text-success',
      href: '/dashboard/tips',
    },
  ]

  return (
    <div>
      {/* Greeting header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
            {getFormattedDate()}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-surface-900 sm:text-3xl truncate">
            {getTimeGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-surface-500">{dynamicSubtitle}</p>
        </div>

        {/* Hero metric — desktop only */}
        {hasTips && (
          <div className="hidden lg:flex items-center gap-3 shrink-0 rounded-xl bg-surface-50 border border-surface-200 px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
              <DollarSign className="h-4 w-4 text-primary-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-surface-500">Total earned</p>
              <p className="text-xl font-bold text-surface-900 tabular-nums">
                {formatCurrency(tipStats.totalTips)}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <motion.div
              variants={fadeInUp}
              className="glass-effect rounded-xl p-4 sm:p-5 group hover:shadow-medium transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-surface-500">{stat.label}</p>
                <div className={cn('rounded-lg p-1.5 sm:p-2', stat.color)}>
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-xl sm:text-2xl font-bold text-surface-900 tabular-nums">
                  {stat.value}
                </p>
                <ArrowRight className="h-4 w-4 text-surface-300 group-hover:text-primary-500 transition-colors mb-1" />
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Quick actions when empty */}
      {!hasTips && employees.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl p-6 sm:p-8"
        >
          <h3 className="text-base font-semibold text-surface-900">Get started</h3>
          <p className="mt-1 text-sm text-surface-500">
            Set up your venue in a few quick steps.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              to="/dashboard/employees"
              className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 shrink-0">
                <Users className="h-4 w-4 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Add employees</p>
                <p className="text-xs text-surface-500">Build your team</p>
              </div>
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-light shrink-0">
                <Settings className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Venue settings</p>
                <p className="text-xs text-surface-500">Configure payouts & profile</p>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
