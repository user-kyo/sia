import { useState, useEffect } from 'react'
import { X, Pencil, Package, Monitor, Shirt, Coffee, Smartphone, Box, Scissors, Wrench, Book, Music, Camera, Car, ShoppingBag, Gift, Heart, Home } from 'lucide-react'
import { motion } from 'framer-motion'

const ICONS = {
  Package, Monitor, Shirt, Coffee, Smartphone, Box, 
  Scissors, Wrench, Book, Music, Camera, Car, 
  ShoppingBag, Gift, Heart, Home
}

export default function EditCategoryModal({ onClose, onSubmit, isPending, existingCategories = [] }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('Package')
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (selectedCategoryId) {
      const cat = existingCategories.find(c => c.id === selectedCategoryId)
      if (cat) {
        setName(cat.name)
        setSelectedIcon(cat.icon || 'Package')
      }
    } else {
      setName('')
      setSelectedIcon('Package')
    }
  }, [selectedCategoryId, existingCategories])

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

    const trimmedName = name.trim()
    if (!trimmedName) {
      setLocalError('Category name cannot be empty.')
      return
    }

    try {
      await onSubmit({ id: selectedCategoryId, name: trimmedName, icon: selectedIcon })
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.'
      setLocalError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5'

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
            <div>
              <label className={labelCls}>Select Category to Edit</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className={inputCls}
              >
                <option value="" disabled className="bg-white dark:bg-[#0d0f1a]">Choose a category...</option>
                {existingCategories.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#0d0f1a]">{c.name}</option>
                ))}
              </select>
            </div>

            {selectedCategoryId && (
              <>
                <div>
                  <label className={labelCls}>Category Name <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    value={name} 
                    onChange={handleNameChange} 
                    placeholder="e.g. Electronics, Furniture" 
                    className={`${inputCls} ${isDuplicate ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/30' : ''}`} 
                  />
                  {isDuplicate && (
                    <p className="mt-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      This category already exists.
                    </p>
                  )}
                  {selectedCategoryObj && selectedCategoryObj.name !== name.trim() && !isDuplicate && (
                    <p className="mt-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      Updating this will change the category name on all affected products.
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
                              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#0d0f1a]' 
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
              </>
            )}
          </div>

          {localError && (
            <div className="mt-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {localError}
            </div>
          )}

          <div className="flex gap-2.5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedCategoryId || !name.trim() || isDuplicate}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
