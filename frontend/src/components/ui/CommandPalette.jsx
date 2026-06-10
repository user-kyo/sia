import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Package, ShoppingCart, FileText, Users, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function CommandPalette({ onLogoutClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100); // Wait for animation
    }
  }, [isOpen]);

  // Actions
  const ALL_ACTIONS = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard'), roles: ['super_admin', 'admin'] },
    { id: 'inventory', label: 'Go to Inventory', icon: Package, action: () => navigate('/inventory'), roles: ['super_admin', 'admin', 'staff'] },
    { id: 'sales', label: 'Go to POS Sales', icon: ShoppingCart, action: () => navigate('/sales'), roles: ['super_admin', 'admin', 'staff'] },
    { id: 'reports', label: 'Go to Reports', icon: FileText, action: () => navigate('/reports'), roles: ['super_admin', 'admin'] },
    { id: 'users', label: 'Manage Users', icon: Users, action: () => navigate('/users'), roles: ['super_admin'] },
    { id: 'settings', label: 'Go to Settings', icon: Settings, action: () => navigate('/settings'), roles: ['super_admin', 'admin', 'staff'] },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`, icon: theme === 'dark' ? Sun : Moon, action: toggleTheme, roles: ['super_admin', 'admin', 'staff'] },
    { id: 'logout', label: 'Logout', icon: LogOut, action: () => onLogoutClick?.(), roles: ['super_admin', 'admin', 'staff'] },
  ];

  const role = userRole || 'staff';
  const availableActions = ALL_ACTIONS.filter(a => a.roles.includes(role));
  const filteredActions = query 
    ? availableActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : availableActions;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (actionObj) => {
    setIsOpen(false);
    actionObj.action();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredActions[selectedIndex]);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden mx-4"
          >
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-white/10">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search commands... (e.g. 'inventory')"
                className="flex-1 w-full h-14 bg-transparent border-none outline-none px-4 text-slate-900 dark:text-white placeholder-slate-400 text-lg focus:ring-0"
              />
              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
                <span>esc</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredActions.length === 0 ? (
                <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                  No commands found for "{query}"
                </div>
              ) : (
                filteredActions.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelect(action)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left focus:outline-none ${
                      i === selectedIndex 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <action.icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{action.label}</span>
                    {i === selectedIndex && (
                      <span className="ml-auto text-xs text-indigo-400 dark:text-indigo-500 font-medium">Enter</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
