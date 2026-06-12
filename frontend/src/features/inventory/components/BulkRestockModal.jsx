import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PackagePlus, Truck, AlertCircle, ShoppingCart } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProcurement } from '../../procurements/api/procurementsApi'
import { useToast } from '../../../components/ui/Toast'
import { useCurrency } from '../../../contexts/CurrencyContext'
import CustomSelect from '../../../components/ui/CustomSelect'

export default function BulkRestockModal({ products = [], suppliers = [], onClose }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { formatPrice } = useCurrency()

  // Initialize grouped state
  const initialGroups = useMemo(() => {
    const groups = {}
    products.forEach(p => {
      let sId = p.supplier_id || '__unassigned__'
      const supp = suppliers.find(s => s.id === sId)
      
      let inactiveSupplierWarning = null
      // If the supplier is inactive, force the product to be unassigned
      if (supp && supp.status?.toLowerCase() === 'inactive') {
        sId = '__unassigned__'
        inactiveSupplierWarning = `Original supplier (${supp.name}) is inactive.`
      }

      if (!groups[sId]) {
        groups[sId] = {
          supplier_id: sId,
          supplier_name: sId === '__unassigned__' ? 'Unassigned Supplier' : suppliers.find(s => s.id === sId)?.name || 'Unknown Supplier',
          items: []
        }
      }
      
      const defaultQty = Math.max(1, (p.reorder_point || 10) - (p.quantity || 0))
      const price = p.cost || p.price || p.selling_price || 0
      
      groups[sId].items.push({
        ...p,
        order_quantity: defaultQty,
        unit_price: price,
        line_total: defaultQty * price,
        inactiveSupplierWarning
      })
    })
    return Object.values(groups)
  }, [products, suppliers])

  const [groups, setGroups] = useState(initialGroups)
  const [unassignedSupplierIds, setUnassignedSupplierIds] = useState({}) // product.id -> supplier_id

  const hasUnassigned = groups.some(g => g.supplier_id === '__unassigned__' && g.items.some(i => !unassignedSupplierIds[i.id]))

  const handleQuantityChange = (groupId, productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1)
    setGroups(prev => prev.map(g => {
      if (g.supplier_id !== groupId) return g
      return {
        ...g,
        items: g.items.map(i => {
          if (i.id !== productId) return i
          return { ...i, order_quantity: qty, line_total: qty * i.unit_price }
        })
      }
    }))
  }

  const handleUnassignedSupplierChange = (productId, supplierId) => {
    setUnassignedSupplierIds(prev => ({ ...prev, [productId]: supplierId }))
  }

  const submitMut = useMutation({
    mutationFn: async () => {
      const posToCreate = []

      // Process normal groups
      groups.forEach(g => {
        if (g.supplier_id !== '__unassigned__' && g.items.length > 0) {
          const totalAmount = g.items.reduce((sum, item) => sum + item.line_total, 0)
          posToCreate.push({
            supplier_id: g.supplier_id,
            remarks: 'Auto-generated Bulk Restock PO',
            total_amount: totalAmount,
            items: g.items.map(i => ({
              product_id: i.id,
              product_name: i.name,
              quantity: i.order_quantity,
              unit_price: i.unit_price,
              line_total: i.line_total
            }))
          })
        }
      })

      // Process unassigned items
      const unassignedGroup = groups.find(g => g.supplier_id === '__unassigned__')
      if (unassignedGroup) {
        const itemsBySupplier = {}
        unassignedGroup.items.forEach(i => {
          const sId = unassignedSupplierIds[i.id]
          if (sId) {
            if (!itemsBySupplier[sId]) itemsBySupplier[sId] = []
            itemsBySupplier[sId].push(i)
          }
        })

        Object.keys(itemsBySupplier).forEach(sId => {
          const items = itemsBySupplier[sId]
          const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)
          
          // Check if we already have a PO for this supplier in posToCreate
          const existingPO = posToCreate.find(po => po.supplier_id === sId)
          if (existingPO) {
            existingPO.items.push(...items.map(i => ({
              product_id: i.id,
              product_name: i.name,
              quantity: i.order_quantity,
              unit_price: i.unit_price,
              line_total: i.line_total
            })))
            existingPO.total_amount += totalAmount
          } else {
            posToCreate.push({
              supplier_id: sId,
              remarks: 'Auto-generated Bulk Restock PO',
              total_amount: totalAmount,
              items: items.map(i => ({
                product_id: i.id,
                product_name: i.name,
                quantity: i.order_quantity,
                unit_price: i.unit_price,
                line_total: i.line_total
              }))
            })
          }
        })
      }

      await Promise.all(posToCreate.map(po => createProcurement(po)))
      return posToCreate.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      toast(`Successfully generated ${count} Purchase Order(s).`, 'success')
      onClose()
    },
    onError: (err) => {
      toast(err.response?.data?.detail || err.message || 'Failed to generate POs', 'error')
    }
  })

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={submitMut.isPending ? undefined : onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white dark:bg-[#0d0f1a] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-white/10"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              <PackagePlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Restock (PO)</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Generate purchase orders for selected products</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitMut.isPending}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30 dark:bg-transparent space-y-6">
          {groups.map(group => (
            <div key={group.supplier_id} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-2">
                {group.supplier_id === '__unassigned__' ? (
                  <AlertCircle size={18} className="text-amber-500" />
                ) : (
                  <Truck size={18} className="text-slate-400" />
                )}
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {group.supplier_name}
                </h3>
                <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-600 dark:text-slate-400">
                  {group.items.length} item(s)
                </span>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {group.items.map(item => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white mb-0.5">{item.name}</div>
                      {item.inactiveSupplierWarning && (
                        <div className="text-[11px] font-medium text-rose-500 mb-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {item.inactiveSupplierWarning}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 flex gap-3">
                        <span>Current Stock: <span className={item.quantity <= item.reorder_point ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>{item.quantity}</span></span>
                        <span>Reorder Pt: {item.reorder_point}</span>
                        <span>Unit Price: {formatPrice(item.unit_price)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {group.supplier_id === '__unassigned__' && (
                        <div className="w-[180px]">
                          <CustomSelect
                            value={unassignedSupplierIds[item.id] || ''}
                            onChange={(val) => handleUnassignedSupplierChange(item.id, val)}
                            options={suppliers.filter(s => s.status?.toLowerCase() !== 'inactive').map(s => ({ value: s.id, label: s.name }))}
                            placeholder="Select Supplier"
                            className={`w-full px-3 py-1.5 text-sm bg-amber-50 dark:bg-amber-500/10 border ${!unassignedSupplierIds[item.id] ? 'border-amber-400 ring-1 ring-amber-400' : 'border-amber-200 dark:border-amber-500/20'} rounded-lg text-amber-900 dark:text-amber-200 outline-none focus:ring-2 focus:ring-amber-500/50`}
                            openUpwards={true}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-500 hidden sm:block">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.order_quantity}
                          onChange={(e) => handleQuantityChange(group.supplier_id, item.id, e.target.value)}
                          className="w-20 px-3 py-1.5 bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-lg text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      
                      <div className="w-24 text-right font-semibold text-slate-900 dark:text-white text-sm">
                        {formatPrice(item.line_total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total POs to generate: <span className="text-slate-900 dark:text-white font-bold">{new Set(
              groups.filter(g => g.supplier_id !== '__unassigned__' && g.items.length > 0).map(g => g.supplier_id)
              .concat(Object.values(unassignedSupplierIds))
            ).size}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={submitMut.isPending}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending || hasUnassigned}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:shadow-none transition-all"
            >
              <ShoppingCart size={16} />
              {submitMut.isPending ? 'Generating...' : 'Generate POs'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
