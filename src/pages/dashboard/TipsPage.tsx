import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Hash,
  BarChart3,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { useTipStore } from '@/stores/tipStore'
import { useVenueStore } from '@/stores/venueStore'

const tipStatusStyles: Record<string, string> = {
  succeeded: 'bg-success-light text-success-dark border border-success/20',
  pending: 'bg-warning-light text-warning-dark border border-warning/20',
  failed: 'bg-error-light text-error-dark border border-error/20',
  refunded: 'bg-surface-100 text-surface-500 border border-surface-200',
}

export default function TipsPage() {
  const venue = useVenueStore((s) => s.venue)
  const { tips, stats, loading, initialized, fetchTips } = useTipStore()

  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (venue?.id) {
      fetchTips(venue.id, {
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
    }
  }, [venue?.id, fetchTips, statusFilter, dateFrom, dateTo])

  const inputClass =
    'block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Tips', value: formatCurrency(stats.totalTips), icon: DollarSign, color: 'bg-primary-100 text-primary-600' },
    { label: 'Average Tip', value: formatCurrency(stats.avgTip), icon: BarChart3, color: 'bg-accent-100 text-accent-600' },
    { label: 'This Week', value: formatCurrency(stats.tipsThisWeek), icon: TrendingUp, color: 'bg-success-light text-success' },
    { label: 'Tip Count', value: stats.tipCount, icon: Hash, color: 'bg-info-light text-info' },
  ]

  return (
    <div>
      {/* Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Tips</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Track all tips received by your venue.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            className="glass-effect rounded-xl p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs sm:text-sm font-medium text-surface-500">{stat.label}</p>
              <div className={cn('rounded-lg p-1.5 sm:p-2', stat.color)}>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-surface-900 tabular-nums">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-5 glass-effect rounded-xl p-4 sm:p-5"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </motion.div>

      {/* Empty state */}
      {tips.length === 0 && (
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
            Share your QR code to start receiving tips.
          </p>
        </motion.div>
      )}

      {/* Tips list */}
      {tips.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-5"
        >
          {/* Desktop table */}
          <div className="hidden lg:block glass-effect rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Employee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Tipper
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {tips.map((tip) => (
                  <motion.tr
                    key={tip.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-surface-600">
                      {formatRelativeTime(tip.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-surface-900 tabular-nums">
                      {formatCurrency(tip.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-600">
                      {tip.employee_name || <span className="text-surface-400">General</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-600">
                      {tip.tipper_name || <span className="text-surface-400">Anonymous</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          tipStatusStyles[tip.status] ?? tipStatusStyles.pending
                        )}
                      >
                        {tip.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500 max-w-[200px] truncate">
                      {tip.tipper_message || <span className="text-surface-300">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {tips.map((tip) => (
              <motion.div
                key={tip.id}
                variants={fadeInUp}
                className="glass-effect rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-surface-900 tabular-nums">
                      {formatCurrency(tip.amount)}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {formatRelativeTime(tip.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium capitalize shrink-0',
                      tipStatusStyles[tip.status] ?? tipStatusStyles.pending
                    )}
                  >
                    {tip.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
                  <span>
                    To: <span className="text-surface-700">{tip.employee_name || 'General'}</span>
                  </span>
                  <span>
                    From: <span className="text-surface-700">{tip.tipper_name || 'Anonymous'}</span>
                  </span>
                </div>

                {tip.tipper_message && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-surface-50 px-3 py-2">
                    <MessageSquare className="h-3.5 w-3.5 text-surface-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-surface-600 leading-relaxed">
                      {tip.tipper_message}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
