import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart, Trash2, SlidersHorizontal, Package, Monitor, Shirt, Coffee, Smartphone, Box, Scissors, Wrench, Book, Music, Camera, Car, ShoppingBag, Gift, Heart, Home, Tag, Check, ClipboardList, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router'
import { useInventory, useAdjustStock, useCategories, useBrands } from '../features/inventory/hooks/useInventory'
import { useAuth } from '../contexts/AuthContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { useCurrency } from '../contexts/CurrencyContext'
import FiltersPanel from '../features/inventory/components/FiltersPanel'
import { ProductGridSkeleton } from '../components/ui/Skeletons'
import { createSalesTransaction, SALES_TRANSACTIONS_QUERY_KEY, fetchSalesTransactions } from '../features/sales/api/salesApi'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

const CATEGORY_ICONS = {
  Package, Monitor, Shirt, Coffee, Smartphone, Box, 
  Scissors, Wrench, Book, Music, Camera, Car, 
  ShoppingBag, Gift, Heart, Home
}

const POSPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cart, setCart] = useState([])
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stockAlert, setStockAlert] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ categories: [], brands: [], stockStatuses: [], minPrice: '', maxPrice: '', hasImage: false, sortBy: 'created_at-desc' })
  const [editingQuantityId, setEditingQuantityId] = useState(null)
  const [tempQuantity, setTempQuantity] = useState('')
  const [amountTendered, setAmountTendered] = useState('')
  const [heldOrders, setHeldOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_held_orders')) || [] } catch { return [] }
  })
  const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false)
  const [discount, setDiscount] = useState({ type: 'percentage', value: 0 }) // type: 'percentage' or 'fixed'
  const [completedOrder, setCompletedOrder] = useState(null)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [isHoldConfirmOpen, setIsHoldConfirmOpen] = useState(false)
  const [holdOrderName, setHoldOrderName] = useState('')
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const { t, settings } = useAppSettings()
  const { companyName } = useAuth()
  const { code, formatPrice, formatAs, convertAmount } = useCurrency()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders))
  }, [heldOrders])



  const queryFilters = {
    search: debouncedSearch || undefined,
    category: filters.categories?.length > 0 ? filters.categories.join(',') : undefined,
    brand: filters.brands?.length > 0 ? filters.brands.join(',') : undefined,
    stockStatus: filters.stockStatuses?.length > 0 ? filters.stockStatuses.join(',') : undefined,
    hasImage: filters.hasImage ? true : undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    sortBy: filters.sortBy ? filters.sortBy.split('-')[0] : 'created_at',
    sortOrder: filters.sortBy ? filters.sortBy.split('-')[1] : 'desc',
  }

  const { data, isLoading: loading } = useInventory(queryFilters, { refetchInterval: 3000 })
  const { data: categories = [] } = useCategories()
  const { data: brands = [] } = useBrands()
  const products = data?.pages.flatMap(page => page.data) || []

  const { data: salesHistoryData, isLoading: loadingHistory } = useQuery({
    queryKey: [...SALES_TRANSACTIONS_QUERY_KEY, 'history'],
    queryFn: () => fetchSalesTransactions({ limit: 50 }),
    enabled: isHistoryOpen
  })

  const adjustStockMutation = useAdjustStock()

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (product.quantity <= 0) {
      setStockAlert({ product, type: 'out_of_stock' })
      return
    }
    if (existing && existing.cartQuantity >= product.quantity) {
      setStockAlert({ product, type: 'max_stock' })
      return
    }

    setCart(prev => {
      const existingInPrev = prev.find(item => item.id === product.id)
      if (existingInPrev) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item)
      }
      return [...prev, { ...product, cartQuantity: 1 }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.cartQuantity + delta
        if (newQty > item.quantity) return item
        return { ...item, cartQuantity: newQty }
      }
      return item
    }).filter(item => item.cartQuantity > 0))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setIsClearConfirmOpen(false)
  }

  const handleQuantitySubmit = (productId) => {
    const qty = parseInt(tempQuantity, 10)
    if (!isNaN(qty) && qty > 0) {
      setCart(prev => prev.map(item => {
        if (item.id === productId) {
          const finalQty = qty > item.quantity ? item.quantity : qty
          if (qty > item.quantity) setStockAlert({ product: item, type: 'max_stock' })
          return { ...item, cartQuantity: finalQty }
        }
        return item
      }))
    } else if (qty === 0) {
      removeFromCart(productId)
    }
    setEditingQuantityId(null)
  }

  const holdOrder = () => {
    if (cart.length === 0) return
    const orderName = holdOrderName.trim() || `Order ${new Date().toLocaleTimeString()}`
    const newHeld = {
      id: Date.now().toString(),
      name: orderName,
      cart: [...cart],
      timestamp: new Date().toISOString()
    }
    setHeldOrders(prev => [newHeld, ...prev])
    setCart([])
    setIsHoldConfirmOpen(false)
    setHoldOrderName('')
  }

  const restoreOrder = (heldOrder) => {
    setCart(heldOrder.cart)
    setHeldOrders(prev => prev.filter(o => o.id !== heldOrder.id))
    setIsHeldOrdersModalOpen(false)
  }

  // Convert each item to the display currency before summing
  const subtotal = cart.reduce((sum, item) => {
    const unitInDisplay = convertAmount(item.price, item.currency || code, code)
    return sum + unitInDisplay * item.cartQuantity
  }, 0)

  const discountAmount = discount.type === 'percentage' 
    ? subtotal * ((Number(discount.value) || 0) / 100)
    : (Number(discount.value) || 0)

  const discountedTotal = Math.max(0, subtotal - discountAmount)
  const finalTotal = discountedTotal

  const processCheckout = async () => {
    if (cart.length === 0) return
    setIsCheckoutLoading(true)
    setCheckoutError(null)
    try {
      await Promise.all(cart.map(item =>
        adjustStockMutation.mutateAsync({
          id: item.id,
          adjustment_type: 'remove',
          quantity: item.cartQuantity,
        })
      ))

      await createSalesTransaction({
        total_amount: finalTotal,
        currency: code,
        items: cart.map(item => {
          const unitPrice = Number(item.price) || 0
          return {
            product_id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category || 'Uncategorized',
            quantity: item.cartQuantity,
            unit_price: unitPrice,
            line_total: unitPrice * item.cartQuantity,
            currency: item.currency || code,
          }
        }),
      })
      queryClient.invalidateQueries({ queryKey: SALES_TRANSACTIONS_QUERY_KEY })

      setCart([])
      setCompletedOrder({
        transaction_code: `TXN-${Date.now().toString().slice(-8)}`, // fallback if api doesn't return it
        items: [...cart],
        subtotal,
        discountAmount,
        finalTotal,
        amountTendered: Number(amountTendered),
        change: Number(amountTendered) - finalTotal,
        currency: code
      })
      // Don't close modal, it will switch to receipt view
    } catch (error) {
      console.error('Checkout failed:', error)
      setCheckoutError(error?.response?.data?.detail || error?.message || 'Checkout failed. Please try again.')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const getStockStatus = (quantity) => {
    const qty = Number(quantity) || 0
    if (qty <= 0)  return { tKey: 'pos_out_stock_label', text: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    dot: 'bg-rose-500' }
    if (qty <= 10) return { tKey: 'pos_low_stock_label', text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10',  dot: 'bg-amber-500' }
    return             { tKey: 'pos_in_stock',           text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500' }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
              <input
                type="text"
                placeholder={t('pos_search_ph')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none"
            >
              <SlidersHorizontal size={18} />
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none flex items-center gap-2 font-bold text-sm"
            >
              <ClipboardList size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
          {/* Quick Category Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
              <motion.button
                layout
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  !filters.categories?.length
                    ? 'text-white border border-transparent'
                    : 'bg-white dark:bg-[#0A0A0B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                }`}
              >
                {!filters.categories?.length && (
                  <motion.div layoutId="activeCategoryPOS" className="absolute inset-0 bg-indigo-600 shadow-md shadow-indigo-600/20 rounded-xl" style={{ zIndex: 0 }} />
                )}
                <span className="relative z-10">All Products</span>
              </motion.button>
              {categories.map(cat => {
                const IconComp = CATEGORY_ICONS[cat.icon] || ImageIcon;
                const isActive = filters.categories?.includes(cat.name);
                return (
                  <motion.button
                    layout
                    whileTap={{ scale: 0.95 }}
                    key={cat.id || cat.name}
                    onClick={() => setFilters(prev => ({ ...prev, categories: [cat.name] }))}
                    className={`relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'text-white border border-transparent'
                        : 'bg-white dark:bg-[#0A0A0B] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="activeCategoryPOS" className="absolute inset-0 bg-indigo-600 shadow-md shadow-indigo-600/20 rounded-xl" style={{ zIndex: 0 }} />
                    )}
                    <div className="relative z-10 flex items-center gap-1.5">
                      <IconComp size={14} className={isActive ? "text-white" : "text-slate-400 dark:text-slate-500"} />
                      <span>{cat.name}</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-transparent scroll-smooth">
          <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <ProductGridSkeleton key="skeleton-pos" count={8} />
          ) : products.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 transition-colors">
              <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-white/10" />
              <p>{t('pos_no_results')}</p>
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-10 pb-6">
              {Object.entries(
                products.reduce((acc, product) => {
                  const cat = product.category || 'Uncategorized';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(product);
                  return acc;
                }, {})
              ).sort((a, b) => a[0].localeCompare(b[0])).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight px-1 transition-colors">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence>
                    {[...items].sort((a, b) => a.name.localeCompare(b.name)).map((product, index) => {
                const stock = getStockStatus(product.quantity)
                const price = Number(product.price) || 0
                const storedCurrency = product.currency || code
                const showConversion = storedCurrency !== code

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, type: 'spring', stiffness: 380, damping: 30 } }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:shadow-lg dark:hover:shadow-none hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors transition-shadow duration-300 group flex flex-col items-center shadow-sm dark:shadow-none relative overflow-hidden"
                  >
                    {/* Image Area */}
                    <div className="w-full h-32 bg-slate-50 dark:bg-white/[0.03] rounded-xl mb-4 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05] transition-colors overflow-hidden relative">
                      {/* Stock Indicator Pill */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md bg-white/90 dark:bg-black/60 border border-slate-200/50 dark:border-white/10 ${stock.text} shadow-sm dark:shadow-none z-10 transition-colors`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${stock.dot}`} />
                        {t(stock.tKey)}
                      </div>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        (() => {
                          const catObj = categories.find(c => c.name === product.category)
                          const IconComp = catObj && CATEGORY_ICONS[catObj.icon] ? CATEGORY_ICONS[catObj.icon] : ImageIcon
                          return <IconComp className="w-8 h-8 text-slate-300 dark:text-white/10 group-hover:scale-110 transition-transform duration-500" />
                        })()
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="w-full text-left space-y-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm w-full line-clamp-2 leading-tight transition-colors" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] uppercase tracking-wider transition-colors">
                        {product.category || 'Uncategorized'}
                      </p>
                    </div>


                    <div className="mt-4 w-full flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-4 transition-colors">
                      <div>
                        {/* Always show the native/stored price as the primary display */}
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg leading-none transition-colors">
                          {formatAs(price, storedCurrency)}
                        </p>
                        {showConversion && (
                          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 transition-colors">
                            ≈ {formatPrice(price, storedCurrency)}
                          </p>
                        )}
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 transition-colors">{Number(product.quantity) || 0} {t('pos_in_stock_sm')}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Current Order Area */}
      <div className="w-96 flex flex-col bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-5 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">{t('pos_order_title')}</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {cart.length === 1 ? t('pos_item', { n: cart.length }) : t('pos_items', { n: cart.length })}
              </p>
            </div>
            <button onClick={() => setIsHeldOrdersModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm font-bold text-xs">
              <Book className="w-4 h-4" />
              Recall
            </button>
          </div>
          <div className="flex gap-3">
            <button disabled={cart.length === 0} onClick={() => { setHoldOrderName(''); setIsHoldConfirmOpen(true); }} className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Package className="w-4 h-4" />
              Park
            </button>
            <button disabled={cart.length === 0} onClick={() => setIsClearConfirmOpen(true)} className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 className="w-4 h-4" />
              Void
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-transparent">
          <AnimatePresence mode="wait">
          {cart.length === 0 ? (
            <motion.div 
              key="empty-cart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5 rounded-2xl m-2 bg-slate-50/50 dark:bg-white/[0.01]"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-white/20" />
              </div>
              <p className="font-medium text-sm text-slate-600 dark:text-slate-300">{t('pos_empty_title')}</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-500 max-w-[200px] text-center leading-relaxed">{t('pos_empty_hint')}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="cart-items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {Object.entries(
                cart.reduce((acc, item) => {
                  const cat = item.category || 'Uncategorized';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {})
              ).sort((a, b) => a[0].localeCompare(b[0])).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                    {category}
                  </h4>
                  <div className="space-y-4">
                    <AnimatePresence>
                    {[...items].sort((a, b) => a.name.localeCompare(b.name)).map(item => {
              const itemStoredCcy = item.currency || code
              const unitInDisplay = convertAmount(item.price, itemStoredCcy, code)
              return (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 10, height: 0, margin: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-between items-start group hover:bg-slate-50 dark:hover:bg-white/[0.02] p-2 -mx-2 rounded-xl transition-colors overflow-hidden"
              >
                <div className="flex-1 pr-4">
                  <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-1" title={item.name}>{item.name}</h5>
                  {/* Unit price: native currency so the user can see what it was entered as */}
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    {formatAs(Number(item.price), itemStoredCcy)}
                    {itemStoredCcy !== code && (
                      <span className="ml-1 text-slate-400 dark:text-slate-500">
                        ≈ {formatPrice(item.price, itemStoredCcy)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2.5">
                  {/* Line total always in display currency */}
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {formatPrice(unitInDisplay * item.cartQuantity)}
                  </span>
                  <div className="flex items-center bg-slate-50 dark:bg-white/[0.05] rounded-lg border border-slate-200 dark:border-white/10">
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1) }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-l-lg transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    {editingQuantityId === item.id ? (
                      <input
                        type="number"
                        autoFocus
                        className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none hide-arrows"
                        value={tempQuantity}
                        onChange={(e) => setTempQuantity(e.target.value)}
                        onBlur={() => handleQuantitySubmit(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuantitySubmit(item.id)
                          if (e.key === 'Escape') setEditingQuantityId(null)
                        }}
                      />
                    ) : (
                      <span 
                        className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTempQuantity(item.cartQuantity.toString())
                          setEditingQuantityId(item.id)
                        }}
                      >
                        {item.cartQuantity}
                      </span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }} disabled={item.cartQuantity >= item.quantity} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500 dark:disabled:hover:bg-transparent dark:disabled:hover:text-slate-400">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }} className="ml-4 mt-1 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
              )
            })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
            <div className="flex flex-col gap-2 transition-colors mb-4">
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Discount</span>
                  <button 
                    onClick={() => setIsDiscountModalOpen(true)}
                    className="text-xs font-medium bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-1 transition-colors"
                  >
                    {discount.value > 0 ? (discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)) : 'Add'}
                  </button>
                </div>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            </div>

          <div className="flex justify-between text-xl font-bold transition-colors mb-6">
            <span className="text-slate-900 dark:text-white tracking-tight">{t('pos_total')}</span>
            <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(finalTotal)}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={cart.length === 0}
            className="relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 dark:disabled:from-white/10 dark:disabled:to-white/10 text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg disabled:shadow-none group overflow-hidden"
          >
            {cart.length > 0 && <div className="absolute inset-0 bg-white/20 blur-xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />}
            <CreditCard className="w-5 h-5 relative z-10" />
            <span className="relative z-10">{t('pos_charge')} {formatPrice(finalTotal)}</span>
          </button>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => !isCheckoutLoading && setIsModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-[#0A0A0B] dark:border dark:border-white/10 rounded-[2rem] shadow-2xl w-full max-w-[440px] overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 bg-white dark:bg-[#0A0A0B] relative z-10 shrink-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('pos_checkout_title')}</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{t('pos_checkout_hint')}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="px-8 py-2 overflow-y-auto custom-scrollbar flex-1 relative z-0">
              
              {/* Order Summary Box */}
              <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-5 border border-slate-100 dark:border-white/5 mb-6 shadow-sm inset-shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-slate-200 dark:border-white/10">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('pos_total_items')} ({cart.reduce((sum, item) => sum + item.cartQuantity, 0)})</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Subtotal: {formatPrice(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total to Pay</span>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">
                      {formatPrice(finalTotal)}
                    </div>
                  </div>
                  {discountAmount > 0 && (
                    <div className="text-right">
                      <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded mb-1 border border-emerald-100 dark:border-emerald-500/20">Discount Applied</span>
                      <span className="text-sm font-bold text-slate-400 line-through">{formatPrice(subtotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Calculator */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Box className="w-4 h-4 text-slate-400" />
                  Payment Received
                </label>
                
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors shadow-sm">
                      <div className="pl-4 pr-2 py-3 bg-slate-50 dark:bg-white/5 border-r border-slate-200 dark:border-white/10 text-slate-500 font-bold shrink-0">
                        {code}
                      </div>
                      <input
                        type="number"
                        value={amountTendered}
                        onChange={(e) => setAmountTendered(e.target.value)}
                        placeholder={finalTotal.toFixed(2)}
                        className="w-full bg-transparent pl-3 pr-4 py-3 text-xl font-black text-slate-900 dark:text-white outline-none hide-arrows placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setAmountTendered(finalTotal.toString())} 
                    className="px-5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-all active:scale-95 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                  >
                    Exact
                  </button>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {[50, 100, 500, 1000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setAmountTendered((Number(amountTendered) + amt).toString())} 
                      className="flex-1 py-2.5 bg-white dark:bg-[#12141c] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                
                {/* Change Due Display */}
                <motion.div 
                  layout
                  className={`mt-4 overflow-hidden rounded-2xl border ${amountTendered !== '' && Number(amountTendered) < finalTotal ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'} p-5 transition-colors duration-300 relative`}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <span className={`text-sm font-bold uppercase tracking-wider ${amountTendered !== '' && Number(amountTendered) < finalTotal ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {amountTendered !== '' && Number(amountTendered) < finalTotal ? 'Insufficient Funds' : 'Change Due'}
                    </span>
                    <span className={`text-2xl font-black ${amountTendered !== '' && Number(amountTendered) < finalTotal ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {amountTendered === '' 
                        ? formatPrice(0) 
                        : Number(amountTendered) >= finalTotal 
                          ? formatPrice(Number(amountTendered) - finalTotal) 
                          : `Short ${formatPrice(finalTotal - Number(amountTendered))}`}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {checkoutError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300 shadow-sm"
                  >
                    {checkoutError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="p-8 pt-6 bg-white dark:bg-[#0A0A0B] relative z-10 shrink-0 border-t border-slate-100 dark:border-white/5">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCheckoutLoading}
                  className="w-1/3 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {t('modal_cancel')}
                </button>
                <button
                  onClick={processCheckout}
                  disabled={isCheckoutLoading || (amountTendered !== '' && Number(amountTendered) < finalTotal)}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg dark:shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:shadow-none"
                >
                  {isCheckoutLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {t('pos_confirm')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsDiscountModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3 }}
            className="relative bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-500" />
                Add Discount
              </h2>
              <button onClick={() => setIsDiscountModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Type Toggle */}
              <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                <motion.button
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDiscount(prev => ({ ...prev, type: 'percentage' }))}
                  className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${discount.type === 'percentage' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {discount.type === 'percentage' && (
                    <motion.div layoutId="discountType" className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm rounded-lg" style={{ zIndex: 0 }} />
                  )}
                  <span className="relative z-10">Percentage (%)</span>
                </motion.button>
                <motion.button
                  layout
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDiscount(prev => ({ ...prev, type: 'fixed' }))}
                  className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${discount.type === 'fixed' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  {discount.type === 'fixed' && (
                    <motion.div layoutId="discountType" className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm rounded-lg" style={{ zIndex: 0 }} />
                  )}
                  <span className="relative z-10">Fixed Amount</span>
                </motion.button>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Discount Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">{discount.type === 'percentage' ? '%' : code}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    max={discount.type === 'percentage' ? "100" : undefined}
                    value={discount.value === 0 ? '' : discount.value}
                    onChange={(e) => setDiscount(prev => ({ ...prev, value: e.target.value }))}
                    className={`w-full ${discount.type === 'percentage' ? 'pl-10' : 'pl-16'} pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold transition-all hide-arrows`}
                    placeholder={discount.type === 'percentage' ? '0' : '0.00'}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDiscount({ type: 'percentage', value: 0 })}
                  className="w-1/3 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold rounded-xl transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Out of Stock Modal */}
      <AnimatePresence>
      {stockAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setStockAlert(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 text-center p-6"
          >
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {stockAlert.type === 'out_of_stock' ? 'Out of Stock' : 'Maximum Stock Reached'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {stockAlert.type === 'out_of_stock' ? (
                <>Sorry, <span className="font-semibold text-slate-700 dark:text-slate-300">"{stockAlert.product.name}"</span> is currently out of stock.</>
              ) : (
                <>The maximum available quantity of <span className="font-semibold text-slate-700 dark:text-slate-300">"{stockAlert.product.name}"</span> is already in your cart.</>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStockAlert(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  const p = stockAlert.product;
                  setStockAlert(null);
                  navigate('/procurements', { state: { autoCreatePO: p } });
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                <Package className="w-4 h-4" />
                Restock PO
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Held Orders Modal */}
      <AnimatePresence>
      {isHeldOrdersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHeldOrdersModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden z-10"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Book className="w-5 h-5 text-indigo-500" />
                  Parked Orders
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recall a previously parked order</p>
              </div>
              <button onClick={() => setIsHeldOrdersModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
              {heldOrders.length === 0 ? (
                <motion.div 
                  key="empty-held"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                  className="text-center py-8"
                >
                  <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No parked orders found.</p>
                </motion.div>
              ) : (
                <motion.div key="held-list" className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                  {heldOrders.map(order => (
                    <motion.div 
                      key={order.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, height: 0, padding: 0, margin: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                      className="flex items-center justify-between px-4 py-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{order.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{order.cart.length} items • {new Date(order.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setHeldOrders(prev => prev.filter(o => o.id !== order.id))} className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg font-medium text-sm transition-colors">Discard</button>
                        <button onClick={() => restoreOrder(order)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm transition-colors shadow-sm">Recall</button>
                      </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
      {completedOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md print:hidden"
            onClick={() => { setCompletedOrder(null); setAmountTendered(''); setDiscount({type: 'percentage', value: 0}); setIsModalOpen(false); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-[#f8f9fa] dark:bg-[#12141c] rounded-b-2xl rounded-t-md shadow-2xl w-full max-w-[360px] z-10 overflow-hidden print:shadow-none print:border-none print:w-[80mm] print:m-0 print:bg-white"
          >
            {/* Close Button */}
            <button 
              onClick={() => { setCompletedOrder(null); setAmountTendered(''); setDiscount({type: 'percentage', value: 0}); setIsModalOpen(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-200/50 dark:bg-white/10 hover:bg-slate-300/50 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400 rounded-full transition-colors z-20 print:hidden"
            >
              <X size={16} />
            </button>
            {/* Receipt Zigzag Top */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-repeat-x print:hidden" style={{ backgroundImage: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%), linear-gradient(-135deg, transparent 50%, rgba(0,0,0,0.05) 50%)', backgroundSize: '12px 100%' }} />

            <div className="px-6 pt-10 pb-6 text-center border-b border-dashed border-slate-300 dark:border-white/20 print:border-black">
              <div className="w-12 h-12 mx-auto bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 print:hidden shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white print:text-black uppercase tracking-widest leading-tight">{companyName || settings?.storeName || 'OFFICIAL RECEIPT'}</h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 print:text-black">{new Date(completedOrder.created_at || Date.now()).toLocaleString()}</p>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 print:text-black">{completedOrder.transaction_code}</p>
            </div>
            
            <div className="px-6 py-4 bg-white dark:bg-[#12141c] print:bg-white">
              <div className="max-h-[35vh] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible pr-1 space-y-3">
                {completedOrder.items.map(item => {
                  const ccy = item.currency || completedOrder.currency || code
                  const unitPrice = item.price || item.unit_price || 0
                  const qty = item.cartQuantity || item.quantity || 1
                  const lineTotal = convertAmount(unitPrice, ccy, completedOrder.currency || code) * qty
                  
                  return (
                    <div key={item.id} className="text-sm flex justify-between font-mono">
                      <div className="pr-4 flex-1">
                        <div className="font-bold text-slate-900 dark:text-white print:text-black break-words leading-tight">{item.name || item.product_name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 print:text-black mt-0.5">{qty} x {formatPrice(lineTotal / qty)}</div>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white print:text-black whitespace-nowrap mt-0.5">{formatPrice(lineTotal)}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100/50 dark:bg-white/[0.02] border-y border-dashed border-slate-300 dark:border-white/20 print:border-black space-y-2 text-sm font-mono print:bg-transparent">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-black font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(completedOrder.subtotal)}</span>
              </div>
              {completedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-rose-500 dark:text-rose-400 print:text-black font-medium">
                  <span>Discount</span>
                  <span>-{formatPrice(completedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white print:text-black pt-2 border-t border-slate-300 dark:border-white/10 mt-2">
                <span>TOTAL</span>
                <span className="text-indigo-600 dark:text-indigo-400 print:text-black">{formatPrice(completedOrder.finalTotal)}</span>
              </div>
            </div>
              
            <div className="px-6 py-4 bg-white dark:bg-[#12141c] space-y-2 text-sm font-mono border-b border-dashed border-slate-300 dark:border-white/20 print:border-black print:bg-white">
              <div className="flex justify-between text-slate-600 dark:text-slate-400 print:text-black font-medium">
                <span>Cash Tendered</span>
                <span>{completedOrder.amountTendered > 0 ? formatPrice(completedOrder.amountTendered) : 'Exact'}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white print:text-black">
                <span>Change Due</span>
                <span className="text-emerald-600 dark:text-emerald-400 print:text-black">{formatPrice(completedOrder.change)}</span>
              </div>
            </div>
              
            <div className="text-center pt-5 pb-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 print:text-black uppercase tracking-widest bg-slate-50 dark:bg-[#12141c] print:bg-white">
              <div className="mb-2"><Heart className="w-4 h-4 mx-auto text-rose-400" /></div>
              Thank you for your business!
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Sales History Drawer */}
      <AnimatePresence>
      {isHistoryOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[70]"
            onClick={() => setIsHistoryOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0A0A0B] border-l border-slate-200 dark:border-white/10 z-[75] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Sales History
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : salesHistoryData?.data?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">No sales transactions found.</div>
              ) : (
                salesHistoryData?.data?.map(txn => (
                  <div 
                    key={txn.id} 
                    onClick={() => {
                      setCompletedOrder({
                        transaction_code: txn.transaction_code,
                        created_at: txn.created_at,
                        items: txn.items,
                        subtotal: txn.total_amount, 
                        discountAmount: 0, 
                        finalTotal: txn.total_amount,
                        amountTendered: 0, 
                        change: 0,
                        currency: txn.currency || code
                      })
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer transition-all group shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">{txn.transaction_code}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(txn.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">{new Date(txn.created_at).toLocaleString()}</span>
                      <span className="font-bold bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{txn.items?.length || 0} items</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsClearConfirmOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 text-center p-6"
          >
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Void Order?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to void this order and remove all {cart.length} items? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearCart}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors shadow-md dark:shadow-[0_0_15px_rgba(225,29,72,0.3)]"
              >
                Void Order
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Hold Order Modal */}
      <AnimatePresence>
      {isHoldConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHoldConfirmOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Park Order</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Save this cart to recall later</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Order Reference Name (Optional)</label>
              <input
                type="text"
                autoFocus
                value={holdOrderName}
                onChange={(e) => setHoldOrderName(e.target.value)}
                placeholder="e.g. Customer in red shirt"
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') holdOrder()
                  if (e.key === 'Escape') setIsHoldConfirmOpen(false)
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsHoldConfirmOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={holdOrder}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] flex justify-center items-center gap-2"
              >
                Park Order
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <FiltersPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories.map(c => c.name)}
        brands={brands}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
}

export default POSPage
