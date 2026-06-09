import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your system preferences and appearance</p>
      </div>

      <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
          <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Appearance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the interface theme</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-3">Theme Preference</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02]'}`}
              >
                <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                  <Sun size={20} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${theme === 'light' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>Light Mode</div>
                  <div className={`text-xs mt-0.5 ${theme === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Clean and bright</div>
                </div>
              </button>
              
              <button 
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02]'}`}
              >
                <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                  <Moon size={20} />
                </div>
                <div className="text-left">
                  <div className={`font-semibold ${theme === 'dark' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>Dark Mode</div>
                  <div className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>Easy on the eyes</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
