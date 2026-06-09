import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, userRole } = useAuth();
  
  const roleDisplay = {
    'super_admin': 'Super Admin',
    'admin': 'Administrator',
    'staff': 'Staff Member'
  };

  return (
    <header className="h-20 bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-10 sticky top-0 z-20 transition-colors">
      <div />

      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative focus:outline-none">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-[#0A0A0B]"></span>
        </button>
        <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {user?.user_metadata?.full_name || 'Guest'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {roleDisplay[userRole] || 'Unknown'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
