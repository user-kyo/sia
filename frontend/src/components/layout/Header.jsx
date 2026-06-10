import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/axios';

const Header = ({ onLogoutClick }) => {
  const { user, userRole, companyId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (companyId) {
      const fetchCompany = async () => {
        try {
          const response = await api.get('/companies');
          const company = response.data.find(c => c.id === companyId);
          if (company) {
            setCompanyName(company.name);
          }
        } catch (err) {
          console.error("Error fetching company name:", err);
        }
      };
      fetchCompany();
    }
  }, [companyId]);

  const roleDisplay = {
    'super_admin': 'Super Admin',
    'admin': 'Administrator',
    'staff': 'Staff Member'
  };

  // Mock notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Low Stock Alert', desc: 'Product "Wireless Mouse" is below reorder point.', time: '10m ago', unread: true },
    { id: 2, title: 'System Update', desc: 'Version 1.0.1 has been deployed successfully.', time: '2h ago', unread: true },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-20 bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-10 sticky top-0 z-20 transition-colors">
      <div className="flex-1 flex items-center">
        {companyName && (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Company</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{companyName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative group" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white dark:border-[#0A0A0B]"></span>
            )}
          </button>

          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none whitespace-nowrap z-[60]">
            Notifications
          </div>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
                  <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({...n, unread: false})))}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 focus:outline-none focus-visible:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No new notifications.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</h4>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{n.desc}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>

        {/* Profile Dropdown */}
        <div className="relative group" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl p-1 pr-3"
          >
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {user?.user_metadata?.full_name || 'Guest'}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {roleDisplay[userRole] || 'Unknown'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
              <User className="w-5 h-5" />
            </div>
          </button>

          {/* Tooltip */}
          <div className="absolute top-full right-0 mt-2 px-2.5 py-1 bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none whitespace-nowrap z-[60]">
            Account & Settings
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col p-2"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/10 mb-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Settings size={16} />
                  Account Settings
                </button>
                
                <button
                  onClick={() => { toggleTheme(); setIsProfileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  Toggle Theme
                </button>

                <div className="h-px bg-slate-100 dark:bg-white/10 my-2"></div>

                <button
                  onClick={() => { setIsProfileOpen(false); onLogoutClick?.(); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
