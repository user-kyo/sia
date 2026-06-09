import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, CreditCard, X, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
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
      <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-900 tracking-tight">Current Order</h3>
          <p className="text-xs font-medium text-slate-500 mt-1">Order #TRX-99382</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between items-start group">
              <div className="flex-1 pr-4">
                <h5 className="font-semibold text-sm text-slate-900">Sony Alpha a7 IV</h5>
                <p className="text-xs font-medium text-slate-500 mt-0.5">$2,498.00</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-sm text-slate-900">$2,498.00</span>
                <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
                  <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-l-md transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-8 text-center text-xs font-semibold text-slate-900">1</span>
                  <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-r-md transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <button className="ml-3 mt-1 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-100 bg-white">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">$4,996.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-500">Tax (8%)</span>
              <span className="font-semibold text-slate-900">$399.68</span>
            </div>
            <div className="flex justify-between text-lg pt-3 border-t border-slate-100">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">$5,395.68</span>
            </div>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-sm">
            <CreditCard className="w-4 h-4" />
            Charge $5,395.68
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSPage;

