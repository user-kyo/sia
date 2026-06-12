import { useState, useEffect, useRef } from 'react'
import { X, Pencil, Package, Monitor, Shirt, Coffee, Smartphone, Box, Scissors, Wrench, Book, Music, Camera, Car, ShoppingBag, Gift, Heart, Home, ChevronDown, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ICONS = {
  Package, Monitor, Shirt, Coffee, Smartphone, Box, 
  Scissors, Wrench, Book, Music, Camera, Car, 
  ShoppingBag, Gift, Heart, Home
}

export default function EditCategoryModal({ onClose, onSubmit, onDelete, isPending, isDeletePending, existingCategories = [], initialCategoryId = '' }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId)
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Package')
  const [localError, setLocalError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmDeleteName, setConfirmDeleteName] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (selectedCategoryId) {
      const cat = existingCategories.find(c => c.id === selectedCategoryId)
      if (cat) {
        setName('')
        setSelectedIcon(cat.icon || 'Package')
      }
    } else {
      setName('')
      setSelectedIcon('Package')
    }
  }, [selectedCategoryId, existingCategories])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCategoryObj = existingCategories.find(c => c.id === selectedCategoryId)

  const isDuplicate = name.trim() !== '' && existingCategories.some(
    c => c.id !== selectedCategoryId && c.name.toLowerCase() === name.trim().toLowerCase()
  )

  const handleNameChange = (e) => {
    const input = e.target.value
    const capitalized = input.replace(/\b\w/g, c => c.toUpperCase())
    setName(capitalized)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    const finalName = name.trim() || (selectedCategoryObj ? selectedCategoryObj.name : '')

    try {
      await onSubmit({ id: selectedCategoryId, name: finalName, icon: selectedIcon })
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.'
      setLocalError(msg)
    }
  }

  const handleDeleteClick = () => {
    if (!selectedCategoryId) return
    setLocalError(null)
    setConfirmDeleteName('')
    setShowDeleteConfirm(true)
  }

  const isDeleteNameMatching = confirmDeleteName === selectedCategoryObj?.name

  const confirmDelete = async () => {
    try {
      await onDelete(selectedCategoryId)
    } catch (err) {
      setShowDeleteConfirm(false)
      const msg = err?.response?.data?.detail || err?.message || 'Failed to delete category. It might be in use.'
      setLocalError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5'

  const finalNameForCheck = name.trim() || (selectedCategoryObj ? selectedCategoryObj.name : '')
  const hasChanges = selectedCategoryObj && (finalNameForCheck !== selectedCategoryObj.name || selectedIcon !== (selectedCategoryObj.icon || 'Package'))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl dark:shadow-none z-10"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              Edit Category
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!showDeleteConfirm ? (
              <motion.form key="edit-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div ref={dropdownRef} className="relative">
                    <label className={labelCls}>Select Category to Edit</label>
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`${inputCls} flex items-center justify-between cursor-pointer select-none`}
                    >
                      <span className={selectedCategoryId ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                        {selectedCategoryObj ? selectedCategoryObj.name : 'Choose a category...'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20 py-1"
                        >
                          {existingCategories.map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCategoryId(c.id)
                                setIsDropdownOpen(false)
                              }}
                              className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${selectedCategoryId === c.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium'}`}
                            >
                              <span>{c.name}</span>
                              {selectedCategoryId === c.id && <Check size={14} />}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {selectedCategoryId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="space-y-4"
                        style={{ overflow: 'visible' }}
                      >
                        <div>
                          <label className={labelCls}>Category Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                          <input 
                            value={name} 
                            onChange={handleNameChange} 
                            placeholder={selectedCategoryObj ? `e.g. ${selectedCategoryObj.name}` : "e.g. Electronics, Furniture"} 
                            className={`${inputCls} ${isDuplicate ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/30' : ''}`} 
                          />
                          {isDuplicate && (
                            <p className="mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              This category already exists.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className={labelCls}>Category Icon</label>
                          <div className="grid grid-cols-8 gap-2">
                            {Object.entries(ICONS).map(([iconName, Icon]) => {
                              const isActive = selectedIcon === iconName
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setSelectedIcon(iconName)}
                                  className={`relative group p-2 rounded-xl flex items-center justify-center transition-all ${
                                    isActive 
                                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-2 ring-inset ring-indigo-500' 
                                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:bg-white/5 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300 border border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                    {iconName}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {localError && (
                  <div className="mt-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    {localError}
                  </div>
                )}

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={isPending || isDeletePending || !selectedCategoryId}
                    onClick={handleDeleteClick}
                    className="p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Delete Category"
                  >
                    <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isPending || isDeletePending}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || isDeletePending || !selectedCategoryId || isDuplicate || !hasChanges}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.div key="delete-confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">Warning: Deleting Category</h3>
                  <p className="text-sm text-red-700 dark:text-red-300/80 mb-3">
                    Are you sure you want to delete the <strong>{selectedCategoryObj?.name}</strong> category? All products linked to this category will also be deleted. This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-red-800 dark:text-red-400">Type "{selectedCategoryObj?.name}" to confirm</label>
                    <input type="text" value={confirmDeleteName} onChange={(e) => setConfirmDeleteName(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder={selectedCategoryObj?.name} />
                  </div>
                </div>

                {localError && <p className="text-sm text-red-500">{localError}</p>}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowDeleteConfirm(false); setConfirmDeleteName(''); setLocalError(null) }} disabled={isDeletePending} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="button" onClick={confirmDelete} disabled={!isDeleteNameMatching || isDeletePending} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-600/20">
                    {isDeletePending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
