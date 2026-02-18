import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Building2, Landmark, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface InviteInfo {
  employee_id: string
  employee_name: string
  employee_email: string
  employee_role: string | null
  venue_name: string
  venue_id: string
}

type Step = 'loading' | 'error' | 'signup' | 'bank-details' | 'complete'

export default function EmployeeSetupPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [step, setStep] = useState<Step>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)

  // Sign up form
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')

  // Bank details form
  const [bankBsb, setBankBsb] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankLoading, setBankLoading] = useState(false)
  const [bankError, setBankError] = useState('')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Step 1: Look up the invitation
  useEffect(() => {
    async function lookupInvitation() {
      if (!token) {
        setErrorMsg('Invalid invitation link.')
        setStep('error')
        return
      }

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/accept-invitation?apikey=${anonKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
          body: JSON.stringify({ token, action: 'lookup' }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || 'This invitation link is invalid or has expired.')
          setStep('error')
          return
        }

        setInviteInfo(data)

        // If user is already logged in, skip to bank details
        if (user) {
          setStep('bank-details')
        } else {
          setStep('signup')
        }
      } catch {
        setErrorMsg('Failed to load invitation. Please try again.')
        setStep('error')
      }
    }

    lookupInvitation()
  }, [token, user, supabaseUrl, anonKey])

  // Handle signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteInfo) return

    if (password.length < 8) {
      setSignupError('Password must be at least 8 characters.')
      return
    }

    setSignupLoading(true)
    setSignupError('')

    // Use direct fetch for signup — pass apikey as URL param (browser extensions can strip headers)
    const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup?apikey=${anonKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        email: inviteInfo.employee_email,
        password,
        data: {
          full_name: inviteInfo.employee_name,
          role: 'employee',
        },
      }),
    })

    const signupData = await signupRes.json()

    if (!signupRes.ok) {
      // If user already exists, try signing in
      const errMsg = signupData.msg || signupData.error_description || signupData.message || ''
      if (errMsg.includes('already') || signupRes.status === 422) {
        const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password&apikey=${anonKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            email: inviteInfo.employee_email,
            password,
          }),
        })

        if (!signInRes.ok) {
          const signInErr = await signInRes.json()
          setSignupError(signInErr.error_description || signInErr.msg || 'Invalid email or password.')
          setSignupLoading(false)
          return
        }

        const signInData = await signInRes.json()
        // Set the session in supabase client
        await supabase.auth.setSession({
          access_token: signInData.access_token,
          refresh_token: signInData.refresh_token,
        })
      } else {
        setSignupError(errMsg || 'Failed to create account.')
        setSignupLoading(false)
        return
      }
    } else if (signupData.access_token) {
      // Auto-confirmed signup — set session
      await supabase.auth.setSession({
        access_token: signupData.access_token,
        refresh_token: signupData.refresh_token,
      })
    }

    // Refresh the auth store
    await useAuthStore.getState().refreshUser()

    setSignupLoading(false)
    setStep('bank-details')
  }

  // Handle bank details submission
  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteInfo || !token) return

    const bsbClean = bankBsb.replace(/\D/g, '')
    const accountClean = bankAccountNumber.replace(/\D/g, '')

    if (bsbClean.length !== 6) {
      setBankError('BSB must be 6 digits.')
      return
    }
    if (accountClean.length < 5 || accountClean.length > 10) {
      setBankError('Account number must be 5-10 digits.')
      return
    }
    if (!bankAccountName.trim()) {
      setBankError('Account name is required.')
      return
    }

    setBankLoading(true)
    setBankError('')

    // Get current user ID from local session (no network request needed)
    const session = (await supabase.auth.getSession()).data.session
    const currentUserId = session?.user?.id ?? null

    if (!currentUserId) {
      setBankError('You must be signed in. Please refresh and try again.')
      setBankLoading(false)
      return
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/accept-invitation?apikey=${anonKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
        body: JSON.stringify({
          token,
          action: 'accept',
          user_id: currentUserId,
          bank_bsb: bsbClean,
          bank_account_number: accountClean,
          bank_account_name: bankAccountName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setBankError(data.error || 'Failed to save your details. Please try again.')
        setBankLoading(false)
        return
      }

      setBankLoading(false)
      setStep('complete')
    } catch {
      setBankError('Something went wrong. Please try again.')
      setBankLoading(false)
    }
  }

  // Format BSB as XXX-XXX
  function handleBsbChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    if (digits.length > 3) {
      setBankBsb(`${digits.slice(0, 3)}-${digits.slice(3)}`)
    } else {
      setBankBsb(digits)
    }
  }

  // Loading state
  if (step === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-surface-500">Loading your invitation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="glass-premium rounded-2xl p-8 text-center shadow-elevated">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-surface-900">Invalid Invitation</h1>
            <p className="mt-2 text-sm text-surface-500">{errorMsg}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Complete state
  if (step === 'complete') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full max-w-sm">
          <div className="glass-premium rounded-2xl p-8 text-center shadow-elevated">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-surface-900">You're all set!</h1>
            <p className="mt-2 text-sm text-surface-500">
              Your profile is active and your payout account has been saved.
              You'll start receiving tips at <strong>{inviteInfo?.venue_name}</strong>.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              Go to Login
            </button>
            <p className="mt-4 text-xs text-surface-400">
              Your manager will share a QR code that customers can scan to tip you directly. You're all good to go!
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-surface-900">TipUs</h1>
          {inviteInfo && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-soft">
              <Building2 className="h-4 w-4 text-primary-500" />
              <span className="text-sm font-medium text-surface-700">{inviteInfo.venue_name}</span>
              {inviteInfo.employee_role && (
                <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                  {inviteInfo.employee_role}
                </span>
              )}
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-premium rounded-2xl p-6 sm:p-8 shadow-elevated">
          {/* Step indicators */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
              step === 'signup'
                ? 'bg-primary-500 text-white'
                : 'bg-success text-white'
            )}>
              {step === 'bank-details' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <div className="h-0.5 w-8 bg-surface-200" />
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
              step === 'bank-details'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-200 text-surface-400'
            )}>
              2
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Sign Up */}
            {step === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
              >
                <h2 className="text-lg font-semibold text-surface-900">Create your account</h2>
                <p className="mt-1 text-sm text-surface-500">
                  Hi {inviteInfo?.employee_name}! Set a password to get started.
                </p>

                <div className="mt-5 space-y-4">
                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700">Email</label>
                    <input
                      type="email"
                      value={inviteInfo?.employee_email || ''}
                      disabled
                      className="mt-1 w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-500"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700">Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-surface-200 px-4 py-2.5 pr-10 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-surface-400">At least 8 characters</p>
                  </div>
                </div>

                {signupError && (
                  <p className="mt-3 text-sm text-error">{signupError}</p>
                )}

                <button
                  type="submit"
                  disabled={signupLoading || password.length < 8}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signupLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* Step 2: Bank Details */}
            {step === 'bank-details' && (
              <motion.form
                key="bank"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleBankSubmit}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                    <Landmark className="h-5 w-5 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900">Payout details</h2>
                    <p className="text-sm text-surface-500">Where should we send your tips?</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {/* BSB */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700">BSB</label>
                    <input
                      type="text"
                      value={bankBsb}
                      onChange={(e) => handleBsbChange(e.target.value)}
                      placeholder="000-000"
                      required
                      maxLength={7}
                      className="mt-1 w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-surface-400">6-digit bank-state-branch number</p>
                  </div>

                  {/* Account number */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700">Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Your account number"
                      required
                      className="mt-1 w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Account name */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700">Account Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="Name on your bank account"
                      required
                      className="mt-1 w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                {bankError && (
                  <p className="mt-3 text-sm text-error">{bankError}</p>
                )}

                <button
                  type="submit"
                  disabled={bankLoading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bankLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-[11px] text-surface-400">
                  Your bank details are stored securely and only used for tip payouts.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}
