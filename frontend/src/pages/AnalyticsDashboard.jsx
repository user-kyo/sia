import React from 'react'
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download, ShoppingCart, Maximize2, X, Sparkles, Loader2, Calendar, Check, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { CardSkeleton, TableSkeleton, ChartCardSkeleton, TrendsChartSkeleton, CategoryChartSkeleton } from '../components/ui/Skeletons'
import { fetchInventory } from '../features/inventory/api/inventoryApi'
import { fetchSalesTransactions, SALES_TRANSACTIONS_QUERY_KEY } from '../features/sales/api/salesApi'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now'
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMins = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const getPeriodWindow = (periodKey) => {
  const daysByPeriod = {
    dash_period_30: 30,
    dash_period_qtr: 90,
    dash_period_yr: 365,
  }
  const days = daysByPeriod[periodKey] || daysByPeriod.dash_period_30
  const now = new Date()
  const currentStart = new Date(now)
  currentStart.setDate(currentStart.getDate() - days)
  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - days)

  return {
    currentStart: currentStart.toISOString(),
    currentEnd: now.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: currentStart.toISOString(),
  }
}

const formatSignedPercent = (value) => {
  const digits = Math.abs(value) >= 10 ? 0 : 1
  const formatted = Math.abs(value).toFixed(digits)
  return `${value >= 0 ? '+' : '-'}${formatted}%`
}

