import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Users,
  QrCode,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, formatCurrency } from '@/lib/utils'
import { useVenueStore } from '@/stores/venueStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useTipStore } from '@/stores/tipStore'
import { useQRCodeStore } from '@/stores/qrCodeStore'

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

export default function DashboardPage() {
  const venue = useVenueStore((s) => s.venue)
  const connectStripe = useVenueStore((s) => s.connectStripe)
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)
  const [connecting, setConnecting] = useState(false)

  const { employees, fetchEmployees } = useEmployeeStore()
  const { stats: tipStats, fetchTips } = useTipStore()
  const { qrCodes, fetchQRCodes } = useQRCodeStore()

  useEffect(() => {
    if (venue?.id) {
      fetchEmployees(venue.id)
      fetchTips(venue.id)
      fetchQRCodes(venue.id)
    }
  }, [venue?.id, fetchEmployees, fetchTips, fetchQRCodes])

  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0)
  const hasTips = tipStats.tipCount > 0

  const dynamicSubtitle = hasTips
    ? `Your team earned ${formatCurrency(tipStats.tipsThisWeek)} this week`
    : 'Share your QR code to start collecting tips'

  async function handleConnectStripe() {
    setConnecting(true)
    const { error } = await connectStripe()
    if (error) {
      addToast({ type: 'error', title: 'Stripe connection failed', description: error })
      setConnecting(false)
    }
  }

  const stats = [
    {
      label: 'Total Tips',
      value: formatCurrency(tipStats.totalTips),
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
      href: '/dashboard/tips',
    },
    {
      label: 'Employees',
      value: String(employees.length),
      icon: Users,
      color: 'bg-accent-100 text-accent-600',
      href: '/dashboard/employees',
    },
    {
      label: 'QR Scans',
      value: String(totalScans),
      icon: QrCode,
      color: 'bg-info-light text-info',
      href: '/dashboard/qr-codes',
    },
    {
      label: 'This Week',
      value: formatCurrency(tipStats.tipsThisWeek),
      icon: TrendingUp,
      color: 'bg-success-light text-success',
      href: '/dashboard/tips',
    },
  ]

  return (
    <div>
      {/* Greeting header — redesigned */}
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
          <div className="hidden lg:block shrink-0 text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Total earned
            </p>
            <p className="text-3xl font-bold text-surface-900 tabular-nums mt-0.5">
              {formatCurrency(tipStats.totalTips)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Stripe Connect banner */}
      {venue && !venue.stripe_onboarding_complete && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-warning/30 bg-warning-light p-4"
        >
          <div className="rounded-lg bg-warning/10 p-2 shrink-0 self-start">
            <CreditCard className="h-5 w-5 text-warning-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-warning-dark">
              Connect Stripe to start accepting tips
            </p>
            <p className="text-xs text-warning-dark/70 mt-0.5">
              Set up your Stripe account to receive digital tips from customers.
            </p>
          </div>
          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            className="flex items-center justify-center gap-2 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-warning-dark disabled:opacity-50 shrink-0"
          >
            {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {connecting ? 'Connecting...' : 'Connect Stripe'}
          </button>
        </motion.div>
      )}

      {/* Stripe connected */}
      {venue?.stripe_onboarding_complete && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-5 flex items-center gap-3 rounded-xl border border-success/30 bg-success-light p-4"
        >
          <div className="rounded-lg bg-success/10 p-2">
            <CheckCircle className="h-5 w-5 text-success-dark" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success-dark">Stripe connected</p>
            <p className="text-xs text-success-dark/70">
              Your account is set up and ready to accept tips.
            </p>
          </div>
        </motion.div>
      )}

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

      {/* Quick actions when empty */}
      {!hasTips && employees.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl p-6 sm:p-8"
        >
          <h3 className="text-base font-semibold text-surface-900">Get started</h3>
          <p className="mt-1 text-sm text-surface-500">
            Set up your venue in a few quick steps.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              to="/dashboard/employees"
              className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 shrink-0">
                <Users className="h-4 w-4 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Add employees</p>
                <p className="text-xs text-surface-500">Build your team</p>
              </div>
            </Link>
            <Link
              to="/dashboard/qr-codes"
              className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-light shrink-0">
                <QrCode className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Create QR code</p>
                <p className="text-xs text-surface-500">Start collecting tips</p>
              </div>
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 rounded-xl border border-surface-200 p-4 hover:bg-surface-50 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 shrink-0">
                <CreditCard className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900">Connect Stripe</p>
                <p className="text-xs text-surface-500">Accept payments</p>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
