import { useState } from 'react'
import { X } from 'lucide-react'

const STOCK_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
]

export default function FiltersPanel({ isOpen, onClose, categories = [], filters, onApply }) {
  const [local, setLocal] = useState({ ...filters })

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
    `px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
      active
        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
        : 'border-slate-200 dark:border-white/20 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
    }`

  return (
    <>
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-72 h-full bg-white dark:bg-[#0f111a] border-l border-slate-200 dark:border-white/10 z-50 flex flex-col shadow-xl transition-colors">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 transition-colors">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-md hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLocal(l => ({ ...l, category: '' }))} className={chip(!local.category)}>
                All
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
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Stock Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STOCK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocal(l => ({ ...l, stockStatus: opt.value }))}
                  className={chip(local.stockStatus === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min $"
                value={local.minPrice}
                onChange={e => setLocal(l => ({ ...l, minPrice: e.target.value }))}
                className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-200 dark:border-white/20 rounded-md text-sm outline-none focus:border-slate-400 dark:focus:border-white/40 bg-transparent text-slate-900 dark:text-white transition-colors"
              />
              <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
              <input
                type="number"
                placeholder="Max $"
                value={local.maxPrice}
                onChange={e => setLocal(l => ({ ...l, maxPrice: e.target.value }))}
                className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-200 dark:border-white/20 rounded-md text-sm outline-none focus:border-slate-400 dark:focus:border-white/40 bg-transparent text-slate-900 dark:text-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-white/10 p-4 flex gap-2 transition-colors">
          <button
            onClick={handleReset}
            className="flex-1 py-2 border border-slate-200 dark:border-white/20 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 bg-slate-900 dark:bg-white rounded-lg text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  )
}
