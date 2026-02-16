import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Loader2, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const presetAmounts = [5, 10, 20, 50]

interface QRInfo {
  qrCodeId: string
  venueId: string
  venueName: string
  employeeId: string | null
  employeeName: string | null
}

// ──────────────────────────────────────────────────
// Payment form (rendered inside Stripe Elements)
// ──────────────────────────────────────────────────
function PaymentForm({
  amount,
  qrInfo: _qrInfo,
  onSuccess,
  onCancel,
}: {
  amount: number
  qrInfo: QRInfo
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment validation failed.')
      setProcessing(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tip/${window.location.pathname.split('/').pop()}?success=true`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please try again.')
      setProcessing(false)
      return
    }

    // Payment succeeded (no redirect needed)
    setProcessing(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-medium text-white shadow-medium transition-all hover:bg-primary-600 hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      <button
        type="button"
        onClick={onCancel}
        disabled={processing}
        className="w-full text-sm text-surface-500 hover:text-surface-700 transition-colors"
      >
        Change amount
      </button>
    </form>
  )
}

// ──────────────────────────────────────────────────
// Main TipPage
// ──────────────────────────────────────────────────
export default function TipPage() {
  const { shortCode } = useParams<{ shortCode: string }>()

  const [qrInfo, setQrInfo] = useState<QRInfo | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [tipperName, setTipperName] = useState('')
  const [tipperMessage, setTipperMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const activeAmount = customAmount ? parseFloat(customAmount) : selectedAmount

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Look up QR code info
  useEffect(() => {
    async function lookupQR() {
      if (!shortCode) {
        setQrError('Invalid QR code.')
        setQrLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          id,
          venue_id,
          employee_id,
          venues ( name ),
          employees ( name )
        `)
        .eq('short_code', shortCode)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setQrError("This QR code is not active or doesn't exist.")
        setQrLoading(false)
        return
      }

      const venue = data.venues as unknown as { name: string } | null
      const employee = data.employees as unknown as { name: string } | null

      setQrInfo({
        qrCodeId: data.id,
        venueId: data.venue_id,
        venueName: venue?.name ?? 'Unknown Venue',
        employeeId: data.employee_id,
        employeeName: employee?.name ?? null,
      })
      setQrLoading(false)
    }

    lookupQR()
  }, [shortCode])

  // Create PaymentIntent when user confirms amount
  async function handleProceedToPayment() {
    if (!activeAmount || activeAmount <= 0 || !qrInfo) return

    setPaymentLoading(true)
    setPaymentError(null)

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent?apikey=${anonKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({
          qr_code_id: qrInfo.qrCodeId,
          amount: Math.round(activeAmount * 100), // convert to cents
          tipper_name: tipperName || null,
          tipper_message: tipperMessage || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPaymentError(data.error || 'Failed to initialize payment.')
        setPaymentLoading(false)
        return
      }

      setClientSecret(data.client_secret)
      setPaymentIntentId(data.payment_intent_id)
      setPaymentLoading(false)
    } catch {
      setPaymentError('Network error. Please try again.')
      setPaymentLoading(false)
    }
  }

  // Record tip after payment succeeds
  async function handlePaymentSuccess() {
    if (!paymentIntentId) {
      setSuccess(true)
      return
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/confirm-tip?apikey=${anonKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })
    } catch {
      // Non-critical — webhook will handle it as fallback
    }

    setSuccess(true)
  }

  function handlePresetClick(amount: number) {
    setCustomAmount('')
    setSelectedAmount(amount)
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  // Loading state
  if (qrLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-surface-500">Loading tip page...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (qrError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="glass-premium rounded-2xl p-8 text-center shadow-elevated">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-surface-900">QR Code Not Found</h1>
            <p className="mt-2 text-sm text-surface-500">{qrError}</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="glass-premium rounded-2xl p-8 text-center shadow-elevated">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-surface-900">Thank you!</h1>
            <p className="mt-2 text-sm text-surface-500">
              Your ${activeAmount?.toFixed(2)} tip
              {qrInfo?.employeeName ? ` for ${qrInfo.employeeName}` : ''} has been sent.
            </p>
            <p className="mt-1 text-xs text-surface-400">
              {qrInfo?.venueName} appreciates your generosity.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Payment step (Stripe Elements)
  if (clientSecret) {
    const stripePromise = getStripe()
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-8">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="glass-premium rounded-2xl p-6 sm:p-8 shadow-elevated">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <Heart className="h-7 w-7 text-primary-500" />
              </div>
              <h1 className="mt-3 text-xl font-bold text-surface-900">
                ${activeAmount?.toFixed(2)} Tip
              </h1>
              {qrInfo?.employeeName && (
                <p className="mt-1 text-sm text-primary-600">{qrInfo.employeeName}</p>
              )}
              <p className="mt-0.5 text-xs text-surface-400">{qrInfo?.venueName}</p>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#d4856a',
                    borderRadius: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  },
                },
              }}
            >
              <PaymentForm
                amount={activeAmount!}
                qrInfo={qrInfo!}
                onSuccess={() => handlePaymentSuccess()}
                onCancel={() => setClientSecret(null)}
              />
            </Elements>

            <p className="mt-4 text-center text-[11px] text-surface-400">
              Payments processed securely via Stripe.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Main tip form (amount selection)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        <motion.div variants={fadeInUp} className="glass-premium rounded-2xl p-6 sm:p-8 text-center shadow-elevated">
          {/* Header */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
            <Heart className="h-7 w-7 text-primary-500" />
          </div>

          <h1 className="mt-3 text-xl font-bold text-surface-900 sm:text-2xl">Leave a Tip</h1>

          {qrInfo?.employeeName && (
            <p className="mt-1 text-sm font-medium text-primary-600">{qrInfo.employeeName}</p>
          )}
          <p className="mt-0.5 text-xs text-surface-400">{qrInfo?.venueName}</p>

          {/* Preset amounts */}
          <motion.div variants={fadeInUp} className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={cn(
                  'rounded-xl border-2 px-4 py-3 text-lg font-semibold transition-all',
                  selectedAmount === amount && !customAmount
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                    : 'border-surface-200 text-surface-700 hover:border-primary-300 hover:bg-primary-50/50'
                )}
              >
                ${amount}
              </button>
            ))}
          </motion.div>

          {/* Custom amount */}
          <motion.div variants={fadeInUp} className="mt-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-surface-400">$</span>
              <input
                type="number"
                placeholder="Other amount"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-full rounded-xl border-2 border-surface-200 py-3 pl-9 pr-4 text-center text-lg font-medium transition-colors placeholder:text-surface-300 focus:border-primary-500 focus:ring-0 focus:outline-none"
              />
            </div>
          </motion.div>

          {/* Optional message */}
          <motion.div variants={fadeInUp} className="mt-3">
            {!showMessage ? (
              <button
                onClick={() => setShowMessage(true)}
                className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-500 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Add a message (optional)
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={tipperName}
                  onChange={(e) => setTipperName(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl border border-surface-200 px-4 py-2 text-sm transition-colors focus:border-primary-500 focus:ring-0 focus:outline-none"
                />
                <textarea
                  placeholder="Leave a message..."
                  value={tipperMessage}
                  onChange={(e) => setTipperMessage(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full rounded-xl border border-surface-200 px-4 py-2 text-sm transition-colors resize-none focus:border-primary-500 focus:ring-0 focus:outline-none"
                />
              </div>
            )}
          </motion.div>

          {/* Error */}
          {paymentError && (
            <p className="mt-3 text-sm text-error text-center">{paymentError}</p>
          )}

          {/* Submit */}
          <motion.div variants={fadeInUp}>
            <button
              onClick={handleProceedToPayment}
              disabled={!activeAmount || activeAmount <= 0 || paymentLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3.5 text-sm font-medium text-white shadow-medium transition-all hover:bg-primary-600 hover:shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading payment...
                </>
              ) : activeAmount && activeAmount > 0 ? (
                `Continue — $${activeAmount.toFixed(2)}`
              ) : (
                'Select an amount'
              )}
            </button>
          </motion.div>

          <p className="mt-4 text-[11px] text-surface-400">
            Powered by TipUs. Payments processed securely via Stripe.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
