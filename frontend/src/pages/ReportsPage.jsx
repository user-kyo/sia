import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Download, Package, ShoppingCart, Truck, Users, UserCog, Tags, ListTree, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAppSettings } from '../contexts/AppSettingsContext'
import { ReportCardSkeleton } from '../components/ui/Skeletons'

import { fetchInventory, fetchCategories, fetchBrands } from '../features/inventory/api/inventoryApi'
import { fetchSalesTransactions } from '../features/sales/api/salesApi'
import { fetchProcurements } from '../features/procurements/api/procurementsApi'
import { fetchSuppliers } from '../features/suppliers/api/suppliersApi'
import api from '../lib/axios'

function exportFile(data, filename, columns, format, chartImage = null) {
  if (!data || data.length === 0) {
    alert("No data available to export.")
    return
  }

  const headers = columns.map(c => c.label)
  const rows = data.map(row => columns.map(c => c.value(row) ?? ''))

  if (format === 'csv' || format === 'xlsx') {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Report")
    
    if (format === 'csv') {
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.csv`, { bookType: 'csv' })
    } else {
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
  } else if (format === 'pdf') {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(filename.replace(/_/g, ' '), 14, 15)
    
    let startY = 20
    if (chartImage) {
      try {
        doc.addImage(chartImage, 'PNG', 14, 25, 180, 90)
        startY = 125
      } catch (e) {
        console.warn("Could not embed chart in PDF", e)
      }
    }
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: startY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] },
    })
    
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
  }
}

const ReportsPage = () => {
  const { t } = useAppSettings()
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState(null)
  const [selectedFormat, setSelectedFormat] = useState('xlsx')
  
  const [previewData, setPreviewData] = useState(null)
  const [previewColumns, setPreviewColumns] = useState(null)
  const [previewFilename, setPreviewFilename] = useState("")
  const [previewChart, setPreviewChart] = useState(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleExportClick = (type) => {
    setSelectedReportType(type)
    setIsModalOpen(true)
  }

  const fetchPreviewData = async () => {
    if (!selectedReportType) return
    const type = selectedReportType
    setIsModalOpen(false)
    setDownloading(type)
    try {
      let data = []
      let filename = ""
      let columns = []

      if (type === 'inventory') {
        const res = await fetchInventory({ limit: 100000 })
        data = res.data || []
        filename = 'Inventory_Report'
        columns = [
          { label: 'SKU', value: r => r.sku || '' },
          { label: 'Name', value: r => r.name || '' },
          { label: 'Brand', value: r => r.brand || '' },
          { label: 'Category', value: r => r.category?.name || r.category || '' },
          { label: 'Quantity', value: r => r.quantity || 0 },
          { label: 'Reorder Point', value: r => r.reorder_point || 0 },
          { label: 'Unit Cost', value: r => r.cost || 0 },
          { label: 'Selling Price', value: r => r.price || 0 }
        ]
      } 
      else if (type === 'sales') {
        const res = await fetchSalesTransactions({ limit: 100000 })
        data = res.data || []
        filename = 'Sales_Transactions_Report'
        columns = [
          { label: 'Transaction Code', value: r => r.transaction_code || r.id },
          { label: 'Date', value: r => new Date(r.created_at).toLocaleString() },
          { label: 'Total Items', value: r => r.item_count || 0 },
          { label: 'Currency', value: r => r.currency || 'PHP' },
          { label: 'Total Amount', value: r => r.total_amount || 0 }
        ]
      }
      else if (type === 'procurements') {
        const res = await fetchProcurements({ limit: 100000 })
        data = res.data || []
        filename = 'Purchase_Orders_Report'
        columns = [
          { label: 'PO Number', value: r => r.po_number },
          { label: 'Date', value: r => new Date(r.created_at).toLocaleString() },
          { label: 'Supplier', value: r => r.supplier?.name || r.supplier_id },
          { label: 'Status', value: r => r.status?.replace('_', ' ').toUpperCase() },
          { label: 'Currency', value: r => r.currency || 'PHP' },
          { label: 'Total Amount', value: r => r.total_amount },
          { label: 'Requested By', value: r => r.requested_by || '' },
          { label: 'Remarks', value: r => r.remarks || '' }
        ]
      }
      else if (type === 'suppliers') {
        const res = await fetchSuppliers({ limit: 100000 })
        data = res.data || []
        filename = 'Suppliers_Report'
        columns = [
          { label: 'Name', value: r => r.name },
          { label: 'Contact Person', value: r => r.contact_person },
          { label: 'Email', value: r => r.email },
          { label: 'Phone', value: r => r.phone },
          { label: 'Address', value: r => r.address },
          { label: 'Status', value: r => r.status }
        ]
      }
      else if (type === 'users') {
        const res = await api.get('/users')
        data = res.data || []
        filename = 'Users_Report'
        columns = [
          { label: 'Email', value: r => r.email },
          { label: 'Name', value: r => r.raw_user_meta_data?.full_name || r.raw_user_meta_data?.name },
          { label: 'Role', value: r => r.raw_user_meta_data?.role || 'staff' },
          { label: 'Status', value: r => r.raw_user_meta_data?.status || 'approved' }
        ]
      }
      else if (type === 'brands') {
        data = await fetchBrands()
        data = data || []
        filename = 'Brands_Report'
        columns = [
          { label: 'Brand Name', value: r => r.name }
        ]
      }
      else if (type === 'categories') {
        data = await fetchCategories()
        data = data || []
        filename = 'Categories_Report'
        columns = [
          { label: 'Category Name', value: r => r.name },
          { label: 'Description', value: r => r.description }
        ]
      }

      setPreviewData(data)
      setPreviewColumns(columns)
      setPreviewFilename(filename)
      
      try {
        const chartRes = await api.get(`/reports/chart?type=${type}`)
        if (chartRes.data && chartRes.data.chart) {
          setPreviewChart(chartRes.data.chart)
        } else {
          setPreviewChart(null)
        }
      } catch (e) {
        console.warn("Failed to fetch chart", e)
        setPreviewChart(null)
      }
      
      setIsPreviewModalOpen(true)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to load report data. Please try again.")
      setSelectedReportType(null)
    } finally {
      setDownloading(null)
    }
  }

  const confirmDownload = () => {
    exportFile(previewData, previewFilename, previewColumns, selectedFormat, previewChart)
    setIsPreviewModalOpen(false)
    setSelectedReportType(null)
    setPreviewData(null)
    setPreviewColumns(null)
    setPreviewChart(null)
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
          <ReportCardSkeleton count={7} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full" />
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
                      onClick={() => handleExportClick(report.id)}
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

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-none overflow-hidden z-10"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 px-6 py-5 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                    <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Format</h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Select a format to download
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={() => setSelectedFormat('xlsx')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${selectedFormat === 'xlsx' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                >
                  <div className="flex flex-col text-left">
                    <span className={`font-bold ${selectedFormat === 'xlsx' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>Excel Workbook (.xlsx)</span>
                    <span className={`text-xs mt-0.5 ${selectedFormat === 'xlsx' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Standard spreadsheet format</span>
                  </div>
                  <FileText className={`w-5 h-5 ${selectedFormat === 'xlsx' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                </button>
                <button
                  onClick={() => setSelectedFormat('csv')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${selectedFormat === 'csv' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                >
                  <div className="flex flex-col text-left">
                    <span className={`font-bold ${selectedFormat === 'csv' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>CSV Document (.csv)</span>
                    <span className={`text-xs mt-0.5 ${selectedFormat === 'csv' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Plain text data format</span>
                  </div>
                  <FileText className={`w-5 h-5 ${selectedFormat === 'csv' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                </button>
                <button
                  onClick={() => setSelectedFormat('pdf')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${selectedFormat === 'pdf' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
                >
                  <div className="flex flex-col text-left">
                    <span className={`font-bold ${selectedFormat === 'pdf' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>PDF Document (.pdf)</span>
                    <span className={`text-xs mt-0.5 ${selectedFormat === 'pdf' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Print-ready formatted document</span>
                  </div>
                  <FileText className={`w-5 h-5 ${selectedFormat === 'pdf' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 px-6 py-4 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={fetchPreviewData}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] flex items-center gap-2"
                >
                  Continue to Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>, document.body)}

      {createPortal(
        <AnimatePresence>
          {isPreviewModalOpen && previewColumns && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPreviewModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative bg-white dark:bg-[#0d0f1a] dark:backdrop-blur-xl border border-transparent dark:border-white/10 rounded-2xl w-full max-w-[95vw] xl:max-w-[1400px] 2xl:max-w-[1600px] shadow-2xl dark:shadow-none overflow-hidden z-10 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-white/5 px-6 py-5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Preview</h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      Previewing first 10 rows of {previewData?.length || 0} total records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto flex-1 bg-white dark:bg-[#0d0f1a] flex flex-col">
                {previewChart && (
                  <div className="mb-6 flex justify-center w-full">
                    <img src={previewChart} alt="Report Chart" className="max-h-64 object-contain rounded-xl border border-slate-200 dark:border-white/10 shadow-sm" />
                  </div>
                )}
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {previewColumns.map((col, i) => (
                        <th key={i} className="px-6 py-3 font-semibold border-b border-slate-200 dark:border-white/10">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {previewData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        {previewColumns.map((col, j) => (
                          <td key={j} className="px-6 py-3 text-slate-700 dark:text-slate-300">
                            {col.value(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewData.length === 0 && (
                      <tr>
                        <td colSpan={previewColumns.length} className="px-6 py-12 text-center text-slate-500">
                          No data available to preview.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 dark:border-white/5 px-6 py-4 bg-slate-50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDownload}
                  disabled={previewData.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Confirm Download
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}

export default ReportsPage
