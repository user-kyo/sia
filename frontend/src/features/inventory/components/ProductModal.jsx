import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCurrency } from '../../../contexts/CurrencyContext'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

const UNITS = ['pcs', 'kg', 'box', 'liter', 'set', 'pair']

const EMPTY = {
  name: '', sku: '', category: '', price: '',
  quantity: '', reorder_point: '10', unit: 'pcs', description: '',
  currency: 'PHP', // overwritten by useEffect based on display currency
}

export default function ProductModal({ mode = 'add', product = null, categories = [], onClose, onSubmit, isPending }) {
  const [form, setForm] = useState(EMPTY)
  const [localError, setLocalError] = useState(null)

  const { current: currency, code } = useCurrency()
  const { settings, t } = useAppSettings()

  useEffect(() => {
    if (mode === 'edit' && product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: String(product.price),
        quantity: String(product.quantity),
        reorder_point: String(product.reorder_point),
        unit: product.unit || 'pcs',
        description: product.description || '',
        currency: product.currency || 'PHP',
      })
    } else {
      // Lock the currency to whatever is selected when the modal opens
      setForm({ ...EMPTY, reorder_point: String(settings.defaultReorderPoint), currency: code })
    }
  }, [mode, product]) // intentionally omit `code` — currency is locked at open time

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    try {
      await onSubmit({
        ...(mode === 'edit' && { id: product.id }),
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category.trim(),
        price: parseFloat(form.price),
        currency: form.currency,
        quantity: parseInt(form.quantity, 10),
        reorder_point: parseInt(form.reorder_point, 10),
        unit: form.unit,
        description: form.description.trim() || undefined,
      })
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.'
      setLocalError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5'

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl dark:shadow-none transition-colors duration-300">

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            {mode === 'add' ? t('modal_add_title') : t('modal_edit_title')}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className={labelCls}>{t('field_name')} <span className="text-red-500">*</span></label>
              <input required value={form.name} onChange={set('name')} placeholder='e.g. MacBook Pro 16"' className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>{t('field_sku')}</label>
              <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated" className={inputCls} />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('field_sku_hint')}</p>
            </div>

            <div>
              <label className={labelCls}>{t('field_category')} <span className="text-red-500">*</span></label>
              <input
                required
                list="inv-categories"
                value={form.category}
                onChange={set('category')}
                placeholder="e.g. Electronics"
                className={inputCls}
              />
              <datalist id="inv-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className={labelCls}>
                {t('field_price')} ({form.currency}) <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className={inputCls} />
              {mode === 'edit' && form.currency !== code && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Stored in {form.currency} — conversion shown in inventory table
                </p>
              )}
            </div>

            <div>
              <label className={labelCls}>{t('field_unit')}</label>
              <select value={form.unit} onChange={set('unit')} className={inputCls}>
                {UNITS.map(u => <option key={u} value={u} className="bg-white dark:bg-[#0d0f1a]">{u}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                {mode === 'add' ? t('field_qty_initial') : t('field_qty')} <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="0" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>{t('field_reorder')}</label>
              <input required type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} placeholder="e.g. 10" className={inputCls} />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('field_reorder_hint')}</p>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                {t('field_description')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
              </label>
              <textarea value={form.description} onChange={set('description')} placeholder="Short product description…" rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>

          {localError && (
            <div className="mt-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {localError}
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
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
              {isPending ? t('modal_saving') : mode === 'add' ? t('modal_add_btn') : t('modal_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
