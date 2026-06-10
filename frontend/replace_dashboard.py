import re

with open('src/pages/AnalyticsDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showSlowHint && createPortal(
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-sm"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Fetching data from server...
          </motion.div>,
          document.body
        )}
      </AnimatePresence>

      {createPortal(
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
                onClick={() => setActiveModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
              >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{getModalTitle()}</h3>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                  <div className="flex-1 overflow-y-auto p-6 scroll-smooth border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/10">
                    {renderModalContent()}
                  </div>
                  <div className="w-full lg:w-80 shrink-0 bg-slate-50/30 dark:bg-white/[0.01] overflow-y-auto">
                    <InsightSidebar activeModal={activeModal} formatPrice={formatPrice} code={code} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

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

      <div className="space-y-8">
        {/* KPI Cards */}
        <AnimatePresence mode="wait">
          {loadingStates.kpi ? (
            <motion.div key="kpi-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <CardSkeleton count={4} />
            </motion.div>
          ) : (
            <motion.div key="kpi-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card title={t('dash_revenue')} value={formatPrice(45231.89)} icon={DollarSign} trend="+20.1%" trendUp={true} attention={t('dash_attention')} />
              <Card title={t('dash_sales_txn')} value="1,204" icon={TrendingUp} trend="+12.5%" trendUp={true} attention={t('dash_attention')} />
              <Card title={t('dash_inv_items')} value="8,432" icon={Package} trend="-4.2%" trendUp={false} attention={t('dash_attention')} />
              <Card title={t('dash_low_alerts')} value="12" icon={AlertCircle} trend={t('dash_attention')} alert={true} attention={t('dash_attention')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts Area 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {loadingStates.trends ? (
              <motion.div key="trends-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-2 h-[300px] bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
            ) : (
              <motion.div key="trends-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="lg:col-span-2">
                <ChartCard onClick={() => setActiveModal('area')} className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                    {t('dash_trends_title')}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">{t('dash_predicted')}</span>
                  </h3>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <AreaChartContent code={code} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.category ? (
              <motion.div key="cat-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-[300px] bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
            ) : (
              <motion.div key="cat-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <ChartCard onClick={() => setActiveModal('donut')} className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">{t('dash_cat_title')}</h3>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <DonutChartContent code={code} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {categoryData.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Additional Reports Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {loadingStates.top ? (
              <motion.div key="top-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-[300px] bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-2xl animate-pulse" />
            ) : (
              <motion.div key="top-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <ChartCard onClick={() => setActiveModal('bar')} className="p-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">{t('dash_top_title')}</h3>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <BarChartContent limit={5} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.orders ? (
              <motion.div key="orders-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-[300px] bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <TableSkeleton rows={4} columns={2} />
              </motion.div>
            ) : (
              <motion.div key="orders-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <ChartCard onClick={() => setActiveModal('orders')}>
                  <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 transition-colors">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-indigo-500" />
                      Recent Orders
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">Top 3</span>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <RecentOrdersTable limit={3} formatPrice={formatPrice} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.stock ? (
              <motion.div key="stock-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-[300px] bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <TableSkeleton rows={4} columns={2} />
              </motion.div>
            ) : (
              <motion.div key="stock-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
                <ChartCard onClick={() => setActiveModal('stock')}>
                  <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3 transition-colors">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      {t('dash_warn_title')}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">Top 3</span>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <LowStockTable limit={3} t={t} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
"""

pattern = re.compile(r'  return \(\n    <div className="space-y-8 relative">\n      \{createPortal\([\s\S]*?(?=\nconst Card =)', re.DOTALL)
result = pattern.sub(replacement, content)

with open('src/pages/AnalyticsDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(result)
