import { Trash2 } from 'lucide-react'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

export default function DeleteConfirmModal({ products = [], onClose, onConfirm, isPending }) {
  const isBulk = products.length > 1
  const { t } = useAppSettings()

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-none transition-colors duration-300 p-6">

        <div className="w-11 h-11 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500 dark:text-red-400" />
        </div>

        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight mb-1.5">
          {isBulk ? t('del_bulk_title', { n: products.length }) : t('del_single_title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {isBulk
            ? t('del_bulk_body', { n: products.length })
            : t('del_single_body', { name: products[0]?.name ?? '' })
          }
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            {t('modal_cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
          >
            {isPending ? t('del_deleting') : t('del_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
