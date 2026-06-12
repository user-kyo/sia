import { useState, useEffect } from 'react'
import { X, Upload, Image as ImageIcon, Wand2, Info, Package, DollarSign, Folder, ImageIcon as ImgIcon } from 'lucide-react'
import CustomSelect from '../../../components/ui/CustomSelect'
import { motion } from 'framer-motion'
import { useUploadProductImage } from '../hooks/useInventory'
import { useCurrency } from '../../../contexts/CurrencyContext'
import { useAppSettings } from '../../../contexts/AppSettingsContext'
import { useAuth } from '../../../contexts/AuthContext'
import { createSupplier } from '../../suppliers/api/suppliersApi'

const EMPTY = {
  name: '', sku: '', brand: '', category: '', supplier_id: null, cost: '', selling_price: '',
  quantity: '', reorder_point: '10', description: '', image_url: '',
  currency: 'PHP',
}

const Card = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col ${className}`}>
    <div className="flex items-center gap-2 mb-3 shrink-0">
      <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
        <Icon size={16} />
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
    </div>
    <div className="space-y-4 flex-1 flex flex-col">
      {children}
    </div>
  </div>
)

export default function ProductModal({ mode = 'add', product = null, highlight = null, categories = [], suppliers = [], onClose, onSubmit, isPending, onNoSuppliersClick }) {

  const [form, setForm] = useState(EMPTY)
  const [initialForm, setInitialForm] = useState(null)
  const [localError, setLocalError] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [hasDraft, setHasDraft] = useState(false)
  const uploadMutation = useUploadProductImage()

  const { code } = useCurrency()
  const { settings, t } = useAppSettings()
  const { session } = useAuth()

  useEffect(() => {
    const inHouseSupplier = suppliers.find(s => s.name === 'In-House Production')
    const inHouseValue = inHouseSupplier ? inHouseSupplier.id : '__in_house__'

    if ((mode === 'edit' || mode === 'view') && product) {
      const init = {
        name: product.name || '',
        sku: product.sku || '',
        brand: product.brand || '',
        category: product.category,
        supplier_id: product.supplier_id || inHouseValue,
        cost: String(product.cost ?? 0),
        selling_price: String(product.selling_price || product.price || 0),
        quantity: String(product.quantity),
        reorder_point: String(product.reorder_point),
        description: product.description || '',
        image_url: product.image_url || '',
        currency: product.currency || 'PHP',
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(init)
      setInitialForm(init)
      setPreviewUrl(product.image_url || '')
      setHasDraft(false)
    } else {
      let initForm = { ...EMPTY, supplier_id: null, reorder_point: String(settings.defaultReorderPoint), currency: code }
      const draft = localStorage.getItem('sia_product_draft')
      let draftExists = false
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          const hasData = Object.keys(parsed).some(k => ['currency', 'supplier_id', 'reorder_point'].includes(k) ? false : !!parsed[k]);
          if (hasData) {
            initForm = { ...initForm, ...parsed }
            draftExists = true
          }
        } catch (e) {}
      }
      setForm(initForm)
      setInitialForm(null)
      setPreviewUrl(initForm.image_url || '')
      setHasDraft(draftExists)
    }
    setImageFile(null)
  }, [mode, product, settings.defaultReorderPoint, code, suppliers])

  useEffect(() => {
    if (mode === 'add' && form !== EMPTY) {
      const hasData = Object.keys(form).some(k => ['currency', 'supplier_id', 'reorder_point'].includes(k) ? false : !!form[k]);
      if (hasData) {
        localStorage.setItem('sia_product_draft', JSON.stringify(form))
        setHasDraft(true)
      } else {
        localStorage.removeItem('sia_product_draft')
        setHasDraft(false)
      }
    }
  }, [form, mode])

  const handleClearDraft = () => {
    localStorage.removeItem('sia_product_draft')
    setHasDraft(false)
    setForm({ ...EMPTY, supplier_id: null, reorder_point: String(settings.defaultReorderPoint), currency: code })
    setImageFile(null)
    setPreviewUrl('')
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const setCapitalized = (field) => (e) => {
    const val = e.target.value
    const capitalized = val.replace(/\b[a-z]/g, c => c.toUpperCase())
    setForm(f => ({ ...f, [field]: capitalized }))
  }

  const handleNumberKeyDown = (allowDecimal) => (e) => {
    if (['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Enter'].includes(e.key)) return;
    if (/[0-9]/.test(e.key)) return;
    if (allowDecimal && e.key === '.' && !e.target.value.includes('.')) return;
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const generateSKU = () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    setForm(f => ({ ...f, sku: `PRD-${randomStr}` }))
  }

  const costVal = parseFloat(form.cost) || 0
  const priceVal = parseFloat(form.selling_price) || 0
  const profit = priceVal - costVal
  const margin = priceVal > 0 ? (profit / priceVal) * 100 : 0
  
  const profitColor = profit > 0 
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
    : profit < 0 
      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
      : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20'

  const hasChanges = mode === 'add' || imageFile !== null || (initialForm && JSON.stringify(form) !== JSON.stringify(initialForm))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    try {
      let finalImageUrl = form.image_url.trim() || undefined
      
      if (imageFile) {
        const uploadResult = await uploadMutation.mutateAsync(imageFile)
        finalImageUrl = uploadResult.image_url
      }

      let finalSupplierId = form.supplier_id
      if (finalSupplierId === '__in_house__') {
        try {
          const userEmail = session?.user?.email || '';
          const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || 'In-House Production';

          const newSupplier = await createSupplier({
            name: 'In-House Production',
            contact_name: userName,
            email: userEmail,
            phone: null,
            address: null,
            status: 'active'
          })
          finalSupplierId = newSupplier.id
        } catch (err) {
          throw new Error('Failed to create in-house supplier: ' + (err?.response?.data?.detail || err?.message))
        }
      }

      await onSubmit({
        ...(mode === 'edit' && { id: product.id }),
        name: (form.name || '').trim(),
        sku: (form.sku || '').trim() || undefined,
        brand: (form.brand || '').trim() || undefined,
        category: form.category.trim(),
        supplier_id: finalSupplierId || null,
        cost: parseFloat(form.cost) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        price: parseFloat(form.selling_price) || 0,
        currency: form.currency,
        quantity: parseInt(form.quantity, 10),
        reorder_point: parseInt(form.reorder_point, 10),
        description: (form.description || '').trim() || undefined,
        image_url: finalImageUrl,
      })

      if (mode === 'add') {
        localStorage.removeItem('sia_product_draft')
        setHasDraft(false)
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Something went wrong. Please try again.'
      setLocalError(msg)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:bg-white dark:focus:bg-[#12141c] focus:ring-2 focus:ring-inset focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm focus:shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-white/[0.02]'
  const numberInputCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`
  const labelCls = 'block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
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
        className="relative bg-slate-50 dark:bg-[#0A0A0B] border border-transparent dark:border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] lg:max-h-[85vh]"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#12141c] border-b border-slate-200 dark:border-white/10 shrink-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {mode === 'add' ? 'Add New Product' : mode === 'edit' ? 'Edit Product' : 'Product Details'}
              </h2>
            </div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === 'add' ? 'Create a new inventory item and set its details.' : mode === 'edit' ? 'Modify existing inventory details and pricing.' : 'View product configuration and status.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 md:p-5 custom-scrollbar relative flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="h-full">
            <fieldset disabled={mode === 'view'} className="contents">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
              
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                
                <Card title="Basic Details" icon={Package}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelCls}>{t('field_name')} <span className="text-red-500">*</span></label>
                      <input required value={form.name} onChange={setCapitalized('name')} placeholder='e.g. MacBook Pro 16"' className={inputCls} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelCls}>
                        {t('field_brand')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
                      </label>
                      <input value={form.brand} onChange={setCapitalized('brand')} placeholder="e.g. Apple" className={inputCls} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelCls}>{t('field_sku')}</label>
                      <div className="relative group/sku">
                        <input value={form.sku} onChange={set('sku')} placeholder="Auto-generated" className={`${inputCls} pr-10`} />
                        {mode !== 'view' && (
                          <button 
                            type="button" 
                            onClick={generateSKU} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors" 
                            title="Generate random SKU"
                          >
                            <Wand2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>
                        {t('field_description')} <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
                      </label>
                      <textarea value={form.description} onChange={set('description')} placeholder="Short product description…" rows={2} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                </Card>

                <Card title="Pricing & Inventory" icon={DollarSign} className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pricing */}
                    <div>
                      <label className={labelCls}>
                        {t('field_cost')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px] font-bold">{form.currency}</span>
                        <input required type="number" min="0" step="0.01" value={form.cost} onChange={set('cost')} onKeyDown={handleNumberKeyDown(true)} placeholder="0.00" className={`${numberInputCls} pl-12 font-semibold ${highlight === 'cost' ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-indigo-50/50 dark:bg-indigo-500/10 transition-all duration-1000' : ''}`} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col relative">
                      <label className={labelCls}>
                        {t('field_selling_price')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px] font-bold">{form.currency}</span>
                        <input required type="number" min="0" step="0.01" value={form.selling_price} onChange={set('selling_price')} onKeyDown={handleNumberKeyDown(true)} placeholder="0.00" className={`${numberInputCls} pl-12 font-semibold ${highlight === 'cost' ? 'border-amber-500 ring-2 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)] bg-amber-50/50 dark:bg-amber-500/10 transition-all duration-1000' : ''}`} />
                      </div>
                      <div className="h-4 mt-1.5 flex items-center absolute -bottom-5 left-0">
                        {(costVal > 0 || priceVal > 0) && (
                          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wide">
                            <span className={`px-1.5 py-0.5 rounded border ${profitColor}`}>
                              {profit > 0 ? '+' : ''}{margin.toFixed(1)}%
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {profit > 0 ? '+' : ''}{form.currency} {profit.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inventory */}
                    <div className="mt-4">
                      <label className={labelCls}>
                        {mode === 'add' ? t('field_qty_initial') : t('field_qty')} <span className="text-red-500">*</span>
                      </label>
                      <input required type="number" min="0" value={form.quantity} onChange={set('quantity')} onKeyDown={handleNumberKeyDown(false)} placeholder="0" className={numberInputCls} />
                    </div>
                    
                    <div className="mt-4">
                      <label className={`${labelCls} flex items-center gap-1.5 group relative w-fit`}>
                        <span>{t('field_reorder')}</span>
                        <Info size={13} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-[11px] font-medium leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-20 pointer-events-none text-center">
                          You will be alerted when stock falls below this number.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-800 dark:border-t-white"></div>
                        </div>
                      </label>
                      <input required type="number" min="0" value={form.reorder_point} onChange={set('reorder_point')} onKeyDown={handleNumberKeyDown(false)} placeholder="10" className={numberInputCls} />
                    </div>

                  </div>
                </Card>

              </div>

              {/* Right Column (1/3 width) */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                
                <Card title="Organization" icon={Folder}>
                  <div className="flex flex-col gap-4">
                    <div className="z-20">
                      <label className={labelCls}>{t('field_category')} <span className="text-red-500">*</span></label>
                      <CustomSelect
                        required
                        disabled={mode === 'view'}
                        value={form.category}
                        onChange={(val) => setForm(f => ({ ...f, category: val }))}
                        placeholder="Choose a category..."
                        options={categories.map(c => ({ value: c.name, label: c.name }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="z-10">
                      <label className={labelCls}>
                        Preferred Supplier <span className="font-normal text-slate-400 dark:text-slate-500">{t('field_optional')}</span>
                      </label>
                      <CustomSelect
                        disabled={mode === 'view'}
                        value={form.supplier_id}
                        onChange={(val) => setForm(f => ({ ...f, supplier_id: val }))}
                        placeholder="Select preferred supplier..."
                        options={[
                          { value: '', label: 'No preferred supplier' },
                          { value: suppliers.find(s => s.name === 'In-House Production')?.id || '__in_house__', label: 'In-House Production' },
                          ...suppliers.filter(s => s.name !== 'In-House Production').map(s => ({ value: s.id, label: s.name })),
                        ]}
                        className={inputCls}
                        onClick={() => {
                          if (suppliers.length === 0 && onNoSuppliersClick) {
                            onNoSuppliersClick()
                          }
                        }}
                      />
                    </div>
                  </div>
                </Card>


                <Card title="Media" icon={ImgIcon} className="flex-1">
                  <div className="flex flex-col h-full min-h-[140px]">
                    <label className={labelCls}>
                      Product Image <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
                    </label>
                    <label className={`flex-1 mt-1 relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center transition-all group overflow-hidden bg-slate-50 dark:bg-[#0A0A0B] ${mode === 'view' ? 'cursor-default' : 'hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer'}`}>
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} alt="Preview" className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${mode !== 'view' && 'group-hover:scale-110'}`} />
                          {mode !== 'view' && (
                            <button type="button" onClick={(e) => { e.preventDefault(); setImageFile(null); setPreviewUrl(''); setForm(f => ({...f, image_url: ''})) }} className="absolute top-2 right-2 bg-slate-900/60 hover:bg-rose-500 text-white rounded-full p-1.5 backdrop-blur-md transition-colors z-10">
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                          {mode === 'view' ? (
                            <>
                              <ImageIcon size={28} className="text-slate-300 dark:text-slate-600 mb-1" />
                              <span className="font-bold text-[13px] text-slate-400 dark:text-slate-500">No Image</span>
                            </>
                          ) : (
                            <>
                              <Upload size={22} className="text-indigo-500 mb-1" />
                              <span className="font-bold text-[13px] text-indigo-500">Click to upload</span>
                              <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500 max-w-[120px]">PNG, JPG, WEBP (Max 5MB)</span>
                            </>
                          )}
                        </div>
                      )}
                      {mode !== 'view' && <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />}
                    </label>
                  </div>
                </Card>

              </div>
            </div>

            {localError && mode !== 'view' && (
              <div className="mt-6 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-[13px] font-medium text-red-600 dark:text-red-400 leading-relaxed flex items-center justify-center shadow-sm">
                {localError}
              </div>
            )}
            </fieldset>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 bg-white dark:bg-[#12141c] border-t border-slate-200 dark:border-white/10 shrink-0 z-10">
          {mode === 'add' && hasDraft && (
            <button type="button" onClick={handleClearDraft} className="mr-auto px-6 py-2.5 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors text-sm font-semibold">
              Clear Draft
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold transition-colors ${mode === 'view' ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}`}
          >
            {mode === 'view' ? 'Close' : t('modal_cancel')}
          </button>
          {mode !== 'view' && (
            <button
              type="submit"
              form="product-form"
              disabled={isPending || uploadMutation.isPending || !hasChanges}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
            >
              {isPending || uploadMutation.isPending ? t('modal_saving') : mode === 'add' ? t('modal_add_btn') : t('modal_save')}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  )
}
