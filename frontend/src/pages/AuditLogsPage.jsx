import React from 'react'
import { ShieldAlert, Download, Filter, Search } from 'lucide-react'
import { useAppSettings } from '../contexts/AppSettingsContext'

const AuditLogsPage = () => {
  const { t } = useAppSettings()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('audit_title')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('audit_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md shadow-sm dark:shadow-none">
            <Filter className="w-4 h-4" />
            {t('audit_btn_filters')}
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Download className="w-4 h-4" />
            {t('audit_btn_export')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01] flex justify-between items-center transition-colors">
          <div className="relative w-72">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder={t('audit_search_ph')}
              className="w-full bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all backdrop-blur-md shadow-sm dark:shadow-none"
            />
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4 py-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm dark:shadow-none transition-colors">
            {t('audit_period')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 transition-colors">
              <tr>
                <th className="px-6 py-4">{t('audit_col_ts')}</th>
                <th className="px-6 py-4">{t('audit_col_user')}</th>
                <th className="px-6 py-4">{t('audit_col_action')}</th>
                <th className="px-6 py-4">{t('audit_col_module')}</th>
                <th className="px-6 py-4">{t('audit_col_desc')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">2026-06-04 14:32:01</td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">john.admin</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 tracking-wider">DELETE</span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">Inventory</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">Deleted product PRD-2023 (MacBook Pro 16")</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">2026-06-04 14:28:15</td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">sarah.staff</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 tracking-wider">CREATE</span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">Sales</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">Processed transaction TRX-99382 ($5,395.68)</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-xs">2026-06-04 09:12:00</td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">system</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 tracking-wider">AUTH</span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">Authentication</td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">User john.admin logged in successfully from IP 192.168.1.45</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <span>{t('audit_showing', { from: '1', to: '3', total: '1,294' })}</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none">{t('audit_prev')}</button>
            <button className="px-4 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none">{t('audit_next')}</button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-6 flex gap-4 mt-6 transition-colors">
        <ShieldAlert className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm">{t('audit_notice_title')}</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80 mt-1.5 leading-relaxed">
            {t('audit_notice_body')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuditLogsPage
