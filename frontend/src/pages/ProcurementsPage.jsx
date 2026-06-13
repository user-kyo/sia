import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, CheckCircle, XCircle, Trash2, Clock, Calendar, ExternalLink, X, ListOrdered, ClipboardList, PackageCheck, PackageOpen, ChevronDown, Package, DollarSign, Folder, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProcurements, createProcurement, updateProcurementStatus, deleteProcurement, updateProcurement } from '../features/procurements/api/procurementsApi'
import { fetchSuppliers } from '../features/suppliers/api/suppliersApi'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useToast } from '../components/ui/Toast'
import CustomSelect from '../components/ui/CustomSelect'
import { supabase } from '../lib/supabase'

const PROCUREMENT_SYNC_CHANNEL = 'sia_procurements_updated'

const StatCard = ({ title, value, icon: Icon, colorClass, onClick }) => {
  const colors = {
    indigo: {
      bg: 'bg-white dark:bg-[#0A0A0B]',
      border: 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30',
      text: 'text-slate-500 dark:text-slate-400',
      glow: 'from-indigo-500/5 to-purple-500/5',
      iconText: 'text-slate-400 dark:text-slate-600'
    },
    emerald: {
      bg: 'bg-white dark:bg-emerald-500/5',
      border: 'border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'from-emerald-500/5 to-teal-500/5',
      iconText: 'text-emerald-500'
    },
    amber: {
      bg: 'bg-white dark:bg-amber-500/5',
      border: 'border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'from-amber-500/5 to-orange-500/5',
      iconText: 'text-amber-500'
    },
    blue: {
      bg: 'bg-white dark:bg-blue-500/5',
      border: 'border-blue-200 dark:border-blue-500/20 hover:border-blue-400 dark:hover:border-blue-500/40',
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'from-blue-500/5 to-cyan-500/5',
      iconText: 'text-blue-500'
    }
  };
  const theme = colors[colorClass] || colors.indigo;

  return (
    <div onClick={onClick} className={`relative h-full w-full rounded-2xl p-5 flex flex-col justify-end group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 shadow-sm overflow-hidden border ${theme.bg} ${theme.border} ${onClick ? 'cursor-pointer' : ''}`}>
      <div className={`absolute -inset-4 bg-gradient-to-br ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg`} />

      <div className={`absolute -top-2 -right-2 p-4 opacity-10 transition-transform duration-500 group-hover:scale-[1.2] group-hover:-rotate-6 ${theme.iconText}`}>
        <Icon size={64} />
      </div>

      <div className={`text-sm font-medium mb-1 relative z-10 ${theme.text} flex items-center justify-between`}>
        <span>{title}</span>
        {onClick && (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <span className="hidden sm:block">Open</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">{value}</div>
    </div>
  );
};

const StatCardSkeleton = () => (
  <div className="relative h-full w-full bg-white dark:bg-[#0A0A0B] rounded-2xl p-5 flex flex-col justify-end border border-slate-200 dark:border-white/10 overflow-hidden min-h-[104px]">
    <div className="absolute -top-2 -right-2 p-4 opacity-5">
      <div className="w-16 h-16 rounded-xl bg-slate-300 dark:bg-white/20 animate-pulse" />
    </div>
    <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md mb-1 relative z-10 animate-pulse" />
    <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-md relative z-10 animate-pulse" />
  </div>
);

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
  const [selectedKpi, setSelectedKpi] = useState(null)
  const [draftToEdit, setDraftToEdit] = useState(null)
  
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
      queryClient.invalidateQueries({ queryKey: ['db-notifications'] })
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

  const stats = {
    total: procurements.length,
    pending: procurements.filter(p => p.status === 'pending_approval').length,
    approved: procurements.filter(p => p.status === 'approved' || p.status === 'invoice_received').length,
    completed: procurements.filter(p => p.status === 'received').length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Refill Procurement & Purchase Orders</h2>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-1">Restock inventory depots through supplier contracts</p>
        </div>
        <button onClick={() => { setInitialProduct(null); setDraftToEdit(null); setIsCreateOpen(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]">
          <Plus className="w-4 h-4" />
          Create Procurement PO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title="Total Orders" value={stats.total} icon={ListOrdered} colorClass="indigo" onClick={() => setSelectedKpi('total')} />
            <StatCard title="Pending Approval" value={stats.pending} icon={Clock} colorClass="amber" onClick={() => setSelectedKpi('pending')} />
            <StatCard title="To Restock" value={stats.approved} icon={PackageOpen} colorClass="blue" onClick={() => setSelectedKpi('approved')} />
            <StatCard title="Completed" value={stats.completed} icon={PackageCheck} colorClass="emerald" onClick={() => setSelectedKpi('completed')} />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedKpi && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedKpi(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#0d0f1a] rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {selectedKpi === 'total' ? 'All Orders' : selectedKpi === 'pending' ? 'Pending Approval Orders' : selectedKpi === 'approved' ? 'To Restock Orders' : 'Completed Orders'}
                </h3>
                <button onClick={() => setSelectedKpi(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {(() => {
                    let list = procurements;
                    if (selectedKpi === 'pending') list = procurements.filter(p => p.status === 'pending_approval');
                    if (selectedKpi === 'approved') list = procurements.filter(p => p.status === 'approved' || p.status === 'invoice_received');
                    if (selectedKpi === 'completed') list = procurements.filter(p => p.status === 'received');
                    
                    if (list.length === 0) return <p className="text-sm text-slate-500">No orders found.</p>;
                    
                    return list.map(po => {
                      const supplierName = supplierMap[po.supplier_id] || 'Unknown Supplier'
                      return (
                        <div key={po.id} onClick={() => { setSelectedKpi(null); setSelectedPO(po); setIsViewOpen(true); }} className="cursor-pointer hover:bg-slate-100 hover:dark:bg-white/[0.04] flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{po.po_number}</span>
                            <span className="text-xs font-medium text-slate-500 mt-0.5">{supplierName}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(po.total_amount, po.currency)}</span>
                            <StatusBadge status={po.status} />
                          </div>
                        </div>
                      )
                    });
                  })()}
                </div>
                <button onClick={() => setSelectedKpi(null)} className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div>
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">Loading...</div>
        ) : procurements.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No procurements found.</div>
        ) : (
          <>
            {(() => {
              const drafts = procurements.filter(p => p.status === 'draft')
              const pendingApproval = procurements.filter(p => p.status === 'pending_approval')
              const toRestock = procurements.filter(p => p.status === 'approved' || p.status === 'invoice_received')
              const completed = procurements.filter(p => p.status === 'received')
              const cancelled = procurements.filter(p => p.status === 'cancelled')

              return (
                <>
                  <CollapsibleSection 
                    title="Pending Approval" 
                    items={pendingApproval} 
                    icon={<Clock size={20} className="text-amber-500" />} 
                    emptyMessage="There are no purchase orders currently waiting for approval." 
                    supplierMap={supplierMap} isAdmin={isAdmin} formatPrice={formatPrice} setPoToDelete={setPoToDelete} deleteMut={deleteMut} updateStatusMut={updateStatusMut} setSelectedPO={setSelectedPO} setIsViewOpen={setIsViewOpen} setDraftToEdit={setDraftToEdit} setIsCreateOpen={setIsCreateOpen}
                  />
                  <CollapsibleSection 
                    title="To Restock" 
                    items={toRestock} 
                    icon={<PackageOpen size={20} className="text-blue-500" />} 
                    emptyMessage="No approved orders are waiting to be restocked right now." 
                    supplierMap={supplierMap} isAdmin={isAdmin} formatPrice={formatPrice} setPoToDelete={setPoToDelete} deleteMut={deleteMut} updateStatusMut={updateStatusMut} setSelectedPO={setSelectedPO} setIsViewOpen={setIsViewOpen} setDraftToEdit={setDraftToEdit} setIsCreateOpen={setIsCreateOpen}
                  />
                  <CollapsibleSection 
                    title="Completed" 
                    items={completed} 
                    icon={<PackageCheck size={20} className="text-emerald-500" />} 
                    emptyMessage="No purchase orders have been completed recently." 
                    supplierMap={supplierMap} isAdmin={isAdmin} formatPrice={formatPrice} setPoToDelete={setPoToDelete} deleteMut={deleteMut} updateStatusMut={updateStatusMut} setSelectedPO={setSelectedPO} setIsViewOpen={setIsViewOpen} setDraftToEdit={setDraftToEdit} setIsCreateOpen={setIsCreateOpen}
                  />
                  <CollapsibleSection 
                    title="Cancelled" 
                    items={cancelled} 
                    icon={<XCircle size={20} className="text-rose-500" />} 
                    emptyMessage="There are no cancelled purchase orders." 
                    supplierMap={supplierMap} isAdmin={isAdmin} formatPrice={formatPrice} setPoToDelete={setPoToDelete} deleteMut={deleteMut} updateStatusMut={updateStatusMut} setSelectedPO={setSelectedPO} setIsViewOpen={setIsViewOpen} setDraftToEdit={setDraftToEdit} setIsCreateOpen={setIsCreateOpen}
                  />
                  <CollapsibleSection 
                    title="Drafts" 
                    items={drafts} 
                    icon={<FileText size={20} className="text-slate-400" />} 
                    emptyMessage="You don't have any saved drafts." 
                    supplierMap={supplierMap} isAdmin={isAdmin} formatPrice={formatPrice} setPoToDelete={setPoToDelete} deleteMut={deleteMut} updateStatusMut={updateStatusMut} setSelectedPO={setSelectedPO} setIsViewOpen={setIsViewOpen} setDraftToEdit={setDraftToEdit} setIsCreateOpen={setIsCreateOpen}
                  />
                </>
              )
            })()}
          </>
        )}
      </div>

      <AnimatePresence>
        {isCreateOpen && <CreateProcurementModal initialProduct={initialProduct} initialDraft={draftToEdit} onClose={() => setIsCreateOpen(false)} />}
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

function CollapsibleSection({ title, items, icon, emptyMessage, supplierMap, isAdmin, formatPrice, setPoToDelete, deleteMut, updateStatusMut, setSelectedPO, setIsViewOpen, setDraftToEdit, setIsCreateOpen }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-10 last:mb-0">
      <div 
        className="flex items-center justify-between cursor-pointer border-b border-slate-200 dark:border-white/10 pb-2 mb-4 group select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          {icon} {title}
          <span className="ml-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-bold">{items.length}</span>
        </h3>
        <button className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {items.length === 0 ? (
              <div className="bg-slate-50/50 dark:bg-white/[0.01] border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center">
                <div className="text-slate-300 dark:text-slate-600 mb-3 opacity-50">{icon}</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{emptyMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-1 pb-4">
                {items.map(po => (
                  <ProcurementCard 
                    key={po.id} 
                    po={po} 
                    supplierMap={supplierMap} 
                    isAdmin={isAdmin} 
                    formatPrice={formatPrice} 
                    setPoToDelete={setPoToDelete} 
                    deleteMut={deleteMut} 
                    updateStatusMut={updateStatusMut} 
                    setSelectedPO={setSelectedPO} 
                    setIsViewOpen={setIsViewOpen}
                    setDraftToEdit={setDraftToEdit}
                    setIsCreateOpen={setIsCreateOpen}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProcurementCard({ po, supplierMap, isAdmin, formatPrice, setPoToDelete, deleteMut, updateStatusMut, setSelectedPO, setIsViewOpen, setDraftToEdit, setIsCreateOpen }) {
  const supplierName = supplierMap[po.supplier_id] || 'Unknown Supplier'
  const isDraft = po.status === 'draft'
  const isPending = po.status === 'pending_approval'
  const isApproved = po.status === 'approved'
  const isInvoiceReceived = po.status === 'invoice_received'
  const isReceived = po.status === 'received'
  const isCancelled = po.status === 'cancelled'
  
  return (
    <div className="bg-white dark:bg-[#12141c] rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
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
      
      <div className="bg-slate-50/80 dark:bg-white/[0.02] p-5 border-t border-slate-50 dark:border-white/5 flex flex-col gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supply Cost</div>
          <div className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">{formatPrice(po.total_amount, po.currency)}</div>
        </div>
        
        {(isDraft || isAdmin) && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-white/5">
          {isDraft && (
            <button
              onClick={() => { setDraftToEdit(po); setIsCreateOpen(true); }}
              className="flex-1 flex justify-center items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FileText size={16} />
              Edit Draft
            </button>
          )}
          {(isReceived || isDraft || isCancelled) && isAdmin && (
            <button
              onClick={() => setPoToDelete(po)}
              disabled={deleteMut.isPending}
              className="flex-1 flex justify-center items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          {isApproved && isAdmin && (
            <div className="flex-1 flex justify-center items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-2 bg-slate-100/50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 whitespace-nowrap shadow-sm">
              <Clock size={16} />
              Waiting for Supplier Invoice...
            </div>
          )}
          {isInvoiceReceived && isAdmin && (
            <>
              {po.invoice_url && (
                <a href={po.invoice_url} target="_blank" rel="noreferrer" className="flex-1 flex justify-center items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl whitespace-nowrap transition-colors">
                  <FileText size={16} />
                  View Invoice
                </a>
              )}
              <button 
                onClick={() => updateStatusMut.mutate({ id: po.id, status: 'received' })}
                disabled={updateStatusMut.isPending}
                className="flex-1 flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
              >
                Stock Received
              </button>
              <button 
                onClick={() => updateStatusMut.mutate({ id: po.id, status: 'cancelled' })}
                disabled={updateStatusMut.isPending}
                className="flex-1 flex justify-center items-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
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
                className="flex-1 flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
              >
                Approve PO
              </button>
              <button 
                onClick={() => updateStatusMut.mutate({ id: po.id, status: 'cancelled' })}
                disabled={updateStatusMut.isPending}
                className="flex-1 flex justify-center items-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          )}
          </div>
        )}
      </div>
    </div>
  )
}

function DeleteCompletedProcurementModal({ po, supplierName, onClose, onConfirm, isPending }) {
  if (!po) return null

  const getMessage = () => {
    if (po.status === 'draft') return { title: 'Delete Draft', desc: 'Are you sure you want to permanently delete this draft purchase order?' }
    if (po.status === 'cancelled') return { title: 'Delete Cancelled PO', desc: 'Are you sure you want to permanently remove this cancelled purchase order from the system?' }
    return { title: 'Delete Completed PO', desc: 'Are you sure you want to delete this received purchase order? This action is irreversible.' }
  }

  const { title, desc } = getMessage()

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md bg-slate-50 dark:bg-[#0A0A0B] border border-transparent dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 md:p-8">
          <div className="mx-auto w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
            <Trash2 className="w-7 h-7 text-rose-600 dark:text-rose-500" />
          </div>
          <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-[15px] text-center text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            {desc}
          </p>
          <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 p-4 rounded-xl mb-8 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500 dark:text-slate-400">PO Number:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{po.po_number}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-slate-500 dark:text-slate-400">Supplier:</span>
              <span className="font-bold text-slate-900 dark:text-white">{supplierName}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(225,29,72,0.2)] dark:shadow-[0_0_15px_rgba(225,29,72,0.2)]"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
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

const Card = ({ title, icon: Icon, children, className = '', action = null, delay = 0, bodyClassName = '' }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }} className={`bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md flex flex-col ${className}`}>
    <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Icon size={16} />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className={`flex-1 flex flex-col min-h-0 ${bodyClassName || 'space-y-4'}`}>
      {children}
    </div>
  </motion.div>
)

function CreateProcurementModal({ onClose, initialProduct = null, initialDraft = null }) {
  const queryClient = useQueryClient()
  const { formatPrice } = useCurrency()
  const { user } = useAuth()
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => fetchSuppliers() })
  const [hasLocalDraft, setHasLocalDraft] = useState(false)
  const [remarks, setRemarks] = useState(() => {
    if (initialDraft?.remarks) return initialDraft.remarks
    if (!initialDraft) return localStorage.getItem('sia_po_draft_remarks') || ''
    return ''
  })
  
  const [selectedSupplier, setSelectedSupplier] = useState(() => {
    if (initialDraft?.supplier_id) return initialDraft.supplier_id
    if (initialProduct?.supplier_id) return initialProduct.supplier_id
    try {
      if (!initialDraft) {
        const draft = localStorage.getItem('sia_po_draft_items')
        if (draft) {
          const parsed = JSON.parse(draft)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].supplier_id) {
            return parsed[0].supplier_id
          }
        }
      }
    } catch (e) {}
    return ''
  })

  const [items, setItems] = useState(() => {
    if (initialDraft?.items?.length) {
      return initialDraft.items.map(i => ({ ...i, _rowId: crypto.randomUUID() }))
    }

    let draftItems = []
    if (!initialDraft) {
      try {
        const draft = localStorage.getItem('sia_po_draft_items')
        if (draft) {
          const parsed = JSON.parse(draft)
          if (Array.isArray(parsed) && parsed.length > 0) {
            draftItems = parsed
          }
        }
      } catch (e) {}
    }

    if (initialProduct) {
      const qtyToOrder = Math.max(1, (initialProduct.reorder_point || 0) - (initialProduct.quantity || 0))
      const price = initialProduct.cost || initialProduct.price || 0
      const newRow = {
        _rowId: crypto.randomUUID(),
        product_id: initialProduct.id,
        product_name: initialProduct.name,
        quantity: qtyToOrder,
        unit_price: price,
        line_total: qtyToOrder * price,
        supplier_id: initialProduct.supplier_id || ''
      }
      if (draftItems.length > 0 && draftItems.some(i => i.product_id && i.product_id !== newRow.product_id)) {
        return [...draftItems, newRow]
      }
      return [newRow]
    }

    if (draftItems.length > 0 && draftItems.some(i => i.product_id)) {
      return draftItems
    }

    return [{ _rowId: crypto.randomUUID(), product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0, supplier_id: '' }]
  })
  const [errorMsg, setErrorMsg] = useState(null)
  const [openDropdownRowIdx, setOpenDropdownRowIdx] = useState(null)

  useEffect(() => {
    if (!initialDraft) {
      const hasData = items.some(i => i.product_id)
      if (hasData || remarks) {
        localStorage.setItem('sia_po_draft_items', JSON.stringify(items))
        localStorage.setItem('sia_po_draft_remarks', remarks)
        setHasLocalDraft(true)
      } else {
        localStorage.removeItem('sia_po_draft_items')
        localStorage.removeItem('sia_po_draft_remarks')
        setHasLocalDraft(false)
      }
    }
  }, [items, remarks, initialDraft])

  const handleClearDraft = () => {
    localStorage.removeItem('sia_po_draft_items')
    localStorage.removeItem('sia_po_draft_remarks')
    setHasLocalDraft(false)
    setItems([{ _rowId: crypto.randomUUID(), product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0, supplier_id: selectedSupplier }])
    setRemarks('')
  }

  const { data: allInvData } = useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => fetchInventory({ limit: 1000 }),
  })

  const activeSuppliers = suppliers.filter(s => s.status?.toLowerCase() !== 'inactive' && s.name !== 'In-House Production')
  const activeSupplierIds = new Set(activeSuppliers.map(s => s.id))

  const availableProducts = allInvData?.data || []

  const createMut = useMutation({ mutationFn: createProcurement })
  const updateMut = useMutation({ mutationFn: updateProcurement })

  const isSaving = createMut.isPending || updateMut.isPending

  const handleItemChange = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].line_total = Number(newItems[index].quantity || 0) * Number(newItems[index].unit_price || 0)
    }
    setItems(newItems)
  }

  const canAddRow = selectedSupplier && availableProducts.filter(p => p.supplier_id === selectedSupplier).length > items.length && items.every(i => i.product_id)
  const addItem = () => {
    if (canAddRow) {
      setItems([...items, { _rowId: crypto.randomUUID(), product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0, supplier_id: selectedSupplier }])
    }
  }
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const totalAmount = items.reduce((sum, item) => sum + item.line_total, 0)

  const handleSubmit = async (e, status) => {
    e.preventDefault()
    
    if (!selectedSupplier) {
      setErrorMsg("Please select a supplier first.")
      return
    }

    if (items.some(i => !i.product_id || i.quantity <= 0)) {
      setErrorMsg("Please ensure all items have a valid product and quantity.")
      return
    }

    const payload = {
      supplier_id: selectedSupplier,
      remarks,
      items: items.map(i => ({ ...i, supplier_id: selectedSupplier })), // Ensure all items have the selected supplier
      total_amount: items.reduce((sum, item) => sum + item.line_total, 0),
      status: status,
      requested_by: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown'
    }

    try {
      if (initialDraft && selectedSupplier === initialDraft.supplier_id) {
        await updateMut.mutateAsync({ id: initialDraft.id, ...payload })
      } else {
        await createMut.mutateAsync(payload)
      }
      
      if (!initialDraft) {
        localStorage.removeItem('sia_po_draft_items')
        localStorage.removeItem('sia_po_draft_remarks')
      }
      queryClient.invalidateQueries({ queryKey: ['procurements'] })
      onClose()
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || err.message || 'Failed to submit PO')
    }
  }

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-white/[0.02]'
  const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`
  const labelCls = 'block text-[14px] font-bold text-slate-700 dark:text-slate-300 mb-1.5'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="relative bg-white dark:bg-[#0A0A0B] border border-transparent dark:border-white/10 rounded-3xl w-full max-w-[98vw] 2xl:max-w-[1600px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[90vh] min-h-[85vh] lg:min-h-[80vh]">
        
        {/* Premium Header */}
        <div className="relative px-8 py-6 bg-slate-50 dark:bg-[#12141c] border-b border-slate-200 dark:border-white/10 shrink-0 z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {initialDraft ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Configure supplier details and add items to your purchase order.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-105 active:scale-95 bg-slate-100 dark:bg-transparent shadow-sm">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={e => handleSubmit(e, 'pending_approval')} className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden h-full custom-scrollbar">
          <div className="p-6 md:p-8 flex-1 relative z-20 flex flex-col bg-slate-50/50 dark:bg-[#0A0A0B]">
            {errorMsg && (
              <div className="mb-6 px-5 py-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 leading-relaxed shadow-sm shrink-0 flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                {errorMsg}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
              
              {/* Left Column (2/3 width) - Order Items */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Supplier Selection Block */}
                <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-visible shrink-0 relative z-20">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-t-2xl">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <PackageOpen size={18} />
                    </div>
                    <h3 className="font-bold text-[15px] text-slate-800 dark:text-white">Select Supplier</h3>
                  </div>
                  <div className="p-5">
                    <label className={labelCls}>Supplier</label>
                    <CustomSelect
                      required
                      value={selectedSupplier}
                      onChange={(e) => {
                        const newSupplier = e?.target ? e.target.value : e;
                        if (selectedSupplier !== newSupplier) {
                          setSelectedSupplier(newSupplier);
                          setItems([{ _rowId: crypto.randomUUID(), product_id: '', product_name: '', quantity: 1, unit_price: 0, line_total: 0, supplier_id: newSupplier }]);
                        }
                      }}
                      options={activeSuppliers.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Choose a supplier first..."
                      className={inputCls}
                      disabled={!!initialDraft || !!initialProduct}
                    />
                    {(initialDraft || initialProduct) && (
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                        <AlertCircle size={12} /> Supplier cannot be changed for this draft or auto-created PO.
                      </p>
                    )}
                  </div>
                </div>

                <div className={`bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-visible relative z-10 ${!selectedSupplier ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02] rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Package size={20} />
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Order Items</h3>
                    </div>
                    <button type="button" onClick={addItem} disabled={!canAddRow} className={`text-sm font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${!canAddRow ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 cursor-not-allowed opacity-60' : 'text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 hover:-translate-y-0.5'}`}>
                      <Plus size={16} /> Add Row
                    </button>
                  </div>
                  
                  <div className="overflow-visible">
                    <table className="w-full text-sm relative min-w-[700px]">
                      <thead className="bg-slate-50/80 dark:bg-[#0A0A0B]/50 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-6 py-4">Item Name</th>
                          <th className="px-6 py-4 w-32">Qty</th>
                          <th className="px-6 py-4 w-40">Unit Cost</th>
                          <th className="px-6 py-4 w-40">Total</th>
                          <th className="px-6 py-4 w-16 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        <AnimatePresence initial={false}>
                          {items.map((item, idx) => (
                            <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} key={item._rowId || idx} className={`group/row relative hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors ${openDropdownRowIdx === idx ? 'z-20' : 'z-0'}`}>
                            <td className="p-4 align-top">
                              <CustomSelect
                                required
                                onOpenChange={(isOpen) => setOpenDropdownRowIdx(isOpen ? idx : null)}
                                value={item.product_id || ''}
                                onChange={val => {
                                  const value = val?.target ? val.target.value : val;
                                  const selected = availableProducts.find(p => p.id === value)
                                  if (selected) {
                                    const newItems = [...items]
                                    newItems[idx].product_id = selected.id
                                    newItems[idx].product_name = selected.name
                                    newItems[idx].unit_price = selected.cost || selected.price || 0
                                    newItems[idx].line_total = newItems[idx].quantity * newItems[idx].unit_price
                                    newItems[idx].supplier_id = selectedSupplier
                                    setItems(newItems)
                                  }
                                }}
                                placeholder="Select product..."
                                options={availableProducts
                                  .filter(p => p.supplier_id === selectedSupplier)
                                  .filter(p => !items.some((i, index) => i.product_id === p.id && index !== idx))
                                  .map(p => ({ value: p.id, label: p.name }))}
                                className={inputCls}
                                disabled={!selectedSupplier}
                              />
                            </td>
                            <td className="p-4 align-top">
                              <input required type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className={numberInputCls} />
                            </td>
                            <td className="p-4 align-top">
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold font-mono">₱</span>
                                <input required type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} className={`${numberInputCls} pl-8 font-mono`} />
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <div className="h-[42px] flex items-center px-4 text-base text-slate-800 dark:text-slate-200 font-mono font-bold">
                                ₱ {item.line_total.toFixed(2)}
                              </div>
                            </td>
                            <td className="p-4 align-top">
                              <div className="h-[42px] flex items-center justify-center">
                                <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl disabled:opacity-30 transition-all hover:scale-110 active:scale-95">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3 width) - Order Details */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-xl shadow-indigo-500/20 p-6 text-white relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <DollarSign size={120} className="-rotate-12 translate-x-4 -translate-y-4" />
                  </div>
                  <h3 className="font-bold text-lg text-indigo-100 mb-6 flex items-center gap-2">
                    <DollarSign size={20} /> Summary
                  </h3>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex justify-between text-sm font-medium text-indigo-100/80">
                      <span>Total Items</span>
                      <span className="text-white font-bold">{items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-indigo-100/80">
                      <span>Currency</span>
                      <span className="text-white font-bold">PHP (₱)</span>
                    </div>
                    <div className="pt-5 mt-1 border-t border-indigo-400/30 flex flex-col gap-1">
                      <span className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Estimated Total</span>
                      <span className="text-4xl font-extrabold tracking-tight">
                        {formatPrice(totalAmount, 'PHP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 min-h-[200px]">
                  <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Folder size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Internal Remarks</h3>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <textarea
                      placeholder="Add any internal notes, supplier instructions, or references here..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full flex-1 px-4 py-4 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md resize-none custom-scrollbar"
                    />
                  </div>
                </div>

              </div>
              
            </div>
          </div>
          
          <div className="flex justify-end gap-4 px-8 py-5 bg-white dark:bg-[#12141c] border-t border-slate-200 dark:border-white/10 shrink-0 z-10 rounded-b-3xl">
            {hasLocalDraft && !initialDraft && (
              <button type="button" onClick={handleClearDraft} className="mr-auto px-6 py-3 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all text-sm font-bold shadow-sm">
                Clear Draft
              </button>
            )}
            <button type="button" onClick={onClose} className="px-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm">
              Cancel
            </button>
            <button type="button" onClick={e => handleSubmit(e, 'draft')} disabled={isSaving} className="px-6 py-3 text-sm font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm border border-transparent dark:border-white/5">
              Save as Draft
            </button>
            <button type="submit" disabled={isSaving} className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-60 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 flex items-center gap-2">
              {isSaving ? 'Processing...' : 'Submit Request'}
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
  const { user } = useAuth()
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

  const getActionTitle = () => {
    if (po.status === 'pending_approval') return 'Review Purchase Order'
    if (po.status === 'approved' || po.status === 'invoice_received') return 'Review & Receive Stocks'
    return 'Purchase Order Details'
  }

  const displayRequestedBy = (!po.requested_by || po.requested_by.toLowerCase() === 'unknown') 
    ? (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown') 
    : po.requested_by;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} className="relative bg-white dark:bg-[#0A0A0B] border border-transparent dark:border-white/10 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[85vh]">
        
        {/* Header with background gradient */}
        <div className="relative px-8 py-6 bg-slate-50 dark:bg-[#12141c] border-b border-slate-200 dark:border-white/10 shrink-0 z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <PackageCheck size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{getActionTitle()}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="font-mono font-semibold text-sm text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-white/5 px-2.5 py-0.5 rounded-md border border-slate-300 dark:border-white/10">{po.po_number}</span>
                  <StatusBadge status={po.status} />
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all hover:scale-105 active:scale-95 bg-slate-100 dark:bg-transparent shadow-sm">
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 relative bg-slate-50/50 dark:bg-[#0A0A0B]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            
            {/* Left Column (2/3 width) - Order Items */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <ListOrdered size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Order Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/80 dark:bg-[#0A0A0B]/50 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="px-6 py-4">Item Name</th>
                        <th className="px-6 py-4 w-32 text-center">Qty</th>
                        <th className="px-6 py-4 w-40 text-right">Unit Price</th>
                        <th className="px-6 py-4 w-40 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {po.items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                <Package size={18} />
                              </div>
                              <span className="text-slate-900 dark:text-slate-200 font-bold">{item.product_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg text-center font-bold text-slate-700 dark:text-slate-300 inline-block w-full">
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono font-medium">{formatPrice(item.unit_price, po.currency)}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200 font-mono">{formatPrice(item.line_total, po.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column (1/3 width) - Order Details */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Folder size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Order Details</h3>
                </div>
                <div className="p-6">
                  {po.status === 'cancelled' && po.cancel_reason && (
                    <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-xl text-sm text-rose-800 dark:text-rose-300 leading-relaxed shadow-sm">
                      <div className="font-bold mb-1 flex items-center gap-2"><AlertCircle size={16}/> Cancellation Reason</div>
                      <p className="opacity-90">{po.cancel_reason}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                        <div className="font-bold">{displayRequestedBy?.charAt(0).toUpperCase() || 'U'}</div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Requested By</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{displayRequestedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Date Created</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{new Date(po.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {po.invoice_url && (
                      <div className="mt-2 pt-5 border-t border-slate-100 dark:border-white/5">
                        <a href={po.invoice_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-xl transition-all hover:-translate-y-0.5 border border-transparent dark:border-indigo-500/10">
                          <FileText size={18} />
                          View Invoice Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl shadow-indigo-500/20 p-6 text-white relative overflow-hidden mt-auto">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <DollarSign size={120} className="-rotate-12 translate-x-4 -translate-y-4" />
                </div>
                <h3 className="font-bold text-lg text-indigo-100 mb-6 flex items-center gap-2">
                  <ClipboardList size={20} /> Summary
                </h3>
                <div className="flex flex-col gap-4 relative z-10">
                  <div className="flex justify-between text-sm font-medium text-indigo-100/80">
                    <span>Total Items</span>
                    <span className="text-white font-bold">{po.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} units</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-indigo-100/80">
                    <span>Currency</span>
                    <span className="text-white font-bold">PHP (₱)</span>
                  </div>
                  <div className="pt-5 mt-1 border-t border-indigo-400/30 flex flex-col gap-1">
                    <span className="text-sm font-bold text-indigo-200 uppercase tracking-wider">Total Amount</span>
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formatPrice(po.total_amount, po.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {isAdmin && (
          <div className="px-8 py-5 bg-white dark:bg-[#12141c] border-t border-slate-200 dark:border-white/10 shrink-0 z-10 flex justify-between items-center rounded-b-3xl">
            {showCancelInput ? (
              <div className="flex-1 flex gap-3 w-full bg-rose-50/50 dark:bg-rose-500/5 p-2 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                <input type="text" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." className="flex-1 px-4 py-3 bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-sm" />
                <button onClick={() => statusMut.mutate({ id: po.id, status: 'cancelled', reason: cancelReason })} disabled={!cancelReason.trim() || statusMut.isPending} className="px-8 py-3 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">Confirm Reject</button>
                <button onClick={() => setShowCancelInput(false)} className="px-8 py-3 border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12141c] rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors shadow-sm">Cancel</button>
              </div>
            ) : (
              <div className="flex gap-4 ml-auto">
                {po.status === 'pending_approval' && (
                  <>
                    <button onClick={() => setShowCancelInput(true)} className="px-8 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-all border border-rose-100 dark:border-rose-500/20 hover:-translate-y-0.5 shadow-sm">Reject Order</button>
                    <button onClick={() => statusMut.mutate({ id: po.id, status: 'approved' })} disabled={statusMut.isPending} className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(79,70,229,0.6)] hover:-translate-y-0.5">
                      Approve & Process Order
                    </button>
                  </>
                )}
                {po.status === 'approved' && (
                  <button disabled className="px-8 py-3 text-sm font-bold bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-xl flex items-center gap-2 cursor-not-allowed border border-slate-200 dark:border-white/10">
                    <Clock size={18} />
                    Waiting for Supplier Invoice...
                  </button>
                )}
                {po.status === 'invoice_received' && (
                  <button onClick={() => statusMut.mutate({ id: po.id, status: 'received' })} disabled={statusMut.isPending} className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 flex items-center gap-2">
                    <PackageCheck size={18} />
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
