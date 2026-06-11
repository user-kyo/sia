import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Building2, Phone, Mail, MapPin, MoreVertical, Edit2, Trash2, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../features/suppliers/api/suppliersApi'

export default function SuppliersDirectoryPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: ''
  })

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', { search: searchTerm }],
    queryFn: () => fetchSuppliers({ search: searchTerm }),
  })

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers'])
      setIsModalOpen(false)
      resetForm()
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to create supplier')
    }
  })

  const updateMut = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers'])
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
      queryClient.invalidateQueries(['suppliers'])
      setSupplierToDelete(null)
    }
  })

  const resetForm = () => {
    setFormData({ name: '', contact_name: '', email: '', phone: '', address: '' })
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
      address: s.address || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setHasAttemptedSubmit(true)
    
    if (!formData.name || !formData.contact_name || !formData.email) {
      return
    }

    if (editingSupplier) {
      updateMut.mutate({ id: editingSupplier.id, ...formData })
    } else {
      createMut.mutate(formData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Suppliers Directory</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your supplier partners and contacts</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="relative w-72">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No suppliers found.</td></tr>
              ) : suppliers.map(supplier => (
                <tr key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{supplier.name}</div>
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(supplier)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setSupplierToDelete(supplier)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                </h3>
                <button onClick={() => {setIsModalOpen(false); resetForm()}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} noValidate className="flex flex-col">
                <div className="p-6 space-y-4">
                  {errorMsg && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 text-sm text-rose-600 dark:text-rose-400 rounded-xl">
                      {errorMsg}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Supplier Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full bg-slate-50 dark:bg-white/5 border ${hasAttemptedSubmit && !formData.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50`} />
                    {hasAttemptedSubmit && !formData.name && (
                      <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">This field is required.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Representative Name *</label>
                    <input required type="text" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} className={`w-full bg-slate-50 dark:bg-white/5 border ${hasAttemptedSubmit && !formData.contact_name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50`} />
                    {hasAttemptedSubmit && !formData.contact_name && (
                      <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">This field is required.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full bg-slate-50 dark:bg-white/5 border ${hasAttemptedSubmit && !formData.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-white/10'} rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50`} />
                      {hasAttemptedSubmit && !formData.email && (
                        <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">This field is required.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Corporate Address</label>
                    <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                  </div>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3 mt-auto">
                  <button type="button" onClick={() => {setIsModalOpen(false); resetForm()}} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {editingSupplier ? 'Save Changes' : 'Add Supplier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {supplierToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
              <div className="flex gap-3">
                <button
                  onClick={() => setSupplierToDelete(null)}
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
      </AnimatePresence>
    </div>
  )
}
