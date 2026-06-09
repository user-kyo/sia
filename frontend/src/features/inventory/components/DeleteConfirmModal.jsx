import { Trash2 } from 'lucide-react'

export default function DeleteConfirmModal({ products = [], onClose, onConfirm, isPending }) {
  const isBulk = products.length > 1

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1.5">
          {isBulk ? `Delete ${products.length} Products?` : 'Delete Product?'}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {isBulk
            ? `This will permanently delete ${products.length} products. This action cannot be undone.`
            : <>This will permanently delete <strong className="text-slate-700">{products[0]?.name}</strong>. This action cannot be undone.</>
          }
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {isPending ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
