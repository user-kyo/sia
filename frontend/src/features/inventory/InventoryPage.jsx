import React from 'react';
import { Plus, Filter, Edit2, Trash2, Search, MoreHorizontal } from 'lucide-react';

const InventoryPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage products, pricing, and view stock levels</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by name, ID, or category..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            142 Total Products
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock Level</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">MacBook Pro 16" (M3 Max)</span>
                      <span className="text-xs text-slate-500 mt-0.5 font-medium">PRD-202{i}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Electronics
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">$3,499.00</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${i % 3 === 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      <span className="font-medium text-slate-700">{i % 3 === 0 ? '5' : '42'} in stock</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm font-medium text-slate-500 bg-slate-50">
          <span>Showing 1-6 of 142 entries</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-900 shadow-sm">Previous</button>
            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors text-slate-900 shadow-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
