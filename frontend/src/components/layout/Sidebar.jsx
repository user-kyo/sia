import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings, Users, LogOut, ChevronLeft, ChevronRight, Download, Building2, ClipboardList } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppSettings } from '../../contexts/AppSettingsContext'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

const ALL_NAV = [
  { key: 'nav_dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { key: 'nav_inventory', path: '/inventory', icon: Package, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'nav_pos', path: '/sales', icon: ShoppingCart, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'nav_suppliers', path: '/suppliers', icon: Building2, roles: ['super_admin', 'admin'] },
  { key: 'nav_procurements', path: '/procurements', icon: ClipboardList, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'nav_data_reports', path: '/data-reports', icon: Download, roles: ['super_admin', 'admin'] },
  { key: 'nav_reports', path: '/reports', icon: FileText, roles: ['super_admin', 'admin'] },
  { key: 'nav_users', path: '/users', icon: Users, roles: ['super_admin'] },
  { key: 'nav_settings', path: '/settings', icon: Settings, roles: ['super_admin', 'admin', 'staff'] },
]

export default function Sidebar({ onLogoutClick }) {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const { userRole } = useAuth()
  const { t } = useAppSettings()

  const role = userRole || 'staff'
  const navItems = ALL_NAV.filter(item => item.roles.includes(role))

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 210, minWidth: isCollapsed ? 80 : 210 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col h-screen overflow-hidden z-20"
    >
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-white/10 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10">
          <span className="text-white font-bold text-xs">SR</span>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0, x: -10 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-slate-900 dark:text-white font-bold text-sm tracking-wide whitespace-nowrap overflow-hidden"
            >
              Stock & Roll
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 pt-4 overflow-y-auto overflow-x-hidden">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0, height: 0, x: -10 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0, height: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-6 pb-3 whitespace-nowrap overflow-hidden"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>
        {navItems.map(({ key, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onMouseEnter={(e) => {
              if (!isCollapsed) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredItem({
                text: t(key),
                top: rect.top + rect.height / 2,
                left: rect.right + 12
              });
            }}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 py-3 text-sm transition-colors rounded-xl mx-2 my-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isCollapsed ? 'justify-center' : 'px-4'
              } ${isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 border-r-2 border-indigo-500 z-0"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon size={16} className="shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0, x: -10 }}
                        animate={{ opacity: 1, width: 'auto', x: 0 }}
                        exit={{ opacity: 0, width: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {t(key)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className={`border-t border-slate-100 dark:border-white/10 px-6 py-5 flex items-center overflow-hidden ${isCollapsed ? 'justify-center flex-col gap-5' : 'justify-between'}`}>
        <button
          onClick={onLogoutClick}
          onMouseEnter={(e) => {
            if (!isCollapsed) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredItem({
              text: t('nav_logout'),
              top: rect.top + rect.height / 2,
              left: rect.right + 12
            });
          }}
          onMouseLeave={() => setHoveredItem(null)}
          className={`flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-sm transition-colors font-medium rounded-xl p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0, x: -10 }}
                animate={{ opacity: 1, width: 'auto', x: 0 }}
                exit={{ opacity: 0, width: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {t('nav_logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>
      </div>

      {/* Tooltip Portal */}
      {hoveredItem && isCollapsed && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -10, y: '-50%' }}
            animate={{ opacity: 1, x: 0, y: '-50%' }}
            exit={{ opacity: 0, x: -10, y: '-50%' }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] px-3 py-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl pointer-events-none"
            style={{ top: hoveredItem.top, left: hoveredItem.left }}
          >
            {hoveredItem.text}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.aside>
  )
}
