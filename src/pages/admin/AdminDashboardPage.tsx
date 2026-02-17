import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAdminStore } from '@/stores/adminStore'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning-light text-warning-dark border border-warning/20',
  processing: 'bg-info-light text-info-dark border border-info/20',
  completed: 'bg-success-light text-success-dark border border-success/20',
  partially_completed: 'bg-warning-light text-warning-dark border border-warning/20',
  failed: 'bg-error-light text-error-dark border border-error/20',
}

export default function AdminDashboardPage() {
  const { stats, allPayouts, fetchStats, fetchAllPayouts } = useAdminStore()

  useEffect(() => {
    fetchStats()
    fetchAllPayouts()
  }, [fetchStats, fetchAllPayouts])

  const recentPayouts = allPayouts.slice(0, 5)

  const statCards = [
    {
      label: 'Total Venues',
      value: String(stats.totalVenues),
      icon: Store,
      color: 'bg-primary-100 text-primary-600',
      href: '/admin/venues',
    },
    {
      label: 'Total Employees',
      value: String(stats.totalEmployees),
      icon: Users,
      color: 'bg-accent-100 text-accent-600',
      href: '/admin/venues',
    },
    {
      label: 'Total Tips',
      value: formatCurrency(stats.totalTips),
      icon: DollarSign,
      color: 'bg-success-light text-success',
      href: '/admin/payouts',
    },
    {
      label: 'Platform Revenue',
      value: formatCurrency(stats.platformRevenue),
      icon: Wallet,
      color: 'bg-info-light text-info',
      href: '/admin/payouts',
    },
    {
      label: 'Tips This Week',
      value: formatCurrency(stats.tipsThisWeek),
      icon: TrendingUp,
      color: 'bg-warning-light text-warning-dark',
      href: '/admin/payouts',
    },
  ]

  return (
    <div>
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Admin Dashboard</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Platform overview and key metrics.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        {statCards.map((stat) => (
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

      {/* Recent payouts */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-surface-900">Recent Payouts</h2>
          <Link
            to="/admin/payouts"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {recentPayouts.length === 0 ? (
          <div className="glass-effect rounded-xl py-12 text-center">
            <Wallet className="mx-auto h-8 w-8 text-surface-300 mb-2" />
            <p className="text-sm text-surface-500">No payouts yet</p>
          </div>
        ) : (
          <div className="glass-effect rounded-xl overflow-hidden">
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Venue</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Total</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Fee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200/40">
                  {recentPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-surface-900">{payout.venue_name}</td>
                      <td className="px-5 py-3.5 text-sm text-surface-900">
                        {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-surface-900 tabular-nums">
                        {formatCurrency(payout.total_amount)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-surface-500 tabular-nums">
                        {formatCurrency(payout.platform_fee)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          statusStyles[payout.status] ?? statusStyles.pending
                        )}>
                          {payout.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-surface-500">{formatDate(payout.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-surface-200/40">
              {recentPayouts.map((payout) => (
                <div key={payout.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{payout.venue_name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                      </p>
                    </div>
                    <span className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium shrink-0',
                      statusStyles[payout.status] ?? statusStyles.pending
                    )}>
                      {payout.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="font-medium text-surface-900 tabular-nums">{formatCurrency(payout.total_amount)}</span>
                    <span className="text-surface-400">Fee: {formatCurrency(payout.platform_fee)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
