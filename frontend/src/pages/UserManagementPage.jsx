import React, { useState } from 'react';
import { Users, Search, MoreVertical, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mocked user data for demonstration purposes
  const mockUsers = [
    { id: 1, name: 'Alice Cooper', email: 'alice@salesinvent.com', role: 'super_admin', status: 'Approved', lastActive: '2 mins ago' },
    { id: 2, name: 'Bob Smith', email: 'bob@salesinvent.com', role: 'admin', status: 'Approved', lastActive: '1 hour ago' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@salesinvent.com', role: 'staff', status: 'Revoked', lastActive: '1 day ago' },
    { id: 4, name: 'Diana Prince', email: 'diana@salesinvent.com', role: 'staff', status: 'Approved', lastActive: '5 mins ago' },
    { id: 5, name: 'Eve Carter', email: 'eve@salesinvent.com', role: 'staff', status: 'Pending', lastActive: 'Just now' },
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <ShieldAlert size={16} className="text-purple-600" />;
      case 'admin': return <ShieldCheck size={16} className="text-indigo-600" />;
      default: return <Shield size={16} className="text-slate-400" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">{getRoleIcon(role)} Super Admin</span>;
      case 'admin': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{getRoleIcon(role)} Admin</span>;
      default: 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">{getRoleIcon(role)} Staff</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Revoked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user roles, permissions, and account access.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]">
          <Users size={16} className="mr-2" />
          Invite User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200/50">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-slate-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {user.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
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
