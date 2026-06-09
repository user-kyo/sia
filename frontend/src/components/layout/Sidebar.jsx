import { NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings, Users, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ALL_NAV = [
  { name: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { name: 'Inventory',       path: '/inventory', icon: Package,          roles: ['super_admin', 'admin', 'staff'] },
  { name: 'Point of Sale',   path: '/sales',     icon: ShoppingCart,     roles: ['super_admin', 'admin', 'staff'] },
  { name: 'Audit Logs',      path: '/reports',   icon: FileText,         roles: ['super_admin', 'admin'] },
  { name: 'User Management', path: '/users',     icon: Users,            roles: ['super_admin'] },
  { name: 'Settings',        path: '/settings',  icon: Settings,         roles: ['super_admin', 'admin', 'staff'] },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { signOut, userRole } = useAuth()

  const role = userRole || 'staff'
  const navItems = ALL_NAV.filter(item => item.roles.includes(role))

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <aside className="w-[210px] min-w-[210px] bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col h-screen transition-colors">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-white/10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/10">
          <span className="text-white font-bold text-xs">SR</span>
        </div>
        <span className="text-slate-900 dark:text-white font-bold text-sm tracking-wide">Stock & Roll</span>
      </div>

      <div className="flex-1 pt-4">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-6 pb-3">
          Main Menu
        </p>
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border-r-2 border-indigo-500'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Icon size={16} />
            {name}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-slate-100 dark:border-white/10 px-6 py-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-sm transition-colors font-medium w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
