import { Download, Trash2 } from 'lucide-react'

export default function BulkActionBar({ count, onExport, onDelete }) {
  return (
    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4">
      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium text-blue-700">
        {count} product{count !== 1 ? 's' : ''} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download size={12} />
          Export Selected
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-lg text-xs font-medium text-white hover:bg-red-600"
        >
          <Trash2 size={12} />
          Delete Selected
        </button>
      </div>
    </div>
  )
}
