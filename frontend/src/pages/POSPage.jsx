import React from 'react';
import { Search, Plus, Minus, CreditCard, X } from 'lucide-react';

const POSPage = () => {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Scan barcode or search products..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-[#F8FAFC]">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all group flex flex-col items-center">
                <div className="w-full h-32 bg-slate-50 rounded-lg mb-4 flex items-center justify-center border border-slate-100 group-hover:bg-slate-100/50 transition-colors">
                  {/* Placeholder for Product Image */}
                  <div className="w-12 h-12 rounded bg-slate-200"></div>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm text-center w-full truncate">Sony Alpha a7 IV</h4>
                <p className="text-slate-500 font-medium text-xs mt-1">PRD-202{i}</p>
                <div className="mt-3 w-full flex justify-between items-center">
                  <p className="text-slate-900 font-bold">$2,498.00</p>
                  <p className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">12 IN STOCK</p>
                </div>
              </div>
            ))}
          </div>
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
