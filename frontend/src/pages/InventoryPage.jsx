import { useState, useEffect } from 'react'
import { Plus, SlidersHorizontal, Download, FolderPlus, Pencil } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useToast } from '../components/ui/Toast'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import {
  useInventory, useCategories, useBrands,
  useCreateProduct, useUpdateProduct, useDeleteProduct, useAdjustStock, useCreateCategory, useUpdateCategory
} from '../features/inventory/hooks/useInventory'
import ProductTable from '../features/inventory/components/ProductTable'
import FiltersPanel from '../features/inventory/components/FiltersPanel'
import BulkActionBar from '../features/inventory/components/BulkActionBar'
import ProductModal from '../features/inventory/components/ProductModal'
import CategoryModal from '../features/inventory/components/CategoryModal'
import EditCategoryModal from '../features/inventory/components/EditCategoryModal'
import StockAdjustModal from '../features/inventory/components/StockAdjustModal'
import DeleteConfirmModal from '../features/inventory/components/DeleteConfirmModal'
import { useQuery } from '@tanstack/react-query'
import { fetchSuppliers } from '../features/suppliers/api/suppliersApi'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { AlertCircle } from 'lucide-react'

function exportToCSV(items, filename, formatPrice) {
  const headers = ['Name', 'SKU', 'Category', 'Price', 'Quantity', 'Reorder Point', 'Unit', 'Description']
  const rows = items.map(i => [
    i.name, i.sku, i.category, formatPrice(i.price), i.quantity, i.reorder_point, i.unit || '', i.description || '',
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
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ categories: [], brands: [], stockStatuses: [], minPrice: '', maxPrice: '', hasImage: false })
  const [sort, setSort] = useState({ by: 'created_at', order: 'desc' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [hiddenIds, setHiddenIds] = useState(new Set()) // For optimistic UI undo
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [showZeroSupplierModal, setShowZeroSupplierModal] = useState(false)
  const [showZeroCategoryModal, setShowZeroCategoryModal] = useState(false)

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => fetchSuppliers(),
  })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setSelectedIds(new Set()) }, [debouncedSearch, filters, sort])

  const handleAddProductClick = () => {
    if (categories.length === 0) {
      setShowZeroCategoryModal(true)
      return
    }
    
    if (!suppliersLoading && suppliers.length === 0) {
      setShowZeroSupplierModal(true)
    } else {
      setModal({ type: 'add' })
    }
  }

  const queryFilters = {
    search: debouncedSearch || undefined,
    category: filters.categories?.length > 0 ? filters.categories.join(',') : undefined,
    brand: filters.brands?.length > 0 ? filters.brands.join(',') : undefined,
    stockStatus: filters.stockStatuses?.length > 0 ? filters.stockStatuses.join(',') : undefined,
    hasImage: filters.hasImage ? true : undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    sortBy: sort.by,
    sortOrder: sort.order,
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInventory(queryFilters)
  const { data: categories = [] } = useCategories()
  const { data: brands = [] } = useBrands()

  const allItemsRaw = data?.pages.flatMap(p => p.data) ?? []
  const allItems = allItemsRaw.filter(i => !hiddenIds.has(i.id))
  const total = (data?.pages[0]?.total ?? 0) - hiddenIds.size

  const toast = useToast()
  const { formatPrice } = useCurrency()
  const { t } = useAppSettings()

  const createMutation = useCreateProduct()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
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

  const handleDeleteConfirm = () => {
    const ids = modal.products.map(p => p.id)
    const count = ids.length
    
    // Optimistically hide
    setHiddenIds(prev => new Set([...prev, ...ids]))
    setSelectedIds(new Set())
    closeModal()

    // Setup delayed delete
    const timerId = setTimeout(() => {
      Promise.all(ids.map(id => deleteMutation.mutateAsync(id))).catch(console.error)
      setHiddenIds(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }, 5000)

    toast(
      count === 1 ? `"${modal.products[0].name}" deleted.` : `${count} products deleted.`,
      'success',
      {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timerId)
          setHiddenIds(prev => {
            const next = new Set(prev)
            ids.forEach(id => next.delete(id))
            return next
          })
          toast('Action undone. Product restored.', 'success')
        }
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('inv_title')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('inv_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          >
            <SlidersHorizontal size={15} />
            {t('inv_filters')}
          </button>
          <button
            onClick={() => setIsEditCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          >
            <Pencil size={15} />
            Edit Category
          </button>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none"
          >
            <FolderPlus size={15} />
            Add Category
          </button>
          <button
            onClick={handleAddProductClick}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Plus size={15} />
            {t('inv_add')}
          </button>
        </div>
      </div>

      {/* Main Table Card Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300"
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('inv_search')}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-full sm:w-auto text-left sm:text-right">
            {total.toLocaleString()} {t('inv_total')}
          </span>
        </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onExport={() => exportToCSV(allItems.filter(i => selectedIds.has(i.id)), 'selected.csv', formatPrice)}
          onDelete={() => setModal({ type: 'delete', products: allItems.filter(i => selectedIds.has(i.id)) })}
        />
      )}

      {/* Table */}
      <div className="relative">
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
      </div>
      </motion.div>

      {/* Filters panel */}
      <FiltersPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories.map(c => c.name)}
        brands={brands}
        filters={{ ...filters, sortBy: `${sort.by}-${sort.order}` }}
        onApply={(f) => {
          setFilters(f)
          if (f.sortBy) {
            const [by, order] = f.sortBy.split('-')
            setSort({ by, order })
          }
        }}
      />

      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryModal
            onClose={() => setIsCategoryModalOpen(false)}
            isPending={createCategoryMutation.isPending}
            existingCategories={categories.map(c => c.name)}
            onSubmit={async data => {
              await createCategoryMutation.mutateAsync(data)
              setIsCategoryModalOpen(false)
              toast('Category created successfully.')
            }}
          />
        )}
        
        {isEditCategoryModalOpen && (
          <EditCategoryModal
            onClose={() => setIsEditCategoryModalOpen(false)}
            isPending={updateCategoryMutation.isPending}
            existingCategories={categories}
            onSubmit={async data => {
              await updateCategoryMutation.mutateAsync(data)
              setIsEditCategoryModalOpen(false)
              toast('Category updated successfully.')
            }}
          />
        )}

        {showZeroCategoryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Categories Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                You must add at least one category before creating a product.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setShowZeroCategoryModal(false); setIsCategoryModalOpen(true); }} className="w-full py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  Go to Add Category
                </button>
                <button onClick={() => setShowZeroCategoryModal(false)} className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showZeroSupplierModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-white/10 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500 mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Suppliers Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {userRole === 'admin' || userRole === 'super_admin' 
                  ? "You must set up at least one Supplier before adding inventory items."
                  : "Please contact an Administrator to add a Supplier to the system before creating products."}
              </p>
              <div className="flex flex-col gap-3">
                {(userRole === 'admin' || userRole === 'super_admin') && (
                  <button onClick={() => navigate('/suppliers')} className="w-full py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    Go to Suppliers Directory
                  </button>
                )}
                <button onClick={() => setShowZeroSupplierModal(false)} className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {modal?.type === 'add' && (
        <ProductModal
          mode="add"
          categories={categories}
          suppliers={suppliers}
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
          suppliers={suppliers}
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
