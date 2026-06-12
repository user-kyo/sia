import { useState, useEffect, useRef } from 'react'
import { X, Pencil, Package, Monitor, Shirt, Coffee, Smartphone, Box, Scissors, Wrench, Book, Music, Camera, Car, ShoppingBag, Gift, Heart, Home, ChevronDown, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ICONS = {
  Package, Monitor, Shirt, Coffee, Smartphone, Box, 
  Scissors, Wrench, Book, Music, Camera, Car, 
  ShoppingBag, Gift, Heart, Home
}

export default function EditCategoryModal({ onClose, onSubmit, onDelete, isPending, isDeletePending, existingCategories = [] }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Package')
  const [localError, setLocalError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    setShowDeleteConfirm(true)
  }

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

        <form onSubmit={handleSubmit} className="p-6">
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
                  className="space-y-4 overflow-hidden"
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
                            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                              isActive 
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-2 ring-inset ring-indigo-500' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:bg-white/5 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300 border border-slate-200 dark:border-white/10'
                            }`}
                            title={iconName}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
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

          <div className="flex gap-2.5 mt-6">
            {selectedCategoryId && (
              <button
                type="button"
                disabled={isPending || isDeletePending}
                onClick={handleDeleteClick}
                className="px-4 py-2.5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                title="Delete Category"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isDeletePending || !selectedCategoryId || isDuplicate || !hasChanges}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/95 dark:bg-[#0d0f1a]/95 backdrop-blur-md rounded-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="text-center w-full"
              >
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 mx-auto mb-4 border border-rose-100 dark:border-rose-500/20">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Delete Category?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                  Are you sure you want to delete the "{selectedCategoryObj?.name}" category? This action cannot be undone.
                </p>
                <div className="flex gap-2.5 px-6">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeletePending}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.2)] dark:shadow-[0_0_15px_rgba(225,29,72,0.2)]"
                  >
                    {isDeletePending ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
