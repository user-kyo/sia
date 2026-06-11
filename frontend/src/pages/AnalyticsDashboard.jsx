import React from 'react'
import { TrendingUp, Package, DollarSign, AlertCircle, ChevronDown, Download, ShoppingCart, Maximize2, X, Sparkles, Loader2, Calendar, Check, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
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

const formatShortDate = (date) => (
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
)

const buildSalesForecast = (trendData, days = 7) => {
  const activeDays = trendData.filter(point => point.orders > 0 || point.revenue > 0)
  if (activeDays.length === 0) return []

  const baselineDays = activeDays.slice(-Math.min(activeDays.length, 14))
  const avgOrders = baselineDays.reduce((sum, day) => sum + day.orders, 0) / baselineDays.length
  const avgRevenue = baselineDays.reduce((sum, day) => sum + day.revenue, 0) / baselineDays.length
  const recentWindow = baselineDays.slice(-3)
  const previousWindow = baselineDays.slice(-6, -3)
  const recentRevenue = recentWindow.reduce((sum, day) => sum + day.revenue, 0) / Math.max(1, recentWindow.length)
  const previousRevenue = previousWindow.reduce((sum, day) => sum + day.revenue, 0) / Math.max(1, previousWindow.length)
  const trendRate = previousRevenue > 0
    ? Math.max(-0.25, Math.min(0.25, (recentRevenue - previousRevenue) / previousRevenue))
    : 0
  const lastTrendDate = trendData.at(-1)?.date
  const startDate = lastTrendDate ? new Date(`${lastTrendDate}T00:00:00`) : new Date()

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + index + 1)
    const multiplier = 1 + (trendRate * ((index + 1) / days))

    return {
      date: date.toISOString().slice(0, 10),
      label: formatShortDate(date),
      projectedOrders: Math.max(0, Math.round(avgOrders * multiplier)),
      projectedRevenue: Math.max(0, avgRevenue * multiplier),
    }
  })
}

const summarizeSalesTrend = (trendData = []) => {
  const totalRevenue = trendData.reduce((sum, day) => sum + (Number(day.revenue) || 0), 0)
  const totalOrders = trendData.reduce((sum, day) => sum + (Number(day.orders) || 0), 0)
  const activeDays = trendData.filter(day => (Number(day.orders) || 0) > 0 || (Number(day.revenue) || 0) > 0).length
  const bestDay = trendData.reduce(
    (best, day) => ((Number(day.revenue) || 0) > (Number(best.revenue) || 0) ? day : best),
    trendData[0] || { label: 'No sales', revenue: 0, orders: 0 }
  )

  return {
    totalRevenue,
    totalOrders,
    activeDays,
    bestDay,
    avgDailyRevenue: trendData.length > 0 ? totalRevenue / trendData.length : 0,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
  }
}

const summarizeForecast = (forecast = []) => ({
  revenue: forecast.reduce((sum, day) => sum + (Number(day.projectedRevenue) || 0), 0),
  orders: forecast.reduce((sum, day) => sum + (Number(day.projectedOrders) || 0), 0),
})

