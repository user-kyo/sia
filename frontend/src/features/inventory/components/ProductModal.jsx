import { useState, useEffect } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useUploadProductImage } from '../hooks/useInventory'
import { useCurrency } from '../../../contexts/CurrencyContext'
import { useAppSettings } from '../../../contexts/AppSettingsContext'

const EMPTY = {
  name: '', sku: '', brand: '', category: '', supplier_id: '', cost: '', selling_price: '',
  quantity: '', reorder_point: '10', description: '', image_url: '',
  currency: 'PHP', // overwritten by useEffect based on display currency
}

export default function ProductModal({ mode = 'add', product = null, categories = [], suppliers = [], onClose, onSubmit, isPending }) {
  const [form, setForm] = useState(EMPTY)
  const [localError, setLocalError] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const uploadMutation = useUploadProductImage()

  const { code } = useCurrency()
  const { settings, t } = useAppSettings()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (mode === 'edit' && product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        brand: product.brand || '',
        category: product.category,
        supplier_id: product.supplier_id || '',
        cost: String(product.cost ?? 0),
        selling_price: String(product.selling_price || product.price || 0),
        quantity: String(product.quantity),
        reorder_point: String(product.reorder_point),
        description: product.description || '',
        image_url: product.image_url || '',
        currency: product.currency || 'PHP',
      })
      setPreviewUrl(product.image_url || '')
    } else {
      setForm({ ...EMPTY, reorder_point: String(settings.defaultReorderPoint), currency: code })
      setPreviewUrl('')
    }
    setImageFile(null)
  }, [mode, product]) // intentionally omit `code` — currency is locked at open time

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
        name: (form.name || '').trim(),
        sku: (form.sku || '').trim() || undefined,
        brand: (form.brand || '').trim() || undefined,
        category: form.category.trim(),
        supplier_id: form.supplier_id || undefined,
        cost: parseFloat(form.cost) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        price: parseFloat(form.selling_price) || 0,
        currency: form.currency,
        quantity: parseInt(form.quantity, 10),
        reorder_point: parseInt(form.reorder_point, 10),
        description: (form.description || '').trim() || undefined,
        image_url: finalImageUrl,
      })
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
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            {mode === 'add' ? t('modal_add_title') : t('modal_edit_title')}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className={labelCls}>{t('field_name')} <span className="text-red-500">*</span></label>
              <input required value={form.name} onChange={set('name')} placeholder='e.g. MacBook Pro 16"' className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>{t('field_sku')}</label>
              <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated" className={inputCls} />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('field_sku_hint')}</p>
            </div>

            <div>
              <label className={labelCls}>
                {t('field_brand')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
              </label>
              <input value={form.brand} onChange={set('brand')} placeholder="e.g. Apple" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>{t('field_category')} <span className="text-red-500">*</span></label>
              <select
                required
                value={form.category}
                onChange={set('category')}
                className={inputCls}
              >
                <option value="" disabled className="bg-white dark:bg-[#0d0f1a]">Select a category</option>
                {categories.map(c => (
                  <option key={c.id || c.name} value={c.name} className="bg-white dark:bg-[#0d0f1a]">{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>
                Preferred Supplier <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
              </label>
              <select
                value={form.supplier_id}
                onChange={set('supplier_id')}
                className={inputCls}
              >
                <option value="" className="bg-white dark:bg-[#0d0f1a]">Self-Made (Internal Production)</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#0d0f1a]">{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                {t('field_cost')} ({form.currency}) <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} placeholder="0.00" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>
                {t('field_selling_price')} ({form.currency}) <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" step="0.01" value={form.selling_price} onChange={set('selling_price')} placeholder="0.00" className={inputCls} />
            </div>


            <div>
              <label className={labelCls}>
                {mode === 'add' ? t('field_qty_initial') : t('field_qty')} <span className="text-red-500">*</span>
              </label>
              <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="0" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>{t('field_reorder')}</label>
              <input required type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} placeholder="e.g. 10" className={inputCls} />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{t('field_reorder_hint')}</p>
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
              <label className={labelCls}>
                {t('field_description')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
              </label>
              <textarea value={form.description} onChange={set('description')} placeholder="Short product description…" rows={2} className={`${inputCls} resize-none`} />
            </div>
          </div>

          {localError && (
            <div className="mt-4 px-3 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {localError}
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
            >
              {t('modal_cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || uploadMutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)]"
            >
              {isPending || uploadMutation.isPending ? t('modal_saving') : mode === 'add' ? t('modal_add_btn') : t('modal_save')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
