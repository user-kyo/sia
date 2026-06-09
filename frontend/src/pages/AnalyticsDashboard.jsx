import React from 'react'
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeletons'

const AnalyticsDashboard = () => {
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])
  const { formatPrice } = useCurrency()
  const { t } = useAppSettings()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('dash_title')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('dash_subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="appearance-none bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all cursor-pointer backdrop-blur-md shadow-sm dark:shadow-none">
              <option className="bg-white dark:bg-[#1b2035]">{t('dash_period_30')}</option>
              <option className="bg-white dark:bg-[#1b2035]">{t('dash_period_qtr')}</option>
              <option className="bg-white dark:bg-[#1b2035]">{t('dash_period_yr')}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Download className="w-4 h-4" />
            {t('dash_export')}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div key="skeleton-dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
            <CardSkeleton count={4} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 h-[350px] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
              <div className="h-[350px] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="h-[350px] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
              <div className="h-[350px] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <TableSkeleton rows={4} columns={3} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="content-dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
            {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title={t('dash_revenue')}    value={formatPrice(45231.89)} icon={DollarSign}   trend="+20.1%" trendUp={true}  attention={t('dash_attention')} />
        <Card title={t('dash_sales_txn')} value="1,204"                 icon={TrendingUp}   trend="+12.5%" trendUp={true}  attention={t('dash_attention')} />
        <Card title={t('dash_inv_items')} value="8,432"                 icon={Package}      trend="-4.2%"  trendUp={false} attention={t('dash_attention')} />
        <Card title={t('dash_low_alerts')} value="12"                   icon={AlertCircle}  trend={t('dash_attention')} alert={true} attention={t('dash_attention')} />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
            {t('dash_trends_title')}
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-md">{t('dash_predicted')}</span>
          </h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Line Chart Output ]
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">{t('dash_cat_title')}</h3>
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Pie Chart Output ]
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">{t('dash_top_title')}</h3>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-slate-500 text-sm font-medium transition-colors">
            [ Matplotlib Base64 Bar Chart Output ]
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('dash_warn_title')}</h3>
            <a href="#" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">{t('dash_view_all')}</a>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10 transition-colors">
                <tr>
                  <th className="px-6 py-4">{t('dash_col_product')}</th>
                  <th className="px-6 py-4">{t('dash_col_stock')}</th>
                  <th className="px-6 py-4 text-right">{t('dash_col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
                <AnimatePresence>
                  {[1, 2, 3, 4].map((i, index) => (
                    <motion.tr 
                      key={i} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05, type: 'spring', stiffness: 380, damping: 30 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">Sony Alpha a7 IV</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">5 units</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                        {t('dash_critical')}
                      </span>
                    </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Card = ({ title, value, icon: Icon, trend, trendUp, alert, attention }) => (
  <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:shadow-md dark:hover:shadow-none hover:border-slate-300 dark:hover:bg-white/[0.04] transition-all duration-300 shadow-sm dark:shadow-none">
    <div className="flex justify-between items-start mb-6">
      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-white/[0.05] border border-indigo-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      {alert ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">{attention}</span>
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
)

export default AnalyticsDashboard
