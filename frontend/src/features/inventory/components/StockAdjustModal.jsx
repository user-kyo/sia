import { useState } from 'react'
import { X } from 'lucide-react'

const TYPES = [
  { value: 'add', label: 'Add Stock' },
  { value: 'remove', label: 'Remove Stock' },
  { value: 'set', label: 'Set Exact Quantity' },
]

export default function StockAdjustModal({ product, onClose, onSubmit, isPending }) {
  const [form, setForm] = useState({ adjustment_type: 'add', quantity: '', note: '' })
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ id: product.id, adjustment_type: form.adjustment_type, quantity: parseInt(form.quantity, 10), note: form.note.trim() || undefined })
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 bg-white'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Adjust Stock</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {product?.name} · Currently{' '}
              <span className="font-semibold text-slate-700">{product?.quantity}</span> in stock
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md hover:bg-slate-50 text-slate-400">
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Type</label>
            <select value={form.adjustment_type} onChange={set('adjustment_type')} className={inputCls}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity</label>
            <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input value={form.note} onChange={set('note')} placeholder="e.g. Restocked from supplier" className={inputCls} />
          </div>

          <div className="flex gap-2.5 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 bg-slate-900 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
              {isPending ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
