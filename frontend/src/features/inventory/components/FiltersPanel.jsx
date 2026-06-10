import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Filter, Check, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

const STOCK_KEYS = [
  { value: '',            tKey: 'filter_all'       },
  { value: 'in_stock',   tKey: 'filter_in_stock'  },
  { value: 'low_stock',  tKey: 'filter_low_stock' },
  { value: 'out_of_stock', tKey: 'filter_out_stock' },
]

const SORT_OPTIONS = [
  { value: 'created_at-desc', label: 'Newest' },
  { value: 'created_at-asc', label: 'Oldest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' }
]

function FilterSection({ title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 dark:border-white/5 py-5 first:pt-2 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group"
      >
        <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-wide uppercase">{title}</span>
        {isOpen ? (
          <ChevronUp size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckboxItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 group text-left"
    >
      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
        active 
          ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white shadow-sm shadow-indigo-600/20 dark:shadow-indigo-500/20' 
          : 'bg-white dark:bg-[#0d0f1a] border-slate-300 dark:border-white/20 text-transparent group-hover:border-indigo-400 dark:group-hover:border-indigo-400'
      }`}>
        <Check size={10} strokeWidth={4} className={active ? "opacity-100" : "opacity-0"} />
      </div>
      <span className={`text-[13px] transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
        {label}
      </span>
    </button>
  )
}

function RadioItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 group text-left"
    >
      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
        active 
          ? 'border-indigo-600 dark:border-indigo-500 shadow-sm shadow-indigo-600/20 dark:shadow-indigo-500/20' 
          : 'bg-white dark:bg-[#0d0f1a] border-slate-300 dark:border-white/20 group-hover:border-indigo-400 dark:group-hover:border-indigo-400'
      }`}>
        {active && <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500" />}
      </div>
      <span className={`text-[13px] transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
        {label}
      </span>
    </button>
  )
}

export default function FiltersPanel({ isOpen, onClose, categories = [], units = [], filters, onApply }) {
  const [local, setLocal] = useState({ 
    categories: filters.categories || [], 
    units: filters.units || [],
    stockStatuses: filters.stockStatuses || [], 
    minPrice: filters.minPrice || '', 
    maxPrice: filters.maxPrice || '',
    hasImage: filters.hasImage || false,
    sortBy: filters.sortBy || 'created_at-desc'
  })
  const [activeThumb, setActiveThumb] = useState(null)
  const { t } = useAppSettings()

  const handleReset = () => {
    const reset = { 
      categories: [], units: [], stockStatuses: [], 
      minPrice: '', maxPrice: '', hasImage: false, sortBy: 'created_at-desc' 
    }
    setLocal(reset)
    onApply(reset)
  }

  const handleApply = () => {
    onApply(local)
    onClose()
  }

  const inputCls = 'w-full px-3.5 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm'

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 right-0 w-[340px] h-full bg-white dark:bg-[#0d0f1a] dark:border-l dark:border-white/10 z-50 flex flex-col shadow-2xl dark:shadow-none rounded-l-2xl overflow-hidden"
          >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-800 dark:text-slate-200" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('filter_title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-full hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-transparent">
          <FilterSection title="Sort By">
            {SORT_OPTIONS.map(opt => (
              <RadioItem
                key={opt.value}
                label={opt.label}
                active={local.sortBy === opt.value}
                onClick={() => setLocal(l => ({ ...l, sortBy: opt.value }))}
              />
            ))}
          </FilterSection>

          <FilterSection title="Media">
            <RadioItem
              label="All Items"
              active={local.hasImage === false}
              onClick={() => setLocal(l => ({ ...l, hasImage: false }))}
            />
            <RadioItem
              label="Has Image"
              active={local.hasImage === true}
              onClick={() => setLocal(l => ({ ...l, hasImage: true }))}
            />
          </FilterSection>

          <FilterSection title={t('filter_category')}>
            {categories.map(cat => {
              const active = local.categories.includes(cat)
              return (
                <CheckboxItem
                  key={cat}
                  label={cat}
                  active={active}
                  onClick={() => setLocal(l => ({
                    ...l,
                    categories: active 
                      ? l.categories.filter(c => c !== cat) 
                      : [...l.categories, cat]
                  }))}
                />
              )
            })}
          </FilterSection>

          <FilterSection title={t('filter_status')}>
            {STOCK_KEYS.filter(opt => opt.value !== '').map(opt => {
              const active = local.stockStatuses.includes(opt.value)
              return (
                <CheckboxItem
                  key={opt.value}
                  label={t(opt.tKey)}
                  active={active}
                  onClick={() => setLocal(l => ({
                    ...l,
                    stockStatuses: active 
                      ? l.stockStatuses.filter(s => s !== opt.value) 
                      : [...l.stockStatuses, opt.value]
                  }))}
                />
              )
            })}
          </FilterSection>

          <FilterSection title="Unit Type">
            {units.map(unit => {
              const active = local.units.includes(unit)
              // Auto-capitalize the unit string
              const displayUnit = unit.charAt(0).toUpperCase() + unit.slice(1)
              return (
                <CheckboxItem
                  key={unit}
                  label={displayUnit}
                  active={active}
                  onClick={() => setLocal(l => ({
                    ...l,
                    units: active 
                      ? l.units.filter(u => u !== unit) 
                      : [...l.units, unit]
                  }))}
                />
              )
            })}
          </FilterSection>

          <FilterSection title={t('filter_price')}>
            <div className="pt-2 space-y-6">
              {/* Dual Range Slider */}
              <div className="relative h-5 flex items-center group">
                <div className="absolute w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                <div 
                  className="absolute h-1.5 bg-indigo-500 rounded-full z-10"
                  style={{ 
                    left: `${Math.min(100, Math.max(0, ((Number(local.minPrice) || 0) / 10000) * 100))}%`, 
                    width: `${Math.max(0, Math.min(100, (((Number(local.maxPrice) || 10000) - (Number(local.minPrice) || 0)) / 10000) * 100))}%` 
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="10"
                  value={Number(local.minPrice) || 0}
                  onChange={e => {
                    const val = Math.min(Number(e.target.value), (Number(local.maxPrice) || 10000));
                    setLocal(l => ({ ...l, minPrice: String(val) }));
                  }}
                  onPointerDown={() => setActiveThumb('min')}
                  className={`absolute w-full appearance-none bg-transparent pointer-events-none h-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing ${activeThumb === 'min' ? 'z-40' : 'z-20'}`}
                />
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="10"
                  value={Number(local.maxPrice) || 10000}
                  onChange={e => {
                    const val = Math.max(Number(e.target.value), (Number(local.minPrice) || 0));
                    setLocal(l => ({ ...l, maxPrice: String(val) }));
                  }}
                  onPointerDown={() => setActiveThumb('max')}
                  className={`absolute w-full appearance-none bg-transparent pointer-events-none h-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing ${activeThumb === 'max' ? 'z-40' : 'z-30'}`}
                />
              </div>

              {/* Exact Inputs */}
              <div className="flex items-center gap-3">
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
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-white/10 p-5 bg-slate-50/50 dark:bg-white/[0.01] flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors active:scale-95 duration-200 shadow-sm"
          >
            <RotateCcw size={15} />
            {t('filter_clear')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-md shadow-indigo-600/20 dark:shadow-indigo-500/20 active:scale-95 duration-200"
          >
            <Check size={16} />
            {t('filter_apply')}
          </button>
        </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
