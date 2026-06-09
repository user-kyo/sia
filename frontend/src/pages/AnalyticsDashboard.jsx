import React from 'react';
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download } from 'lucide-react';

const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Analytics Overview</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Real-time insights and predictive forecasting</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="appearance-none bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer backdrop-blur-md shadow-sm dark:shadow-none">
              <option className="bg-white dark:bg-[#1b2035]">Last 30 Days</option>
              <option className="bg-white dark:bg-[#1b2035]">Last Quarter</option>
              <option className="bg-white dark:bg-[#1b2035]">This Year</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
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
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
            Sales & Revenue Trends
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-md">Predicted</span>
          </h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Line Chart Output ]
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Category Performance</h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Pie Chart Output ]
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Top Selling Products</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Bar Chart Output ]
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Low Stock Warning</h3>
            <a href="#" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">View all</a>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10 transition-colors">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                {[1, 2, 3, 4].map(i => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">Sony Alpha a7 IV</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">5 units</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
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
  <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:shadow-md dark:hover:shadow-none hover:border-slate-300 dark:hover:bg-white/[0.04] transition-all duration-300 shadow-sm dark:shadow-none">
    <div className="flex justify-between items-start mb-6">
      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-white/[0.05] border border-indigo-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      {alert ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">Attention</span>
      ) : (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${trendUp ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'}`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <h4 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h4>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">{title}</p>
    </div>
  </div>
);

export default AnalyticsDashboard;
