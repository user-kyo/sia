import React from 'react'
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download, ShoppingCart, Maximize2, X, Sparkles, Loader2, Calendar, Check, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { useCurrency } from '../contexts/CurrencyContext'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { CardSkeleton, TableSkeleton, ChartCardSkeleton, TrendsChartSkeleton, CategoryChartSkeleton } from '../components/ui/Skeletons'

// --- Mock Data ---
const revenueData = Array.from({ length: 30 }, (_, i) => ({
  name: `${i + 1}`,
  revenue: Math.floor(Math.random() * 5000) + 3000 + (i * 100),
  orders: Math.floor(Math.random() * 20) + 10 + (i * 2)
}));

const categoryData = [
  { name: 'Electronics', value: 4200 },
  { name: 'Photography', value: 3100 },
  { name: 'Computers', value: 2800 },
  { name: 'Audio', value: 1500 },
  { name: 'Accessories', value: 900 },
  { name: 'Gaming', value: 1200 },
  { name: 'Office', value: 600 }
];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4'];

const topProductsData = [
  { name: 'Sony Alpha a7 IV', sales: 145 },
  { name: 'MacBook Pro 16"', sales: 120 },
  { name: 'AirPods Pro Gen 2', sales: 98 },
  { name: 'DJI Mini 4 Pro', sales: 85 },
  { name: 'Herman Miller Embody', sales: 72 },
  { name: 'Samsung 49" Odyssey', sales: 64 },
  { name: 'Keychron K8 Pro', sales: 58 },
  { name: 'Logitech MX Master 3S', sales: 49 },
];

const recentTransactions = [
  { id: 'TXN-9823', amount: 1299.00, items: 2, status: 'Completed', time: '10 mins ago' },
  { id: 'TXN-9824', amount: 45.50, items: 1, status: 'Completed', time: '15 mins ago' },
  { id: 'TXN-9825', amount: 349.99, items: 4, status: 'Completed', time: '1 hour ago' },
  { id: 'TXN-9826', amount: 2100.00, items: 3, status: 'Completed', time: '2 hours ago' },
  { id: 'TXN-9827', amount: 89.95, items: 2, status: 'Completed', time: '3 hours ago' },
  { id: 'TXN-9828', amount: 599.00, items: 1, status: 'Completed', time: '4 hours ago' },
];

const lowStockData = [
  { name: 'Sony Alpha a7 IV', stock: 2, threshold: 10, status: 'Critical' },
  { name: 'AirPods Pro Gen 2', stock: 5, threshold: 20, status: 'Low' },
  { name: 'LG 27" Monitor', stock: 8, threshold: 15, status: 'Low' },
  { name: 'Logitech MX Master 3S', stock: 1, threshold: 10, status: 'Critical' },
  { name: 'Canon RF 24-70mm', stock: 3, threshold: 5, status: 'Critical' },
  { name: 'Rode VideoMic Pro', stock: 4, threshold: 12, status: 'Low' },
];

