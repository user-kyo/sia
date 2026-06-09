import { Download, Trash2 } from 'lucide-react'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

export default function BulkActionBar({ count, onExport, onDelete }) {
  const { t } = useAppSettings()

  return (
    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-2.5 mb-4 transition-colors">
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {count === 1 ? t('bulk_selected', { n: count }) : t('bulk_selected_pl', { n: count })}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
        >
          <Download size={12} />
          {t('bulk_export')}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 dark:bg-rose-500/20 border border-transparent dark:border-rose-500/30 rounded-lg text-xs font-medium text-white dark:text-rose-400 hover:bg-red-600 dark:hover:bg-rose-500/30 transition-colors"
        >
          <Trash2 size={12} />
          {t('bulk_delete')}
        </button>
      </div>
    </div>
  )
}
