import { useState, useEffect } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useUploadProductImage } from '../hooks/useInventory'

const UNITS = ['pcs', 'kg', 'box', 'liter', 'set', 'pair']

const EMPTY = {
  name: '', sku: '', category: '', price: '',
  quantity: '', reorder_point: '10', unit: 'pcs', description: '', image_url: ''
}

export default function ProductModal({ mode = 'add', product = null, categories = [], onClose, onSubmit, isPending }) {
  const [form, setForm] = useState(EMPTY)
  const [localError, setLocalError] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const uploadMutation = useUploadProductImage()

  useEffect(() => {
    if (mode === 'edit' && product) {
      setForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: String(product.price),
        quantity: String(product.quantity),
        reorder_point: String(product.reorder_point),
        unit: product.unit || 'pcs',
        description: product.description || '',
        image_url: product.image_url || '',
      })
      setPreviewUrl(product.image_url || '')
    } else {
      setForm(EMPTY)
      setPreviewUrl('')
    }
    setImageFile(null)
  }, [mode, product])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    try {
      let finalImageUrl = form.image_url.trim() || undefined
      
      if (imageFile) {
        const uploadResult = await uploadMutation.mutateAsync(imageFile)
        finalImageUrl = uploadResult.image_url
      }

      await onSubmit({
        ...(mode === 'edit' && { id: product.id }),
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        category: form.category.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity, 10),
        reorder_point: parseInt(form.reorder_point, 10),
        unit: form.unit,
        description: form.description.trim() || undefined,
        image_url: finalImageUrl,
      })
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.'
      setLocalError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 bg-white'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md hover:bg-slate-50 text-slate-400">
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
              <input required value={form.name} onChange={set('name')} placeholder='e.g. MacBook Pro 16"' className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">SKU</label>
              <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated" className={inputCls} />
              <p className="text-[11px] text-slate-400 mt-1">Leave blank to auto-generate</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <input
                required
                list="inv-categories"
                value={form.category}
                onChange={set('category')}
                placeholder="e.g. Electronics"
                className={inputCls}
              />
              <datalist id="inv-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Price ($) <span className="text-red-500">*</span></label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit</label>
              <select value={form.unit} onChange={set('unit')} className={inputCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {mode === 'add' ? 'Initial Quantity' : 'Quantity'} <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="0" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reorder Point</label>
              <input required type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} placeholder="e.g. 10" className={inputCls} />
              <p className="text-[11px] text-slate-400 mt-1">Stock alert triggers below this</p>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Image <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                  {previewUrl && (
                    <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(''); setForm(f => ({...f, image_url: ''})) }} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors text-sm font-medium text-slate-600">
                    <Upload size={16} className="text-indigo-500" />
                    <span>Upload File</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">PNG, JPG, WEBP up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea value={form.description} onChange={set('description')} placeholder="Short product description…" rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>

          {localError && (
            <div className="mt-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 leading-relaxed">
              {localError}
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending || uploadMutation.isPending} className="flex-1 py-2.5 bg-slate-900 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
              {isPending || uploadMutation.isPending ? 'Saving…' : mode === 'add' ? 'Add Product' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
