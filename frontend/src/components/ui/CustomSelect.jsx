import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export default function CustomSelect({ value, onChange, options, placeholder, disabled, required, className, onClick, openUpwards = false, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen)
    }
  }, [isOpen, onOpenChange])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const defaultCls = 'w-full px-3 py-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all'
  const finalCls = className || defaultCls

  return (
    <div ref={ref} className={`relative w-full ${isOpen ? 'z-[60]' : 'z-auto'}`}>
      <div 
        onClick={(e) => {
          if (disabled) return
          if (onClick) onClick(e)
          setIsOpen(!isOpen)
        }}
        className={`${finalCls} flex items-center justify-between cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: openUpwards ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} left-0 right-0 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-y-auto max-h-60 z-50 py-1 custom-scrollbar`}
          >
            {options.map(o => (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value)
                  setIsOpen(false)
                }}
                className={`px-3.5 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${value === o.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-medium'}`}
              >
                <span>{o.label}</span>
                {value === o.value && <Check size={14} />}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-3.5 py-3 text-sm text-center text-slate-400 dark:text-slate-500 font-medium">
                No options available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Invisible native select for HTML5 form validation popup positioning */}
      {required && (
         <select required className="opacity-0 absolute inset-0 -z-10 w-full h-full pointer-events-none" value={value} onChange={() => {}} tabIndex={-1}>
           <option value="" disabled></option>
           {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
         </select>
      )}
    </div>
  )
}
