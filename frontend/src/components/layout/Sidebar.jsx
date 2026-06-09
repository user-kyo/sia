import { NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ALL_NAV = [
  { name: 'Dashboard',       path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
  { name: 'Inventory',       path: '/inventory', icon: Package,          roles: ['super_admin', 'admin', 'staff'] },
  { name: 'Point of Sale',   path: '/sales',     icon: ShoppingCart,     roles: ['super_admin', 'admin', 'staff'] },
  { name: 'Audit Logs',      path: '/reports',   icon: FileText,         roles: ['super_admin', 'admin'] },
  { name: 'User Management', path: '/users',     icon: Settings,         roles: ['super_admin'] },
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
    <aside className="w-[210px] min-w-[210px] bg-[#1b2035] flex flex-col h-screen">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#2a3150]">
        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shrink-0">
          <span className="text-[#1b2035] font-black text-xs">▲</span>
        </div>
        <span className="text-white font-semibold text-sm">SIA System</span>
      </div>

      <div className="flex-1 pt-4">
        <p className="text-[10px] font-semibold text-[#4b5680] uppercase tracking-widest px-4 pb-2">
          Main Menu
        </p>
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-[#252d4a] text-white font-medium'
                  : 'text-[#8b93b8] hover:bg-[#232b47] hover:text-[#c5cae8]'
              }`
            }
          >
            <Icon size={16} />
            {name}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-[#2a3150] px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 text-[#8b93b8] hover:text-[#c5cae8] text-sm transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
