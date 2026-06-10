import { useState, useEffect } from 'react'
import { Download, Package, ShoppingCart, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { ReportCardSkeleton } from '../components/ui/Skeletons'

const ReportsPage = () => {
  const { t } = useAppSettings()
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleExport = (type) => {
    setDownloading(type)
    setTimeout(() => {
      setDownloading(null)
      // Simulate download completion
    }, 2000)
  }

  const reports = [
    {
      id: 'inventory',
      icon: Package,
      title: t('rep_card_inv'),
      description: t('rep_card_inv_desc'),
      color: 'indigo'
    },
    {
      id: 'sales',
      icon: ShoppingCart,
      title: t('rep_card_sales'),
      description: t('rep_card_sales_desc'),
      color: 'emerald'
    },
    {
      id: 'analytics',
      icon: LayoutDashboard,
      title: t('rep_card_analytics'),
      description: t('rep_card_analytics_desc'),
      color: 'purple'
    }
  ]

  const getColorClasses = (color) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
      case 'emerald': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'purple': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      default: return 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('rep_title')}</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('rep_subtitle')}</p>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <ReportCardSkeleton count={3} />
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => {
              const Icon = report.icon;
              const colorClasses = getColorClasses(report.color);
              const isDownloading = downloading === report.id;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg" />
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 transition-transform duration-300 group-hover:scale-110 ${colorClasses}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{report.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed min-h-[60px]">{report.description}</p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 relative z-10">
                    <button 
                      onClick={() => handleExport(report.id)}
                      disabled={isDownloading || downloading !== null}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 dark:border-indigo-500/20"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          {t('rep_btn_export')}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReportsPage
