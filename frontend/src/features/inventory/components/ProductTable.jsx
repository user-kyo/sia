import { useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrency } from '../../../contexts/CurrencyContext'
import { useAppSettings } from '../../../contexts/AppSettingsContext'
import { TableSkeleton } from '../../../components/ui/Skeletons'

const COLS = [
  { key: 'name',         tKey: 'col_product',       width: 'w-[22%]' },
  { key: 'brand',        tKey: 'col_brand',         width: 'w-[12%]' },
  { key: 'category',     tKey: 'col_category',      width: 'w-[12%]' },
  { key: 'cost',         tKey: 'col_cost',          width: 'w-[12%]' },
  { key: 'selling_price', tKey: 'col_selling_price', width: 'w-[12%]' },
  { key: 'quantity',     tKey: 'col_stock',         width: 'w-[14%]' },
]

const DENSITY_CLS = {
  compact:     'py-2',
  default:     'py-3.5',
  comfortable: 'py-5',
}

const CATEGORY_COLORS = {
  Electronics: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  Furniture: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  Clothing: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
}

function stockStatus(qty, reorder, t) {
  if (qty === 0)
    return { dot: 'bg-slate-400 dark:bg-slate-500', text: 'text-slate-500 dark:text-slate-400', label: t('stock_out') }
  if (qty <= reorder)
    return { dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', label: `${qty} ${t('stock_in')}` }
  if (qty <= Math.ceil(reorder * 1.2))
    return { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: `${qty} ${t('stock_in')}` }
  return { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: `${qty} ${t('stock_in')}` }
}

function SortIcon({ colKey, sort }) {
  if (sort.by !== colKey) return <ChevronsUpDown size={11} className="text-slate-400 dark:text-slate-500" />
  return sort.order === 'asc'
    ? <ChevronUp size={11} className="text-indigo-600 dark:text-indigo-400" />
    : <ChevronDown size={11} className="text-indigo-600 dark:text-indigo-400" />
}

export default function ProductTable({
  items = [],
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  sort,
  onSortChange,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onAdjustStock,
  onDelete,
}) {
  const { formatPrice, formatAs, code } = useCurrency()
  const { t, settings } = useAppSettings()
  const rowPad = DENSITY_CLS[settings.tableDensity] || DENSITY_CLS.default
  const loaderRef = useRef(null)

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const handleSort = (key) => {
    onSortChange(
      sort.by === key
        ? { by: key, order: sort.order === 'asc' ? 'desc' : 'asc' }
        : { by: key, order: 'asc' }
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading ? (
        <TableSkeleton key="skeleton-table" rows={5} columns={6} />
      ) : (
        <motion.div 
          key="content-table"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-x-auto relative min-h-[500px]"
        >
      <table className="w-full min-w-[800px] text-left text-sm table-fixed">
        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 transition-colors">
          <tr>
            <th className="w-14 px-6 py-4">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={onSelectAll}
                className="w-4 h-4 rounded bg-white dark:bg-white/5 border-slate-300 dark:border-white/20 cursor-pointer accent-indigo-600 dark:accent-indigo-500 shadow-sm dark:shadow-none"
              />
            </th>
            {COLS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-6 py-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none whitespace-nowrap transition-colors ${col.width || ''}`}
              >
                <span className="flex items-center gap-1">
                  {t(col.tKey)}
                  <SortIcon colKey={col.key} sort={sort} />
                </span>
              </th>
            ))}
            <th className="px-6 py-4 font-semibold text-center transition-colors w-[16%] min-w-[180px]">
              {t('col_actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
          <AnimatePresence>
            {items.map((item, index) => {
              const { dot, text, label } = stockStatus(item.quantity, item.reorder_point, t)
              const isSelected = selectedIds.has(item.id)
              const catColor = CATEGORY_COLORS[item.category] || 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 380, damping: 30 }}
                  className={`transition-colors group relative ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                >
                <td className={`px-6 ${rowPad}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectOne(item.id)}
                    className="w-4 h-4 rounded bg-white dark:bg-white/5 border-slate-300 dark:border-white/20 cursor-pointer accent-indigo-600 dark:accent-indigo-500 shadow-sm dark:shadow-none"
                  />
                </td>
                <td className={`px-6 ${rowPad}`}>
                  <p className="font-semibold text-slate-900 dark:text-slate-200 transition-colors">{item.name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 transition-colors">{item.sku}</p>
                </td>
                <td className={`px-6 ${rowPad}`}>
                  <p className="font-medium text-slate-700 dark:text-slate-200 transition-colors">
                    {item.brand || <span className="text-slate-400 dark:text-slate-600">—</span>}
                  </p>
                </td>
                <td className={`px-6 ${rowPad}`}>
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${catColor} transition-colors`}>
                    {item.category}
                  </span>
                </td>
                <td className={`px-6 ${rowPad} transition-colors`}>
                  {(() => {
                    const stored = item.currency || code
                    const showBoth = stored !== code
                    const val = item.cost ?? 0
                    return showBoth ? (
                      <>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{formatAs(val, stored)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">≈ {formatPrice(val, stored)}</p>
                      </>
                    ) : (
                      <p className="font-medium text-slate-700 dark:text-slate-200">{formatPrice(val)}</p>
                    )
                  })()}
                </td>
                <td className={`px-6 ${rowPad} transition-colors`}>
                  {(() => {
                    const stored = item.currency || code
                    const showBoth = stored !== code
                    const val = item.selling_price || item.price || 0
                    return showBoth ? (
                      <>
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{formatAs(val, stored)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">≈ {formatPrice(val, stored)}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-slate-900 dark:text-slate-200">{formatPrice(val)}</p>
                    )
                  })()}
                </td>
                <td className={`px-6 ${rowPad}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className={`text-sm font-semibold ${text} transition-colors`}>{label}</span>
                  </div>
                </td>
                <td className={`px-6 ${rowPad} text-center`}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit"
                      className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {t('act_edit')}
                    </button>
                    {(!item.supplier_id) && (
                      <button
                        onClick={() => onAdjustStock(item)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        {t('act_adjust')}
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(item)}
                      className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      {t('act_delete')}
                    </button>
                  </div>
                </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>

          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
                {t('inv_no_results')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div ref={loaderRef} className="flex items-center justify-center py-4 gap-2 text-sm text-slate-500 dark:text-slate-400 min-h-[56px] border-t border-slate-200 dark:border-white/5 transition-colors">
        {isFetchingNextPage && (
          <div className="w-4 h-4 border-2 border-slate-200 dark:border-white/10 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin transition-colors" />
        )}
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
