import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, signUp, loading, user } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'employee' ? '/employee' : '/dashboard', { replace: true })
    }
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = isSignUp
      ? await signUp(email, password, fullName)
      : await signIn(email, password)

    if (result.error) {
      addToast({ type: 'error', title: 'Authentication failed', description: result.error })
    } else if (isSignUp) {
      addToast({ type: 'success', title: 'Account created', description: 'Check your email to verify your account.' })
    }
    // Redirect is handled by the useEffect watching user state
  }

  const inputClass =
    'mt-1.5 block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-5 py-8 sm:px-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div variants={fadeInUp}>
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-surface-500 transition-colors hover:text-surface-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp} className="glass-effect rounded-2xl p-5 shadow-elevated sm:p-8">
          <div className="mb-6 flex items-center gap-2.5">
            <img src="/savings.png" alt="TipUs" className="h-9 w-9 rounded-lg" />
            <span className="text-xl font-semibold text-surface-900">TipUs</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            {isSignUp
              ? 'Set up your venue and start accepting digital tips.'
              : 'Sign in to manage your venue and tips.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="fullName" className="block text-sm font-medium text-surface-700">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter your password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-surface-400 hover:text-surface-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-surface-400">At least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
