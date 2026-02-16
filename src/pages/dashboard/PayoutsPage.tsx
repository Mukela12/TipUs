import { useEffect, useState, useMemo } from 'react'
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
  Clock,
  Calendar,
  Save,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { usePayoutStore } from '@/stores/payoutStore'
import { useVenueStore } from '@/stores/venueStore'
import { useUIStore } from '@/stores/uiStore'

const statusStyles: Record<string, string> = {
  pending: 'bg-warning-light text-warning-dark border border-warning/20',
  processing: 'bg-info-light text-info-dark border border-info/20',
  completed: 'bg-success-light text-success-dark border border-success/20',
  failed: 'bg-error-light text-error-dark border border-error/20',
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getNextPayoutDate(
  frequency: 'weekly' | 'fortnightly' | 'monthly',
  payoutDay: number,
  lastRun: string | null
): string {
  const now = new Date()

  if (frequency === 'monthly') {
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), payoutDay))
    if (next <= now) {
      next.setUTCMonth(next.getUTCMonth() + 1)
    }
    return next.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Weekly or fortnightly
  const currentDay = now.getUTCDay()
  let daysUntil = payoutDay - currentDay
  if (daysUntil <= 0) daysUntil += 7

  if (frequency === 'fortnightly' && lastRun) {
    const last = new Date(lastRun)
    const daysSinceLast = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceLast < 14 && daysUntil < 14 - daysSinceLast) {
      daysUntil += 7
    }
  }

  const next = new Date(now)
  next.setUTCDate(next.getUTCDate() + daysUntil)
  return next.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PayoutsPage() {
  const venue = useVenueStore((s) => s.venue)
  const updatePayoutSchedule = useVenueStore((s) => s.updatePayoutSchedule)
  const { payouts, loading, initialized, fetchPayouts, createPayout, completePayout } =
    usePayoutStore()
  const addToast = useUIStore((s) => s.addToast)

  const [showForm, setShowForm] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [confirmPayoutId, setConfirmPayoutId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Schedule state
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'weekly' | 'fortnightly' | 'monthly'>('weekly')
  const [scheduleDay, setScheduleDay] = useState(1)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleChanged, setScheduleChanged] = useState(false)

  // Initialize schedule state from venue
  useEffect(() => {
    if (venue) {
      setScheduleEnabled(venue.auto_payout_enabled ?? false)
      setScheduleFrequency(venue.payout_frequency ?? 'weekly')
      setScheduleDay(venue.payout_day ?? 1)
      setScheduleChanged(false)
    }
  }, [venue])

  useEffect(() => {
    if (venue?.id) fetchPayouts(venue.id)
  }, [venue?.id, fetchPayouts])

  // Track if schedule has been modified
  useEffect(() => {
    if (!venue) return
    const changed =
      scheduleEnabled !== (venue.auto_payout_enabled ?? false) ||
      scheduleFrequency !== (venue.payout_frequency ?? 'weekly') ||
      scheduleDay !== (venue.payout_day ?? 1)
    setScheduleChanged(changed)
  }, [venue, scheduleEnabled, scheduleFrequency, scheduleDay])

  const nextPayoutDate = useMemo(() => {
    if (!scheduleEnabled) return null
    return getNextPayoutDate(scheduleFrequency, scheduleDay, venue?.last_auto_payout_at ?? null)
  }, [scheduleEnabled, scheduleFrequency, scheduleDay, venue?.last_auto_payout_at])

  async function handleSaveSchedule() {
    if (!venue?.id) return
    setSavingSchedule(true)
    const { error } = await updatePayoutSchedule(venue.id, {
      auto_payout_enabled: scheduleEnabled,
      payout_frequency: scheduleFrequency,
      payout_day: scheduleDay,
    })
    setSavingSchedule(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to save schedule', description: error })
    } else {
      addToast({ type: 'success', title: 'Payout schedule saved' })
      setScheduleChanged(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!venue?.id || !periodStart || !periodEnd) return

    setSubmitting(true)
    const { error } = await createPayout(venue.id, periodStart, periodEnd)
    setSubmitting(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to create payout', description: error })
    } else {
      addToast({ type: 'success', title: 'Payout created' })
      setPeriodStart('')
      setPeriodEnd('')
      setShowForm(false)
    }
  }

  async function handleExecutePayout(payoutId: string) {
    setConfirmPayoutId(null)
    setCompletingId(payoutId)
    const { error } = await completePayout(payoutId)
    setCompletingId(null)

    if (error) {
      addToast({ type: 'error', title: 'Payout failed', description: error })
    } else {
      addToast({ type: 'success', title: 'Payout executed', description: 'Funds have been sent to employee bank accounts via Stripe.' })
    }
  }

  const inputClass =
    'block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

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
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Payouts</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Distribute tips to your team members.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:shadow-medium"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Create Payout'}
        </button>
      </motion.div>

      {/* Payout Schedule */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-5 glass-effect rounded-xl p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100">
            <Clock className="h-4.5 w-4.5 text-primary-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900">Payout Schedule</h3>
            <p className="text-xs text-surface-500">Configure automatic recurring payouts</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-surface-700">Enable automatic payouts</span>
            <button
              type="button"
              role="switch"
              aria-checked={scheduleEnabled}
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                scheduleEnabled ? 'bg-primary-500' : 'bg-surface-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
                  scheduleEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </label>

          {scheduleEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Frequency */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => {
                      const val = e.target.value as 'weekly' | 'fortnightly' | 'monthly'
                      setScheduleFrequency(val)
                      // Reset day to sensible default
                      if (val === 'monthly') setScheduleDay(1)
                      else setScheduleDay(1) // Monday
                    }}
                    className={inputClass}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Day picker */}
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    {scheduleFrequency === 'monthly' ? 'Day of Month' : 'Day of Week'}
                  </label>
                  <select
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(Number(e.target.value))}
                    className={inputClass}
                  >
                    {scheduleFrequency === 'monthly'
                      ? Array.from({ length: 28 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                          </option>
                        ))
                      : DAY_NAMES.map((name, i) => (
                          <option key={i} value={i}>
                            {name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {/* Next payout info */}
              {nextPayoutDate && (
                <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 border border-primary-100">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span className="text-xs text-primary-700">
                    Next scheduled payout: <span className="font-semibold">{nextPayoutDate}</span>
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Save button */}
          {scheduleChanged && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Schedule
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Create payout form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCreate}
            className="overflow-hidden"
          >
            <div className="mt-5 glass-effect rounded-xl p-5">
              <div className="grid gap-4 sm:grid-cols-2">
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
            Create your first payout to distribute tips to your team.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" />
              Create Payout
            </button>
          )}
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
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Actions
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
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-500">
                      {formatDate(payout.created_at)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => setConfirmPayoutId(payout.id)}
                          disabled={completingId === payout.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                        >
                          {completingId === payout.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          Execute Payout
                        </button>
                      )}
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
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {dist.is_prorated && (
                                  <span className="rounded-md bg-warning-light px-1.5 py-0.5 text-[10px] font-medium text-warning-dark border border-warning/20">
                                    Prorated
                                  </span>
                                )}
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
                      'rounded-md px-2 py-0.5 text-xs font-medium capitalize shrink-0',
                      statusStyles[payout.status] ?? statusStyles.pending
                    )}
                  >
                    {payout.status}
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
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-surface-900 tabular-nums">
                              {formatCurrency(dist.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Execute payout button */}
                {payout.status === 'pending' && (
                  <div className="mt-3 border-t border-surface-200/40 pt-3">
                    <button
                      onClick={() => setConfirmPayoutId(payout.id)}
                      disabled={completingId === payout.id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500/10 py-2.5 text-sm font-medium text-primary-700 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
                    >
                      {completingId === payout.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Execute Payout
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
                This will transfer real money from your Stripe balance to each employee's bank account.
              </p>
              <p className="text-sm font-medium text-surface-900 mb-5">
                Amount:{' '}
                {formatCurrency(
                  payouts.find((p) => p.id === confirmPayoutId)?.net_amount ?? 0
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