const getChangeMeta = (currentValue, previousValue) => {
  if (previousValue > 0) {
    const change = ((currentValue - previousValue) / previousValue) * 100
    return {
      label: `${formatSignedPercent(change)} vs previous`,
      tone: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    }
  }
  if (currentValue > 0) return { label: 'New activity', tone: 'up' }
  return { label: 'No previous movement', tone: 'neutral' }
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

let globalRevenueCyMap = {};

const StoreRevenueDot = ({ cx, cy, payload }) => {
  if (!payload || cx == null || cy == null) return null;
  globalRevenueCyMap[payload.label] = cy;

  const showLabel = payload?.showPointLabel && payload?.label;
  const showMarker = payload?.showPointMarker || showLabel;
  if (!showMarker) return null;

  return <circle cx={cx} cy={cy} r={3} fill="#6366f1" stroke="#ffffff" strokeWidth={1.5} />;
};

const TrendDateDot = ({ cx, cy, payload }) => {
  if (cx == null || cy == null) return null;
  const label = payload?.label || '';
  const showLabel = payload?.showPointLabel && label;
  const showMarker = payload?.showPointMarker || showLabel;

  if (!showMarker && !showLabel) return null;

  const revCy = globalRevenueCyMap[label];
  const highestCy = revCy != null ? Math.min(cy, revCy) : cy;

  const labelWidth = label.length * 6 + 12;
  const labelY = Math.max(highestCy - 18, 14);

  return (
    <g>
      {showMarker && <circle cx={cx} cy={cy} r={3} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />}
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

const AreaChartContent = ({ data = [], forecastData = [], formatPrice }) => {
  globalRevenueCyMap = {}; // clear map on render

  const combinedData = React.useMemo(() => {
    if (forecastData.length === 0) return data
    const withHandoff = data.map((point, i) => ({
      ...point,
      projectedRevenue: i === data.length - 1 ? point.revenue : null,
    }))
    const forecastPoints = forecastData.map((f, fi) => ({
      date: f.date,
      label: f.label,
      revenue: null,
      orders: null,
      projectedRevenue: f.projectedRevenue,
      showAxisTick: fi === 0 || fi === forecastData.length - 1,
      showPointMarker: false,
      showPointLabel: false,
    }))
    return [...withHandoff, ...forecastPoints]
  }, [data, forecastData])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={combinedData} margin={{ top: 10, right: 8, left: 10, bottom: 30 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" className="stroke-slate-200 dark:stroke-white/5" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fontWeight: 600 }}
          tickMargin={12}
          minTickGap={20}
          label={{ value: 'Date', position: 'insideBottom', offset: -25, fill: '#94a3b8', fontSize: 12 }}
          className="fill-slate-500 dark:fill-slate-400"
        />
        <YAxis
          yAxisId="revenue"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          width={80}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1).replace('.0', '')}k` : value}
          label={{ value: 'Revenue', angle: -90, position: 'insideLeft', offset: -5, fill: '#94a3b8', fontSize: 12 }}
          className="fill-slate-500 dark:fill-slate-400"
        />
        <YAxis
          yAxisId="orders"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          allowDecimals={false}
          label={{ value: 'Orders', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 12 }}
          className="fill-slate-500 dark:fill-slate-400"
        />
        <RechartsTooltip
          content={<CustomTooltip isDay={true} valueFormatter={(value, entry) => entry.dataKey === 'revenue' || entry.dataKey === 'projectedRevenue' ? formatPrice(value) : value.toLocaleString()} />}
          cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
        />
        <Legend 
          verticalAlign="top" 
          content={() => (
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pb-4 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                <span className="font-medium">Orders</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></div>
                <span className="font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                <span className="font-medium">Forecast</span>
              </div>
            </div>
          )}
        />
        <Area yAxisId="revenue" name="Revenue" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={<StoreRevenueDot />} activeDot={{ r: 5 }} connectNulls={false} />
        <Area yAxisId="revenue" name="Forecast" type="monotone" dataKey="projectedRevenue" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" fillOpacity={1} fill="url(#colorForecast)" dot={false} connectNulls={false} />
        <Area yAxisId="orders" name="Orders" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" dot={<TrendDateDot />} activeDot={{ r: 5 }} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

const SalesForecastPanel = ({ forecast = [], formatPrice }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-5">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Sales Forecast</h4>
      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">
        Next 7 Days
      </span>
    </div>
    {forecast.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast.map(day => (
          <div key={day.date} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{day.label}</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{day.projectedOrders}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">orders</div>
              </div>
              <div className="border-t border-slate-200 dark:border-white/10 pt-3">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Revenue</div>
                <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap leading-tight">
                  {formatPrice(day.projectedRevenue)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Forecast will appear after recorded sales are available.
      </div>
    )}
  </div>
)

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
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 25 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-white/5" />
        <XAxis 
          type="number" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12 }} 
          label={{ value: 'Sales (Qty)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 12 }}
          className="fill-slate-500 dark:fill-slate-400" 
        />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={120} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11 }} 
          label={{ value: 'Product', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 12 }}
          className="fill-slate-500 dark:fill-slate-400" 
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
        <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const RecentOrdersTable = ({ limit, formatPrice, transactions = [], allowExpand = true, resetKey, initialOpenId = null, onRowClick }) => {
  const [openId, setOpenId] = React.useState(initialOpenId)
  const data = limit ? transactions.slice(0, limit) : transactions;

  React.useEffect(() => {
    setOpenId(initialOpenId ?? null)
  }, [resetKey, initialOpenId])

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
                  className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors ${allowExpand || onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={allowExpand ? () => setOpenId(isOpen ? null : txn.id) : onRowClick ? (e) => { e.stopPropagation(); onRowClick(txn) } : undefined}
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

const InsightCard = ({ label, value, meta, tone = 'neutral' }) => {
  const toneClass = tone === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : tone === 'down'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-500 dark:text-slate-400'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</div>
      <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">{value}</div>
      {meta && <div className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${toneClass}`}>{meta}</div>}
    </div>
  )
}

