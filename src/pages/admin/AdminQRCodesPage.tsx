import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  X,
  Eye,
  Download,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn, downloadQRCodeAsPng } from '@/lib/utils'
import { useAdminStore } from '@/stores/adminStore'
import { useUIStore } from '@/stores/uiStore'
import { supabase } from '@/lib/supabase'
import type { Venue, Employee } from '@/types'

const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export default function AdminQRCodesPage() {
  const {
    allQRCodes,
    loading,
    fetchQRCodesForVenue,
    createQRCodeForVenue,
    toggleQRCodeActive,
    deleteQRCodeAdmin,
  } = useAdminStore()
  const addToast = useUIStore((s) => s.addToast)

  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch venues list on mount
  useEffect(() => {
    async function loadVenues() {
      const { data } = await supabase
        .from('venues')
        .select('*')
        .order('name')
      setVenues(data ?? [])
    }
    loadVenues()
  }, [])

  // Fetch QR codes + employees when venue changes
  useEffect(() => {
    if (selectedVenueId) {
      fetchQRCodesForVenue(selectedVenueId)
      supabase
        .from('employees')
        .select('*')
        .eq('venue_id', selectedVenueId)
        .order('name')
        .then(({ data }) => setEmployees(data ?? []))
    }
  }, [selectedVenueId, fetchQRCodesForVenue])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVenueId) return

    setSubmitting(true)
    const { error } = await createQRCodeForVenue({
      venue_id: selectedVenueId,
      label: label.trim() || undefined,
      employee_id: employeeId || undefined,
    })
    setSubmitting(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to create QR code', description: error })
    } else {
      addToast({ type: 'success', title: 'QR code created' })
      setLabel('')
      setEmployeeId('')
      setShowForm(false)
    }
  }

  async function handleCopyUrl(shortCode: string, id: string) {
    const url = `${appUrl}/tip/${shortCode}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      addToast({ type: 'error', title: 'Failed to copy URL' })
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await toggleQRCodeActive(id, !current)
    if (error) {
      addToast({ type: 'error', title: 'Failed to update', description: error })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await deleteQRCodeAdmin(id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (error) {
      addToast({ type: 'error', title: 'Failed to delete', description: error })
    } else {
      addToast({ type: 'success', title: 'QR code deleted' })
    }
  }

  const inputClass =
    'block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none'

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
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">QR Codes</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Manage QR codes for all venues.
          </p>
        </div>
        {selectedVenueId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:shadow-medium self-start"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Create QR Code'}
          </button>
        )}
      </motion.div>

      {/* Venue selector */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mt-5"
      >
        <label className="block text-xs font-medium text-surface-600 mb-1.5">
          Select Venue
        </label>
        <select
          value={selectedVenueId}
          onChange={(e) => {
            setSelectedVenueId(e.target.value)
            setShowForm(false)
          }}
          className={cn(inputClass, 'max-w-md')}
        >
          <option value="">Choose a venue...</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && selectedVenueId && (
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
                    Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Bar Counter, Table 5"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Assign to Employee
                  </label>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Venue-wide (no specific employee)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create QR Code
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* No venue selected */}
      {!selectedVenueId && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <QrCode className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">Select a venue</h3>
          <p className="mt-1 text-sm text-surface-500">
            Choose a venue above to manage its QR codes.
          </p>
        </motion.div>
      )}

      {/* Empty state for selected venue */}
      {selectedVenueId && !loading && allQRCodes.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <QrCode className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No QR codes</h3>
          <p className="mt-1 text-sm text-surface-500">
            Create the first QR code for this venue.
          </p>
        </motion.div>
      )}

      {/* Loading */}
      {selectedVenueId && loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      )}

      {/* QR code grid */}
      {selectedVenueId && !loading && allQRCodes.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {allQRCodes.map((qr) => {
            const tipUrl = `${appUrl}/tip/${qr.short_code}`
            return (
              <motion.div
                key={qr.id}
                variants={fadeInUp}
                className={cn(
                  'glass-effect rounded-xl p-5 transition-opacity',
                  !qr.is_active && 'opacity-60'
                )}
              >
                {/* QR preview */}
                <div className="flex justify-center mb-4">
                  <div className="rounded-xl bg-white p-3 shadow-soft">
                    <QRCodeSVG
                      id={`qr-${qr.id}`}
                      value={tipUrl}
                      size={140}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-surface-900">
                    {qr.label || 'Untitled'}
                  </p>
                  <p className="text-xs text-surface-400 font-mono mt-0.5">
                    {qr.short_code}
                  </p>
                  {qr.employee_name && (
                    <p className="text-xs text-surface-500 mt-1">
                      Assigned to {qr.employee_name}
                    </p>
                  )}
                </div>

                {/* Stats + actions */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-surface-500">
                    <Eye className="h-3.5 w-3.5" />
                    {qr.scan_count} scans
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const venue = venues.find((v) => v.id === selectedVenueId)
                        const venueName = venue?.name ?? 'venue'
                        const label = qr.label ? `${venueName}-${qr.label}` : venueName
                        downloadQRCodeAsPng(`qr-${qr.id}`, label.replace(/\s+/g, '-').toLowerCase())
                      }}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                      title="Download QR code"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleCopyUrl(qr.short_code, qr.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                      title="Copy tip URL"
                    >
                      {copiedId === qr.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleToggle(qr.id, qr.is_active)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        qr.is_active ? 'bg-success' : 'bg-surface-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                          qr.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        )}
                      />
                    </button>

                    {confirmDeleteId === qr.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(qr.id)}
                          disabled={deletingId === qr.id}
                          className="text-xs font-medium text-error"
                        >
                          {deletingId === qr.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Yes'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs font-medium text-surface-500"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(qr.id)}
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-error-light hover:text-error transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
