import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Landmark, Loader2, CheckCircle } from 'lucide-react'
import { fadeInUp } from '@/lib/animations'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useEmployeeDashboardStore } from '@/stores/employeeDashboardStore'
import { useUIStore } from '@/stores/uiStore'

export default function EmployeeProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { profile, venueName, updateBankDetails } = useEmployeeDashboardStore()
  const addToast = useUIStore((s) => s.addToast)

  const [bankBsb, setBankBsb] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setBankBsb(profile.bank_bsb ?? '')
      setBankAccountNumber(profile.bank_account_number ?? '')
      setBankAccountName(profile.bank_account_name ?? '')
    }
  }, [profile])

  function handleBsbChange(value: string) {
    // Format BSB: 000-000
    const digits = value.replace(/\D/g, '').slice(0, 6)
    if (digits.length > 3) {
      setBankBsb(`${digits.slice(0, 3)}-${digits.slice(3)}`)
    } else {
      setBankBsb(digits)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.employee_id) return

    setSaving(true)
    const { error } = await updateBankDetails(user.employee_id, {
      bank_bsb: bankBsb,
      bank_account_number: bankAccountNumber,
      bank_account_name: bankAccountName,
    })
    setSaving(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to save', description: error })
    } else {
      addToast({ type: 'success', title: 'Bank details updated' })
    }
  }

  const inputClass =
    'mt-1 w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'
  const readOnlyClass =
    'mt-1 w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-600'

  return (
    <div>
      {/* Header */}
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Profile</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Your account details and payout information.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Personal info — read only */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="glass-effect rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <User className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900">Personal Info</h2>
              <p className="text-xs text-surface-500">Managed by your venue owner</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">Name</label>
              <div className={readOnlyClass}>{profile?.name ?? '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">Email</label>
              <div className={readOnlyClass}>{user?.email ?? '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">Venue</label>
              <div className={readOnlyClass}>{venueName || '—'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">Role</label>
              <div className={readOnlyClass}>{profile?.role ?? 'Employee'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">Member since</label>
              <div className={readOnlyClass}>
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank details — editable */}
        <motion.form
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          onSubmit={handleSave}
          className="glass-effect rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50">
              <Landmark className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900">Payout Details</h2>
              <p className="text-xs text-surface-500">Where your tips are sent</p>
            </div>
          </div>

          <div className="space-y-4">
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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Bank Details
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[11px] text-surface-400">
            Your bank details are stored securely and only used for tip payouts.
          </p>
        </motion.form>
      </div>
    </div>
  )
}