// --- Custom Tooltips ---
const CustomTooltip = ({ active, payload, label, prefix = '', isDay = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-[#0d0f1a]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-xl dark:shadow-none z-50">
        {label && <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">{isDay ? `Day ${label}` : label}</p>}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-900 dark:text-white font-medium text-sm capitalize">
              {entry.name}: {prefix}{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Extracted Chart Components ---
const AreaChartContent = ({ code }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" className="stroke-slate-200 dark:stroke-white/5" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-slate-500 dark:fill-slate-400" minTickGap={20} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-slate-500 dark:fill-slate-400" />
      <RechartsTooltip content={<CustomTooltip prefix={code + ' '} isDay={true} />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }} />
      <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
    </AreaChart>
  </ResponsiveContainer>
);

const DonutChartContent = ({ code }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={categoryData}
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        paddingAngle={5}
        dataKey="value"
        stroke="none"
      >
        {categoryData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <RechartsTooltip content={<CustomTooltip prefix={code + ' '} />} cursor={{ fill: 'transparent' }} />
    </PieChart>
  </ResponsiveContainer>
);

const BarChartContent = ({ limit }) => {
  const data = limit ? topProductsData.slice(0, limit) : topProductsData;
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

const RecentOrdersTable = ({ limit, formatPrice }) => {
  const data = limit ? recentTransactions.slice(0, limit) : recentTransactions;
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
          {data.map((txn, index) => (
            <motion.tr
              key={txn.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-6 py-3">
                <div className="font-medium text-slate-900 dark:text-slate-200">{txn.id}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{txn.time} • {txn.items} items</div>
              </td>
              <td className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">
                {formatPrice(txn.amount)}
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
};

const LowStockTable = ({ limit, t }) => {
  const data = limit ? lowStockData.slice(0, limit) : lowStockData;
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
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-6 py-3">
                <div className="font-medium text-slate-900 dark:text-slate-200 line-clamp-1" title={item.name}>{item.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{item.stock} / {item.threshold} units</div>
              </td>
              <td className="px-6 py-3 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.status === 'Critical'
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                  }`}>
                  {item.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
};

const InsightSidebar = ({ activeModal, formatPrice, code, insight, isGenerating, generateInsight }) => {
  const metrics = React.useMemo(() => {
    switch (activeModal) {
      case 'area': {
        const totalRev = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
        const avgRev = totalRev / revenueData.length;
        const maxDay = revenueData.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current);
        return [
          { label: "Total Revenue", value: formatPrice(totalRev) },
          { label: "Avg Daily Revenue", value: formatPrice(avgRev) },
          { label: "Best Day", value: `Day ${maxDay.name} (${formatPrice(maxDay.revenue)})` }
        ];
      }
      case 'donut': {
        const topCat = categoryData[0];
        const weakCat = categoryData[categoryData.length - 1];
        const totalRev = categoryData.reduce((acc, curr) => acc + curr.value, 0);
        const topCatPercent = ((topCat.value / totalRev) * 100).toFixed(1);
        const weakCatPercent = ((weakCat.value / totalRev) * 100).toFixed(1);
        return [
          { label: "Top Category", value: `${topCat.name} (${topCatPercent}%)` },
          { label: "Top Revenue", value: formatPrice(topCat.value) },
          { label: "Weakest Category", value: `${weakCat.name} (${weakCatPercent}%)` },
          { label: "Lowest Revenue", value: formatPrice(weakCat.value) },
          { label: "Total Categories", value: categoryData.length.toString() }
        ];
      }
      case 'bar': {
        const totalSales = topProductsData.reduce((acc, curr) => acc + curr.sales, 0);
        const avgSales = Math.floor(totalSales / topProductsData.length);
        return [
          { label: "Total Units Sold", value: totalSales.toString() },
          { label: "Top Mover", value: topProductsData[0].name },
          { label: "Avg per Product", value: avgSales.toString() }
        ];
      }
      case 'orders': {
        const totalOrders = recentTransactions.reduce((acc, curr) => acc + curr.amount, 0);
        const avgOrder = totalOrders / recentTransactions.length;
        return [
          { label: "Total Volume", value: formatPrice(totalOrders) },
          { label: "Avg Order Value", value: formatPrice(avgOrder) },
          { label: "Pending Orders", value: "0" }
        ];
      }
      case 'stock': {
        const critical = lowStockData.filter(i => i.status === 'Critical').length;
        const low = lowStockData.filter(i => i.status === 'Low').length;
        return [
          { label: "Critical Items", value: critical.toString() },
          { label: "Low Stock Items", value: low.toString() },
          { label: "Est. Restock Cost", value: formatPrice(4500) }
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
  }, [activeModal, formatPrice]);

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
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = React.useState(false)
  const [selectedPeriod, setSelectedPeriod] = React.useState('dash_period_30')
  const periodDropdownRef = React.useRef(null)

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
          text = "Electronics makes up 42% of total revenue. Photography is showing the highest growth rate (+24%). Consider bundling Accessories with Audio products to lift the weakest segment.";
          break;
        case 'bar':
          text = `The top product dominates with ${topProductsData[0].sales} sales. AirPods Pro Gen 2 velocity has increased 30% in the last 5 days. Consider restocking high-velocity items.`;
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

  const { formatPrice, code } = useCurrency()
  const { t } = useAppSettings()

  const renderModalContent = () => {
    switch (activeModal) {
      case 'area':
        return (
          <div className="w-full h-[500px]">
            <AreaChartContent code={code} />
          </div>
        )
      case 'donut':
        return (
          <div className="w-full flex flex-col gap-8 p-4">
            <div className="w-full h-[400px]">
              <DonutChartContent code={code} />
            </div>
            <div className="w-full flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Category Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:bg-slate-100 dark:hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{code} {entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'bar':
        return (
          <div className="w-full h-[600px]">
            <BarChartContent />
          </div>
        )
      case 'orders':
        return (
          <div className="w-full">
            <RecentOrdersTable formatPrice={formatPrice} />
          </div>
        )
      case 'stock':
        return (
          <div className="w-full">
            <LowStockTable t={t} />
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
                {[
                  { source: 'Online Store', amount: 32476.50, percent: 71.8 },
                  { source: 'In-Store POS', amount: 8412.00, percent: 18.6 },
                  { source: 'B2B Wholesale', amount: 4343.39, percent: 9.6 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{row.source}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatPrice(row.amount)}</td>
                    <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">{row.percent}%</td>
                  </tr>
                ))}
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
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 text-right">Transactions</th>
                  <th className="p-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                {[
                  { type: 'Credit Card', count: 850, percent: 70.6 },
                  { type: 'Cash', count: 210, percent: 17.4 },
                  { type: 'Digital Wallet', count: 144, percent: 12.0 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{row.type}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{row.count}</td>
                    <td className="p-4 text-right text-indigo-600 dark:text-indigo-400 font-medium">{row.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'kpi_inventory':
        return (
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Items in Stock</th>
                  <th className="p-4 text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                {[
                  { category: 'Electronics', count: 3200, value: 150000 },
                  { category: 'Accessories', count: 2800, value: 45000 },
                  { category: 'Photography', count: 1500, value: 210000 },
                  { category: 'Audio', count: 932, value: 85000 },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{row.category}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{row.count}</td>
                    <td className="p-4 text-right text-slate-600 dark:text-slate-300">{formatPrice(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'kpi_alerts':
        return (
          <div className="w-full">
            <LowStockTable t={t} />
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
                      <InsightSidebar activeModal={activeModal} formatPrice={formatPrice} code={code} insight={insight} isGenerating={isGenerating} generateInsight={generateInsight} />
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
              <Card onClick={() => setActiveModal('kpi_revenue')} title={t('dash_revenue')} value={formatPrice(45231.89)} icon={DollarSign} trend="+20.1%" trendUp={true} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_sales')} title={t('dash_sales_txn')} value="1,204" icon={TrendingUp} trend="+12.5%" trendUp={true} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_inventory')} title={t('dash_inv_items')} value="8,432" icon={Package} trend="-4.2%" trendUp={false} attention={t('dash_attention')} />
              <Card onClick={() => setActiveModal('kpi_alerts')} title={t('dash_low_alerts')} value="12" icon={AlertCircle} trend={t('dash_attention')} alert={true} attention={t('dash_attention')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Charts Area 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {loadingStates.trends ? (
              <motion.div key="trends-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="lg:col-span-2 h-full w-full">
                <TrendsChartSkeleton />
              </motion.div>
            ) : (
              <motion.div key="trends-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="lg:col-span-2 h-full w-full">
                <ChartCard onClick={() => setActiveModal('area')} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                      {t('dash_trends_title')}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">{t('dash_predicted')}</span>
                    </h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full min-h-[220px]">
                    <AreaChartContent code={code} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.category ? (
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
                    <BarChartContent limit={5} />
                  </div>
                </ChartCard>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.orders ? (
              <motion.div key="orders-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <ChartCardSkeleton />
              </motion.div>
            ) : (
              <motion.div key="orders-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <ChartCard onClick={() => setActiveModal('orders')}>
                  <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-indigo-500" />
                        Recent Orders
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">Top 3</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-md">Top 3</span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
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

const Card = ({ title, value, icon: Icon, trend, trendUp, alert, attention, onClick }) => (
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${trendUp
          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
          }`}>
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
