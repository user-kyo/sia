import React from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, Package, ShoppingCart, FileText, Settings, LogOut, Activity } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Point of Sale', path: '/sales', icon: ShoppingCart },
    { name: 'Audit Logs', path: '/reports', icon: FileText },
  ];

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] text-slate-900 tracking-tight">SIA System</span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-slate-50 text-slate-900' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`
            }
          >
            <item.icon className={`w-[18px] h-[18px] ${({ isActive }) => isActive ? 'text-slate-900' : 'text-slate-400'}`} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-500 hover:text-slate-900">
          <LogOut className="w-[18px] h-[18px] text-slate-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
