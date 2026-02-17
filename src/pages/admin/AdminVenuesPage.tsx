import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAdminStore } from '@/stores/adminStore'

export default function AdminVenuesPage() {
  const { venues, loading, fetchVenues } = useAdminStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  if (loading && venues.length === 0) {
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
      >
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Venues</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          All registered venues on the platform.
        </p>
      </motion.div>

      {/* Empty state */}
      {venues.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <Store className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No venues yet</h3>
          <p className="mt-1 text-sm text-surface-500">
            Venues will appear here once they register.
          </p>
        </motion.div>
      )}

      {/* Venues list */}
      {venues.length > 0 && (
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Venue</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Employees</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Total Tips</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Auto Payout</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {venues.map((venue) => (
                  <motion.tr
                    key={venue.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === venue.id ? null : venue.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {expandedId === venue.id ? (
                          <ChevronUp className="h-3.5 w-3.5 text-surface-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-surface-900">{venue.name}</p>
                          <p className="text-xs text-surface-400">{venue.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-900 tabular-nums">
                      {venue.employee_count}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-surface-900 tabular-nums">
                      {formatCurrency(venue.tip_total)}
                    </td>
                    <td className="px-5 py-3.5">
                      {venue.auto_payout_enabled ? (
                        <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium bg-success-light text-success-dark border border-success/20">
                          {venue.payout_frequency}
                        </span>
                      ) : (
                        <span className="inline-block rounded-md px-2 py-0.5 text-xs font-medium bg-surface-100 text-surface-500">
                          Off
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500">
                      {formatDate(venue.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Expanded details */}
            <AnimatePresence>
              {venues.map(
                (venue) =>
                  expandedId === venue.id && (
                    <motion.div
                      key={`detail-${venue.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-surface-200/60 bg-surface-50/50"
                    >
                      <div className="px-5 py-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Address</p>
                          <p className="text-sm text-surface-700">{venue.address || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Description</p>
                          <p className="text-sm text-surface-700">{venue.description || 'Not set'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Subscription</p>
                          <p className="text-sm text-surface-700 capitalize">{venue.subscription_tier}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Venue ID</p>
                          <p className="text-xs text-surface-500 font-mono break-all">{venue.id}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-1">Owner ID</p>
                          <p className="text-xs text-surface-500 font-mono break-all">{venue.owner_id}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {venues.map((venue) => (
              <motion.div
                key={venue.id}
                variants={fadeInUp}
                className="glass-effect rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{venue.name}</p>
                    <p className="text-xs text-surface-400">{venue.slug}</p>
                  </div>
                  {venue.auto_payout_enabled ? (
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium bg-success-light text-success-dark border border-success/20 shrink-0">
                      {venue.payout_frequency}
                    </span>
                  ) : (
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium bg-surface-100 text-surface-500 shrink-0">
                      Off
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Employees</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <Users className="h-3 w-3 text-surface-400" />
                      <p className="text-sm font-bold text-surface-900">{venue.employee_count}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Tips</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <DollarSign className="h-3 w-3 text-surface-400" />
                      <p className="text-sm font-bold text-surface-900 tabular-nums">{formatCurrency(venue.tip_total)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase text-surface-400">Created</p>
                    <p className="text-xs text-surface-500 mt-1">{formatDate(venue.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
