import { useState, useEffect, useRef } from 'react'
import { X, Pencil, Trash2, Tag, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function EditBrandModal({ onClose, onSubmit, onDelete, isPending, isDeletePending, existingBrands = [], initialBrand = '' }) {
  const [selectedBrand, setSelectedBrand] = useState(initialBrand)
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmDeleteName, setConfirmDeleteName] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (selectedBrand) {
      setName('')
    } else {
      setName('')
    }
  }, [selectedBrand])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isDuplicate = name.trim() !== '' && existingBrands.some(
    b => b !== selectedBrand && b.toLowerCase() === name.trim().toLowerCase()
  )

  const handleNameChange = (e) => {
    const input = e.target.value
    // Capitalize first letter of each word
    const capitalized = input.replace(/\b\w/g, c => c.toUpperCase())
    setName(capitalized)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    const finalName = name.trim() || selectedBrand
    if (!finalName) {
      setLocalError('Brand name is required')
      return
    }

    if (isDuplicate) {
      setLocalError('A brand with this name already exists')
      return
    }

    if (!selectedBrand) {
      setLocalError('Please select a brand to edit')
      return
    }

    if (finalName === selectedBrand) {
      onClose()
      return
    }

    try {
      await onSubmit({ oldName: selectedBrand, newName: finalName })
    } catch (err) {
      setLocalError(err.message || 'Failed to update brand')
    }
  }

  const isDeleteNameMatching = confirmDeleteName === selectedBrand

  const handleDelete = async () => {
    if (!isDeleteNameMatching) {
      setLocalError('Brand name does not match')
      return
    }
    setLocalError(null)
    try {
      await onDelete(selectedBrand)
    } catch (err) {
      setLocalError(err.message || 'Failed to delete brand')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#0d0f1a] rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-500" />
            Edit Brand
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {existingBrands.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No Brands Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">You need to have products with brands first.</p>
              <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                Close
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.form key="edit-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-4">
                  {/* Select Brand Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Select Brand to Edit</label>
                    <div className="relative" ref={dropdownRef}>
                      <div
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] cursor-pointer"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <div className="flex items-center gap-3">
                          {selectedBrand ? (
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedBrand}</span>
                          ) : (
                            <span className="text-sm text-slate-400">Select a brand...</span>
                          )}
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-[#131627] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-[240px] overflow-y-auto">
                            {existingBrands.map(b => (
                              <div
                                key={b}
                                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => {
                                  setSelectedBrand(b)
                                  setIsDropdownOpen(false)
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{b}</span>
                                </div>
                                {selectedBrand === b && <Check size={16} className="text-indigo-500" />}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* New Name Input */}
                  {selectedBrand && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rename Brand To</label>
                        <input
                          type="text"
                          value={name}
                          onChange={handleNameChange}
                          placeholder={selectedBrand}
                          className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                        {isDuplicate && <p className="text-xs text-red-500 mt-1.5">This name is already used by another brand.</p>}
                      </div>
                    </motion.div>
                  )}

                  {localError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{localError}</p>}

                  <div className="pt-4 flex items-center justify-between gap-3">
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={!selectedBrand || isPending || isDeletePending} className="p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed group" title="Delete Brand">
                      <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="flex gap-3">
                      <button type="button" onClick={onClose} disabled={isPending || isDeletePending} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                        Cancel
                      </button>
                      <button type="submit" disabled={isPending || isDeletePending || isDuplicate || !selectedBrand} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="delete-confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-2">Warning: Removing Brand</h3>
                    <p className="text-sm text-red-700 dark:text-red-300/80 mb-3">
                      This will remove the brand <strong>{selectedBrand}</strong> from all products. They will become unbranded.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-red-800 dark:text-red-400">Type "{selectedBrand}" to confirm</label>
                      <input type="text" value={confirmDeleteName} onChange={(e) => setConfirmDeleteName(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50" placeholder={selectedBrand} />
                    </div>
                  </div>

                  {localError && <p className="text-sm text-red-500">{localError}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowDeleteConfirm(false); setConfirmDeleteName(''); setLocalError(null) }} disabled={isDeletePending} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete} disabled={!isDeleteNameMatching || isDeletePending} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-600/20">
                      {isDeletePending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={16} />}
                      Confirm Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}
