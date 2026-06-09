import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart, Trash2, SlidersHorizontal } from 'lucide-react';
import { useInventory, useInventorySubscription, useAdjustStock, useCategories } from '../features/inventory/hooks/useInventory';
import FiltersPanel from '../features/inventory/components/FiltersPanel';

const POSPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ category: '', stockStatus: '', minPrice: '', maxPrice: '' });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Setup realtime subscription (if enabled in DB)
  useInventorySubscription();

  const queryFilters = {
    search: debouncedSearch || undefined,
    category: filters.category || undefined,
    stockStatus: filters.stockStatus || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
  };

  // Also add polling as a fallback every 3 seconds to guarantee it shows up instantly 
  // even if Supabase Realtime isn't configured in the database dashboard.
  const { data, isLoading: loading } = useInventory(queryFilters, { refetchInterval: 3000 });
  const { data: categories = [] } = useCategories();
  const products = data?.pages.flatMap(page => page.data) || [];

  const adjustStockMutation = useAdjustStock();

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity) return prev; // Cannot add more than stock
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      if (product.quantity <= 0) return prev; // Out of stock
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.cartQuantity + delta;
        if (newQty > item.quantity) return item; // Exceeds stock
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }).filter(item => item.cartQuantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.cartQuantity), 0);

  const processCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckoutLoading(true);
    try {
      await Promise.all(cart.map(item => 
        adjustStockMutation.mutateAsync({
          id: item.id,
          adjustment_type: 'remove',
          quantity: item.cartQuantity
        })
      ));
      
      setCart([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Checkout failed:', error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const getStockStatus = (quantity) => {
    const qty = Number(quantity) || 0;
    if (qty <= 0) return { label: 'Out of Stock', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' };
    if (qty <= 10) return { label: 'Low Stock', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', dot: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Scan barcode or search products by name, sku, or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center justify-center w-10 h-10 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-[#F8FAFC]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Search className="w-12 h-12 mb-4 text-slate-300" />
              <p>No products found matching your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(product => {
                const stock = getStockStatus(product.quantity);
                const price = Number(product.price) || 0;
                
                return (
                  <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group flex flex-col items-center relative overflow-hidden">
                    {/* Stock Indicator Pill */}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${stock.bg} ${stock.text} shadow-sm z-10`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${stock.dot}`}></div>
                      {stock.label}
                    </div>

                    {/* Image Area */}
                    <div className="w-full h-32 bg-slate-50 rounded-lg mb-4 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100/50 transition-colors overflow-hidden mt-6 relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="w-full text-left space-y-1">
                      <h4 className="font-semibold text-slate-900 text-sm w-full line-clamp-2 leading-tight" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                        {product.category || 'Uncategorized'}
                      </p>
                    </div>
                    
                    <div className="mt-4 w-full flex justify-between items-center border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-blue-600 font-bold text-lg leading-none">${price.toFixed(2)}</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-1">{Number(product.quantity) || 0} IN STOCK</p>
                      </div>
                      <button className="bg-slate-50 border border-slate-200 text-slate-400 p-2.5 rounded-xl transition-all duration-300 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white group-hover:shadow-md group-hover:scale-105 active:scale-95">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current Order Area */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">Current Order</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">{cart.length} Item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-medium text-sm">Your cart is empty</p>
              <p className="text-xs mt-1 text-slate-400">Click on a product to add it</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex-1 pr-4">
                  <h5 className="font-semibold text-sm text-slate-900 line-clamp-1" title={item.name}>{item.name}</h5>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-sm text-slate-900">${(Number(item.price) * item.cartQuantity).toFixed(2)}</span>
                  <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-l-md transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-8 text-center text-xs font-semibold text-slate-900">{item.cartQuantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} disabled={item.cartQuantity >= item.quantity} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-r-md transition-colors disabled:opacity-50"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="ml-3 mt-1 p-1 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-white">
          <div className="mb-6">
            <div className="flex justify-between items-center text-xl pt-2">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Confirm Checkout</h2>
              <p className="text-sm text-slate-500 mt-1">Please review the order details before charging.</p>
            </div>
            
            <div className="p-6 bg-slate-50">
              <div className="max-h-48 overflow-y-auto mb-4 space-y-2 pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-600 line-clamp-1 pr-2">{item.cartQuantity}x {item.name}</span>
                    <span className="font-medium text-slate-900">${(item.cartQuantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mb-2 text-slate-600 border-t border-slate-200 pt-4">
                <span>Total Items</span>
                <span className="font-medium">{cart.reduce((sum, item) => sum + item.cartQuantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 mt-1">
                <span>Amount to Charge</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 flex gap-3 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isCheckoutLoading}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={processCheckout}
                disabled={isCheckoutLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
              >
                {isCheckoutLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {isCheckoutLoading ? 'Processing...' : 'Confirm Charge'}
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
  );
};

export default POSPage;

