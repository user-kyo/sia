import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // toast(message)              → success
  // toast(message, 'error')     → red
  // toast(message, 'warning')   → amber
  // toast(message, 'success', { label: 'Undo', onClick: () => {} }) → with action button
  const addToast = useCallback((message, type = 'success', action = null) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, action }])
    // Warnings and actionable toasts stay longer
    setTimeout(() => dismiss(id), type === 'warning' ? 6000 : action ? 6000 : 3500)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const VARIANTS = {
  success: {
    border: 'border-emerald-200 dark:border-emerald-500/30',
    bg:     'bg-white dark:bg-[#0d0f1a]',
    icon:   <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
  },
  error: {
    border: 'border-red-200 dark:border-red-500/30',
    bg:     'bg-white dark:bg-[#0d0f1a]',
    icon:   <XCircle size={16} className="text-red-500 shrink-0" />,
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-500/30',
    bg:     'bg-amber-50 dark:bg-amber-500/10',
    icon:   <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  },
}

function ToastItem({ toast, onDismiss }) {
  const v = VARIANTS[toast.type] ?? VARIANTS.success
  return (
    <div className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium min-w-[280px] max-w-sm ${v.bg} ${v.border}`}>
      <span className="mt-0.5">{v.icon}</span>
      <div className="flex-1 flex flex-col">
        <span className="text-slate-800 dark:text-slate-100 leading-relaxed">{toast.message}</span>
        {toast.action && (
          <button
            onClick={() => { toast.action.onClick(); onDismiss(toast.id); }}
            className="mt-2 w-fit text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
