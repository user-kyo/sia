import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

const STOCK_KEYS = [
  { value: '',            tKey: 'filter_all'       },
  { value: 'in_stock',   tKey: 'filter_in_stock'  },
  { value: 'low_stock',  tKey: 'filter_low_stock' },
  { value: 'out_of_stock', tKey: 'filter_out_stock' },
]

export default function FiltersPanel({ isOpen, onClose, categories = [], filters, onApply }) {
  const [local, setLocal] = useState({ ...filters })
  const { t } = useAppSettings()

  if (!isOpen) return null

  const handleReset = () => {
    const reset = { category: '', stockStatus: '', minPrice: '', maxPrice: '' }
    setLocal(reset)
    onApply(reset)
    onClose()
  }

  const handleApply = () => {
    onApply(local)
    onClose()
  }

  const chip = (active) =>
    `px-3 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
      active
        ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white'
        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-700 dark:hover:text-slate-200'
    }`

  const inputCls = 'flex-1 min-w-0 px-3 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md'

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-72 h-full bg-white dark:bg-[#0d0f1a]/95 dark:backdrop-blur-xl border-l border-slate-200 dark:border-white/10 z-50 flex flex-col shadow-xl dark:shadow-none transition-colors duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{t('filter_title')}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

          <div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              {t('filter_category')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLocal(l => ({ ...l, category: '' }))} className={chip(!local.category)}>
                {t('filter_all')}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setLocal(l => ({ ...l, category: cat }))}
                  className={chip(local.category === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              {t('filter_status')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STOCK_KEYS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocal(l => ({ ...l, stockStatus: opt.value }))}
                  className={chip(local.stockStatus === opt.value)}
                >
                  {t(opt.tKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
              {t('filter_price')}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`${t('filter_min')} $`}
                value={local.minPrice}
                onChange={e => setLocal(l => ({ ...l, minPrice: e.target.value }))}
                className={inputCls}
              />
              <span className="text-slate-300 dark:text-slate-600 text-sm font-medium">—</span>
              <input
                type="number"
                placeholder={`${t('filter_max')} $`}
                value={local.maxPrice}
                onChange={e => setLocal(l => ({ ...l, maxPrice: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-white/10 p-4 flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            {t('filter_clear')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
          >
            {t('filter_apply')}
          </button>
        </div>
      </div>
    </>
  )
}
