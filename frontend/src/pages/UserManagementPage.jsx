import React, { useState } from 'react';
import { Users, Search, MoreVertical, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mocked user data for demonstration purposes
  const mockUsers = [
    { id: 1, name: 'Alice Cooper', email: 'alice@stocknroll.com', role: 'super_admin', status: 'Approved', lastActive: '2 mins ago' },
    { id: 2, name: 'Bob Smith', email: 'bob@stocknroll.com', role: 'admin', status: 'Approved', lastActive: '1 hour ago' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@stocknroll.com', role: 'staff', status: 'Revoked', lastActive: '1 day ago' },
    { id: 4, name: 'Diana Prince', email: 'diana@stocknroll.com', role: 'staff', status: 'Approved', lastActive: '5 mins ago' },
    { id: 5, name: 'Eve Carter', email: 'eve@stocknroll.com', role: 'staff', status: 'Pending', lastActive: 'Just now' },
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <ShieldAlert size={16} className="text-purple-600 dark:text-purple-400" />;
      case 'admin': return <ShieldCheck size={16} className="text-indigo-600 dark:text-indigo-400" />;
      default: return <Shield size={16} className="text-slate-500 dark:text-slate-400" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">{getRoleIcon(role)} Super Admin</span>;
      case 'admin': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">{getRoleIcon(role)} Admin</span>;
      default: 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">{getRoleIcon(role)} Staff</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
            Pending
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
            Revoked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage user roles, permissions, and account access.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-500 transition-all active:scale-[0.98]">
          <Users size={16} className="mr-2" />
          Invite User
        </button>
      </div>

      <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm dark:shadow-none overflow-hidden transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] transition-colors">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer appearance-none shadow-sm dark:shadow-none transition-colors">
              <option value="all" className="bg-white dark:bg-[#1b2035]">All Roles</option>
              <option value="super_admin" className="bg-white dark:bg-[#1b2035]">Super Admin</option>
              <option value="admin" className="bg-white dark:bg-[#1b2035]">Admin</option>
              <option value="staff" className="bg-white dark:bg-[#1b2035]">Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 transition-colors">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 dark:from-indigo-500/20 to-purple-50 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-100 dark:border-indigo-500/30 shadow-sm transition-colors">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No users found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
