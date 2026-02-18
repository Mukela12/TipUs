import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Hash,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useEmployeeDashboardStore } from '@/stores/employeeDashboardStore'

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

export default function EmployeeDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { profile, tipStats, tips, fetchVenueTips } = useEmployeeDashboardStore()

  useEffect(() => {
    if (profile?.venue_id) {
      fetchVenueTips(profile.venue_id)
    }
  }, [profile?.venue_id, fetchVenueTips])

  const firstName = (profile?.name ?? user?.full_name ?? '').split(' ')[0] || 'there'
  const hasTips = tipStats.tipCount > 0

  const dynamicSubtitle = hasTips
    ? `Your venue earned ${formatCurrency(tipStats.tipsThisWeek)} this week`
    : 'Tips will show up here once customers start tipping'

  const stats = [
    {
      label: 'Venue Tips',
      value: formatCurrency(tipStats.totalTips),
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
      href: '/employee/tips',
    },
    {
      label: 'Average Tip',
      value: formatCurrency(tipStats.avgTip),
      icon: BarChart3,
      color: 'bg-accent-100 text-accent-600',
      href: '/employee/tips',
    },
    {
      label: 'This Week',
      value: formatCurrency(tipStats.tipsThisWeek),
      icon: TrendingUp,
      color: 'bg-success-light text-success',
      href: '/employee/tips',
    },
    {
      label: 'Tip Count',
      value: String(tipStats.tipCount),
      icon: Hash,
      color: 'bg-info-light text-info',
      href: '/employee/tips',
    },
  ]

  const recentTips = tips.slice(0, 5)

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
              <p className="text-xs font-medium text-surface-500">Venue total</p>
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

      {/* Recent tips */}
      {recentTips.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-surface-900">Recent Tips</h2>
            <Link
              to="/employee/tips"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentTips.map((tip) => (
              <div
                key={tip.id}
                className="glass-effect rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-surface-900 tabular-nums">
                    {formatCurrency(tip.amount)}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {tip.tipper_name || 'Anonymous'}
                    {tip.employee_name && <> &middot; To {tip.employee_name}</>}
                    {' '}&middot; {formatRelativeTime(tip.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                    tip.status === 'succeeded'
                      ? 'bg-success-light text-success-dark border border-success/20'
                      : tip.status === 'pending'
                        ? 'bg-warning-light text-warning-dark border border-warning/20'
                        : 'bg-surface-100 text-surface-500 border border-surface-200'
                  )}
                >
                  {tip.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!hasTips && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <DollarSign className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No tips yet</h3>
          <p className="mt-1 text-sm text-surface-500">
            Tips will appear here once customers start tipping.
          </p>
        </motion.div>
      )}
    </div>
  )
}
