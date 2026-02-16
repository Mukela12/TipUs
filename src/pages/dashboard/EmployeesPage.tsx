import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Trash2,
  Loader2,
  X,
  UserCheck,
} from 'lucide-react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { useEmployeeStore } from '@/stores/employeeStore'
import { useVenueStore } from '@/stores/venueStore'
import { useUIStore } from '@/stores/uiStore'

const statusStyles: Record<string, string> = {
  invited: 'bg-warning-light text-warning-dark border border-warning/20',
  active: 'bg-success-light text-success-dark border border-success/20',
  inactive: 'bg-surface-100 text-surface-500 border border-surface-200',
}

export default function EmployeesPage() {
  const venue = useVenueStore((s) => s.venue)
  const {
    employees,
    loading,
    initialized,
    fetchEmployees,
    addEmployee,
    toggleActive,
    deleteEmployee,
  } = useEmployeeStore()
  const addToast = useUIStore((s) => s.addToast)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (venue?.id) fetchEmployees(venue.id)
  }, [venue?.id, fetchEmployees])

  const activeCount = employees.filter((e) => e.is_active).length

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!venue?.id || !name.trim() || !email.trim()) return

    setSubmitting(true)
    const { error } = await addEmployee({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || undefined,
      venue_id: venue.id,
    })
    setSubmitting(false)

    if (error) {
      addToast({ type: 'error', title: 'Failed to add employee', description: error })
    } else {
      addToast({ type: 'success', title: 'Employee added' })
      setName('')
      setEmail('')
      setRole('')
      setShowForm(false)
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await toggleActive(id, !current)
    if (error) {
      addToast({ type: 'error', title: 'Failed to update status', description: error })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const { error } = await deleteEmployee(id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (error) {
      addToast({ type: 'error', title: 'Failed to delete', description: error })
    } else {
      addToast({ type: 'success', title: 'Employee removed' })
    }
  }

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    )
  }

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
          <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">Employees</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            Manage your team members and their access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 px-3 py-1.5 text-xs font-medium text-surface-600">
            <Users className="h-3.5 w-3.5" />
            {employees.length} total
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-light px-3 py-1.5 text-xs font-medium text-success-dark">
            <UserCheck className="h-3.5 w-3.5" />
            {activeCount} active
          </span>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-600 hover:shadow-medium"
          >
            {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Employee'}
          </button>
        </div>
      </motion.div>

      {/* Inline add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleAdd}
            className="overflow-hidden"
          >
            <div className="mt-5 glass-effect rounded-xl p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">
                    Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Bartender"
                    className="block w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-all placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Employee
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {employees.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 glass-effect rounded-xl py-16 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100">
            <Users className="h-7 w-7 text-surface-400" />
          </div>
          <h3 className="text-base font-semibold text-surface-900">No employees yet</h3>
          <p className="mt-1 text-sm text-surface-500">
            Add your first team member to get started.
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-600"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </button>
          )}
        </motion.div>
      )}

      {/* Employee list */}
      {employees.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-6"
        >
          {/* Desktop table */}
          <div className="hidden lg:block glass-effect rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Active
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/40">
                {employees.map((emp) => (
                  <motion.tr
                    key={emp.id}
                    variants={fadeInUp}
                    className="hover:bg-surface-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-surface-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-surface-600">{emp.email}</td>
                    <td className="px-5 py-3.5 text-sm text-surface-600">
                      {emp.role || <span className="text-surface-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                          statusStyles[emp.status] ?? statusStyles.inactive
                        )}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleToggle(emp.id, emp.is_active)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          emp.is_active ? 'bg-success' : 'bg-surface-300'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                            emp.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {confirmDeleteId === emp.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-surface-500">Delete?</span>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            disabled={deletingId === emp.id}
                            className="text-xs font-medium text-error hover:text-error-dark transition-colors"
                          >
                            {deletingId === emp.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Yes'
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-medium text-surface-500 hover:text-surface-700 transition-colors"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(emp.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-error-light hover:text-error transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {employees.map((emp) => (
              <motion.div
                key={emp.id}
                variants={fadeInUp}
                className="glass-effect rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900">{emp.name}</p>
                      <p className="text-xs text-surface-500 truncate">{emp.email}</p>
                      {emp.role && (
                        <p className="text-xs text-surface-400 mt-0.5">{emp.role}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium capitalize shrink-0',
                      statusStyles[emp.status] ?? statusStyles.inactive
                    )}
                  >
                    {emp.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-surface-200/40 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(emp.id, emp.is_active)}
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        emp.is_active ? 'bg-success' : 'bg-surface-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform',
                          emp.is_active ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        )}
                      />
                    </button>
                    <span className="text-xs text-surface-500">
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {confirmDeleteId === emp.id ? (
                    <span className="inline-flex items-center gap-3">
                      <span className="text-xs text-surface-500">Remove?</span>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        disabled={deletingId === emp.id}
                        className="text-xs font-medium text-error"
                      >
                        {deletingId === emp.id ? (
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
                      onClick={() => setConfirmDeleteId(emp.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-error-light hover:text-error transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
