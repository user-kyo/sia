import { useState } from 'react'
import { X } from 'lucide-react'
import CustomSelect from '../../../components/ui/CustomSelect'
import { motion } from 'framer-motion'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

export default function StockAdjustModal({ product, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({ adjustment_type: 'add', quantity: '', note: '' })
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))
  const { t } = useAppSettings()

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ id: product.id, adjustment_type: form.adjustment_type, quantity: parseInt(form.quantity, 10), note: form.note.trim() || undefined })
  }

  const handleNumberKeyDown = (allowDecimal) => (e) => {
    if (['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)) return;
    if (/[0-9]/.test(e.key)) return;
    if (allowDecimal && e.key === '.' && !e.target.value.includes('.')) return;
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
  }

  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
  const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-none z-10"
      >

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{t('adj_title')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {product?.name} · {t('adj_currently')}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{product?.quantity}</span> {t('adj_in_stock')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className={labelCls}>{t('adj_type')}</label>
            <CustomSelect
              value={form.adjustment_type}
              onChange={(val) => setForm(f => ({ ...f, adjustment_type: val }))}
              options={[
                { value: 'add', label: t('adj_add_stock') },
                { value: 'remove', label: t('adj_remove_stock') },
                { value: 'set', label: t('adj_set_qty') }
              ]}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{t('field_qty')}</label>
            <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} onKeyDown={handleNumberKeyDown(false)} placeholder="0" className={numberInputCls} />
          </div>
          <div>
            <label className={labelCls}>
              {t('field_note')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
            </label>
            <input value={form.note} onChange={set('note')} placeholder={t('field_note_hint')} className={inputCls} />
          </div>

          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {t('modal_cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
            >
              {isPending ? t('modal_saving') : t('modal_confirm')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
