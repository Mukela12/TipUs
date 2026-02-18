import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { usePayoutStore } from '@/stores/payoutStore'
import { useVenueStore } from '@/stores/venueStore'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning-light text-warning-dark border border-warning/20',
  processing: 'bg-info-light text-info-dark border border-info/20',
  completed: 'bg-success-light text-success-dark border border-success/20',
  partially_completed: 'bg-warning-light text-warning-dark border border-warning/20',
  failed: 'bg-error-light text-error-dark border border-error/20',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  partially_completed: 'Partial',
  failed: 'Failed',
}

export default function PayoutsPage() {
  const venue = useVenueStore((s) => s.venue)
  const { payouts, loading, initialized, fetchPayouts } = usePayoutStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (venue?.id) fetchPayouts(venue.id)
  }, [venue?.id, fetchPayouts])

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Payout History</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            View payout history and track employee distributions.
          </p>
        </div>
      </motion.div>

      {/* Empty state */}
      {payouts.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <Wallet className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No payouts yet</h3>
          <p className="mt-1 text-sm text-surface-500">
            Payouts will appear here once TipUs processes them for your venue.
          </p>
        </motion.div>
      )}

      {/* Payouts list */}
      {payouts.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          {/* Desktop table */}
          <div className="hidden lg:block glass-effect rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Period
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Fee
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Net
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {payouts.map((payout) => (
                  <motion.tr
                    key={payout.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === payout.id ? null : payout.id)
                    }
                  >
                    <td className="px-5 py-3.5 text-sm text-surface-900">
                      <div className="flex items-center gap-1.5">
                        {expandedId === payout.id ? (
                          <ChevronUp className="h-3.5 w-3.5 text-surface-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
                        )}
                        {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-surface-900 tabular-nums">
                      {formatCurrency(payout.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500 tabular-nums">
                      {formatCurrency(payout.platform_fee)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-surface-900 tabular-nums">
                      {formatCurrency(payout.net_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          statusStyles[payout.status] ?? statusStyles.pending
                        )}
                      >
                        {statusLabels[payout.status] ?? payout.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500">
                      {formatDate(payout.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Expanded distributions (desktop) */}
            <AnimatePresence>
              {payouts.map(
                (payout) =>
                  expandedId === payout.id &&
                  payout.distributions.length > 0 && (
                    <motion.div
                      key={`dist-${payout.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-surface-200/60 bg-surface-50/50"
                    >
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-2">
                          Employee Breakdown
                        </p>
                        <div className="space-y-2">
                          {payout.distributions.map((dist) => (
                            <div
                              key={dist.id}
                              className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-surface-200/40"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                                  {(dist.employee_name ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-surface-900">
                                    {dist.employee_name ?? 'Unknown'}
                                  </span>
                                  <span className="ml-2 text-xs text-surface-400">
                                    {dist.days_active}/{dist.total_period_days} days
                                  </span>
                                  {dist.error_message && (
                                    <p className="text-[10px] text-error-dark mt-0.5">{dist.error_message}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {dist.is_prorated && (
                                  <span className="rounded-md bg-warning-light px-1.5 py-0.5 text-[10px] font-medium text-warning-dark border border-warning/20">
                                    Prorated
                                  </span>
                                )}
                                <span className={cn(
                                  'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                                  statusStyles[dist.status] ?? statusStyles.pending
                                )}>
                                  {dist.status === 'completed' ? 'Sent' : dist.status === 'failed' ? 'Failed' : 'Pending'}
                                </span>
                                <span className="text-sm font-semibold text-surface-900 tabular-nums">
                                  {formatCurrency(dist.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {payouts.map((payout) => (
              <motion.div
                key={payout.id}
                variants={fadeInUp}
                className="glass-effect rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-surface-900">
                      {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Created {formatDate(payout.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium shrink-0',
                      statusStyles[payout.status] ?? statusStyles.pending
                    )}
                  >
                    {statusLabels[payout.status] ?? payout.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Total</p>
                    <p className="text-sm font-bold text-surface-900 tabular-nums">
                      {formatCurrency(payout.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Fee</p>
                    <p className="text-sm text-surface-500 tabular-nums">
                      {formatCurrency(payout.platform_fee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Net</p>
                    <p className="text-sm font-bold text-surface-900 tabular-nums">
                      {formatCurrency(payout.net_amount)}
                    </p>
                  </div>
                </div>

                {/* Expand/collapse distributions */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === payout.id ? null : payout.id)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-200/60 py-2 text-xs font-medium text-surface-500 hover:bg-surface-50 transition-colors"
                >
                  {expandedId === payout.id ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" /> Hide Breakdown
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" /> Show Breakdown ({payout.distributions.length})
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {expandedId === payout.id && payout.distributions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2">
                        {payout.distributions.map((dist) => (
                          <div
                            key={dist.id}
                            className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
                                {(dist.employee_name ?? '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-surface-900">
                                  {dist.employee_name ?? 'Unknown'}
                                </p>
                                <p className="text-[10px] text-surface-400">
                                  {dist.days_active}/{dist.total_period_days} days
                                  {dist.is_prorated && ' (prorated)'}
                                </p>
                                {dist.error_message && (
                                  <p className="text-[10px] text-error-dark mt-0.5">{dist.error_message}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                                statusStyles[dist.status] ?? statusStyles.pending
                              )}>
                                {dist.status === 'completed' ? 'Sent' : dist.status === 'failed' ? 'Failed' : 'Pending'}
                              </span>
                              <span className="text-xs font-semibold text-surface-900 tabular-nums">
                                {formatCurrency(dist.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