// --- Custom Tooltips ---
const CustomTooltip = ({ active, payload, label, prefix = '', isDay = false, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-xl dark:shadow-none z-50">
        {label && <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">{isDay ? label : label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-900 dark:text-white font-medium text-sm capitalize">
              {entry.name}: {valueFormatter ? valueFormatter(entry.value, entry) : `${prefix}${entry.value.toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Extracted Chart Components ---
const TrendDateDot = ({ cx, cy, payload }) => {
  if (cx == null || cy == null) return null
  const label = payload?.label || ''
  const showLabel = payload?.showPointLabel && label
  const showMarker = payload?.showPointMarker || showLabel
  if (!showMarker) return null

  const labelWidth = label.length * 6 + 12
  const labelY = Math.max(cy - 18, 14)

  return (
    <g>
      <circle cx={cx} cy={cy} r={3} fill="#6366f1" stroke="#ffffff" strokeWidth={1.5} />
      {showLabel && (
        <g>
          <rect
            x={cx - labelWidth / 2}
            y={labelY - 12}
            width={labelWidth}
            height={17}
            rx={5}
            fill="rgba(15, 23, 42, 0.82)"
            stroke="rgba(148, 163, 184, 0.35)"
          />
          <text x={cx} y={labelY} textAnchor="middle" fontSize={10} fontWeight={800} fill="#e2e8f0">
            {label}
          </text>
        </g>
      )}
    </g>
  )
}

const AreaChartContent = ({ data = [], formatPrice }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 34, right: 8, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" className="stroke-slate-200 dark:stroke-white/5" />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 11, fontWeight: 600 }}
        tickMargin={10}
        height={34}
        interval={0}
        tickFormatter={(value, index) => data[index]?.showAxisTick ? value : ''}
        className="fill-slate-500 dark:fill-slate-400"
      />
      <YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-slate-500 dark:fill-slate-400" />
      <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-slate-500 dark:fill-slate-400" allowDecimals={false} />
      <RechartsTooltip
        content={<CustomTooltip isDay={true} valueFormatter={(value, entry) => entry.dataKey === 'revenue' ? formatPrice(value) : value.toLocaleString()} />}
        cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
      />
      <Area yAxisId="revenue" name="Revenue" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={<TrendDateDot />} activeDot={{ r: 5 }} />
      <Area yAxisId="orders" name="Orders" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

const DonutChartContent = ({ data = [], formatPrice }) => {
  if (data.length === 0) {
    return (
      <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No category sales recorded yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          content={<CustomTooltip valueFormatter={(value) => formatPrice(value)} />}
          cursor={{ fill: 'transparent' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

const BarChartContent = ({ limit, products = [] }) => {
  const data = (limit ? products.slice(0, limit) : products).map(product => ({
    name: product.name,
    sales: Number(product.quantity) || 0,
  }))

  if (data.length === 0) {
    return (
      <div className="h-full min-h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No product sales recorded yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-white/5" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-slate-500 dark:fill-slate-400" />
        <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} className="fill-slate-500 dark:fill-slate-400" />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
        <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const RecentOrdersTable = ({ limit, formatPrice, transactions = [], allowExpand = true, resetKey }) => {
  const [openId, setOpenId] = React.useState(null)
  const data = limit ? transactions.slice(0, limit) : transactions;

  React.useEffect(() => {
    setOpenId(null)
  }, [resetKey])

  if (data.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No sales transactions recorded yet.
      </div>
    )
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10 transition-colors">
        <tr>
          <th className="px-6 py-3">Transaction</th>
          <th className="px-6 py-3 text-right">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
        <AnimatePresence>
          {data.map((txn, index) => {
            const isOpen = allowExpand && openId === txn.id
            const items = Array.isArray(txn.items) ? txn.items : []

            return (
              <React.Fragment key={txn.id}>
                <motion.tr
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${allowExpand ? 'cursor-pointer' : ''}`}
                  onClick={allowExpand ? () => setOpenId(isOpen ? null : txn.id) : undefined}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {allowExpand && (
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      )}
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-200">{txn.transaction_code || txn.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(txn.created_at)} - {txn.item_count} item{txn.item_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">
                    {formatPrice(Number(txn.total_amount) || 0, txn.currency)}
                  </td>
                </motion.tr>
                {isOpen && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-50/70 dark:bg-white/[0.02]"
                  >
                    <td colSpan={2} className="px-6 py-4">
                      {items.length > 0 ? (
                        <div className="space-y-3">
                          {items.map((item, itemIndex) => (
                            <div key={`${txn.id}-${item.product_id || item.sku || item.name}-${itemIndex}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-3 py-2.5 text-xs">
                              <div className="min-w-0">
                                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{item.quantity}x {item.name}</div>
                                <div className="mt-1 text-slate-400 dark:text-slate-500 truncate">{item.sku || item.product_id || 'No SKU'}</div>
                              </div>
                              <div className="text-right font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                                {formatPrice(Number(item.line_total) || 0, item.currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400">No item details recorded for this order.</div>
                      )}
                    </td>
                  </motion.tr>
                )}
              </React.Fragment>
            )
          })}
        </AnimatePresence>
      </tbody>
    </table>
  );
};

const LowStockTable = ({ limit, t, items = [] }) => {
  const data = limit ? items.slice(0, limit) : items;
  if (data.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No low stock or out-of-stock items.
      </div>
    )
  }
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10 transition-colors">
        <tr>
          <th className="px-6 py-3">{t('dash_col_product')}</th>
          <th className="px-6 py-3 text-right">{t('dash_col_status')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
        <AnimatePresence>
          {data.map((item, index) => (
            <motion.tr
              key={item.id ?? item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-6 py-3">
                <div className="font-medium text-slate-900 dark:text-slate-200 line-clamp-1" title={item.name}>{item.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.quantity} / {item.reorder_point} units</div>
              </td>
              <td className="px-6 py-3 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.quantity === 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                  }`}>
                  {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                </span>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
};

const InsightSidebar = ({ activeModal, formatPrice, code, insight, isGenerating, generateInsight, lowStockItems = [], recentTransactions = [], topProducts = [], salesTrendData = [], categoryPerformanceData = [] }) => {
  const metrics = React.useMemo(() => {
    switch (activeModal) {
      case 'area': {
        const totalRev = salesTrendData.reduce((acc, curr) => acc + curr.revenue, 0);
        const totalOrders = salesTrendData.reduce((acc, curr) => acc + curr.orders, 0);
        const avgRev = salesTrendData.length > 0 ? totalRev / salesTrendData.length : 0;
        const maxDay = salesTrendData.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current, salesTrendData[0] || { label: 'No sales', revenue: 0 });
        return [
          { label: "Total Revenue", value: formatPrice(totalRev) },
          { label: "Avg Daily Revenue", value: formatPrice(avgRev) },
          { label: "Orders", value: totalOrders.toString() },
          { label: "Best Day", value: `${maxDay.label} (${formatPrice(maxDay.revenue)})` }
        ];
      }
      case 'donut': {
        const topCat = categoryPerformanceData[0];
        const weakCat = categoryPerformanceData[categoryPerformanceData.length - 1];
        const totalRev = categoryPerformanceData.reduce((acc, curr) => acc + curr.value, 0);
        const topCatPercent = topCat && totalRev > 0 ? ((topCat.value / totalRev) * 100).toFixed(1) : '0.0';
        const weakCatPercent = weakCat && totalRev > 0 ? ((weakCat.value / totalRev) * 100).toFixed(1) : '0.0';
        return [
          { label: "Top Category", value: topCat ? `${topCat.name} (${topCatPercent}%)` : "No sales yet" },
          { label: "Top Revenue", value: formatPrice(topCat?.value || 0) },
          { label: "Weakest Category", value: weakCat ? `${weakCat.name} (${weakCatPercent}%)` : "No sales yet" },
          { label: "Lowest Revenue", value: formatPrice(weakCat?.value || 0) },
          { label: "Total Categories", value: categoryPerformanceData.length.toString() }
        ];
      }
      case 'bar': {
        const totalSales = topProducts.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
        const avgSales = topProducts.length > 0 ? Math.floor(totalSales / topProducts.length) : 0;
        return [
          { label: "Total Units Sold", value: totalSales.toString() },
          { label: "Top Mover", value: topProducts[0]?.name || "No sales yet" },
          { label: "Avg per Product", value: avgSales.toString() }
        ];
      }
      case 'orders': {
        const totalOrders = recentTransactions.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        const avgOrder = recentTransactions.length > 0 ? totalOrders / recentTransactions.length : 0;
        return [
          { label: "Total Volume", value: formatPrice(totalOrders) },
          { label: "Avg Order Value", value: formatPrice(avgOrder) },
          { label: "Recent Orders", value: recentTransactions.length.toString() }
        ];
      }
      case 'stock': {
        const outOfStock = lowStockItems.filter(i => i.quantity === 0).length;
        const lowStock = lowStockItems.filter(i => i.quantity > 0).length;
        return [
          { label: "Out of Stock", value: outOfStock.toString() },
          { label: "Low Stock Items", value: lowStock.toString() },
          { label: "Total Alerts", value: lowStockItems.length.toString() },
        ];
      }
      case 'global_forecast': {
        return [
          { label: "Overall Trend", value: "Positive Growth" },
          { label: "Risk Level", value: "Low" },
          { label: "Forecasted Revenue", value: formatPrice(125000) }
        ];
      }
      default:
        return [];
    }
  }, [activeModal, formatPrice, recentTransactions, lowStockItems, topProducts, salesTrendData, categoryPerformanceData]);

  return (
    <div className="p-6 flex flex-col h-full">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Detailed Insights</h4>

      <div className="space-y-4 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{m.label}</span>
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{m.value}</span>
          </div>
        ))}
      </div>

      {activeModal !== 'global_forecast' && (
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={generateInsight}
            disabled={isGenerating || insight !== null}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isGenerating ? "Analyzing data..." : "Generate AI Insights"}
          </button>
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [insight, setInsight] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [loadingStates, setLoadingStates] = React.useState({
    kpi: true,
    trends: true,
    category: true,
    top: true,
    orders: true,
    stock: true
  })
  const [showSlowHint, setShowSlowHint] = React.useState(false)
  const [activeModal, setActiveModal] = React.useState(null)
  const [recentOrdersModalResetKey, setRecentOrdersModalResetKey] = React.useState(0)
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = React.useState(false)
  const [selectedPeriod, setSelectedPeriod] = React.useState('dash_period_30')
  const periodDropdownRef = React.useRef(null)

  const openRecentOrdersModal = () => {
    setRecentOrdersModalResetKey(key => key + 1)
    setActiveModal('orders')
  }

  React.useEffect(() => {
    setInsight(null);
    if (activeModal === 'global_forecast') {
      setIsGenerating(true);
      const timer = setTimeout(() => {
        setIsGenerating(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsGenerating(false);
    }
  }, [activeModal]);

  const generateInsight = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let text = "";
      switch (activeModal) {
        case 'area':
          text = "Revenue is trending upwards by 18% compared to the previous period. Based on the current trajectory, expect a 12-15% increase in gross revenue next week. Highest volume typically occurs between day 18-22.";
          break;
        case 'donut':
          text = categoryPerformanceData[0]
            ? `${categoryPerformanceData[0].name} is currently the strongest category with ${formatPrice(categoryPerformanceData[0].value)} in recorded sales for this period.`
            : "No category sales have been recorded for this period yet.";
          break;
        case 'bar':
          text = topProducts[0]
            ? `${topProducts[0].name} is currently leading with ${topProducts[0].quantity} units sold. Keep an eye on stock for your fastest movers.`
            : "No product sales have been recorded yet. Once POS checkout has sales, this section will highlight your fastest-moving products.";
          break;
        case 'orders':
          text = "Average order value is strong. High-value transactions (>$1,000) constitute 40% of recent volume. Conversion rates are peaking during morning hours.";
          break;
        case 'stock':
          text = "Critical stock alerts have doubled. Restocking the highest velocity items will require an estimated capital of $4,500. Recommend immediate PO creation.";
          break;
        case 'global_forecast':
          text = "The overall health of the business is strong. Revenue is up, average order value remains stable, and top categories are performing exceptionally well. Ensure inventory levels are maintained for top products to sustain this growth.";
          break;
      }
      setInsight(text);
      setIsGenerating(false);
    }, 1500);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setLoadingStates(s => ({ ...s, kpi: false })), 600),
      setTimeout(() => setLoadingStates(s => ({ ...s, trends: false })), 1400),
      setTimeout(() => setLoadingStates(s => ({ ...s, category: false })), 1100),
      setTimeout(() => setLoadingStates(s => ({ ...s, top: false })), 1800),
      setTimeout(() => setLoadingStates(s => ({ ...s, orders: false })), 900),
      setTimeout(() => setLoadingStates(s => ({ ...s, stock: false })), 3500)
    ];

    const hintTimer = setTimeout(() => {
      setLoadingStates(currentStates => {
        if (Object.values(currentStates).some(v => v)) {
          setShowSlowHint(true);
        }
        return currentStates;
      });
    }, 2000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(hintTimer);
    }
  }, []);

  React.useEffect(() => {
    if (!Object.values(loadingStates).some(v => v)) {
      setShowSlowHint(false);
    }
  }, [loadingStates]);

  const { formatPrice, code, current, convertAmount } = useCurrency()
  const { t } = useAppSettings()
  const inventoryTrendWindow = React.useMemo(() => getPeriodWindow(selectedPeriod), [selectedPeriod])

  const { data: inventoryTotalData } = useQuery({
    queryKey: ['inventory', 'dashboard-total'],
    queryFn: () => fetchInventory({ limit: 1, offset: 0, includeSummary: true }),
    staleTime: 60_000,
  })

  const { data: lowStockQueryData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['inventory', 'dashboard-low-stock'],
    queryFn: () => fetchInventory({ stockStatus: 'low_stock,out_of_stock', limit: 100, offset: 0 }),
    staleTime: 60_000,
  })

  const { data: currentPeriodInventoryData } = useQuery({
    queryKey: ['inventory', 'dashboard-period-current', inventoryTrendWindow.currentStart, inventoryTrendWindow.currentEnd],
    queryFn: () => fetchInventory({
      createdFrom: inventoryTrendWindow.currentStart,
      createdTo: inventoryTrendWindow.currentEnd,
      limit: 1,
      offset: 0,
    }),
    staleTime: 60_000,
  })

  const { data: previousPeriodInventoryData } = useQuery({
    queryKey: ['inventory', 'dashboard-period-previous', inventoryTrendWindow.previousStart, inventoryTrendWindow.previousEnd],
    queryFn: () => fetchInventory({
      createdFrom: inventoryTrendWindow.previousStart,
      createdTo: inventoryTrendWindow.previousEnd,
      limit: 1,
      offset: 0,
    }),
    staleTime: 60_000,
  })

  const { data: salesTransactionsData, isLoading: isSalesTransactionsLoading } = useQuery({
    queryKey: [...SALES_TRANSACTIONS_QUERY_KEY, inventoryTrendWindow.currentStart, inventoryTrendWindow.currentEnd],
    queryFn: () => fetchSalesTransactions({
      limit: 6,
      offset: 0,
      summaryFrom: inventoryTrendWindow.currentStart,
      summaryTo: inventoryTrendWindow.currentEnd,
    }),
    staleTime: 30_000,
  })

  const totalInventoryItems = inventoryTotalData?.total ?? null
  const inventoryCategoryBreakdown = inventoryTotalData?.summary?.category_breakdown ?? []
  const lowStockItems = lowStockQueryData?.data ?? []
  const lowStockCount = lowStockQueryData?.total ?? null
  const inventoryTrend = React.useMemo(() => {
    const currentAdded = currentPeriodInventoryData?.total
    const previousAdded = previousPeriodInventoryData?.total

    if (currentAdded === undefined || previousAdded === undefined) {
      return { label: '—', up: false, tone: 'neutral' }
    }
    if (previousAdded > 0) {
      const percent = ((currentAdded - previousAdded) / previousAdded) * 100
      return { label: formatSignedPercent(percent), up: percent > 0, tone: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral' }
    }
    if (currentAdded > 0) {
      return { label: `+${currentAdded} new`, up: true, tone: 'up' }
    }
    return { label: '0 new', up: false, tone: 'neutral' }
  }, [currentPeriodInventoryData, previousPeriodInventoryData])
  const recentSalesTransactions = salesTransactionsData?.data ?? []
  const salesTransactionCount = salesTransactionsData?.total ?? null
  const revenueByCurrency = salesTransactionsData?.summary?.revenue_by_currency ?? {}
  const topProducts = salesTransactionsData?.summary?.top_products ?? []
  const salesTrendData = React.useMemo(() => {
    const rawTrendData = (salesTransactionsData?.summary?.daily_trends ?? []).map(point => ({
      date: point.date,
      label: point.label,
      orders: Number(point.orders) || 0,
      revenue: Object.entries(point.revenue_by_currency || {}).reduce((sum, [currency, amount]) => (
        sum + convertAmount(Number(amount) || 0, currency, code)
      ), 0),
    }))
    const axisInterval = Math.max(1, Math.ceil(rawTrendData.length / 5))
    const pointLabelGap = Math.max(1, Math.ceil(rawTrendData.length / 12))
    let lastPointLabelIndex = -Infinity

    return rawTrendData.map((point, index) => {
      const isCurrentPoint = index === rawTrendData.length - 1
      const hasActivity = point.orders > 0 || point.revenue > 0
      const canLabelActivity = hasActivity && index - lastPointLabelIndex >= pointLabelGap
      const showPointLabel = isCurrentPoint || canLabelActivity

      if (showPointLabel) {
        lastPointLabelIndex = index
      }

      return {
        ...point,
        showAxisTick: index === 0 || isCurrentPoint || index % axisInterval === 0,
        showPointMarker: isCurrentPoint || hasActivity,
        showPointLabel,
      }
    })
  }, [salesTransactionsData, convertAmount, code])
  const categoryPerformanceData = React.useMemo(() => (
    (salesTransactionsData?.summary?.category_performance ?? []).map(category => ({
      name: category.category,
      quantity: Number(category.quantity) || 0,
      value: Object.entries(category.revenue_by_currency || {}).reduce((sum, [currency, amount]) => (
        sum + convertAmount(Number(amount) || 0, currency, code)
      ), 0),
    })).filter(category => category.quantity > 0 || category.value > 0)
      .sort((a, b) => b.value - a.value)
  ), [salesTransactionsData, convertAmount, code])
  const totalRevenue = React.useMemo(() => (
    Object.entries(revenueByCurrency).reduce((sum, [currency, amount]) => (
      sum + convertAmount(Number(amount) || 0, currency, code)
    ), 0)
  ), [revenueByCurrency, convertAmount, code])
  const RevenueCurrencyIcon = React.useMemo(() => {
    const symbol = current?.symbol || code

    return ({ className = '' }) => (
      <span
        className={`${className} inline-flex items-center justify-center font-black leading-none`}
        style={{ fontSize: symbol.length > 1 ? '0.75rem' : '1rem' }}
      >
        {symbol}
      </span>
    )
  }, [current, code])

  const renderModalContent = () => {
    switch (activeModal) {
      case 'area':
        return (
          <div className="w-full h-[500px]">
            <AreaChartContent data={salesTrendData} formatPrice={formatPrice} />
          </div>
        )
      case 'donut':
        return (
          <div className="w-full flex flex-col gap-8 p-4">
            <div className="w-full h-[400px]">
              <DonutChartContent data={categoryPerformanceData} formatPrice={formatPrice} />
            </div>
            <div className="w-full flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Category Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryPerformanceData.length > 0 ? categoryPerformanceData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatPrice(entry.value)}</span>
                  </div>
                )) : (
                  <div className="sm:col-span-2 text-center text-sm text-slate-500 dark:text-slate-400 py-8">No category sales recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )
      case 'bar':
        return (
          <div className="w-full h-[600px]">
            <BarChartContent products={topProducts} />
          </div>
        )
      case 'orders':
        return (
          <div className="w-full">
            <RecentOrdersTable key={recentOrdersModalResetKey} formatPrice={formatPrice} transactions={recentSalesTransactions} resetKey={recentOrdersModalResetKey} />
          </div>
        )
      case 'stock':
        return (
          <div className="w-full">
            <LowStockTable t={t} items={lowStockItems} />
          </div>
        )
      case 'global_forecast':
        if (isGenerating) {
          return (
            <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
              </div>
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300 animate-pulse">Analyzing entire dashboard data...</p>
            </div>
          );
        }

        const containerVariants = {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
          }
        };

        const itemVariants = {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
        };

        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full flex flex-col gap-6 p-4"
          >
            {/* Header Banner */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
                <Sparkles className="w-48 h-48" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> AI Generated Insight
                </div>
                <h3 className="text-3xl font-black mb-3">Strong Upward Trajectory</h3>
                <p className="text-indigo-100 text-lg leading-relaxed">
                  Your business is experiencing solid growth. Based on the aggregated data across all metrics, expect a <strong className="text-white">12-15% increase</strong> in gross revenue over the next quarter.
                </p>
              </div>
            </motion.div>

            {/* Detailed Insights */}
            <motion.div variants={itemVariants} className="bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/10 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Detailed AI Analysis
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
                <div className="space-y-4">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-indigo-200 dark:border-indigo-500/20 pb-2">Revenue & Sales Patterns</h5>
                  <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">Peak Conversion:</strong> Conversion rates spike by 24% between 10:00 AM and 2:00 PM on weekdays.</span></li>
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">Average Order Value (AOV):</strong> AOV is strongly positively correlated with multi-item transactions (+18% when {'>'}2 items).</span></li>
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">High-Value Concentration:</strong> The top 10% of customers account for 40% of the overall transaction volume.</span></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-indigo-200 dark:border-indigo-500/20 pb-2">Inventory & Category Velocity</h5>
                  <ul className="space-y-3 text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">Electronics Dominance:</strong> Accounts for 42% of revenue. Bundling with Audio (15% rev) is highly recommended.</span></li>
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">Stock Velocity Risk:</strong> 6 SKUs have entered critical stock levels faster than historical replenishment cycles.</span></li>
                    <li className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" /><span><strong className="text-slate-800 dark:text-slate-300">Emerging Trend:</strong> Photography equipment searches and sales have accelerated 24% month-over-month.</span></li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Predictive Metrics */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1b2035] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3 group hover:border-emerald-500/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">High Confidence</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Projected Growth</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">+15.2%</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1b2035] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3 group hover:border-indigo-500/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Next 30 Days</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Est. Revenue</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">{code} 125,000</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1b2035] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3 group hover:border-amber-500/50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Low Risk</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Market Risk Assessment</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">Favorable</div>
                </div>
              </div>
            </motion.div>

            {/* Action Items */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#1b2035] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" /> Key Recommendations
                </h4>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-1.5">Replenish High-Velocity Items</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">AirPods Pro Gen 2 and Sony Alpha a7 IV are selling 30% faster than usual. Restock immediately to capture ongoing demand and prevent stockouts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-1.5">Bundle Electronics & Audio</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Electronics are driving 42% of revenue. Bundle them with Audio products to boost the weakest performing segment and increase your average order value.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-1.5">Resolve Critical Stock Alerts</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">There are currently multiple items at critical stock levels. Immediate attention is required to prevent an estimated $4,500 in lost potential sales.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )
      case 'kpi_revenue':
        return (
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Source / Channel</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">POS Checkout</td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-300">{salesTransactionsData ? formatPrice(totalRevenue) : '—'}</td>
                  <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">{totalRevenue > 0 ? '100%' : '0%'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      case 'kpi_sales':
        return (
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Source</th>
                  <th className="p-4 text-right">Transactions</th>
                  <th className="p-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">POS Checkout</td>
                  <td className="p-4 text-right text-slate-600 dark:text-slate-300">{salesTransactionCount !== null ? salesTransactionCount.toLocaleString() : '—'}</td>
                  <td className="p-4 text-right text-indigo-600 dark:text-indigo-400 font-medium">{salesTransactionCount && salesTransactionCount > 0 ? '100%' : '0%'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      case 'kpi_inventory':
        return (
          <div className="w-full space-y-8">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Category Breakdown</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Products</th>
                    <th className="p-4 text-right">Stock Qty</th>
                    <th className="p-4 text-right">Est. Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                  {inventoryCategoryBreakdown.length > 0 ? (
                    inventoryCategoryBreakdown.map((row) => {
                      const estimatedValue = Object.entries(row.value_by_currency || {}).reduce((sum, [currency, amount]) => (
                        sum + convertAmount(Number(amount) || 0, currency, code)
                      ), 0)

                      return (
                        <tr key={row.category} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{row.category}</td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-300">{row.product_count.toLocaleString()}</td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-300">{row.stock_quantity.toLocaleString()}</td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatPrice(estimatedValue)}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400">No inventory items yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Product Count Movement</h4>
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">Added in {t(selectedPeriod)}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{currentPeriodInventoryData?.total?.toLocaleString() ?? '—'}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">Added in previous period</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{previousPeriodInventoryData?.total?.toLocaleString() ?? '—'}</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">Trend</td>
                    <td className={`p-4 text-right font-semibold ${inventoryTrend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>{inventoryTrend.label}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      case 'kpi_alerts':
        return (
          <div className="w-full">
            <LowStockTable t={t} items={lowStockItems} />
          </div>
        )
      default:
        return null;
    }
  }

  const getModalTitle = () => {
    switch (activeModal) {
      case 'area': return t('dash_trends_title');
      case 'donut': return t('dash_cat_title');
      case 'bar': return t('dash_top_title');
      case 'orders': return 'Recent Orders';
      case 'stock': return t('dash_warn_title');
      case 'global_forecast': return 'Global Forecast & AI Insights';
      case 'kpi_revenue': return 'Revenue Breakdown';
      case 'kpi_sales': return 'Sales Transactions Breakdown';
      case 'kpi_inventory': return 'Inventory Breakdown';
      case 'kpi_alerts': return 'Critical Stock Alerts';
      default: return '';
    }
  }

  return (
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
                  <div className={`flex-1 flex flex-col overflow-y-auto p-6 scroll-smooth ${!['global_forecast', 'kpi_revenue', 'kpi_sales', 'kpi_inventory', 'kpi_alerts'].includes(activeModal) ? 'border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/10' : ''}`}>
                    <AnimatePresence>
                      {insight && activeModal !== 'global_forecast' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden shadow-sm shrink-0"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                          <div className="flex gap-4 items-start">
                            <div className="p-2 bg-white dark:bg-white/5 rounded-lg shadow-sm shrink-0 mt-0.5">
                              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Generated Summary</h4>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                {insight}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {renderModalContent()}
                  </div>
                  {!['global_forecast', 'kpi_revenue', 'kpi_sales', 'kpi_inventory', 'kpi_alerts'].includes(activeModal) && (
                    <div className="w-full lg:w-80 shrink-0 bg-slate-50/30 dark:bg-white/[0.01] overflow-y-auto">
                      <InsightSidebar activeModal={activeModal} formatPrice={formatPrice} code={code} insight={insight} isGenerating={isGenerating} generateInsight={generateInsight} lowStockItems={lowStockItems} recentTransactions={recentSalesTransactions} topProducts={topProducts} salesTrendData={salesTrendData} categoryPerformanceData={categoryPerformanceData} />
                    </div>
                  )}
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('global_forecast')}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Insights
          </button>
          <div className="flex items-center gap-3 bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-sm">
            <div className="pl-3 pr-2 flex items-center gap-2 border-r border-slate-200 dark:border-white/10">
              <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Period</span>
            </div>
            <div className="relative" ref={periodDropdownRef}>
              <button
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="flex items-center justify-between w-48 gap-2 bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.05] rounded-lg pl-3 pr-2 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none transition-all cursor-pointer"
              >
                <span className="truncate">{t(selectedPeriod)}</span>
                <motion.div
                  animate={{ rotate: isPeriodDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isPeriodDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-full bg-white dark:bg-[#1b2035] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 p-1"
                  >
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Date Range</div>
                    {['dash_period_30', 'dash_period_qtr', 'dash_period_yr'].map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-between ${selectedPeriod === period
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                          }`}
                      >
                        {t(period)}
                        {selectedPeriod === period && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
              <Card onClick={() => setActiveModal('kpi_revenue')} title={t('dash_revenue')} value={salesTransactionsData ? formatPrice(totalRevenue) : '—'} icon={RevenueCurrencyIcon} trend={salesTransactionCount && salesTransactionCount > 0 ? 'Recorded' : 'No sales yet'} trendUp={salesTransactionCount && salesTransactionCount > 0} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_sales')} title={t('dash_sales_txn')} value={salesTransactionCount !== null ? salesTransactionCount.toLocaleString() : '—'} icon={TrendingUp} trend="Recorded" trendUp={true} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_inventory')} title={t('dash_inv_items')} value={totalInventoryItems !== null ? totalInventoryItems.toLocaleString() : '—'} icon={Package} trend={inventoryTrend.label} trendUp={inventoryTrend.up} trendTone={inventoryTrend.tone} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_alerts')} title={t('dash_low_alerts')} value={lowStockCount !== null ? lowStockCount.toString() : '—'} icon={AlertCircle} trend={t('dash_attention')} alert={true} attention={t('dash_attention')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts Area 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {loadingStates.trends || isSalesTransactionsLoading ? (
              <motion.div key="trends-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-2 h-full w-full">
                <TrendsChartSkeleton />
              </motion.div>
            ) : (
              <motion.div key="trends-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="lg:col-span-2 h-full w-full">
                <ChartCard onClick={() => setActiveModal('area')} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                      {t('dash_trends_title')}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">Recorded</span>
                    </h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <AreaChartContent data={salesTrendData} formatPrice={formatPrice} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.category || isSalesTransactionsLoading ? (
              <motion.div key="cat-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <CategoryChartSkeleton />
              </motion.div>
            ) : (
              <motion.div key="cat-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ChartCard onClick={() => setActiveModal('donut')} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('dash_cat_title')}</h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <DonutChartContent data={categoryPerformanceData} formatPrice={formatPrice} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {categoryPerformanceData.slice(0, 4).map((entry, index) => (
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
            {loadingStates.top || isSalesTransactionsLoading ? (
              <motion.div key="top-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <ChartCardSkeleton />
              </motion.div>
            ) : (
              <motion.div key="top-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ChartCard onClick={() => setActiveModal('bar')} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('dash_top_title')}</h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <BarChartContent limit={5} products={topProducts} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.orders || isSalesTransactionsLoading ? (
              <motion.div key="orders-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <ChartCardSkeleton />
              </motion.div>
            ) : (
              <motion.div key="orders-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ChartCard onClick={openRecentOrdersModal}>
                  <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-indigo-500" />
                        Recent Orders
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <RecentOrdersTable limit={3} formatPrice={formatPrice} transactions={recentSalesTransactions} allowExpand={false} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.stock ? (
              <motion.div key="stock-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <ChartCardSkeleton />
              </motion.div>
            ) : (
              <motion.div key="stock-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ChartCard onClick={() => setActiveModal('stock')}>
                  <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        {t('dash_warn_title')}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <LowStockTable limit={3} t={t} items={lowStockItems} />
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

const getTrendClass = (trendTone, trendUp) => {
  const tone = trendTone || (trendUp ? 'up' : 'neutral')
  if (tone === 'up') {
    return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
  }
  if (tone === 'down') {
    return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
  }
  return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
}

const Card = ({ title, value, icon: Icon, trend, trendUp, trendTone, alert, attention, onClick }) => (
  <div onClick={onClick} className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}>
    {/* Subtle Background Glow on Hover */}
    <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg" />

    <div className="relative z-10 flex justify-between items-start mb-6">
      <div className={`p-3 rounded-xl border transition-transform duration-300 group-hover:scale-110 ${alert
        ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
        : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
        }`}>
        <Icon className={`w-5 h-5 ${alert ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
      </div>
      {alert ? (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
          {attention}
        </span>
      ) : (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${getTrendClass(trendTone, trendUp)}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {onClick && (
          <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  </div>
)

const ChartCard = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-300 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}>
    <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg" />
    <div className="relative z-10 flex flex-col h-full w-full">
      {children}
    </div>
  </div>
)

export default AnalyticsDashboard
