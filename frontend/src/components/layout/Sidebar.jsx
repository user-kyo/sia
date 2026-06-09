import { NavLink, useNavigate } from 'react-router'
import { LayoutDashboard, Package, ShoppingCart, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/sales', icon: ShoppingCart, label: 'Point of Sale' },
  { to: '/reports', icon: FileText, label: 'Audit Logs' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

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
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-[#252d4a] text-white font-medium'
                  : 'text-[#8b93b8] hover:bg-[#232b47] hover:text-[#c5cae8]'
              }`
            }
          >
            <Icon size={16} />
            {label}
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
