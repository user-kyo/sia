import React from 'react';
import { ShieldAlert, Download, Filter, Search } from 'lucide-react';

const AuditLogsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">System-wide activity monitoring and security tracking</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search user, action, or module..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Past 7 days
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Module</th>
                <th className="px-6 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-xs">2026-06-04 14:32:01</td>
                <td className="px-6 py-3.5 font-medium text-slate-900">john.admin</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">DELETE</span>
                </td>
                <td className="px-6 py-3.5 text-slate-600 font-medium">Inventory</td>
                <td className="px-6 py-3.5 text-slate-600">Deleted product PRD-2023 (MacBook Pro 16")</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-xs">2026-06-04 14:28:15</td>
                <td className="px-6 py-3.5 font-medium text-slate-900">sarah.staff</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">CREATE</span>
                </td>
                <td className="px-6 py-3.5 text-slate-600 font-medium">Sales</td>
                <td className="px-6 py-3.5 text-slate-600">Processed transaction TRX-99382 ($5,395.68)</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono text-xs">2026-06-04 09:12:00</td>
                <td className="px-6 py-3.5 font-medium text-slate-900">system</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">AUTH</span>
                </td>
                <td className="px-6 py-3.5 text-slate-600 font-medium">Authentication</td>
                <td className="px-6 py-3.5 text-slate-600">User john.admin logged in successfully from IP 192.168.1.45</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm font-medium text-slate-500 bg-slate-50">
          <span>Showing 1-3 of 1,294 entries</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-900 shadow-sm">Previous</button>
            <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors text-slate-900 shadow-sm">Next</button>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex gap-4 mt-6">
        <ShieldAlert className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">Administrative Access Only</h4>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            This module is strictly restricted to Administrators. Staff members attempting to access this route will be automatically redirected to their dashboard and the attempt will be logged.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