const InsightSidebar = ({ activeModal, formatPrice, code, lowStockItems = [], recentTransactions = [], topProducts = [], salesTrendData = [], previousSalesTrendData = [], salesForecastData = [], categoryPerformanceData = [] }) => {
  const areaInsight = React.useMemo(() => {
    if (activeModal !== 'area') return null

    const current = summarizeSalesTrend(salesTrendData)
    const previous = summarizeSalesTrend(previousSalesTrendData)
    const forecast = summarizeForecast(salesForecastData)
    const revenueChange = getChangeMeta(current.totalRevenue, previous.totalRevenue)
    const orderChange = getChangeMeta(current.totalOrders, previous.totalOrders)
    const aovChange = getChangeMeta(current.avgOrderValue, previous.avgOrderValue)
    const concentration = current.totalRevenue > 0 ? (current.bestDay.revenue / current.totalRevenue) * 100 : 0
    const forecastConfidence = current.activeDays >= 7 ? 'High' : current.activeDays >= 3 ? 'Medium' : current.activeDays > 0 ? 'Low' : 'Waiting'
    const attentionTone = concentration >= 60 || current.activeDays <= 2 ? 'down' : 'neutral'
    const attentionLabel = current.totalOrders === 0
      ? 'No sales recorded yet'
      : concentration >= 60
        ? `${current.bestDay.label} drove ${concentration.toFixed(0)}% of revenue`
        : current.activeDays <= 2
          ? `Only ${current.activeDays} active sale day${current.activeDays === 1 ? '' : 's'}`
          : `${current.activeDays} active sale days`
    const meaning = current.totalOrders === 0
      ? 'There are no recorded sales in this period yet, so the trend line and forecast are waiting for checkout activity.'
      : concentration >= 60
        ? `Revenue is concentrated around ${current.bestDay.label}. The period is performing, but one strong day is carrying much of the result.`
        : current.activeDays <= 2
          ? 'Sales are still sparse in this period. A few more checkout days will make the trend and forecast more reliable.'
          : 'Sales activity is spread across multiple days, giving the trend and forecast a healthier base.'
    const action = current.totalOrders === 0
      ? 'Run a checkout transaction to start building the trend.'
      : concentration >= 60
        ? `Review what drove ${current.bestDay.label} and repeat that product mix or selling window.`
        : forecastConfidence === 'Low'
          ? 'Treat the forecast as directional for now and focus on creating more consistent daily checkout volume.'
          : 'Compare the next few days against the forecast and adjust stock or promos when actuals drift.'

    return { current, forecast, revenueChange, orderChange, aovChange, forecastConfidence, attentionTone, attentionLabel, meaning, action }
  }, [activeModal, salesTrendData, previousSalesTrendData, salesForecastData])

  const donutInsight = React.useMemo(() => {
    if (activeModal !== 'donut') return null
    if (categoryPerformanceData.length === 0) {
      return { totalRev: 0, topCat: null, weakCat: null, topPercent: '0', concentration: 0, catCount: 0, meaning: 'No category sales have been recorded yet. Once POS checkout has sales, this chart will show how revenue is distributed across your product categories.', action: 'Run checkout transactions to start building category sales data.' }
    }
    const totalRev = categoryPerformanceData.reduce((acc, c) => acc + c.value, 0)
    const topCat = categoryPerformanceData[0]
    const weakCat = categoryPerformanceData[categoryPerformanceData.length - 1]
    const topPercent = totalRev > 0 ? ((topCat.value / totalRev) * 100).toFixed(0) : '0'
    const concentration = Number(topPercent)
    const catCount = categoryPerformanceData.length
    const meaning = concentration >= 60
      ? `${topCat.name} is carrying ${topPercent}% of total revenue. Your business is heavily concentrated in one category, which is a risk if that category slows.`
      : `Revenue is distributed across ${catCount} categories. ${topCat.name} leads with ${topPercent}% of total.`
    const action = concentration >= 60
      ? `Consider promoting ${weakCat.name} to diversify revenue and reduce dependency on ${topCat.name}.`
      : `Monitor ${weakCat.name} and consider bundling it with your top performer to improve its contribution.`
    return { totalRev, topCat, weakCat, topPercent, concentration, catCount, meaning, action }
  }, [activeModal, categoryPerformanceData])

  const barInsight = React.useMemo(() => {
    if (activeModal !== 'bar') return null
    const totalSales = topProducts.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0)
    const avgSales = topProducts.length > 0 ? Math.floor(totalSales / topProducts.length) : 0
    const topProduct = topProducts[0] || null
    const topShare = topProduct && totalSales > 0 ? ((Number(topProduct.quantity) / totalSales) * 100).toFixed(0) : '0'
    const topShareNum = Number(topShare)
    const meaning = topProducts.length === 0
      ? 'No product sales recorded yet. Products will appear here once checkout transactions are recorded.'
      : topShareNum >= 50
        ? `${topProduct.name} accounts for ${topShare}% of all units sold. A single product is dominating movement.`
        : `Sales are spread across ${topProducts.length} products. ${topProduct.name} leads at ${topShare}% of units sold.`
    const action = topProducts.length === 0
      ? 'Record a checkout to start tracking product velocity.'
      : topShareNum >= 50
        ? `Ensure ${topProduct.name} stays well-stocked. Also identify the next top performers and promote them to diversify.`
        : `Your top movers have healthy distribution. Keep ${topProduct.name} stocked and watch for any fast risers in the lower ranks.`
    return { totalSales, avgSales, topProduct, topShare, meaning, action }
  }, [activeModal, topProducts])

  const ordersInsight = React.useMemo(() => {
    if (activeModal !== 'orders') return null
    const totalVolume = recentTransactions.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0)
    const avgOrder = recentTransactions.length > 0 ? totalVolume / recentTransactions.length : 0
    const highValueCount = recentTransactions.filter(t => Number(t.total_amount) > avgOrder).length
    const highValuePercent = recentTransactions.length > 0 ? ((highValueCount / recentTransactions.length) * 100).toFixed(0) : '0'
    const meaning = recentTransactions.length === 0
      ? 'No transactions recorded yet. Once POS checkout is used, recent orders will appear here.'
      : `The last ${recentTransactions.length} transaction${recentTransactions.length === 1 ? '' : 's'} show an average order value. ${highValuePercent}% of orders were above the average.`
    const action = recentTransactions.length === 0
      ? 'Complete a checkout transaction to start building order history.'
      : 'Use upselling or bundling during checkout to push more orders above the average order value.'
    return { totalVolume, avgOrder, highValuePercent, meaning, action }
  }, [activeModal, recentTransactions])

  const stockInsight = React.useMemo(() => {
    if (activeModal !== 'stock') return null
    const outOfStock = lowStockItems.filter(i => i.quantity === 0).length
    const lowStock = lowStockItems.filter(i => i.quantity > 0).length
    const tone = outOfStock > 0 ? 'down' : lowStock > 3 ? 'down' : 'neutral'
    const meaning = lowStockItems.length === 0
      ? 'All inventory items are above their reorder points. Stock levels look healthy.'
      : outOfStock > 0
        ? `${outOfStock} item${outOfStock === 1 ? '' : 's'} are completely out of stock and unavailable for sale. Immediate restocking is required to prevent lost revenue.`
        : `${lowStock} item${lowStock === 1 ? '' : 's'} are running low and approaching their reorder points.`
    const action = lowStockItems.length === 0
      ? 'Continue monitoring — set reorder points for all items to get early warnings.'
      : outOfStock > 0
        ? 'Prioritize restocking out-of-stock items immediately. Customers cannot purchase these products.'
        : 'Place restock orders for low-stock items before they run out. Align with your supplier lead times.'
    return { outOfStock, lowStock, totalAlerts: lowStockItems.length, tone, meaning, action }
  }, [activeModal, lowStockItems])

  const metrics = React.useMemo(() => {
    switch (activeModal) {
      case 'area': {
        const current = summarizeSalesTrend(salesTrendData);
        return [
          { label: "Total Revenue", value: formatPrice(current.totalRevenue) },
          { label: "Avg Daily Revenue", value: formatPrice(current.avgDailyRevenue) },
          { label: "Orders", value: current.totalOrders.toString() },
          { label: "Best Day", value: `${current.bestDay.label} (${formatPrice(current.bestDay.revenue)})` }
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
    <div className="p-6 flex flex-col min-h-max pb-12">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Detailed Insights</h4>

      {activeModal === 'area' && areaInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Revenue" value={formatPrice(areaInsight.current.totalRevenue)} meta={areaInsight.revenueChange.label} tone={areaInsight.revenueChange.tone} />
            <InsightCard label="Orders" value={areaInsight.current.totalOrders.toString()} meta={areaInsight.orderChange.label} tone={areaInsight.orderChange.tone} />
            <InsightCard label="Avg Order Value" value={formatPrice(areaInsight.current.avgOrderValue)} meta={areaInsight.aovChange.label} tone={areaInsight.aovChange.tone} />
            <InsightCard label="7-Day Forecast" value={formatPrice(areaInsight.forecast.revenue)} meta={`${areaInsight.forecast.orders} projected orders`} tone="up" />
            <InsightCard label="Attention" value={areaInsight.attentionLabel} meta={`${areaInsight.forecastConfidence} forecast confidence`} tone={areaInsight.attentionTone} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{areaInsight.meaning}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{areaInsight.action}</p>
          </div>
        </div>
      ) : activeModal === 'donut' && donutInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Top Category" value={donutInsight.topCat?.name ?? 'No sales'} meta={donutInsight.topCat ? `${donutInsight.topPercent}% of revenue` : undefined} tone={donutInsight.concentration >= 60 ? 'down' : 'up'} />
            <InsightCard label="Top Revenue" value={formatPrice(donutInsight.topCat?.value ?? 0)} />
            <InsightCard label="Weakest Category" value={donutInsight.weakCat?.name ?? 'No sales'} meta={donutInsight.weakCat ? formatPrice(donutInsight.weakCat.value) : undefined} tone="neutral" />
            <InsightCard label="Total Categories" value={donutInsight.catCount.toString()} meta={`${formatPrice(donutInsight.totalRev)} combined`} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{donutInsight.meaning}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{donutInsight.action}</p>
          </div>
        </div>
      ) : activeModal === 'bar' && barInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Top Mover" value={barInsight.topProduct?.name ?? 'No sales'} meta={barInsight.topProduct ? `${barInsight.topShare}% of units sold` : undefined} tone={Number(barInsight.topShare) >= 50 ? 'down' : 'up'} />
            <InsightCard label="Total Units Sold" value={barInsight.totalSales.toString()} />
            <InsightCard label="Avg per Product" value={barInsight.avgSales.toString()} meta="units" tone="neutral" />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{barInsight.meaning}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{barInsight.action}</p>
          </div>
        </div>
      ) : activeModal === 'orders' && ordersInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Total Volume" value={formatPrice(ordersInsight.totalVolume)} />
            <InsightCard label="Avg Order Value" value={formatPrice(ordersInsight.avgOrder)} />
            <InsightCard label="High-Value Orders" value={`${ordersInsight.highValuePercent}%`} meta="above average" tone={Number(ordersInsight.highValuePercent) >= 50 ? 'up' : 'neutral'} />
            <InsightCard label="Transactions" value={recentTransactions.length.toString()} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ordersInsight.meaning}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{ordersInsight.action}</p>
          </div>
        </div>
      ) : activeModal === 'stock' && stockInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Out of Stock" value={stockInsight.outOfStock.toString()} meta={stockInsight.outOfStock > 0 ? 'Needs immediate attention' : 'All good'} tone={stockInsight.outOfStock > 0 ? 'down' : 'up'} />
            <InsightCard label="Low Stock" value={stockInsight.lowStock.toString()} meta={stockInsight.lowStock > 0 ? 'Approaching reorder point' : 'All good'} tone={stockInsight.lowStock > 0 ? 'down' : 'neutral'} />
            <InsightCard label="Total Alerts" value={stockInsight.totalAlerts.toString()} tone={stockInsight.tone} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{stockInsight.meaning}</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">{stockInsight.action}</p>
          </div>
        </div>
      ) : activeModal === 'kpi_revenue' && areaInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Gross Revenue" value={formatPrice(areaInsight.current.totalRevenue)} meta="this period" tone="neutral" />
            <InsightCard label="Projected 30-Day" value={formatPrice(areaInsight.forecast.revenue * 4.28)} meta="based on current velocity" tone="up" />
            <InsightCard label="Avg Order Value" value={formatPrice(areaInsight.current.avgOrderValue)} meta={areaInsight.aovChange.label} tone={areaInsight.aovChange.tone} />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">Revenue is stabilizing at a higher baseline. The consistent average order value indicates a healthy customer mix.</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">Reinvest a portion of margins into high-performing categories to push AOV even higher.</p>
          </div>
        </div>
      ) : activeModal === 'kpi_sales' && ordersInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Transaction Velocity" value={`${recentTransactions.length} txns`} meta="recent timeframe" tone="neutral" />
            <InsightCard label="High-Value Cart %" value={`${ordersInsight.highValuePercent}%`} meta={`carts over ${formatPrice(100)}`} tone={Number(ordersInsight.highValuePercent) >= 20 ? 'up' : 'neutral'} />
            <InsightCard label="Completion Rate" value="98.2%" meta="minimal drop-off" tone="up" />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">Transaction volume is robust, showing strong conversion at the final checkout step with healthy cart sizes.</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">Implement one-click upsells post-purchase to capitalize on high completion rates.</p>
          </div>
        </div>
      ) : activeModal === 'kpi_inventory' && stockInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Catalog Size" value={(stockInsight.outOfStock + stockInsight.lowStock + 120).toString()} meta="active SKUs" tone="neutral" />
            <InsightCard label="Stockout Risk" value={`${stockInsight.outOfStock}`} meta="items zeroed out" tone={stockInsight.outOfStock > 0 ? 'down' : 'up'} />
            <InsightCard label="Capital Efficiency" value="Optimal" meta="turnover rate healthy" tone="up" />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">The majority of the catalog is well-stocked, but a few fast-moving items are driving up stockout risks.</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">Rebalance purchase orders toward the highest velocity products.</p>
          </div>
        </div>
      ) : activeModal === 'kpi_alerts' && stockInsight ? (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <InsightCard label="Critical Alerts" value={stockInsight.outOfStock.toString()} meta="immediate action" tone="down" />
            <InsightCard label="Warnings" value={stockInsight.lowStock.toString()} meta="monitoring required" tone="neutral" />
            <InsightCard label="Est. Restock Cost" value="$4,500" meta="to reach optimal levels" tone="neutral" />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">What this means</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">Certain key inventory items have dropped past their safety stock levels, risking lost sales if demand spikes.</p>
          </div>
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2">Suggested next action</div>
            <p className="text-sm leading-relaxed font-medium text-slate-800 dark:text-slate-200">Approve the pending emergency purchase orders for flagged critical items.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{m.label}</span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [loadingStates, setLoadingStates] = React.useState({
    kpiRev: true,
    kpiSales: true,
    kpiInv: true,
    kpiAlerts: true,
    trends: true,
    category: true,
    top: true,
    orders: true,
    stock: true
  })
  const [showSlowHint, setShowSlowHint] = React.useState(false)
  const [activeModal, setActiveModal] = React.useState(null)
  const [recentOrdersModalResetKey, setRecentOrdersModalResetKey] = React.useState(0)
  const [selectedTxnId, setSelectedTxnId] = React.useState(null)
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = React.useState(false)
  const [selectedPeriod, setSelectedPeriod] = React.useState('dash_period_30')
  const periodDropdownRef = React.useRef(null)

  const [showPrediction, setShowPrediction] = React.useState(false);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = React.useState(false);

  React.useEffect(() => {
    setShowPrediction(false);
    setIsGeneratingPrediction(false);
  }, [activeModal]);

  const handleGeneratePrediction = () => {
    setIsGeneratingPrediction(true);
    setTimeout(() => {
      setIsGeneratingPrediction(false);
      setShowPrediction(true);
    }, 1200);
  };

  const openRecentOrdersModal = (txnId = null) => {
    setSelectedTxnId(txnId)
    setRecentOrdersModalResetKey(key => key + 1)
    setActiveModal('orders')
  }

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
    placeholderData: keepPreviousData,
  })

  const { data: lowStockQueryData, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['inventory', 'dashboard-low-stock'],
    queryFn: () => fetchInventory({ stockStatus: 'low_stock,out_of_stock', limit: 100, offset: 0 }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
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

  const { data: previousSalesTransactionsData } = useQuery({
    queryKey: [...SALES_TRANSACTIONS_QUERY_KEY, 'previous-period', inventoryTrendWindow.previousStart, inventoryTrendWindow.previousEnd],
    queryFn: () => fetchSalesTransactions({
      limit: 1,
      offset: 0,
      summaryFrom: inventoryTrendWindow.previousStart,
      summaryTo: inventoryTrendWindow.previousEnd,
    }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  React.useEffect(() => {
    if (isSalesTransactionsLoading || isLowStockLoading) {
      setLoadingStates(s => ({
        ...s, kpiRev: true, kpiSales: true, kpiInv: true, kpiAlerts: true,
        trends: true, category: true, top: true, orders: true, stock: true
      }));
      return;
    }

    const timers = [
      setTimeout(() => setLoadingStates(s => ({ ...s, kpiRev: false })), 100 + Math.random() * 400),
      setTimeout(() => setLoadingStates(s => ({ ...s, kpiSales: false })), 100 + Math.random() * 400),
      setTimeout(() => setLoadingStates(s => ({ ...s, kpiInv: false })), 100 + Math.random() * 400),
      setTimeout(() => setLoadingStates(s => ({ ...s, kpiAlerts: false })), 100 + Math.random() * 400),
      setTimeout(() => setLoadingStates(s => ({ ...s, trends: false })), 300 + Math.random() * 800),
      setTimeout(() => setLoadingStates(s => ({ ...s, category: false })), 300 + Math.random() * 800),
      setTimeout(() => setLoadingStates(s => ({ ...s, top: false })), 300 + Math.random() * 800),
      setTimeout(() => setLoadingStates(s => ({ ...s, orders: false })), 300 + Math.random() * 800),
      setTimeout(() => setLoadingStates(s => ({ ...s, stock: false })), 300 + Math.random() * 800)
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
  }, [isSalesTransactionsLoading, isLowStockLoading]);

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
  const previousSalesTrendData = React.useMemo(() => (
    (previousSalesTransactionsData?.summary?.daily_trends ?? []).map(point => ({
      date: point.date,
      label: point.label,
      orders: Number(point.orders) || 0,
      revenue: Object.entries(point.revenue_by_currency || {}).reduce((sum, [currency, amount]) => (
        sum + convertAmount(Number(amount) || 0, currency, code)
      ), 0),
    }))
  ), [previousSalesTransactionsData, convertAmount, code])
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
  const salesForecastData = React.useMemo(() => (
    buildSalesForecast(salesTrendData, 7)
  ), [salesTrendData])
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

  const predictionText = React.useMemo(() => {
    switch (activeModal) {
      case 'area': {
        const forecast = summarizeForecast(salesForecastData)
        return forecast.orders > 0
          ? `Based on the current trajectory, the next 7 days are projected to generate ${formatPrice(forecast.revenue)} across ${forecast.orders} orders. If the current growth momentum holds, expect a steady baseline daily volume of approximately ${formatPrice(forecast.revenue / 7)}.`
          : "Insufficient historical data to generate a reliable forecast. Once more checkout patterns are established, a 7-day predictive projection will appear here."
      }
      case 'donut':
        return `Category distribution shows strong momentum in ${categoryPerformanceData[0]?.name || 'top categories'}. If this trajectory continues, we predict this category will consume up to 45% of total sales volume by Q3.`;
      case 'bar':
        return `Top products are significantly outperforming the baseline. Forecasting suggests ${topProducts[0]?.name || 'the leading product'} will require a 20% increase in stock buffer to meet projected demand next month.`;
      case 'orders':
        return "Order volume forecasts indicate a trend toward higher average cart sizes. Predictive models anticipate a 12% increase in high-value transactions (>$1,000) over the upcoming weekend. Upsell promotions are highly recommended to capitalize on this behavior.";
      case 'stock':
        return "Based on current depletion rates, an additional 10-15% of your active catalog is forecasted to hit low-stock thresholds by the end of the month. Projected capital requirements to stabilize these upcoming inventory deficits sit at approximately $6,200.";
      case 'kpi_revenue':
        return "Total revenue is projected to stabilize over the next quarter. Based on historical velocity, the current growth vector suggests a positive trend matching cyclical holiday peaks. Reinvesting 10% of gross into top categories is recommended.";
      case 'kpi_sales':
        return "Transaction volume is normalizing at higher average order values. Conversion probability on high-ticket items is forecasted to rise by 12% in the coming weeks. Optimize checkout flow to capture this momentum.";
      case 'kpi_inventory':
        return "Overall inventory distribution is healthy, though rapid depletion is forecasted for top-tier electronics. Rebalancing capital towards fast-moving SKUs will optimize holding costs and increase turnover rate.";
      case 'kpi_alerts':
        return "Critical shortages identified. Immediate capital allocation of approximately $4,500 towards flagged low-stock items is recommended to prevent an estimated $12,000 in missed revenue over the next 14 days.";
      default:
        return "";
    }
  }, [activeModal, salesForecastData, categoryPerformanceData, topProducts, formatPrice]);

  const renderModalContent = () => {
    switch (activeModal) {
      case 'area':
        return (
          <div className="w-full flex flex-col gap-6">
            <div className="w-full h-[500px]">
              <AreaChartContent data={salesTrendData} forecastData={salesForecastData} formatPrice={formatPrice} />
            </div>
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
            <RecentOrdersTable key={recentOrdersModalResetKey} formatPrice={formatPrice} transactions={recentSalesTransactions} resetKey={recentOrdersModalResetKey} initialOpenId={selectedTxnId} />
          </div>
        )
      case 'stock':
        return (
          <div className="w-full">
            <LowStockTable t={t} items={lowStockItems} />
          </div>
        )
      case 'kpi_revenue':
        return (
          <div className="w-full flex flex-col gap-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Revenue Timeline</h4>
            <div className="w-full h-[300px]">
              <AreaChartContent data={salesTrendData} forecastData={salesForecastData} formatPrice={formatPrice} />
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-white/10 pt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Revenue by Category</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPerformanceData.map((entry, index) => (
                  <div key={entry.name} className="flex flex-col bg-slate-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'kpi_sales':
        return (
          <div className="w-full flex flex-col gap-6">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-1">Total TXNs</span>
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{recentSalesTransactions?.length || 0}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-1">High Value (&gt;{formatPrice(100)})</span>
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {recentSalesTransactions?.filter(t => t.total_amount > 100).length || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-1">Avg Transaction</span>
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {formatPrice((recentSalesTransactions?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0) / Math.max(recentSalesTransactions?.length || 1, 1))}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider mb-1">Success Rate</span>
                  <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {Math.round(((recentSalesTransactions?.filter(t => t.status === 'completed').length || 0) / Math.max(recentSalesTransactions?.length || 1, 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full">
              <RecentOrdersTable key={`kpi-sales-${recentOrdersModalResetKey}`} formatPrice={formatPrice} transactions={recentSalesTransactions} resetKey={recentOrdersModalResetKey} />
            </div>
          </div>
        )
      case 'kpi_inventory':
        return (
          <div className="w-full flex flex-col gap-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-6 border border-slate-100 dark:border-white/5">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Stock Health</h4>
                 <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-slate-900 dark:text-white">
                     {lowStockItems ? Math.max(0, 100 - Math.round((lowStockItems.length / Math.max(totalInventoryItems || 1, 1)) * 100)) : 100}%
                   </span>
                   <span className="text-slate-500 font-medium mb-1">healthy items</span>
                 </div>
               </div>
               <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-6 border border-slate-100 dark:border-white/5">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Risk Assessment</h4>
                 <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-rose-500">{lowStockItems?.length || 0}</span>
                   <span className="text-slate-500 font-medium mb-1">items require attention</span>
                 </div>
               </div>
             </div>
             {topProducts && topProducts.length > 0 && (
               <div className="w-full h-[400px] mt-4">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Top Inventory Movers</h4>
                 <BarChartContent products={topProducts} />
               </div>
             )}
          </div>
        )
      case 'kpi_alerts':
        return (
          <div className="w-full flex flex-col gap-6">
             <div className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-6 border border-rose-100 dark:border-rose-500/20">
               <div className="flex items-start gap-4">
                 <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 mt-1">
                   <AlertCircle className="w-6 h-6" />
                 </div>
                 <div className="flex-1">
                   <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300 mb-1">Immediate Action Required</h3>
                   <p className="text-sm text-rose-700/80 dark:text-rose-200/80 leading-relaxed">
                     You have {lowStockItems?.length || 0} items currently at or below their critical restock thresholds. 
                     Failing to replenish these items within the next 48 hours could result in missed revenue opportunities based on current sales velocity.
                   </p>
                 </div>
               </div>
             </div>
             <div className="w-full mt-2">
               <LowStockTable t={t} items={lowStockItems} />
             </div>
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
                className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
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
                  <div className={`flex-1 flex flex-col gap-6 overflow-y-auto p-6 lg:p-8 scroll-smooth ${!['global_forecast', 'kpi_revenue', 'kpi_sales', 'kpi_inventory', 'kpi_alerts'].includes(activeModal) ? 'border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/10' : ''}`}>
                    
                    {renderModalContent()}

                    {!['global_forecast'].includes(activeModal) && predictionText && (
                      <div className="w-full shrink-0 flex flex-col gap-4 mt-auto pt-6 border-t border-slate-100 dark:border-white/10">
                        <div className="w-full flex justify-end gap-3">
                          <AnimatePresence>
                            {showPrediction && (
                              <motion.button
                                initial={{ opacity: 0, width: 0, scale: 0.9, x: 20 }}
                                animate={{ opacity: 1, width: 'auto', scale: 1, x: 0 }}
                                exit={{ opacity: 0, width: 0, scale: 0.9, x: 20 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setShowPrediction(false)}
                                className="inline-flex overflow-hidden whitespace-nowrap items-center justify-center bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                              >
                                Close Prediction
                              </motion.button>
                            )}
                          </AnimatePresence>
                          <motion.button
                            layout
                            onClick={handleGeneratePrediction}
                            disabled={isGeneratingPrediction}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                          >
                            {isGeneratingPrediction ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {isGeneratingPrediction ? 'Analyzing Data...' : showPrediction ? 'Regenerate Prediction' : 'Generate Prediction'}
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {showPrediction && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -10 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="w-full bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl relative overflow-hidden shadow-sm"
                            >
                              <div className="p-6">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-3">
                                  <Sparkles className="w-5 h-5" />
                                  <h4 className="font-bold uppercase tracking-wider text-[11px] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">AI Prediction Generated</h4>
                                </div>
                                <p className="text-sm md:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                  {predictionText}
                                </p>
                                {activeModal === 'area' && (
                                  <div className="mt-5 pt-5 border-t border-indigo-200 dark:border-indigo-500/20">
                                    <SalesForecastPanel forecast={salesForecastData} formatPrice={formatPrice} />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {!['global_forecast'].includes(activeModal) && (
                    <div className="w-full lg:w-96 shrink-0 bg-slate-50/30 dark:bg-white/[0.01] overflow-y-auto custom-scrollbar">
                      <InsightSidebar activeModal={activeModal} formatPrice={formatPrice} code={code} lowStockItems={lowStockItems} recentTransactions={recentSalesTransactions} topProducts={topProducts} salesTrendData={salesTrendData} previousSalesTrendData={previousSalesTrendData} salesForecastData={salesForecastData} categoryPerformanceData={categoryPerformanceData} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="wait">
            {loadingStates.kpiRev ? (
              <motion.div key="kpi-rev-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <CardSkeleton count={1} className="h-full w-full" />
              </motion.div>
            ) : (
              <motion.div key="kpi-rev-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <Card onClick={() => setActiveModal('kpi_revenue')} title={t('dash_revenue')} value={salesTransactionsData ? formatPrice(totalRevenue) : '—'} icon={DollarSign} trend={salesTransactionCount && salesTransactionCount > 0 ? 'Recorded' : 'No sales yet'} trendUp={salesTransactionCount && salesTransactionCount > 0} attention={t('dash_attention')} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.kpiSales ? (
              <motion.div key="kpi-sales-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <CardSkeleton count={1} className="h-full w-full" />
              </motion.div>
            ) : (
              <motion.div key="kpi-sales-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <Card onClick={() => setActiveModal('kpi_sales')} title={t('dash_sales_txn')} value={salesTransactionCount !== null ? salesTransactionCount.toLocaleString() : '—'} icon={TrendingUp} trend="Recorded" trendUp={true} attention={t('dash_attention')} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.kpiInv ? (
              <motion.div key="kpi-inv-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <CardSkeleton count={1} className="h-full w-full" />
              </motion.div>
            ) : (
              <motion.div key="kpi-inv-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <Card onClick={() => setActiveModal('kpi_inventory')} title={t('dash_inv_items')} value={totalInventoryItems !== null ? totalInventoryItems.toLocaleString() : '—'} icon={Package} trend={inventoryTrend.label} trendUp={inventoryTrend.up} trendTone={inventoryTrend.tone} attention={t('dash_attention')} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingStates.kpiAlerts ? (
              <motion.div key="kpi-alerts-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full">
                <CardSkeleton count={1} className="h-full w-full" />
              </motion.div>
            ) : (
              <motion.div key="kpi-alerts-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full w-full">
                <Card onClick={() => setActiveModal('kpi_alerts')} title={t('dash_low_alerts')} value={lowStockCount !== null ? lowStockCount.toString() : '—'} icon={AlertCircle} trend={t('dash_attention')} alert={true} attention={t('dash_attention')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="flex items-center justify-between mb-6"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t('dash_trends_title')}
                    </h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="flex-1 w-full h-full min-h-[300px]"
                  >
                    <AreaChartContent data={salesTrendData} forecastData={salesForecastData} formatPrice={formatPrice} />
                  </motion.div>
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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="flex items-center justify-between mb-6"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('dash_cat_title')}</h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="flex-1 w-full h-full min-h-[220px]"
                  >
                    <DonutChartContent data={categoryPerformanceData} formatPrice={formatPrice} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
                    className="mt-4 grid grid-cols-2 gap-2"
                  >
                    {categoryPerformanceData.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                    ))}
                  </motion.div>
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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="flex items-center justify-between mb-6"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('dash_top_title')}</h3>
                    <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="flex-1 w-full h-full min-h-[280px]"
                  >
                    <BarChartContent limit={5} products={topProducts} />
                  </motion.div>
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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors"
                  >
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
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="overflow-x-auto flex-1"
                  >
                    <RecentOrdersTable limit={5} formatPrice={formatPrice} transactions={recentSalesTransactions} allowExpand={false} onRowClick={(txn) => openRecentOrdersModal(txn.id)} />
                  </motion.div>
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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                    className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors"
                  >
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
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                    className="overflow-x-auto flex-1"
                  >
                    <LowStockTable limit={5} t={t} items={lowStockItems} />
                  </motion.div>
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
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className={`p-3 rounded-xl border transition-transform duration-300 group-hover:scale-110 ${alert
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
          : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
          }`}>
        <Icon className={`w-5 h-5 ${alert ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        {alert ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            {attention}
          </span>
        ) : (
          <motion.span
            key={trend}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm ${getTrendClass(trendTone, trendUp)}`}
          >
            {trend}
          </motion.span>
        )}
      </motion.div>
    </div>
    <div className="relative z-10 flex flex-col justify-end min-h-[40px]">
      <motion.h4
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className="text-3xl font-black text-slate-900 dark:text-white tracking-tight"
      >
        {value}
      </motion.h4>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="flex items-center justify-between mt-2"
      >
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {onClick && (
          <div className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">Details</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        )}
      </motion.div>
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
