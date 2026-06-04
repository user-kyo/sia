import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
        <input 
          type="text" 
          placeholder="Search everywhere..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
        <div className="absolute right-2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 rounded flex items-center gap-0.5">
          <span>⌘</span><span>K</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-900 transition-colors relative focus:outline-none">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-5 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Admin User</span>
            <span className="text-[11px] font-medium text-slate-500">Administrator</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
