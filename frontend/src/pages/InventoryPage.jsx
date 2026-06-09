import { useState, useEffect } from 'react'
import { Plus, SlidersHorizontal, Download } from 'lucide-react'
import { Search } from 'lucide-react'
import { useToast } from '../components/ui/Toast'
import {
  useInventory, useCategories,
  useCreateProduct, useUpdateProduct, useDeleteProduct, useAdjustStock,
} from '../features/inventory/hooks/useInventory'
import ProductTable from '../features/inventory/components/ProductTable'
import FiltersPanel from '../features/inventory/components/FiltersPanel'
import BulkActionBar from '../features/inventory/components/BulkActionBar'
import ProductModal from '../features/inventory/components/ProductModal'
import StockAdjustModal from '../features/inventory/components/StockAdjustModal'
import DeleteConfirmModal from '../features/inventory/components/DeleteConfirmModal'

function exportToCSV(items, filename) {
  const headers = ['Name', 'SKU', 'Category', 'Price', 'Quantity', 'Reorder Point', 'Unit', 'Description']
  const rows = items.map(i => [
    i.name, i.sku, i.category, i.price, i.quantity, i.reorder_point, i.unit || '', i.description || '',
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ category: '', stockStatus: '', minPrice: '', maxPrice: '' })
  const [sort, setSort] = useState({ by: 'created_at', order: 'desc' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setSelectedIds(new Set()) }, [debouncedSearch, filters, sort])

  const queryFilters = {
    search: debouncedSearch || undefined,
    category: filters.category || undefined,
    stockStatus: filters.stockStatus || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    sortBy: sort.by,
    sortOrder: sort.order,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInventory(queryFilters)
  const { data: categories = [] } = useCategories()

  const allItems = data?.pages.flatMap(p => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  const toast = useToast()

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const adjustMutation = useAdjustStock()

  const closeModal = () => setModal(null)

  const handleSelectAll = () => {
    setSelectedIds(prev =>
      prev.size === allItems.length ? new Set() : new Set(allItems.map(i => i.id))
    )
  }

  const handleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDeleteConfirm = async () => {
    const ids = modal.products.map(p => p.id)
    await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)))
    setSelectedIds(new Set())
    closeModal()
    const count = ids.length
    toast(count === 1 ? `"${modal.products[0].name}" deleted.` : `${count} products deleted.`)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage products, pricing, and view stock levels</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToCSV(allItems, 'inventory.csv')}
            className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          >
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <button
            onClick={() => setModal({ type: 'add' })}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Plus size={15} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or category..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          />
        </div>
        <span className="ml-auto text-sm font-medium text-slate-500 dark:text-slate-400">
          {total.toLocaleString()} Total Products
        </span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onExport={() => exportToCSV(allItems.filter(i => selectedIds.has(i.id)), 'selected.csv')}
          onDelete={() => setModal({ type: 'delete', products: allItems.filter(i => selectedIds.has(i.id)) })}
        />
      )}

      {/* Table */}
      <ProductTable
        items={allItems}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        sort={sort}
        onSortChange={setSort}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        onEdit={product => setModal({ type: 'edit', product })}
        onAdjustStock={product => setModal({ type: 'adjust', product })}
        onDelete={product => setModal({ type: 'delete', products: [product] })}
      />

      {/* Filters panel */}
      <FiltersPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        filters={filters}
        onApply={setFilters}
      />

      {/* Modals */}
      {modal?.type === 'add' && (
        <ProductModal
          mode="add"
          categories={categories}
          onClose={closeModal}
          onSubmit={async data => {
            const result = await createMutation.mutateAsync(data)
            closeModal()
            toast(`"${result.name}" added to inventory!`)
          }}
          isPending={createMutation.isPending}
        />
      )}
      {modal?.type === 'edit' && (
        <ProductModal
          mode="edit"
          product={modal.product}
          categories={categories}
          onClose={closeModal}
          onSubmit={async data => {
            const result = await updateMutation.mutateAsync(data)
            closeModal()
            toast(`"${result.name}" updated successfully.`)
          }}
          isPending={updateMutation.isPending}
        />
      )}
      {modal?.type === 'adjust' && (
        <StockAdjustModal
          product={modal.product}
          onClose={closeModal}
          onSubmit={async data => {
            await adjustMutation.mutateAsync(data)
            closeModal()
            toast(`Stock adjusted for "${modal.product.name}".`)
          }}
          isPending={adjustMutation.isPending}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          products={modal.products}
          onClose={closeModal}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
