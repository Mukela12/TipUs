import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  QrCode,
  DollarSign,
  Wallet,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useNotificationStore } from '@/stores/notificationStore'
import type { NotificationType } from '@/types'

const filterOptions: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'QR Codes', value: 'qr_code_created' },
  { label: 'Tips', value: 'tip_received' },
  { label: 'Payouts', value: 'payout_completed' },
]

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'qr_code_created':
      return <QrCode className="h-5 w-5 text-primary-500" />
    case 'tip_received':
      return <DollarSign className="h-5 w-5 text-success" />
    case 'payout_completed':
      return <Wallet className="h-5 w-5 text-primary-600" />
    case 'payout_failed':
      return <AlertTriangle className="h-5 w-5 text-error" />
  }
}

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    filter,
    unreadCount,
    fetchNotifications,
    setFilter,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filtered =
    filter === 'all'
      ? notifications
      : notifications.filter((n) =>
          filter === 'payout_completed'
            ? n.type === 'payout_completed' || n.type === 'payout_failed'
            : n.type === filter
        )

  return (
    <div>
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Notifications</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Stay up to date with your activity.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-100 px-4 py-2 text-sm font-medium text-surface-700 transition-all hover:bg-surface-200 self-start"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </motion.div>

      {/* Filter pills */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-5 flex gap-2 overflow-x-auto pb-1"
      >
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              filter === opt.value
                ? 'bg-primary-100 text-primary-700'
                : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
            )}
          >
            {opt.label}
          </button>
        ))}
      </motion.div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <Bell className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No notifications</h3>
          <p className="mt-1 text-sm text-surface-500">
            {filter === 'all'
              ? "You're all caught up!"
              : 'No notifications of this type yet.'}
          </p>
        </motion.div>
      )}

      {/* Notification list */}
      {filtered.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6 space-y-2"
        >
          {filtered.map((n) => (
            <motion.div
              key={n.id}
              variants={fadeInUp}
              className={cn(
                'glass-effect rounded-xl p-4 transition-all cursor-pointer hover:shadow-medium',
                !n.is_read && 'border-l-4 border-l-primary-500 bg-primary-50/20'
              )}
              onClick={() => {
                if (!n.is_read) markAsRead(n.id)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm text-surface-900', !n.is_read && 'font-semibold')}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-surface-400 whitespace-nowrap">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="text-sm text-surface-500 mt-0.5">{n.body}</p>
                  )}
                </div>
                {!n.is_read && (
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
