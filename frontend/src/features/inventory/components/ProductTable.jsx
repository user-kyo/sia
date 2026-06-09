import { useRef, useEffect } from 'react'
import { Edit2, BarChart2, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const COLS = [
  { key: 'name', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'quantity', label: 'Stock Level' },
]

const CATEGORY_COLORS = {
  Electronics: 'bg-blue-50 text-blue-700',
  Furniture: 'bg-green-50 text-green-700',
  Clothing: 'bg-purple-50 text-purple-700',
}

function stockStatus(qty, reorder) {
  if (qty === 0)
    return { dot: 'bg-slate-400', text: 'text-slate-400', label: 'Out of stock' }
  if (qty <= reorder)
    return { dot: 'bg-red-500', text: 'text-red-500', label: `${qty} in stock` }
  if (qty <= Math.ceil(reorder * 1.2))
    return { dot: 'bg-amber-400', text: 'text-amber-600', label: `${qty} in stock` }
  return { dot: 'bg-emerald-500', text: 'text-slate-700', label: `${qty} in stock` }
}

function SortIcon({ colKey, sort }) {
  if (sort.by !== colKey) return <ChevronsUpDown size={11} className="text-slate-300" />
  return sort.order === 'asc'
    ? <ChevronUp size={11} className="text-indigo-500" />
    : <ChevronDown size={11} className="text-indigo-500" />
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="border-b border-slate-100">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-900"
              />
            </th>
            {COLS.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  <SortIcon colKey={col.key} sort={sort} />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map(item => {
            const { dot, text, label } = stockStatus(item.quantity, item.reorder_point)
            const isSelected = selectedIds.has(item.id)
            const catColor = CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-700'
            return (
              <tr
                key={item.id}
                className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}`}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectOne(item.id)}
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-slate-900"
                  />
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{item.sku}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border border-transparent ${catColor}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-900">
                  ${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className={`text-sm font-medium ${text}`}>{label}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => onAdjustStock(item)}
                      title="Adjust Stock"
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"
                    >
                      <BarChart2 size={12} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center text-slate-400 text-sm">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div ref={loaderRef} className="flex items-center justify-center py-4 gap-2 text-sm text-slate-400 min-h-[56px]">
        {isFetchingNextPage && (
          <>
            <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
            Loading more products…
          </>
        )}
      </div>
    </div>
  )
}
