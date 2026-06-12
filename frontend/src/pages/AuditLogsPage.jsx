import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ShieldAlert, Download, Filter, Search, Trash2, Loader2, AlertTriangle, Lock, Eye, EyeOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'
import { TableSkeleton } from '../components/ui/Skeletons'
import CustomSelect from '../components/ui/CustomSelect'
import { fetchAuditLogs, deleteAuditLog, clearAuditLogs, getAuditChanges, getAuditDescription } from '../features/audit/api/auditApi'

// Time-window options shared by the view filter and the clear-logs scope.
const RANGE_OPTIONS = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

const rangeToDays = (value) => (value === 'all' ? null : Number(value))
const rangeLabel = (value) => RANGE_OPTIONS.find(o => o.value === value)?.label || 'All time'

// Badge colours keyed by audit action. Falls back to a neutral slate badge.
const AMBER_BADGE = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
const INDIGO_BADGE = 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'

const ACTION_BADGE = {
  CREATE: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  UPDATE: AMBER_BADGE,
  UPDATE_STATUS: AMBER_BADGE,
  UPDATE_ROLE: AMBER_BADGE,
  ADJUST_STOCK: AMBER_BADGE,
  DELETE: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
  AUTH: INDIGO_BADGE,
  INVITE: INDIGO_BADGE,
  TRANSFER_OWNERSHIP: INDIGO_BADGE,
}

// Human-friendly wording so the log doesn't read like raw system codes.
const ACTION_LABEL = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  UPDATE_STATUS: 'Status Updated',
  UPDATE_ROLE: 'Role Changed',
  ADJUST_STOCK: 'Stock Adjusted',
  DELETE: 'Deleted',
  AUTH: 'Signed In',
  INVITE: 'Invited',
  TRANSFER_OWNERSHIP: 'Ownership Transferred',
}

const getActionBadge = (action) => (
  ACTION_BADGE[action] || 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
)

