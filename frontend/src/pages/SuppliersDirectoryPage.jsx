import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit2, Trash2, X, Package, Clock, Box, ShoppingCart, ChevronRight, ChevronLeft, Users, CheckCircle, XCircle, ArrowUpDown, ShieldAlert, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../features/suppliers/api/suppliersApi'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { fetchProcurements } from '../features/procurements/api/procurementsApi'
import { useCurrency } from '../contexts/CurrencyContext'
import { useToast } from '../components/ui/Toast'
import CustomSelect from '../components/ui/CustomSelect'

const Card = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col ${className}`}>
    <div className="flex items-center gap-2 mb-3 shrink-0">
      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <Icon size={16} />
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
    </div>
    <div className="space-y-4 flex-1 flex flex-col">
      {children}
    </div>
  </div>
)

const EMPTY_SUPPLIER = { name: '', contact_name: '', email: '', phone: '', address: '', status: '' }

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
    rose: {
      bg: 'bg-white dark:bg-rose-500/5',
      border: 'border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'from-rose-500/5 to-pink-500/5',
      iconText: 'text-rose-500'
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
      <div className="w-16 h-16 rounded-xl bg-slate-300 dark:bg-white/20 animate-shimmer" />
    </div>
    <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md mb-1 relative z-10 animate-shimmer" />
    <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-md relative z-10 animate-shimmer" />
  </div>
);

export default function SuppliersDirectoryPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [deleteErrorMsg, setDeleteErrorMsg] = useState(null)
  
  const [hasDraft, setHasDraft] = useState(false)
  const [selectedKpi, setSelectedKpi] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [activeTab, setActiveTab] = useState('products') // 'products' or 'orders'
  const [errorMsg, setErrorMsg] = useState(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const { formatPrice } = useCurrency()
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    status: ''
  })

  // Sync draft state when formData changes and we're not editing
  useEffect(() => {
    if (!editingSupplier && isModalOpen) {
      const hasData = Object.values(formData).some(val => !!val)
      if (hasData) {
        localStorage.setItem('sia_supplier_draft', JSON.stringify(formData))
        setHasDraft(true)
      } else {
        localStorage.removeItem('sia_supplier_draft')
        setHasDraft(false)
      }
    }
  }, [formData, editingSupplier, isModalOpen])

  const openAddModal = () => {
    let initForm = { ...EMPTY_SUPPLIER }
    const draft = localStorage.getItem('sia_supplier_draft')
    let draftExists = false
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const hasData = Object.values(parsed).some(val => !!val)
        if (hasData) {
          initForm = { ...initForm, ...parsed }
          draftExists = true
        }
      } catch (e) {}
    }
    setFormData(initForm)
    setEditingSupplier(null)
    setHasAttemptedSubmit(false)
    setErrorMsg(null)
    setHasDraft(draftExists)
    setIsModalOpen(true)
  }

  const handleClearDraft = () => {
    localStorage.removeItem('sia_supplier_draft')
    setHasDraft(false)
    setFormData({ ...EMPTY_SUPPLIER })
  }

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', { search: searchTerm }],
    queryFn: () => fetchSuppliers({ search: searchTerm }),
  })

  // Reset pagination on search
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1)
  }, [searchTerm, sortConfig])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    let aVal = a[sortConfig.key] || ''
    let bVal = b[sortConfig.key] || ''
    
    // Make sorting case-insensitive for strings
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const total = sortedSuppliers.length
  const totalPages = Math.ceil(total / itemsPerPage)
  const paginatedSuppliers = sortedSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const { data: productsData } = useQuery({
    queryKey: ['inventory', { supplierId: selectedSupplier?.id }],
    queryFn: () => fetchInventory({ supplierId: selectedSupplier?.id, limit: 100 }),
    enabled: !!selectedSupplier
  })
  
  const { data: procurementsData } = useQuery({
    queryKey: ['procurements', { status: '' }],
    queryFn: () => fetchProcurements({ status: '' }),
    enabled: !!selectedSupplier
  })

  // Extract products and procurements specific to the selected supplier
  const supplierProducts = productsData?.data || productsData?.items || productsData || []
  
  const allProcurements = procurementsData?.data || procurementsData || []
  const supplierProcurements = allProcurements.filter(p => p.supplier_id === selectedSupplier?.id)

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsModalOpen(false)
      resetForm()
      toast(`${supplier.name} added successfully.`, 'success')
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to create supplier')
    }
  })

  const updateMut = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to update supplier')
    }
  })
  
  const deleteMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      const supplierName = supplierToDelete?.name || 'Supplier'
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setSupplierToDelete(null)
      setDeleteErrorMsg(null)
      toast(`${supplierName} deleted successfully.`, 'success')
    },
    onError: (err) => {
      setDeleteErrorMsg(err.response?.data?.detail || err.message || 'Failed to delete supplier')
    }
  })

  const resetForm = () => {
    setFormData({ ...EMPTY_SUPPLIER })
    setEditingSupplier(null)
    setErrorMsg(null)
    setHasAttemptedSubmit(false)
  }

  const openEdit = (s) => {
    setEditingSupplier(s)
    setFormData({
      name: s.name || '',
      contact_name: s.contact_name || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      status: s.status || ''
    })
    setIsModalOpen(true)
  }

  const handleCapitalizedChange = (field) => (e) => {
    const val = e.target.value
    const capitalized = val.replace(/\b[a-z]/g, c => c.toUpperCase())
    setFormData(f => ({ ...f, [field]: capitalized }))
  }

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    
    if (val.startsWith('09')) val = '63' + val.substring(1)
    if (val.startsWith('9')) val = '63' + val
    
    let formatted = ''
    if (val.length > 0) {
      if (val.startsWith('63')) {
        formatted = '+63'
        if (val.length > 2) formatted += ' ' + val.substring(2, 5)
        if (val.length > 5) formatted += ' ' + val.substring(5, 8)
        if (val.length > 8) formatted += ' ' + val.substring(8, 12)
      } else {
        formatted = '+' + val
      }
    }
    setFormData({...formData, phone: formatted})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)
    
    if (!formData.name || !formData.contact_name || !formData.email || !formData.status) {
      return
    }

    if (editingSupplier) {
      updateMut.mutate({ id: editingSupplier.id, ...formData })
    } else {
      createMut.mutate(formData)
      localStorage.removeItem('sia_supplier_draft')
      setHasDraft(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Suppliers Directory</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your supplier partners and contacts</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard title="Total Suppliers" value={suppliers.length} icon={Users} colorClass="indigo" onClick={() => setSelectedKpi('total')} />
            <StatCard title="Active Suppliers" value={suppliers.filter(s => s.status?.toLowerCase() === 'active').length} icon={CheckCircle} colorClass="emerald" onClick={() => setSelectedKpi('active')} />
            <StatCard title="Inactive Suppliers" value={suppliers.filter(s => s.status?.toLowerCase() === 'inactive').length} icon={XCircle} colorClass="rose" onClick={() => setSelectedKpi('inactive')} />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedKpi && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedKpi(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#0d0f1a] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {selectedKpi === 'total' ? 'All Suppliers' : `${selectedKpi} Suppliers`}
                </h3>
                <button onClick={() => setSelectedKpi(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {(() => {
                    let list = suppliers;
                    if (selectedKpi === 'active') list = suppliers.filter(s => s.status?.toLowerCase() === 'active');
                    if (selectedKpi === 'inactive') list = suppliers.filter(s => s.status?.toLowerCase() === 'inactive');
                    
                    if (list.length === 0) return <p className="text-sm text-slate-500">No suppliers found.</p>;
                    
                    return list.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{s.name}</span>
                          {s.email && <span className="text-xs text-slate-500 mt-1">{s.email}</span>}
                        </div>
                        {s.status && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.status.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                            {s.status}
                          </span>
                        )}
                      </div>
                    ));
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-visible transition-colors duration-300"
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] transition-colors rounded-t-2xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[780px]">
          <table className="w-full min-w-[800px] text-left text-sm table-fixed">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 transition-colors">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer select-none group transition-colors hover:bg-slate-100 dark:hover:bg-white/5 w-[30%]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center justify-start gap-1">
                    Supplier Name
                    <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'name' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer select-none group transition-colors hover:bg-slate-100 dark:hover:bg-white/5 w-[40%]"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center justify-start gap-1">
                    Contact
                    <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'email' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`} />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold cursor-pointer select-none group transition-colors hover:bg-slate-100 dark:hover:bg-white/5 w-[15%]"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-start gap-1">
                    Status
                    <ArrowUpDown size={14} className={`transition-colors ${sortConfig.key === 'status' ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-center transition-colors w-[15%]"></th>
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.tbody
                  key="skeleton-body"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="divide-y divide-slate-100 dark:divide-white/5 transition-colors relative"
                >
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={`skel-${idx}`} className="h-[73px] bg-transparent border-b border-slate-100 dark:border-white/5 last:border-0 opacity-40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0 animate-shimmer" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-shimmer" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 bg-slate-200 dark:bg-white/10 rounded animate-shimmer mb-2" />
                        <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded animate-shimmer" />
                      </td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-md animate-shimmer" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-6 w-16 ml-auto bg-slate-200 dark:bg-white/10 rounded-md animate-shimmer" /></td>
                    </tr>
                  ))}
                </motion.tbody>
              ) : (
                <motion.tbody
                  key={`data-${currentPage}-${searchTerm}-${sortConfig.key}-${sortConfig.direction}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="divide-y divide-slate-100 dark:divide-white/5 transition-colors relative"
                >
                  {paginatedSuppliers.map((supplier, index) => (
                    <motion.tr 
                      key={supplier.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => setSelectedSupplier(supplier)} 
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg uppercase shadow-sm">
                        {supplier.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{supplier.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {supplier.address || 'No address'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 dark:text-slate-200 font-medium">{supplier.contact_name || 'N/A'}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Phone size={10} /> {supplier.phone || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {supplier.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${supplier.status?.toLowerCase() === 'inactive' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                      {supplier.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      <span className="text-xs font-semibold mr-1 opacity-0 group-hover:opacity-100 transition-opacity">View details</span>
                      <ChevronRight size={18} />
                    </div>
                  </td>
                </motion.tr>
              ))}
              
              {/* Pad with empty rows to maintain consistent table height */}
              {Array.from({ length: Math.max(0, itemsPerPage - paginatedSuppliers.length) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="h-[73px] bg-transparent pointer-events-none">
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))}
            </motion.tbody>
              )}
            </AnimatePresence>
          </table>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 top-[53px] flex flex-col items-center justify-center pointer-events-none z-10 bg-white/30 dark:bg-[#0A0A0B]/30 backdrop-blur-[1px]"
              >
                <div className="bg-white dark:bg-[#12141c] px-6 py-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                  <p className="font-semibold text-slate-900 dark:text-white">Loading suppliers...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fetching data from the server</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State Overlay */}
          {!isLoading && paginatedSuppliers.length === 0 && (
            <div className="absolute inset-0 top-[53px] flex flex-col items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto pointer-events-auto">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                  <Building2 className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Suppliers Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
                  {searchTerm ? "We couldn't find any suppliers matching your search." : "You haven't added any suppliers yet."}
                </p>
                {!searchTerm && (
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                    <Plus className="w-4 h-4" />
                    Add First Supplier
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination UI */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0A0A0B] rounded-b-2xl">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              'No results found'
            ) : total === 1 ? (
              'Showing 1 result'
            ) : totalPages === 1 ? (
              <>Showing all <span className="font-medium text-slate-900 dark:text-white">{total}</span> results</>
            ) : (
              <>Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, total)}</span> of <span className="font-medium text-slate-900 dark:text-white">{total}</span> results</>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${currentPage === idx + 1
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || total === 0}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={() => {setIsModalOpen(false); resetForm()}}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative z-10 bg-slate-50 dark:bg-[#0A0A0B] border border-transparent dark:border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[85vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#12141c] border-b border-slate-200 dark:border-white/10 shrink-0 z-10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                      </h2>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {editingSupplier ? 'Update supplier details and contact information' : 'Register a new supplier to your directory'}
                    </p>
                  </div>
                  <button onClick={() => {setIsModalOpen(false); resetForm()}} className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>

                <div className="overflow-y-auto p-4 md:p-5 pb-32 custom-scrollbar relative flex-1">
                  <form onSubmit={handleSubmit} noValidate className="h-full">
                    <div className="flex flex-col h-full">
                      {errorMsg && (
                        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 text-sm font-medium text-rose-600 dark:text-rose-400 rounded-xl mb-5 flex items-center gap-2 shrink-0">
                          <ShieldAlert size={18} />
                          {errorMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                        {/* Left Column - Company Info */}
                        <Card title="Company Details" icon={Building2} className="h-full">
                          <div>
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="e.g. Acme Corporation" value={formData.name} onChange={handleCapitalizedChange('name')} className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border ${hasAttemptedSubmit && !formData.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md`} />
                            {hasAttemptedSubmit && !formData.name && <p className="text-[11px] text-rose-500 mt-1.5 font-medium">This field is required.</p>}
                          </div>

                          <div className="flex-1 flex flex-col">
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Corporate Address</label>
                            <textarea placeholder="Full business address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md resize-none" />
                          </div>
                        </Card>

                        {/* Right Column - Contact Info */}
                        <Card title="Primary Contact" icon={Users} className="h-full">
                          <div>
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Representative Name <span className="text-red-500">*</span></label>
                            <input required type="text" placeholder="e.g. John Doe" value={formData.contact_name} onChange={handleCapitalizedChange('contact_name')} className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border ${hasAttemptedSubmit && !formData.contact_name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md`} />
                            {hasAttemptedSubmit && !formData.contact_name && <p className="text-[11px] text-rose-500 mt-1.5 font-medium">This field is required.</p>}
                          </div>

                          <div>
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address <span className="text-red-500">*</span></label>
                            <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border ${hasAttemptedSubmit && !formData.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md`} />
                            {hasAttemptedSubmit && !formData.email && <p className="text-[11px] text-rose-500 mt-1.5 font-medium">This field is required.</p>}
                          </div>

                          <div>
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                            <input type="text" placeholder="+63 900 000 0000" value={formData.phone} onChange={handlePhoneChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md" />
                          </div>
                          <div>
                            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1">Status <span className="text-red-500">*</span></label>
                            <CustomSelect 
                              value={formData.status} 
                              onChange={val => setFormData({...formData, status: val})} 
                              options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' }
                              ]}
                              placeholder="Select Status"
                              openUpwards={true}
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border ${hasAttemptedSubmit && !formData.status ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md`}
                            />
                            {hasAttemptedSubmit && !formData.status && <p className="text-[11px] text-rose-500 mt-1.5 font-medium">This field is required.</p>}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Footer */}
                <div className="bg-white dark:bg-[#12141c] border-t border-slate-200 dark:border-white/10 p-4 md:p-6 shrink-0 z-10 flex justify-end gap-3">
                  {!editingSupplier && hasDraft && (
                    <button type="button" onClick={handleClearDraft} className="mr-auto px-6 py-2.5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-sm font-semibold">
                      Clear Draft
                    </button>
                  )}
                  <button type="button" onClick={() => {setIsModalOpen(false); resetForm()}} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending} className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-lg active:scale-[0.98]">
                    {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                  </button>
                </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {createPortal(
        <AnimatePresence>
          {supplierToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setSupplierToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#12141c] border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-xl p-6 z-10"
            >
              <div className="w-11 h-11 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Delete Supplier</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Are you sure you want to delete <span className="font-semibold text-slate-700 dark:text-slate-300">{supplierToDelete.name}</span>? This action cannot be undone and may affect active purchase orders.
              </p>
              {deleteErrorMsg && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                  {deleteErrorMsg}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setSupplierToDelete(null); setDeleteErrorMsg(null) }}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMut.mutate(supplierToDelete.id)}
                  disabled={deleteMut.isPending}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {deleteMut.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {createPortal(
        <AnimatePresence>
          {selectedSupplier && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setSelectedSupplier(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0A0A0B] border-l border-slate-200 dark:border-white/10 z-[75] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl uppercase shadow-sm">
                      {selectedSupplier.name.substring(0, 2)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedSupplier.name}</h2>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold border uppercase tracking-wider ${selectedSupplier.status?.toLowerCase() === 'inactive' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                        {selectedSupplier.status || 'active'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { openEdit(selectedSupplier); setSelectedSupplier(null); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit Supplier">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {selectedSupplier.name !== 'In-House Production' && (
                      <button onClick={() => { setSupplierToDelete(selectedSupplier); setDeleteErrorMsg(null); setSelectedSupplier(null); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Supplier">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1"></div>
                    <button onClick={() => setSelectedSupplier(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors" title="Close Drawer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mt-6">
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4 mt-0.5 text-slate-400" />
                    <span className="break-all">{selectedSupplier.email || 'No email'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
                    <span>{selectedSupplier.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400 col-span-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <span>{selectedSupplier.address || 'No address'}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-white/10 px-4 pt-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Products Supplied
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Order History
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                <AnimatePresence mode="wait">
                  {activeTab === 'products' ? (
                    <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                      {supplierProducts.length === 0 ? (
                        <div className="text-center py-10">
                          <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-500">No products linked to this supplier.</p>
                        </div>
                      ) : supplierProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">{p.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate">{p.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{formatPrice(p.cost_price || p.price)}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Stock: {p.stock_level}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                      {supplierProcurements.length === 0 ? (
                        <div className="text-center py-10">
                          <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-slate-500">No purchase orders found.</p>
                        </div>
                      ) : supplierProcurements.map(proc => (
                        <div key={proc.id} className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">{proc.po_number}</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(proc.total_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(proc.created_at).toLocaleDateString()}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded font-medium ${proc.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : proc.status === 'Pending' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{proc.status}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  )
}
