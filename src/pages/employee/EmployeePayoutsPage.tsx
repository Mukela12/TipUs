import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Loader2 } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useEmployeeDashboardStore } from '@/stores/employeeDashboardStore'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning-light text-warning-dark border border-warning/20',
  processing: 'bg-info-light text-info-dark border border-info/20',
  completed: 'bg-success-light text-success-dark border border-success/20',
  failed: 'bg-error-light text-error-dark border border-error/20',
}

export default function EmployeePayoutsPage() {
  const user = useAuthStore((s) => s.user)
  const { payouts, loading, initialized, fetchMyPayouts } = useEmployeeDashboardStore()

  useEffect(() => {
    if (user?.employee_id) {
      fetchMyPayouts(user.employee_id)
    }
  }, [user?.employee_id, fetchMyPayouts])

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
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">My Payouts</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Your share from each payout period.
        </p>
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
            Payouts will appear here once your venue processes tips.
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
                    My Share
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Days Active
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Processed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {payouts.map((payout) => (
                  <motion.tr
                    key={payout.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-surface-900">
                      {payout.period_start && payout.period_end
                        ? `${formatDate(payout.period_start)} — ${formatDate(payout.period_end)}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-surface-900 tabular-nums">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-600">
                      {payout.days_active}/{payout.total_period_days} days
                      {payout.is_prorated && (
                        <span className="ml-1.5 rounded-md bg-warning-light px-1.5 py-0.5 text-[10px] font-medium text-warning-dark border border-warning/20">
                          Prorated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          statusStyles[payout.payout_status ?? 'pending'] ?? statusStyles.pending
                        )}
                      >
                        {payout.payout_status ?? 'pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500">
                      {payout.processed_at ? formatDate(payout.processed_at) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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
                    <p className="text-lg font-bold text-surface-900 tabular-nums">
                      {formatCurrency(payout.amount)}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {payout.period_start && payout.period_end
                        ? `${formatDate(payout.period_start)} — ${formatDate(payout.period_end)}`
                        : 'No period'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium capitalize shrink-0',
                      statusStyles[payout.payout_status ?? 'pending'] ?? statusStyles.pending
                    )}
                  >
                    {payout.payout_status ?? 'pending'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
                  <span>
                    {payout.days_active}/{payout.total_period_days} days
                    {payout.is_prorated && ' (prorated)'}
                  </span>
                  {payout.processed_at && (
                    <span>Processed {formatDate(payout.processed_at)}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