const getActionLabel = (action) => (
  ACTION_LABEL[action] ||
  (action || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') ||
  'Activity'
)

const formatTimestamp = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const AuditLogsPage = () => {
  const { t } = useAppSettings()
  const { userRole, user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const isSuperAdmin = userRole === 'super_admin'

  const [searchQuery, setSearchQuery] = useState('')
  const [rangeDays, setRangeDays] = useState('7')
  const [actionFilter, setActionFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [logToDelete, setLogToDelete] = useState(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const filtersRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: logsData = [], isLoading } = useQuery({
    queryKey: ['audit-logs', 'page', rangeDays],
    queryFn: () => fetchAuditLogs({ limit: 200, days: rangeToDays(rangeDays) }),
    // Keep the log live so new activity appears without a reload/re-login.
    staleTime: 0,
    refetchInterval: 4000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  })

  const deleteMut = useMutation({
    mutationFn: deleteAuditLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      setLogToDelete(null)
      toast('Audit log entry deleted.', 'success')
    },
    onError: (err) => {
      toast(err.response?.data?.detail || err.message || 'Failed to delete audit log.', 'error')
    },
  })

  // Clearing every log is destructive, so we require the owner to re-enter
  // their password. Returns an error message string, or null on success.
  const verifyPasswordAndClear = async (password, days) => {
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password,
      })
      if (signInError) {
        return 'The password you entered is incorrect.'
      }
    }

    try {
      await clearAuditLogs({ days })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      setShowClearModal(false)
      toast(days ? 'Selected audit logs cleared.' : 'All audit logs cleared.', 'success')
      return null
    } catch (err) {
      return err.response?.data?.detail || err.message || 'Failed to clear audit logs.'
    }
  }

  const logs = Array.isArray(logsData) ? logsData : []

  // Build the available Action / Module choices from what's actually present.
  const actionOptions = useMemo(() => {
    const present = [...new Set(logs.map(l => l.action).filter(Boolean))].sort()
    return [{ value: 'all', label: 'All actions' }, ...present.map(a => ({ value: a, label: getActionLabel(a) }))]
  }, [logs])

  const moduleOptions = useMemo(() => {
    const present = [...new Set(logs.map(l => l.module).filter(Boolean))].sort()
    return [{ value: 'all', label: 'All modules' }, ...present.map(m => ({ value: m, label: m }))]
  }, [logs])

  const activeFilterCount = (actionFilter !== 'all' ? 1 : 0) + (moduleFilter !== 'all' ? 1 : 0)

  const query = searchQuery.trim().toLowerCase()
  const filteredLogs = logs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false
    if (moduleFilter !== 'all' && log.module !== moduleFilter) return false
    if (query) {
      const haystack = [log.name, log.username, log.action, getActionLabel(log.action), log.module, log.description, getAuditChanges(log).join(' ')]
      if (!haystack.some(field => (field || '').toLowerCase().includes(query))) return false
    }
    return true
  })

  const columnCount = isSuperAdmin ? 7 : 6

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('audit_title')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('audit_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none border ${activeFilterCount > 0 || showFilters
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200'}`}
            >
              <Filter className="w-4 h-4" />
              {t('audit_btn_filters')}
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Filters</h4>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setActionFilter('all'); setModuleFilter('all') }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      >
                        <X className="w-3 h-3" /> Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Action</label>
                      <CustomSelect value={actionFilter} onChange={setActionFilter} options={actionOptions} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Module</label>
                      <CustomSelect value={moduleFilter} onChange={setModuleFilter} options={moduleOptions} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          )}
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Download className="w-4 h-4" />
            {t('audit_btn_export')}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <TableSkeleton key="skeleton-audit" rows={5} columns={5} />
        ) : (
          <motion.div key="content-audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center transition-colors">
          <div className="relative w-72">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('audit_search_ph')}
              className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
            />
          </div>
          <div className="w-44">
            <CustomSelect value={rangeDays} onChange={setRangeDays} options={RANGE_OPTIONS} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 transition-colors">
              <tr>
                <th className="px-6 py-4">{t('audit_col_ts')}</th>
                <th className="px-6 py-4">{t('audit_col_user')}</th>
                <th className="px-6 py-4">{t('audit_col_action')}</th>
                <th className="px-6 py-4">{t('audit_col_module')}</th>
                <th className="px-6 py-4">{t('audit_col_desc')}</th>
                <th className="px-6 py-4">Changes</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              <AnimatePresence>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const changes = getAuditChanges(log)
                    return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3), type: 'spring', stiffness: 380, damping: 30 }}
                      className="group hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors align-top"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">{formatTimestamp(log.created_at)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">{log.name || log.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${getActionBadge(log.action)}`}>{getActionLabel(log.action)}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{log.module}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{getAuditDescription(log)}</td>
                      <td className="px-6 py-4">
                        {changes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {changes.map((change, i) => (
                              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 whitespace-nowrap">
                                {change}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setLogToDelete(log)}
                            title="Delete this entry"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={columnCount} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      {query
                        ? `No audit logs match "${searchQuery}".`
                        : activeFilterCount > 0
                          ? 'No audit logs match the selected filters.'
                          : rangeDays === 'all'
                            ? 'No audit logs recorded yet.'
                            : `No audit logs in the ${rangeLabel(rangeDays).toLowerCase()}.`}
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <span>{t('audit_showing', { from: filteredLogs.length > 0 ? '1' : '0', to: String(filteredLogs.length), total: String(filteredLogs.length) })}</span>
          <div className="flex gap-2">
            <button disabled className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none">{t('audit_prev')}</button>
            <button disabled className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none">{t('audit_next')}</button>
          </div>
        </div>
      </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 flex gap-4 mt-6 transition-colors">
        <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">{t('audit_notice_title')}</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80 mt-1.5 leading-relaxed">
            {t('audit_notice_body')}
          </p>
        </div>
      </div>

      {/* Single entry delete confirmation */}
      {createPortal(
        <AnimatePresence>
          {logToDelete && (
            <ConfirmDeleteModal
              title="Delete this log entry?"
              body={
                <>
                  This permanently removes the entry for{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{logToDelete.name || logToDelete.username}</span>
                  {' '}({getActionLabel(logToDelete.action)} · {logToDelete.module}). This cannot be undone.
                </>
              }
              confirmLabel="Delete entry"
              isPending={deleteMut.isPending}
              onCancel={() => setLogToDelete(null)}
              onConfirm={() => deleteMut.mutate(logToDelete.id)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Clear-all confirmation — requires password re-authentication */}
      {createPortal(
        <AnimatePresence>
          {showClearModal && (
            <ClearLogsModal
              onCancel={() => setShowClearModal(false)}
              onSubmit={verifyPasswordAndClear}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

function ConfirmDeleteModal({ title, body, confirmLabel, isPending, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={isPending ? undefined : onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-sm bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 mx-4 z-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-rose-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isPending ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ClearLogsModal({ onCancel, onSubmit }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [scope, setScope] = useState('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const scopeText = scope === 'all'
    ? 'all audit logs'
    : `audit logs from the ${rangeLabel(scope).toLowerCase()}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Please enter your password to continue.')
      return
    }
    setBusy(true)
    setError('')
    const errMsg = await onSubmit(password, rangeToDays(scope))
    // On success the parent unmounts this modal; only handle the failure case.
    if (errMsg) {
      setError(errMsg)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-sm bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 mx-4 z-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clear audit logs?</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          This permanently deletes{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{scopeText}</span>
          {' '}for your company. This erases the accountability trail and cannot be undone.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Delete logs from
          </label>
          <div className="mb-4">
            <CustomSelect value={scope} onChange={setScope} options={RANGE_OPTIONS} />
          </div>

          <label htmlFor="clear-logs-password" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Confirm your password to continue
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="clear-logs-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
              disabled={busy}
              autoFocus
              placeholder="Enter your password"
              className={`w-full bg-white dark:bg-white/[0.03] border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${error ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/30' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500/30 focus:border-indigo-500'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-2">{error}</p>}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-rose-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {busy ? 'Clearing...' : scope === 'all' ? 'Clear all logs' : 'Clear logs'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default AuditLogsPage
