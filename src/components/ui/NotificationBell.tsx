import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  QrCode,
  DollarSign,
  Wallet,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'
import { useNotificationStore } from '@/stores/notificationStore'
import type { NotificationType, Notification } from '@/types'

const filterOptions: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'QR Codes', value: 'qr_code_created' },
  { label: 'Tips', value: 'tip_received' },
  { label: 'Payouts', value: 'payout_completed' },
]

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'qr_code_created':
      return <QrCode className="h-4 w-4 text-primary-500" />
    case 'tip_received':
      return <DollarSign className="h-4 w-4 text-success" />
    case 'payout_completed':
      return <Wallet className="h-4 w-4 text-primary-600" />
    case 'payout_failed':
      return <AlertTriangle className="h-4 w-4 text-error" />
  }
}

interface NotificationBellProps {
  basePath: string
}

export function NotificationBell({ basePath }: NotificationBellProps) {
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number }>({ top: 0, right: 0 })
  const {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotificationStore()

  // Fetch notifications on first open
  const hasFetched = useRef(false)
  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  // Compute dropdown position when opened
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const dropdownWidth = window.innerWidth >= 640 ? 384 : 320

    if (rect.right >= dropdownWidth) {
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    } else {
      setPos({ top: rect.bottom + 8, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  // Close on outside click — uses the portal'd dropdown ref
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      // Keep open if click is on the bell button or inside the dropdown
      if (buttonRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const filtered =
    filter === 'all'
      ? notifications
      : notifications.filter((n) =>
          filter === 'payout_completed'
            ? n.type === 'payout_completed' || n.type === 'payout_failed'
            : n.type === filter
        )

  const displayNotifications = filtered.slice(0, 10)

  function handleNotificationClick(n: Notification) {
    if (!n.is_read) markAsRead(n.id)
    setOpen(false)
  }

  // Render dropdown via portal so it escapes stacking contexts (backdrop-filter, etc.)
  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 sm:w-96 rounded-xl bg-white border border-surface-200 shadow-lg z-[100] overflow-hidden"
          style={{
            top: pos.top,
            ...(pos.right !== undefined ? { right: pos.right } : {}),
            ...(pos.left !== undefined ? { left: pos.left } : {}),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 px-4 py-2 border-b border-surface-100 overflow-x-auto">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                  filter === opt.value
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {displayNotifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-surface-300 mb-2" />
                <p className="text-sm text-surface-400">No notifications</p>
              </div>
            ) : (
              displayNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50',
                    !n.is_read && 'bg-primary-50/30'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm text-surface-900', !n.is_read && 'font-semibold')}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[11px] text-surface-400 mt-1">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-100 px-4 py-2.5">
            <button
              onClick={() => {
                setOpen(false)
                navigate(`${basePath}/notifications`)
              }}
              className="w-full text-center text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all notifications
            </button>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 hover:bg-surface-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-surface-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {dropdown}
    </>
  )
}
