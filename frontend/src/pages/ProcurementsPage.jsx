import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, CheckCircle, XCircle, Trash2, Clock, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProcurements, createProcurement, updateProcurementStatus, deleteProcurement } from '../features/procurements/api/procurementsApi'
import { fetchSuppliers } from '../features/suppliers/api/suppliersApi'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useToast } from '../components/ui/Toast'
import { supabase } from '../lib/supabase'

const PROCUREMENT_SYNC_CHANNEL = 'sia_procurements_updated'

export default function ProcurementsPage() {
  const { userRole } = useAuth()
  const { formatPrice } = useCurrency()
  const toast = useToast()
  const queryClient = useQueryClient()
  const isAdmin = userRole === 'super_admin' || userRole === 'admin'
  
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [poToDelete, setPoToDelete] = useState(null)
  
  const { data: procurements = [], isLoading } = useQuery({
    queryKey: ['procurements'],
    queryFn: () => fetchProcurements(),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    const refreshProcurements = () => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
    }

    const channel = supabase
      .channel('procurements-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procurements' },
        refreshProcurements
      )
      .subscribe()

    const handleStorage = (event) => {
      if (event.key === PROCUREMENT_SYNC_CHANNEL) {
        refreshProcurements()
      }
    }

    const broadcastChannel = 'BroadcastChannel' in window
      ? new BroadcastChannel(PROCUREMENT_SYNC_CHANNEL)
      : null
    broadcastChannel?.addEventListener('message', refreshProcurements)
    window.addEventListener('storage', handleStorage)

    return () => {
      supabase.removeChannel(channel)
      broadcastChannel?.removeEventListener('message', refreshProcurements)
      broadcastChannel?.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [queryClient])

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', { includeDeleted: true }],
    queryFn: () => fetchSuppliers({ includeDeleted: true }),
  })
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]))

  const updateStatusMut = useMutation({
    mutationFn: updateProcurementStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['notification-inventory'] })
    }
  })

  const deleteMut = useMutation({
    mutationFn: deleteProcurement,
    onSuccess: () => {
      const poNumber = poToDelete?.po_number || 'Purchase order'
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      setPoToDelete(null)
      toast(`${poNumber} deleted successfully.`, 'success')
    },
    onError: (err) => {
      toast(err.response?.data?.detail || err.message || 'Failed to delete purchase order', 'error')
    },
  })

  const location = useLocation()
  const [initialProduct, setInitialProduct] = useState(null)

  useEffect(() => {
    if (location.state?.autoCreatePO) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialProduct(location.state.autoCreatePO)
      setIsCreateOpen(true)
      // Clear state manually without triggering React Router navigation loop
      window.history.replaceState({}, document.title)
    }
  }, [location.state?.autoCreatePO])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Refill Procurement & Purchase Orders</h2>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">Restock inventory depots through supplier contracts</p>
        </div>
        <button onClick={() => { setInitialProduct(null); setIsCreateOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]">
          <Plus className="w-4 h-4" />
          Create Procurement PO
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-slate-500">Loading...</div>
        ) : procurements.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500">No procurements found.</div>
        ) : procurements.map(po => {
          const supplierName = supplierMap[po.supplier_id] || 'Unknown Supplier'
          const isPending = po.status === 'pending_approval'
          const isApproved = po.status === 'approved'
          const isInvoiceReceived = po.status === 'invoice_received'
          const isReceived = po.status === 'received'
          
          return (
            <div key={po.id} className="bg-white dark:bg-[#12141c] rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs font-mono font-bold tracking-wider text-slate-300 dark:text-slate-500 mb-2 uppercase">{po.po_number}</div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{supplierName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1.5">
                      <Calendar size={14} />
                      Initiated: {new Date(po.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={po.status} />
                </div>
                
                <div className="mt-6 space-y-3">
                  {po.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2">
                        <span className="text-slate-800 dark:text-slate-500">•</span>
                        {item.product_name}
                      </div>
                      <div className="text-slate-500 font-mono text-xs whitespace-nowrap ml-4 mt-0.5">
                        {item.quantity} units x {formatPrice(item.unit_price, po.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-50/80 dark:bg-white/[0.02] p-5 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supply Cost</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white">{formatPrice(po.total_amount, po.currency)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {isReceived && (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-sm">
                      <CheckCircle size={16} />
                      Stocks Credited
                    </div>
                  )}
                  {isReceived && isAdmin && (
                    <button
                      onClick={() => setPoToDelete(po)}
                      disabled={deleteMut.isPending}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                  {isApproved && isAdmin && (
                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-sm mr-2">
                      <Clock size={16} />
                      Waiting for Supplier
                    </div>
                  )}
                  {isInvoiceReceived && isAdmin && (
                    <>
                      {po.invoice_url && (
                        <a href={po.invoice_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm mr-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                          <FileText size={16} />
                          View Invoice
                        </a>
                      )}
                      <button 
                        onClick={() => updateStatusMut.mutate({ id: po.id, status: 'received' })}
                        disabled={updateStatusMut.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(16,185,129,0.2)]"
                      >
                        Stock Received
                      </button>
                      <button 
                        onClick={() => updateStatusMut.mutate({ id: po.id, status: 'cancelled' })}
                        disabled={updateStatusMut.isPending}
                        className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {isPending && isAdmin && (
                    <>
                      <button 
                        onClick={() => updateStatusMut.mutate({ id: po.id, status: 'approved' })}
                        disabled={updateStatusMut.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]"
                      >
                        Approve PO
                      </button>
                      <button 
                        onClick={() => updateStatusMut.mutate({ id: po.id, status: 'cancelled' })}
                        disabled={updateStatusMut.isPending}
                        className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {isCreateOpen && <CreateProcurementModal initialProduct={initialProduct} onClose={() => setIsCreateOpen(false)} />}
        {isViewOpen && selectedPO && <ViewProcurementModal po={selectedPO} isAdmin={isAdmin} onClose={() => { setIsViewOpen(false); setSelectedPO(null) }} />}
        {poToDelete && (
          <DeleteCompletedProcurementModal
            po={poToDelete}
            supplierName={supplierMap[poToDelete.supplier_id] || 'Unknown Supplier'}
            onClose={() => setPoToDelete(null)}
            onConfirm={() => deleteMut.mutate(poToDelete.id)}
            isPending={deleteMut.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DeleteCompletedProcurementModal({ po, supplierName, onClose, onConfirm, isPending }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#12141c]"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <Trash2 size={20} />
        </div>
        <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">Delete Completed PO</h3>
        <p className="mb-6 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Delete <span className="font-semibold text-slate-700 dark:text-slate-300">{po.po_number}</span> for <span className="font-semibold text-slate-700 dark:text-slate-300">{supplierName}</span>? This removes the completed purchase order from the list. Restocked inventory will not be reversed.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StatusBadge({ status }) {
  const config = {
    draft: { color: 'text-slate-500 border-slate-200 dark:text-slate-400 dark:border-slate-700' },
    pending_approval: { label: 'PENDING', color: 'text-amber-500 border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10' },
    approved: { label: 'APPROVED', color: 'text-indigo-500 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10' },
    invoice_received: { label: 'INVOICED', color: 'text-blue-500 border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10' },
    received: { label: 'COMPLETED', color: 'text-emerald-500 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10' },
    cancelled: { label: 'CANCELLED', color: 'text-rose-500 border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10' }
  }
  const c = config[status] || config.draft
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold tracking-wider border ${c.color}`}>
      {c.label || status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

function CreateProcurementModal({ onClose, initialProduct = null }) {
  const queryClient = useQueryClient()
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => fetchSuppliers() })
  const [supplierId, setSupplierId] = useState(initialProduct?.supplier_id || '')
  const [remarks, setRemarks] = useState('')
  const [items, setItems] = useState(() => {
    if (initialProduct) {
      const qtyToOrder = Math.max(1, (initialProduct.reorder_point || 0) - (initialProduct.quantity || 0))
      const price = initialProduct.cost || initialProduct.price || 0
      return [{
        product_id: initialProduct.id,
        product_name: initialProduct.name,
        quantity: qtyToOrder,
        unit_price: price,
        line_total: qtyToOrder * price
      }]
    }
    return [{ product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0 }]
  })
  const [errorMsg, setErrorMsg] = useState(null)

  const { data: supplierInvData } = useQuery({
    queryKey: ['inventory', 'supplier', supplierId],
    queryFn: () => fetchInventory({ supplierId, limit: 1000 }),
    enabled: !!supplierId,
  })

  const shouldAutofillItems = items.length === 1 && !items[0].product_name && !items[0].product_id

  useEffect(() => {
    if (supplierInvData?.data && shouldAutofillItems) {
      const lowStockItems = supplierInvData.data.filter(i => i.quantity <= i.reorder_point)
      if (lowStockItems.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(lowStockItems.map(i => {
          const qtyToOrder = Math.max(1, i.reorder_point - i.quantity)
          const price = i.cost || i.price || 0
          return {
            product_id: i.id,
            product_name: i.name,
            quantity: qtyToOrder,
            unit_price: price,
            line_total: qtyToOrder * price
          }
        }))
      }
    }
  }, [supplierInvData?.data, supplierId, shouldAutofillItems])

  const handleSupplierChange = (e) => {
    setSupplierId(e.target.value)
    setItems([{ product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0 }])
  }

  const createMut = useMutation({
    mutationFn: createProcurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      onClose()
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to create PO')
    }
  })

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].line_total = Number(newItems[index].quantity || 0) * Number(newItems[index].unit_price || 0)
    }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { product_name: '', quantity: 1, unit_price: 0, line_total: 0 }])
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    createMut.mutate({
      supplier_id: supplierId,
      remarks,
      items,
      total_amount: totalAmount,
      status: 'pending_approval' // Request PO immediately
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
          <h3 className="font-semibold text-slate-900 dark:text-white">Create Purchase Order</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6">
            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400 rounded-xl">
                {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier *</label>
                <select required value={supplierId} onChange={handleSupplierChange} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  <option value="">Select Supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Remarks / Notes</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">Items</label>
                <button type="button" onClick={addItem} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Row</button>
              </div>
              <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] text-left text-xs text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2 w-24">Qty</th>
                      <th className="px-4 py-2 w-32">Unit Cost</th>
                      <th className="px-4 py-2 w-32">Total</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            required
                            value={item.product_id || ''}
                            onChange={e => {
                              const selected = supplierInvData?.data?.find(p => p.id === e.target.value)
                              if (selected) {
                                const newItems = [...items]
                                newItems[idx].product_id = selected.id
                                newItems[idx].product_name = selected.name
                                newItems[idx].unit_price = selected.cost || selected.price || 0
                                newItems[idx].line_total = newItems[idx].quantity * newItems[idx].unit_price
                                setItems(newItems)
                              }
                            }}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 text-slate-900 dark:text-slate-200"
                          >
                            <option value="" disabled>Select product...</option>
                            {supplierInvData?.data?.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2"><input required type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 text-slate-900 dark:text-slate-200" /></td>
                        <td className="p-2"><input required type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-sm px-2 text-slate-900 dark:text-slate-200" /></td>
                        <td className="p-2 px-4 text-slate-500 dark:text-slate-400">{item.line_total.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="text-slate-400 hover:text-rose-500 disabled:opacity-30"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <div className="text-sm">
                  <span className="text-slate-500 dark:text-slate-400 mr-4">Total Amount:</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3 mt-auto">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={createMut.isPending} className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              Submit PO Request
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function ViewProcurementModal({ po, isAdmin, onClose }) {
  const queryClient = useQueryClient()
  const { formatPrice } = useCurrency()
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)

  const statusMut = useMutation({
    mutationFn: updateProcurementStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-paginated'] })
      onClose()
    }
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white font-mono">{po.po_number}</h3>
            <StatusBadge status={po.status} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><XCircle size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {po.status === 'cancelled' && po.cancel_reason && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl text-rose-800 dark:text-rose-300 text-sm">
              <span className="font-bold mr-2">Cancellation Reason:</span> {po.cancel_reason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Requested By</p>
              <p className="font-semibold text-slate-900 dark:text-slate-200">{po.requested_by}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Date Created</p>
              <p className="font-semibold text-slate-900 dark:text-slate-200">{new Date(po.created_at).toLocaleString()}</p>
            </div>
            {po.invoice_url && (
              <div className="col-span-2">
                <p className="text-slate-500 dark:text-slate-400 mb-1">Invoice Document</p>
                <a href={po.invoice_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
                  <FileText size={16} />
                  Open Invoice Link
                </a>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Order Items</h4>
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.03] text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {po.items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-transparent">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-200 font-medium">{item.product_name}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatPrice(item.unit_price, po.currency)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-200">{formatPrice(item.line_total, po.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-white/[0.02]">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">Total Amount:</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400 text-lg">{formatPrice(po.total_amount, po.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex justify-between items-center">
            {showCancelInput ? (
              <div className="flex-1 flex gap-2 w-full">
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                <button onClick={() => statusMut.mutate({ id: po.id, status: 'cancelled', reason: cancelReason })} disabled={!cancelReason.trim() || statusMut.isPending} className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors disabled:opacity-50">Confirm</button>
                <button onClick={() => setShowCancelInput(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2 ml-auto">
                {po.status === 'pending_approval' && (
                  <>
                    <button onClick={() => setShowCancelInput(true)} className="px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">Reject</button>
                    <button onClick={() => statusMut.mutate({ id: po.id, status: 'approved' })} disabled={statusMut.isPending} className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      Approve Order
                    </button>
                  </>
                )}
                {po.status === 'approved' && (
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-sm">
                    <Clock size={16} />
                    Waiting for Supplier Invoice
                  </div>
                )}
                {po.status === 'invoice_received' && (
                  <button onClick={() => statusMut.mutate({ id: po.id, status: 'received' })} disabled={statusMut.isPending} className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(16,185,129,0.2)] dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    Mark as Received (Restock)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
