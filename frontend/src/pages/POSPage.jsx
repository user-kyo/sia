import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart, Trash2, SlidersHorizontal, Package } from 'lucide-react';
import { useInventory, useInventorySubscription, useAdjustStock, useCategories } from '../features/inventory/hooks/useInventory';
import FiltersPanel from '../features/inventory/components/FiltersPanel';
import React, { useState, useEffect } from 'react'
import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart, Trash2, SlidersHorizontal } from 'lucide-react'
import { useInventory, useInventorySubscription, useAdjustStock, useCategories } from '../features/inventory/hooks/useInventory'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { useCurrency } from '../contexts/CurrencyContext'
import FiltersPanel from '../features/inventory/components/FiltersPanel'

const POSPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cart, setCart] = useState([])
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({ category: '', stockStatus: '', minPrice: '', maxPrice: '' })

  const { t } = useAppSettings()
  const { code, formatPrice, formatAs, convertAmount } = useCurrency()

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useInventorySubscription()

  const queryFilters = {
    search: debouncedSearch || undefined,
    category: filters.category || undefined,
    stockStatus: filters.stockStatus || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
  }

  const { data, isLoading: loading } = useInventory(queryFilters, { refetchInterval: 3000 })
  const { data: categories = [] } = useCategories()
  const products = data?.pages.flatMap(page => page.data) || []

  const adjustStockMutation = useAdjustStock()

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.cartQuantity >= product.quantity) return prev
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item)
      }
      if (product.quantity <= 0) return prev
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

  const clearCart = () => setCart([])

  // Convert each item to the display currency before summing
  const total = cart.reduce((sum, item) => {
    const unitInDisplay = convertAmount(item.price, item.currency || code, code)
    return sum + unitInDisplay * item.cartQuantity
  }, 0)

  const processCheckout = async () => {
    if (cart.length === 0) return
    setIsCheckoutLoading(true)
    try {
      await Promise.all(cart.map(item =>
        adjustStockMutation.mutateAsync({
          id: item.id,
          adjustment_type: 'remove',
          quantity: item.cartQuantity,
        })
      ))
      setCart([])
      setIsModalOpen(false)
    } catch (error) {
      console.error('Checkout failed:', error)
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
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.01] transition-colors">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-2.5" />
              <input
                type="text"
                placeholder={t('pos_search_ph')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center justify-center w-[46px] h-[46px] border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-transparent scroll-smooth">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white/20 dark:border-t-indigo-500 border-t-indigo-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 transition-colors">
              <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-white/10" />
              <p>{t('pos_no_results')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {
                const stock = getStockStatus(product.quantity)
                const price = Number(product.price) || 0
                const storedCurrency = product.currency || code
                const showConversion = storedCurrency !== code

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:shadow-md dark:hover:shadow-none hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-all duration-300 group flex flex-col items-center shadow-sm dark:shadow-none relative overflow-hidden"
                  >
                    {/* Stock Indicator Pill */}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${stock.bg} ${stock.text} shadow-sm dark:shadow-none z-10 transition-colors`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${stock.dot}`} />
                      {t(stock.tKey)}
                    </div>

                    {/* Image Area */}
                    <div className="w-full h-32 bg-slate-50 dark:bg-white/[0.03] rounded-lg mb-4 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05] transition-colors mt-6 overflow-hidden relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-white/10" />
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

                          {/* Image Area */}
                          <div className="w-full h-32 bg-slate-50 dark:bg-white/[0.03] rounded-lg mb-4 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05] transition-colors mt-6 overflow-hidden relative">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/10 dark:to-purple-500/10 flex flex-col items-center justify-center text-indigo-300 dark:text-indigo-500/40 group-hover:scale-105 transition-transform duration-500">
                                <Package className="w-10 h-10 mb-1 drop-shadow-sm" strokeWidth={1.5} />
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Photo</span>
                              </div>
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
                              <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg leading-none transition-colors">${price.toFixed(2)}</p>
                              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 transition-colors">{Number(product.quantity) || 0} IN STOCK</p>
                            </div>
                            <button className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 p-2.5 rounded-xl transition-all duration-300 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:border-indigo-600 dark:group-hover:border-indigo-500 group-hover:text-white dark:group-hover:text-white group-hover:shadow-md dark:group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-105 active:scale-95">
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
                      <button className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 p-2.5 rounded-xl transition-all duration-300 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:border-indigo-600 dark:group-hover:border-indigo-500 group-hover:text-white dark:group-hover:text-white group-hover:shadow-md dark:group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-105 active:scale-95">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current Order Area */}
      <div className="w-96 flex flex-col bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center transition-colors">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{t('pos_order_title')}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {cart.length === 1 ? t('pos_item', { n: cart.length }) : t('pos_items', { n: cart.length })}
            </p>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              {t('pos_clear')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-300 dark:text-white/10" />
              <p className="font-medium text-sm">{t('pos_empty_title')}</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">{t('pos_empty_hint')}</p>
            </div>
          ) : (
            cart.map(item => {
              const itemStoredCcy = item.currency || code
              const unitInDisplay = convertAmount(item.price, itemStoredCcy, code)
              return (
              <div key={item.id} className="flex justify-between items-start group">
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
                    <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">{item.cartQuantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1) }} disabled={item.cartQuantity >= item.quantity} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-r-lg transition-colors disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }} className="ml-4 mt-1 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              )
            })

          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <div className="flex justify-between text-xl pt-4 border-t border-slate-200 dark:border-white/10 mt-2 transition-colors mb-6">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">{t('pos_total')}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-white/10 text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
          >
            <CreditCard className="w-5 h-5" />
            {t('pos_charge')} {formatPrice(total)}
          </button>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0d0f1a] dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-white/10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('pos_checkout_title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('pos_checkout_hint')}</p>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/[0.02]">
              <div className="max-h-48 overflow-y-auto mb-4 space-y-2 pr-2">
                {cart.map(item => {
                  const ccy = item.currency || code
                  const lineTotal = convertAmount(item.price, ccy, code) * item.cartQuantity
                  return (
                  <div key={item.id} className="flex justify-between text-sm border-b border-slate-200/50 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1 pr-2">{item.cartQuantity}x {item.name}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{formatPrice(lineTotal)}</span>
                  </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center mb-2 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-white/10 pt-4">
                <span>{t('pos_total_items')}</span>
                <span className="font-medium">{cart.reduce((sum, item) => sum + item.cartQuantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mt-1">
                <span>{t('pos_amount')}</span>
                <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="p-6 flex gap-3 bg-white dark:bg-[#0d0f1a]">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isCheckoutLoading}
                className="flex-1 py-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors disabled:opacity-50"
              >
                {t('modal_cancel')}
              </button>
              <button
                onClick={processCheckout}
                disabled={isCheckoutLoading}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isCheckoutLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {isCheckoutLoading ? t('pos_processing') : t('pos_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
}

export default POSPage
