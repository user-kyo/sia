import React, { useState } from 'react';
import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { useInventory, useInventorySubscription } from '../features/inventory/hooks/useInventory';

const POSPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Setup realtime subscription (if enabled in DB)
  useInventorySubscription();

  // Also add polling as a fallback every 3 seconds to guarantee it shows up instantly 
  // even if Supabase Realtime isn't configured in the database dashboard.
  const { data, isLoading: loading } = useInventory({}, { refetchInterval: 3000 });
  const products = data?.pages.flatMap(page => page.data) || [];

  const getStockStatus = (quantity) => {
    const qty = Number(quantity) || 0;
    if (qty <= 0) return { label: 'Out of Stock', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' };
    if (qty <= 10) return { label: 'Low Stock', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', dot: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
  };

  const filteredProducts = products.filter(p => 
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.01] transition-colors">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-2.5" />
            <input 
              type="text" 
              placeholder="Scan barcode or search products..." 
              className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
            />
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-transparent scroll-smooth">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:shadow-md dark:hover:shadow-none hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer transition-all duration-300 group flex flex-col items-center shadow-sm dark:shadow-none">
                <div className="w-full h-32 bg-slate-50 dark:bg-white/[0.03] rounded-lg mb-4 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05] transition-colors">
                  {/* Placeholder for Product Image */}
                  <div className="w-12 h-12 rounded bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/5"></div>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm text-center w-full truncate">Sony Alpha a7 IV</h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1">PRD-202{i}</p>
                <div className="mt-3 w-full flex justify-between items-center">
                  <p className="text-slate-900 dark:text-white font-bold">$2,498.00</p>
                  <p className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/5">12 IN STOCK</p>
                </div>
              </div>
            ))}
          </div>
              placeholder="Scan barcode or search products by name, sku, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-[#F8FAFC]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Search className="w-12 h-12 mb-4 text-slate-300" />
              <p>No products found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const stock = getStockStatus(product.quantity);
                const price = Number(product.price) || 0;
                
                return (
                  <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group flex flex-col items-center relative overflow-hidden">
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
      <div className="w-96 flex flex-col bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Current Order</h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Order #TRX-99382</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between items-start group">
              <div className="flex-1 pr-4">
                <h5 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Sony Alpha a7 IV</h5>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">$2,498.00</p>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">$2,498.00</span>
                <div className="flex items-center bg-slate-50 dark:bg-white/[0.05] rounded-lg border border-slate-200 dark:border-white/10">
                  <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-l-lg transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">1</span>
                  <button className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-r-lg transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
              <button className="ml-4 mt-1 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400">Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">$4,996.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-500 dark:text-slate-400">Tax (8%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">$399.68</span>
            </div>
            <div className="flex justify-between text-xl pt-4 border-t border-slate-200 dark:border-white/10 mt-2 transition-colors">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">Total</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">$5,395.68</span>
            </div>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <CreditCard className="w-5 h-5" />
            Charge $5,395.68
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;

