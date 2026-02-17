import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Plus,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Send,
  AlertTriangle,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useAdminStore } from '@/stores/adminStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import type { Venue } from '@/types'

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

export default function AdminPayoutsPage() {
  const {
    allPayouts,
    loading,
    fetchAllPayouts,
    triggerPayout,
    executePayout,
  } = useAdminStore()
  const addToast = useUIStore((s) => s.addToast)

  const [venues, setVenues] = useState<Venue[]>([])
  const [filterVenueId, setFilterVenueId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formVenueId, setFormVenueId] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [confirmPayoutId, setConfirmPayoutId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadVenues() {
      const { data } = await supabase
        .from('venues')
        .select('*')
        .order('name')
      setVenues(data ?? [])
    }
    loadVenues()
  }, [])

  useEffect(() => {
    fetchAllPayouts(filterVenueId || undefined)
  }, [filterVenueId, fetchAllPayouts])

  async function handleTrigger(e: React.FormEvent) {
    e.preventDefault()
    if (!formVenueId || !periodStart || !periodEnd) return

    setSubmitting(true)
    const { error } = await triggerPayout(formVenueId, periodStart, periodEnd)
    setSubmitting(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to create payout', description: error })
    } else {
      addToast({ type: 'success', title: 'Payout created' })
      setFormVenueId('')
      setPeriodStart('')
      setPeriodEnd('')
      setShowForm(false)
    }
  }

  async function handleExecutePayout(payoutId: string) {
    setConfirmPayoutId(null)
    setExecutingId(payoutId)
    const { error } = await executePayout(payoutId)
    setExecutingId(null)

    if (error) {
      addToast({ type: 'error', title: 'Payout failed', description: error })
    } else {
      addToast({ type: 'success', title: 'Payout executed', description: 'Funds have been sent to employee bank accounts via Stripe.' })
    }
  }

  const inputClass =
    'block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

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
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Payouts</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Manage payouts across all venues.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:shadow-medium self-start"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Trigger Payout'}
        </button>
      </motion.div>

      {/* Venue filter */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-5"
      >
        <label className="block text-xs font-medium text-surface-600 mb-1.5">
          Filter by Venue
        </label>
        <select
          value={filterVenueId}
          onChange={(e) => setFilterVenueId(e.target.value)}
          className={cn(inputClass, 'max-w-md')}
        >
          <option value="">All venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Trigger payout form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleTrigger}
            className="overflow-hidden"
          >
            <div className="mt-5 glass-effect rounded-xl p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Venue *
                  </label>
                  <select
                    required
                    value={formVenueId}
                    onChange={(e) => setFormVenueId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose a venue...</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Calculate & Create
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && allPayouts.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && allPayouts.length === 0 && (
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
            Trigger the first payout for a venue to get started.
          </p>
        </motion.div>
      )}

      {/* Payouts list */}
      {allPayouts.length > 0 && (
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Period</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Fee</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Net</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {allPayouts.map((payout) => (
                  <motion.tr
                    key={payout.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-surface-900">
                      <div className="flex items-center gap-1.5">
                        {expandedId === payout.id ? (
                          <ChevronUp className="h-3.5 w-3.5 text-surface-400" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
                        )}
                        {payout.venue_name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-900">
                      {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
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
                      <span className={cn(
                        'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                        statusStyles[payout.status] ?? statusStyles.pending
                      )}>
                        {statusLabels[payout.status] ?? payout.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500">
                      {formatDate(payout.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {(payout.status === 'pending' || payout.status === 'partially_completed' || payout.status === 'failed') && (
                        <button
                          onClick={() => setConfirmPayoutId(payout.id)}
                          disabled={executingId === payout.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                        >
                          {executingId === payout.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {payout.status === 'pending' ? 'Execute' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Expanded distributions */}
            <AnimatePresence>
              {allPayouts.map(
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
            {allPayouts.map((payout) => (
              <motion.div
                key={payout.id}
                variants={fadeInUp}
                className="glass-effect rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary-600">{payout.venue_name}</p>
                    <p className="text-sm font-semibold text-surface-900 mt-0.5">
                      {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                    </p>
                  </div>
                  <span className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium shrink-0',
                    statusStyles[payout.status] ?? statusStyles.pending
                  )}>
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
                  onClick={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
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

                {/* Execute payout button */}
                {(payout.status === 'pending' || payout.status === 'partially_completed' || payout.status === 'failed') && (
                  <div className="mt-3 border-t border-surface-200/40 pt-3">
                    <button
                      onClick={() => setConfirmPayoutId(payout.id)}
                      disabled={executingId === payout.id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500/10 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                    >
                      {executingId === payout.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {payout.status === 'pending' ? 'Execute Payout' : 'Retry Failed'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmPayoutId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setConfirmPayoutId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-elevated"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-light">
                  <AlertTriangle className="h-5 w-5 text-warning-dark" />
                </div>
                <h3 className="text-base font-semibold text-surface-900">
                  Confirm Payout
                </h3>
              </div>
              <p className="text-sm text-surface-600 mb-1">
                {allPayouts.find((p) => p.id === confirmPayoutId)?.status === 'pending'
                  ? "This will transfer real money from the platform's Stripe balance to each employee's bank account."
                  : "This will retry sending to employees whose transfers previously failed."}
              </p>
              <p className="text-sm font-medium text-surface-900 mb-1">
                Venue: {allPayouts.find((p) => p.id === confirmPayoutId)?.venue_name}
              </p>
              <p className="text-sm font-medium text-surface-900 mb-5">
                Amount:{' '}
                {formatCurrency(
                  allPayouts.find((p) => p.id === confirmPayoutId)?.net_amount ?? 0
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmPayoutId(null)}
                  className="flex-1 rounded-xl border border-surface-200 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecutePayout(confirmPayoutId)}
                  className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
                >
                  Send Payouts
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
