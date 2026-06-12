import { useState, useEffect } from 'react'
import { Download, Package, ShoppingCart, Truck, Users, UserCog, Tags, ListTree } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { ReportCardSkeleton } from '../components/ui/Skeletons'

import { fetchInventory, fetchCategories, fetchBrands } from '../features/inventory/api/inventoryApi'
import { fetchSalesTransactions } from '../features/sales/api/salesApi'
import { fetchProcurements } from '../features/procurements/api/procurementsApi'
import { fetchSuppliers } from '../features/suppliers/api/suppliersApi'
import api from '../lib/axios'

function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) {
    alert("No data available to export.")
    return
  }

  const headers = columns.map(c => c.label).join(',')
  const rows = data.map(row => 
    columns.map(c => {
      let val = c.value(row)
      if (val === null || val === undefined) val = ''
      val = String(val).replace(/"/g, '""')
      return `"${val}"`
    }).join(',')
  )

  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const ReportsPage = () => {
  const { t } = useAppSettings()
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleExport = async (type) => {
    setDownloading(type)
    try {
      if (type === 'inventory') {
        const res = await fetchInventory({ limit: 10000 })
        const data = res.data || []
        exportToCSV(data, 'Inventory_Report', [
          { label: 'SKU', value: r => r.sku },
          { label: 'Name', value: r => r.name },
          { label: 'Category', value: r => r.category?.name || r.category_name },
          { label: 'Quantity', value: r => r.quantity },
          { label: 'Reorder Point', value: r => r.reorder_point },
          { label: 'Unit Cost', value: r => r.cost },
          { label: 'Selling Price', value: r => r.price }
        ])
      } 
      else if (type === 'sales') {
        const res = await fetchSalesTransactions({ limit: 10000 })
        const data = res.data || []
        exportToCSV(data, 'Sales_Transactions_Report', [
          { label: 'Transaction ID', value: r => r.id },
          { label: 'Date', value: r => new Date(r.created_at).toLocaleString() },
          { label: 'Cashier', value: r => r.cashier_name || r.user_id },
          { label: 'Subtotal', value: r => r.subtotal },
          { label: 'Discount', value: r => r.discount_amount },
          { label: 'Tax', value: r => r.tax_amount },
          { label: 'Grand Total', value: r => r.grand_total }
        ])
      }
      else if (type === 'procurements') {
        const res = await fetchProcurements({ limit: 10000 })
        const data = res.data || []
        exportToCSV(data, 'Purchase_Orders_Report', [
          { label: 'PO Number', value: r => r.po_number },
          { label: 'Date', value: r => new Date(r.created_at).toLocaleString() },
          { label: 'Supplier', value: r => r.supplier?.name || r.supplier_id },
          { label: 'Status', value: r => r.status },
          { label: 'Total Amount', value: r => r.total_amount },
          { label: 'Requested By', value: r => r.requested_by },
          { label: 'Remarks', value: r => r.remarks }
        ])
      }
      else if (type === 'suppliers') {
        const res = await fetchSuppliers({ limit: 10000 })
        const data = res.data || []
        exportToCSV(data, 'Suppliers_Report', [
          { label: 'Name', value: r => r.name },
          { label: 'Contact Person', value: r => r.contact_person },
          { label: 'Email', value: r => r.email },
          { label: 'Phone', value: r => r.phone },
          { label: 'Address', value: r => r.address },
          { label: 'Status', value: r => r.status }
        ])
      }
      else if (type === 'users') {
        const res = await api.get('/users')
        const data = res.data || []
        exportToCSV(data, 'Users_Report', [
          { label: 'Email', value: r => r.email },
          { label: 'Name', value: r => r.raw_user_meta_data?.full_name || r.raw_user_meta_data?.name },
          { label: 'Role', value: r => r.raw_user_meta_data?.role || 'staff' },
          { label: 'Status', value: r => r.raw_user_meta_data?.status || 'approved' }
        ])
      }
      else if (type === 'brands') {
        const data = await fetchBrands()
        exportToCSV(data || [], 'Brands_Report', [
          { label: 'Brand Name', value: r => r.name }
        ])
      }
      else if (type === 'categories') {
        const data = await fetchCategories()
        exportToCSV(data || [], 'Categories_Report', [
          { label: 'Category Name', value: r => r.name },
          { label: 'Description', value: r => r.description }
        ])
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export report. Please try again.")
    } finally {
      setDownloading(null)
    }
  }

  const reports = [
    {
      id: 'sales',
      icon: ShoppingCart,
      title: t('rep_card_sales') || 'Sales Transactions',
      description: t('rep_card_sales_desc') || 'Export all historical sales records, including discounts, tax, and cashier details.',
      color: 'emerald'
    },
    {
      id: 'inventory',
      icon: Package,
      title: t('rep_card_inv') || 'Inventory Report',
      description: t('rep_card_inv_desc') || 'Export complete details of current stock, unit costs, pricing, and reorder levels.',
      color: 'indigo'
    },
    {
      id: 'procurements',
      icon: Truck,
      title: 'Purchase Orders',
      description: 'Export procurement records, tracking statuses, suppliers, and total expenditure.',
      color: 'purple'
    },
    {
      id: 'suppliers',
      icon: Users,
      title: 'Suppliers List',
      description: 'Export your vendor directory, containing contact persons, emails, and phone numbers.',
      color: 'blue'
    },
    {
      id: 'categories',
      icon: ListTree,
      title: 'Product Categories',
      description: 'Export the hierarchical list of product categories and descriptions.',
      color: 'cyan'
    },
    {
      id: 'brands',
      icon: Tags,
      title: 'Product Brands',
      description: 'Export the list of all registered product brands and manufacturers.',
      color: 'amber'
    },
    {
      id: 'users',
      icon: UserCog,
      title: 'Users & Staff',
      description: 'Export system users, containing their emails, roles, and account statuses.',
      color: 'rose'
    }
  ]

  const getColorClasses = (color) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
      case 'emerald': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'purple': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      case 'blue': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'rose': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
      case 'amber': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'cyan': return 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20';
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
          <ReportCardSkeleton count={7} />
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {reports.map((report, index) => {
              const Icon = report.icon;
              const colorClasses = getColorClasses(report.color);
              const isDownloading = downloading === report.id;

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                      className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-400/30 border-t-slate-600 dark:border-t-slate-300 animate-spin" />
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
