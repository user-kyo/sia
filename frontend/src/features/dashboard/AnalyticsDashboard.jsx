import React from 'react';
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download } from 'lucide-react';

const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics Overview</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Real-time insights and predictive forecasting</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer">
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Revenue" value="$45,231.89" icon={DollarSign} trend="+20.1%" trendUp={true} />
        <Card title="Sales Transactions" value="1,204" icon={TrendingUp} trend="+12.5%" trendUp={true} />
        <Card title="Inventory Items" value="8,432" icon={Package} trend="-4.2%" trendUp={false} />
        <Card title="Low Stock Alerts" value="12" icon={AlertCircle} trend="Requires attention" alert={true} />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center justify-between">
            Sales & Revenue Trends
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Predicted</span>
          </h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm font-medium">
            [ Matplotlib Base64 Line Chart Output ]
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Category Performance</h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm font-medium">
            [ Matplotlib Base64 Pie Chart Output ]
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-6">Top Selling Products</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm font-medium">
            [ Matplotlib Base64 Bar Chart Output ]
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-900">Low Stock Warning</h3>
            <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</a>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 font-semibold bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Stock Level</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map(i => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">Sony Alpha a7 IV</td>
                    <td className="px-6 py-3.5 text-slate-600">5 units</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        Critical
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, icon: Icon, trend, trendUp, alert }) => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 rounded-lg border border-slate-100 shadow-sm bg-white">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      {alert ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">Attention</span>
      ) : (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trendUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
    </div>
  </div>
);

export default AnalyticsDashboard;
