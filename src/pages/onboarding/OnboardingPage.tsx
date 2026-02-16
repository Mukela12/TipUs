import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVenueStore } from '@/stores/venueStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { Loader2, MapPin, FileText, Store, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '@/lib/animations'

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')

  const createVenue = useVenueStore((s) => s.createVenue)
  const loading = useVenueStore((s) => s.loading)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const addToast = useUIStore((s) => s.addToast)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await createVenue(name, address || undefined, description || undefined)

    if (error) {
      addToast({ type: 'error', title: 'Failed to create venue', description: error })
    } else {
      await refreshUser()
      addToast({ type: 'success', title: 'Venue created!', description: `${name} is ready to go.` })
      navigate('/dashboard', { replace: true })
    }
  }

  const inputClass =
    'mt-1.5 block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 via-white to-white px-4 py-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div variants={fadeInUp} className="glass-effect rounded-2xl p-6 shadow-elevated sm:p-8">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              T
            </div>
            <span className="text-xl font-semibold text-surface-900">TipUs</span>
          </div>

          {/* Progress indicator */}
          <div className="mb-5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-primary-500" />
            <div className="h-1.5 flex-1 rounded-full bg-surface-200" />
          </div>

          <h1 className="text-2xl font-bold text-surface-900">Set up your venue</h1>
          <p className="mt-1 text-sm text-surface-500">
            Tell us about your business to get started with digital tipping.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="venueName" className="flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <Store className="h-3.5 w-3.5 text-surface-400" />
                Venue name
              </label>
              <input
                id="venueName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. The Golden Brew"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="venueAddress" className="flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <MapPin className="h-3.5 w-3.5 text-surface-400" />
                Address
                <span className="text-xs text-surface-400 font-normal">(optional)</span>
              </label>
              <input
                id="venueAddress"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="123 Main St, Sydney NSW"
              />
            </div>

            <div>
              <label htmlFor="venueDescription" className="flex items-center gap-1.5 text-sm font-medium text-surface-700">
                <FileText className="h-3.5 w-3.5 text-surface-400" />
                Description
                <span className="text-xs text-surface-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="venueDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="A brief description of your venue"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating venue...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
