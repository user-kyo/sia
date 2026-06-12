import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Filter, Check, RotateCcw, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSettings } from '../../../contexts/AppSettingsContext'
import { useCurrency } from '../../../contexts/CurrencyContext'

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

const PRICE_MIN = 0
const PRICE_MAX = 10000
const PRICE_STEP = 10

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

export default function FiltersPanel({ isOpen, onClose, categories = [], brands = [], filters, onApply }) {
  const [local, setLocal] = useState({ 
    categories: filters.categories || [], 
    brands: filters.brands || [],
    stockStatuses: filters.stockStatuses || [], 
    minPrice: filters.minPrice || '', 
    maxPrice: filters.maxPrice || '',
    hasImage: filters.hasImage || false,
    sortBy: filters.sortBy || 'created_at-desc'
  })
  const [activeThumb, setActiveThumb] = useState(null)
  const priceSliderRef = useRef(null)
  const { t } = useAppSettings()
  const { current, code } = useCurrency()
  const currencyLabel = current?.symbol || code || ''
  const currentMinPrice = local.minPrice === '' ? PRICE_MIN : Number(local.minPrice) || PRICE_MIN
  const currentMaxPrice = local.maxPrice === '' ? PRICE_MAX : Number(local.maxPrice) || PRICE_MAX
  const minPercent = ((currentMinPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const maxPercent = ((currentMaxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  const handleReset = () => {
    const reset = { 
      categories: [], brands: [], stockStatuses: [], 
      minPrice: '', maxPrice: '', hasImage: false, sortBy: 'created_at-desc' 
    }
    setLocal(reset)
    onApply(reset)
  }

  const handleApply = () => {
    onApply({
      ...local,
      minPrice: local.minPrice === '' ? '' : String(Math.max(0, Number(local.minPrice) || 0)),
      maxPrice: local.maxPrice === '' ? '' : String(Math.max(0, Number(local.maxPrice) || 0)),
    })
    onClose()
  }

  const priceFromPointer = (event) => {
    const rect = priceSliderRef.current?.getBoundingClientRect()
    if (!rect?.width) return PRICE_MIN
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const rawValue = PRICE_MIN + ratio * (PRICE_MAX - PRICE_MIN)
    return Math.round(rawValue / PRICE_STEP) * PRICE_STEP
  }

  const updatePriceThumb = (thumb, value) => {
    setLocal(l => {
      const minPrice = l.minPrice === '' ? PRICE_MIN : Number(l.minPrice) || PRICE_MIN
      const maxPrice = l.maxPrice === '' ? PRICE_MAX : Number(l.maxPrice) || PRICE_MAX

      if (thumb === 'min') {
        return { ...l, minPrice: String(Math.min(value, maxPrice)) }
      }

      return { ...l, maxPrice: String(Math.max(value, minPrice)) }
    })
  }

  const handlePricePointerDown = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)

    const value = priceFromPointer(event)
    const thumb = Math.abs(value - currentMinPrice) <= Math.abs(value - currentMaxPrice) ? 'min' : 'max'
    setActiveThumb(thumb)
    updatePriceThumb(thumb, value)
  }

  const handlePricePointerMove = (event) => {
    if (!activeThumb || event.buttons !== 1) return
    updatePriceThumb(activeThumb, priceFromPointer(event))
  }

  const handlePricePointerUp = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setActiveThumb(null)
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

          <FilterSection title="Brand">
            {brands.map(brand => {
              const active = local.brands.includes(brand)
              return (
                <CheckboxItem
                  key={brand}
                  label={brand}
                  active={active}
                  onClick={() => setLocal(l => ({
                    ...l,
                    brands: active 
                      ? l.brands.filter(b => b !== brand) 
                      : [...l.brands, brand]
                  }))}
                />
              )
            })}
          </FilterSection>

          <FilterSection title={t('filter_price')}>
            <div className="pt-2 space-y-6">
              {/* Dual Range Slider */}
              <div className="px-2.5">
                <div
                  ref={priceSliderRef}
                  role="presentation"
                  onPointerDown={handlePricePointerDown}
                  onPointerMove={handlePricePointerMove}
                  onPointerUp={handlePricePointerUp}
                  onPointerCancel={handlePricePointerUp}
                  className="relative h-8 flex items-center touch-none select-none cursor-pointer"
                >
                <div className="absolute left-0 right-0 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                <div
                  className="absolute h-1.5 bg-indigo-500 rounded-full"
                  style={{
                    left: `${Math.min(100, Math.max(0, minPercent))}%`,
                    width: `${Math.max(0, Math.min(100, maxPercent) - Math.max(0, minPercent))}%`,
                  }}
                />
                <button
                  type="button"
                  aria-label="Minimum price"
                  onPointerDown={() => setActiveThumb('min')}
                  className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-indigo-600 bg-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${activeThumb === 'min' ? 'z-20 scale-110 cursor-grabbing' : 'z-10 cursor-grab'}`}
                  style={{ left: `${Math.min(100, Math.max(0, minPercent))}%` }}
                />
                <button
                  type="button"
                  aria-label="Maximum price"
                  onPointerDown={() => setActiveThumb('max')}
                  className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-indigo-600 bg-white shadow-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${activeThumb === 'max' ? 'z-20 scale-110 cursor-grabbing' : 'z-10 cursor-grab'}`}
                  style={{ left: `${Math.min(100, Math.max(0, maxPercent))}%` }}
                />
                </div>
              </div>

              {/* Exact Inputs */}
              <div className="flex items-center gap-2">
                <div className="relative flex items-center w-full">
                  <button
                    type="button"
                    onClick={() => setLocal(l => ({ ...l, minPrice: String(Math.max(0, (Number(l.minPrice) || 0) - 10)) }))}
                    className="absolute left-1.5 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    placeholder={`${t('filter_min')} ${currencyLabel}`}
                    value={local.minPrice}
                    onChange={e => setLocal(l => ({ ...l, minPrice: e.target.value }))}
                    className={`${inputCls} px-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setLocal(l => ({ ...l, minPrice: String(Math.min((Number(l.minPrice) || 0) + 10, Number(l.maxPrice) || 10000)) }))}
                    className="absolute right-1.5 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <span className="text-slate-300 dark:text-slate-600 text-sm font-medium">—</span>
                
                <div className="relative flex items-center w-full">
                  <button
                    type="button"
                    onClick={() => setLocal(l => ({ ...l, maxPrice: String(Math.max(Number(l.minPrice) || 0, (Number(l.maxPrice) || 0) - 10)) }))}
                    className="absolute left-1.5 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    placeholder={`${t('filter_max')} ${currencyLabel}`}
                    value={local.maxPrice}
                    onChange={e => setLocal(l => ({ ...l, maxPrice: e.target.value }))}
                    className={`${inputCls} px-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setLocal(l => ({ ...l, maxPrice: String((Number(l.maxPrice) || 0) + 10) }))}
                    className="absolute right-1.5 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
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
