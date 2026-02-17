import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  User,
  Loader2,
  Save,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useVenueStore } from '@/stores/venueStore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export default function SettingsPage() {
  const venue = useVenueStore((s) => s.venue)
  const updateVenue = useVenueStore((s) => s.updateVenue)
  const user = useAuthStore((s) => s.user)
  const addToast = useUIStore((s) => s.addToast)

  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [venueDescription, setVenueDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (venue) {
      setVenueName(venue.name)
      setVenueAddress(venue.address ?? '')
      setVenueDescription(venue.description ?? '')
    }
  }, [venue])

  async function handleSaveVenue(e: React.FormEvent) {
    e.preventDefault()
    if (!venue?.id || !venueName.trim()) return

    setSaving(true)
    const { error } = await updateVenue({
      name: venueName.trim(),
      address: venueAddress.trim() || null,
      description: venueDescription.trim() || null,
    })

    if (error) {
      addToast({ type: 'error', title: 'Failed to save', description: error })
    } else {
      addToast({ type: 'success', title: 'Venue updated' })
    }
    setSaving(false)
  }

  const inputClass =
    'block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

  return (
    <div>
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Settings</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Manage your venue profile and account settings.
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-5"
      >
        {/* Venue Profile */}
        <motion.div variants={fadeInUp} className="glass-effect rounded-xl">
          <div className="border-b border-surface-200/50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                <Store className="h-4.5 w-4.5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-900">Venue Profile</h2>
                <p className="text-xs text-surface-500">Update your venue information.</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveVenue} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">
                Venue Name *
              </label>
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Your venue name"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="123 Main St, Sydney NSW"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">
                Description
              </label>
              <textarea
                value={venueDescription}
                onChange={(e) => setVenueDescription(e.target.value)}
                placeholder="Tell customers about your venue..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>

        {/* Account */}
        <motion.div variants={fadeInUp} className="glass-effect rounded-xl">
          <div className="border-b border-surface-200/50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-light">
                <User className="h-4.5 w-4.5 text-info" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-900">Account</h2>
                <p className="text-xs text-surface-500">Your account details.</p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-3">
            <div>
              <p className="text-xs font-medium text-surface-500">Name</p>
              <p className="text-sm text-surface-900">{user?.full_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500">Email</p>
              <p className="text-sm text-surface-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-surface-500">Role</p>
              <p className="text-sm text-surface-900 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
