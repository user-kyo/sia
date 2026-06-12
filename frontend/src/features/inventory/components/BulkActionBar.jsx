import { Download, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

export default function BulkActionBar({ count, onExport, onDelete }) {
  const { t } = useAppSettings()

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="mx-5 mt-4 mb-2 flex items-center gap-3 bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl px-5 py-3 shadow-sm backdrop-blur-sm transition-all">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          {count === 1 ? t('bulk_selected', { n: count }) : t('bulk_selected_pl', { n: count })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shadow-sm active:scale-95"
          >
            <Download size={14} />
            {t('bulk_export')}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 border border-transparent dark:border-rose-500/30 rounded-lg text-xs font-semibold text-white dark:text-rose-400 transition-all shadow-sm active:scale-95"
          >
            <Trash2 size={14} />
            {t('bulk_delete')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
