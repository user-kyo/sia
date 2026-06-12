import { useState, useEffect, useRef } from 'react';
import {
  Users, Search, MoreVertical, Shield, ShieldAlert, ShieldCheck,
  CheckCircle, XCircle, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Key, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router';

const getInitials = (str) => {
  if (!str) return '?';
  const letterOnlyStr = str.replace(/[^a-zA-Z\s]/g, '');
  if (!letterOnlyStr.trim()) return '?';
  
  const parts = letterOnlyStr.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => {
  const colors = {
    indigo: {
      bg: 'bg-white dark:bg-[#0A0A0B]',
      border: 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30',
      text: 'text-slate-500 dark:text-slate-400',
      glow: 'from-indigo-500/5 to-purple-500/5',
      iconText: 'text-slate-400 dark:text-slate-600'
    },
    emerald: {
      bg: 'bg-white dark:bg-emerald-500/5',
      border: 'border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'from-emerald-500/5 to-teal-500/5',
      iconText: 'text-emerald-500'
    },
    amber: {
      bg: 'bg-white dark:bg-amber-500/5',
      border: 'border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'from-amber-500/5 to-orange-500/5',
      iconText: 'text-amber-500'
    },
    rose: {
      bg: 'bg-white dark:bg-rose-500/5',
      border: 'border-rose-200 dark:border-rose-500/20 hover:border-rose-400 dark:hover:border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      glow: 'from-rose-500/5 to-pink-500/5',
      iconText: 'text-rose-500'
    }
  };
  const theme = colors[colorClass] || colors.indigo;

  return (
    <div className={`relative h-full w-full rounded-2xl p-5 flex flex-col justify-end group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 shadow-sm overflow-hidden border ${theme.bg} ${theme.border}`}>
      <div className={`absolute -inset-4 bg-gradient-to-br ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg`} />

      <div className={`absolute -top-2 -right-2 p-4 opacity-10 transition-transform duration-500 group-hover:scale-[1.2] group-hover:-rotate-6 ${theme.iconText}`}>
        <Icon size={64} />
      </div>

      <div className={`text-sm font-medium mb-1 relative z-10 ${theme.text}`}>{title}</div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white relative z-10">{value}</div>
    </div>
  );
};

const StatCardSkeleton = () => (
  <div className="relative h-full w-full bg-white dark:bg-[#0A0A0B] rounded-2xl p-5 flex flex-col justify-end border border-slate-200 dark:border-white/10 overflow-hidden min-h-[104px]">
    <div className="absolute -top-2 -right-2 p-4 opacity-5">
      <div className="w-16 h-16 rounded-xl bg-slate-300 dark:bg-white/20 animate-pulse" />
    </div>
    <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md mb-1 relative z-10 animate-pulse" />
    <div className="h-8 w-16 bg-slate-200 dark:bg-white/10 rounded-md relative z-10 animate-pulse" />
  </div>
);

export default function UserManagementPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: '' });
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteRoleDropdownOpen, setIsInviteRoleDropdownOpen] = useState(false);
  const inviteRoleDropdownRef = useRef(null);

  // Custom Dropdown State
  const [roleFilter, setRoleFilter] = useState('all');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  // Sorting and Pagination State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Transfer Ownership State
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferConfirmText, setTransferConfirmText] = useState('');

  const { userRole, user: currentUser, signOut } = useAuth();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast('Failed to load users. Did you run the SQL migration?', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (inviteRoleDropdownRef.current && !inviteRoleDropdownRef.current.contains(e.target)) {
        setIsInviteRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteForm.email) return toast('Email is required', 'error');
    if (!inviteForm.role) return toast('Role is required', 'error');
    
    setIsInviting(true);
    try {
      const res = await api.post('/users/invite', inviteForm);
      setUsers(prev => [res.data, ...prev]);
      toast('Invite sent successfully!', 'success');
      setIsInviteModalOpen(false);
      setInviteForm({ email: '', name: '', role: '' });
    } catch (error) {
      toast(error.response?.data?.detail || 'Failed to send invite', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const updateStatus = async (userId, newStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      toast(`User status updated to ${newStatus}`, 'success');
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      toast(error.response?.data?.detail || 'Failed to update status', 'error');
    }
    setActiveMenuId(null);
  };

  const updateRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast(`User role updated to ${newRole}`, 'success');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      toast(error.response?.data?.detail || 'Failed to update role', 'error');
    }
    setActiveMenuId(null);
  };

  const handleTransferOwnership = async () => {
    if (transferConfirmText !== 'TRANSFER') {
      toast('Please type TRANSFER to confirm.', 'error');
      return;
    }
    try {
      await api.post(`/users/${transferTarget.id}/transfer-ownership`);
      toast('Ownership transferred successfully! Logging out...', 'success');
      setTransferTarget(null);
      setTransferConfirmText('');
      setTimeout(async () => {
        await signOut();
        navigate('/');
      }, 1500);
    } catch (error) {
      toast(error.response?.data?.detail || 'Failed to transfer ownership', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter Data
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user.status || '').toLowerCase() === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort Data
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    if (sortConfig.key === 'name') {
      aVal = (a.name || a.email || '').toLowerCase();
      bVal = (b.name || b.email || '').toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'revoked', label: 'Revoked' }
  ];

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
        return <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">{getRoleIcon(role)} Super Admin</span>;
      case 'admin':
        return <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">{getRoleIcon(role)} Admin</span>;
      default:
        return <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">{getRoleIcon(role)} Staff</span>;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          Approved
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
          Pending
        </span>
      );
    }
    if (s === 'revoked') {
      return (
        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
          Revoked
        </span>
      );
    }
    return null;
  };

  const renderSortableHeader = (label, sortKey, className = "text-center") => (
    <th
      className={`px-6 py-4 font-semibold cursor-pointer select-none group transition-colors hover:bg-slate-100 dark:hover:bg-white/5 ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-left') ? 'justify-start' : 'justify-center'}`}>
        {label}
        <ArrowUpDown
          size={14}
          className={`transition-colors ${sortConfig.key === sortKey ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'}`}
        />
      </div>
    </th>
  );

  const stats = {
    total: users.length,
    approved: users.filter(u => u?.status?.toLowerCase() === 'approved').length,
    pending: users.filter(u => u?.status?.toLowerCase() === 'pending').length,
    revoked: users.filter(u => u?.status?.toLowerCase() === 'revoked').length,
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage user roles, permissions, and account access.</p>
        </div>
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-indigo-500 transition-all active:scale-[0.98]"
        >
          <Users size={16} className="mr-2" />
          Invite User
        </button>
      </div>

      {/* KPI Cards */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="kpi-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </motion.div>
        ) : (
          <motion.div key="kpi-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.total} icon={Users} colorClass="indigo" />
            <StatCard title="Approved" value={stats.approved} icon={CheckCircle} colorClass="emerald" />
            <StatCard title="Pending" value={stats.pending} icon={ShieldAlert} colorClass="amber" />
            <StatCard title="Revoked" value={stats.revoked} icon={XCircle} colorClass="rose" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-visible transition-colors duration-300"
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-white/[0.01] transition-colors rounded-t-2xl">
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

          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto relative">
            <div className="relative w-full sm:w-auto" ref={roleDropdownRef}>
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center justify-between w-full sm:w-48 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <span>{roleOptions.find(o => o.value === roleFilter)?.label || 'All Roles'}</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-full sm:w-48 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setRoleFilter(option.value);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${roleFilter === option.value
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                      >
                        {option.label}
                        {roleFilter === option.value && (
                          <motion.div layoutId="activeIndicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative w-full sm:w-auto" ref={statusDropdownRef}>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between w-full sm:w-40 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-slate-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <span>{statusOptions.find(o => o.value === statusFilter)?.label || 'All Status'}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2 w-full sm:w-40 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setStatusFilter(option.value); setIsStatusDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${statusFilter === option.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                      >
                        {option.label}
                        {statusFilter === option.value && <motion.div layoutId="activeStatusIndicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[780px]">
          <table className="w-full min-w-[800px] text-left text-sm table-fixed">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 transition-colors">
              <tr>
                {renderSortableHeader("User", "name", "text-left w-[20%]")}
                {renderSortableHeader("Email Address", "email", "text-left w-[25%]")}
                {renderSortableHeader("Role", "role", "text-left w-[15%]")}
                {renderSortableHeader("Status", "status", "text-left w-[15%]")}
                {renderSortableHeader("Last Active", "last_active", "text-left w-[15%]")}
                <th className="px-6 py-4 font-semibold text-center select-none w-[10%]">Actions</th>
              </tr>
            </thead>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.tbody
                  key="skeleton-body"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="divide-y divide-slate-100 dark:divide-white/5 transition-colors relative"
                >
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={`skel-${idx}`} className="h-[73px] bg-transparent border-b border-slate-100 dark:border-white/5 last:border-0 opacity-40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10 shrink-0 animate-pulse" />
                          <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-8 bg-slate-200 dark:bg-white/10 rounded-lg mx-auto animate-pulse" /></td>
                    </tr>
                  ))}
                </motion.tbody>
              ) : (
                <motion.tbody
                  key={`data-${currentPage}-${searchQuery}-${roleFilter}-${statusFilter}-${sortConfig.key}-${sortConfig.direction}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="divide-y divide-slate-100 dark:divide-white/5 transition-colors relative"
                >
                  {paginatedUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group relative"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-start gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-50 dark:from-indigo-500/20 to-purple-50 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm border border-indigo-100 dark:border-indigo-500/30 shadow-sm transition-colors tracking-wide">
                            {getInitials(u.name || u.email)}
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[200px]">{u.name || 'Unnamed User'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left text-slate-500 dark:text-slate-400">
                        <div className="truncate max-w-[220px]" title={u.email}>{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {getStatusBadge(u.status)}
                      </td>
                      <td className="px-6 py-4 text-left text-slate-500 dark:text-slate-400 font-medium">
                        {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-center">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === u.id ? null : u.id)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {activeMenuId === u.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1f36] shadow-2xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden"
                                >
                                  <div className="py-1">
                                    <button onClick={() => navigate('/users/' + u.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                      <User size={14} /> View Profile
                                    </button>

                                    {(userRole === 'super_admin' || userRole === 'admin') && u.email !== currentUser?.email && (
                                      <>
                                        <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
                                        {u.status !== 'approved' && (
                                          <button onClick={() => updateStatus(u.id, 'approved')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <CheckCircle size={14} /> Approve Access
                                          </button>
                                        )}
                                        {u.status !== 'revoked' && (
                                          <button onClick={() => updateStatus(u.id, 'revoked')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <XCircle size={14} /> Revoke Access
                                          </button>
                                        )}
                                        
                                        {userRole === 'super_admin' && (
                                          <>
                                            <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
                                            <div className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left">Change Role</div>
                                            {u.role !== 'staff' && (
                                              <button onClick={() => updateRole(u.id, 'staff')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <Shield size={14} /> Make Staff
                                              </button>
                                            )}
                                            {u.role !== 'admin' && (
                                              <button onClick={() => updateRole(u.id, 'admin')} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                <ShieldCheck size={14} /> Make Admin
                                              </button>
                                            )}

                                            {/* Transfer Ownership Button */}
                                            {u.status === 'approved' && (
                                              <>
                                                <div className="h-px bg-slate-100 dark:bg-white/10 my-1"></div>
                                                <button
                                                  onClick={() => { setTransferTarget(u); setActiveMenuId(null); }}
                                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                                >
                                                  <Key size={14} /> Transfer Ownership
                                                </button>
                                              </>
                                            )}
                                          </>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {/* Pad with empty rows to maintain consistent table height */}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedUsers.length) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="h-[73px] bg-transparent pointer-events-none">
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))}
                </motion.tbody>
              )}
            </AnimatePresence>
          </table>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 top-[53px] flex flex-col items-center justify-center pointer-events-none z-10 bg-white/30 dark:bg-[#0A0A0B]/30 backdrop-blur-[1px]"
              >
                <div className="bg-white dark:bg-[#12141c] px-6 py-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                  <p className="font-semibold text-slate-900 dark:text-white">Loading users...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fetching data from the server</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State Overlay */}
          {!isLoading && paginatedUsers.length === 0 && (
            <div className="absolute inset-0 top-[53px] flex flex-col items-center justify-center pointer-events-none">
              <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg font-medium text-slate-900 dark:text-white">No users found</p>
              <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>



        {/* Pagination UI */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0A0A0B] rounded-b-2xl">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {sortedUsers.length === 0 ? (
              'No results found'
            ) : sortedUsers.length === 1 ? (
              'Showing 1 result'
            ) : totalPages === 1 ? (
              <>Showing all <span className="font-medium text-slate-900 dark:text-white">{sortedUsers.length}</span> results</>
            ) : (
              <>Showing <span className="font-medium text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> of <span className="font-medium text-slate-900 dark:text-white">{sortedUsers.length}</span> results</>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${currentPage === idx + 1
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transfer Ownership Confirmation Modal */}
      <AnimatePresence>
        {transferTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => { setTransferTarget(null); setTransferConfirmText(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
                  <Key size={24} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Ownership</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This is a highly sensitive action.</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                  You are about to transfer <strong>Super Admin</strong> privileges to <strong>{transferTarget.name}</strong> ({transferTarget.email}).
                  You will be demoted to an Admin and logged out automatically.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type <span className="font-bold text-slate-900 dark:text-white select-all">TRANSFER</span> to confirm
                </label>
                <input
                  type="text"
                  value={transferConfirmText}
                  onChange={(e) => setTransferConfirmText(e.target.value)}
                  placeholder="TRANSFER"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm dark:shadow-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setTransferTarget(null); setTransferConfirmText(''); }}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferOwnership}
                  disabled={transferConfirmText !== 'TRANSFER'}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
                >
                  Confirm Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite User Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsInviteModalOpen(false); setInviteForm({ email: '', name: '', role: '' }); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite New User</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Send an email invitation to join.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInviteUser} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="e.g. employee@company.com"
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={inviteForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const capitalized = val.replace(/\b\w/g, char => char.toUpperCase());
                      setInviteForm({ ...inviteForm, name: capitalized });
                    }}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">System Role <span className="text-rose-500">*</span></label>
                  <div className="relative w-full" ref={inviteRoleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsInviteRoleDropdownOpen(!isInviteRoleDropdownOpen)}
                      className="flex items-center justify-between w-full px-4 py-2.5 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                    >
                      <span className={inviteForm.role ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
                        {inviteForm.role === 'staff' ? 'Staff' : inviteForm.role === 'admin' ? 'Admin' : 'Select role'}
                      </span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isInviteRoleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isInviteRoleDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => { setInviteForm({ ...inviteForm, role: 'staff' }); setIsInviteRoleDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 ${inviteForm.role === 'staff' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                          >
                            Staff
                            {inviteForm.role === 'staff' && <motion.div layoutId="inviteRoleIndicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                          </button>
                          
                          {userRole === 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => { setInviteForm({ ...inviteForm, role: 'admin' }); setIsInviteRoleDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 ${inviteForm.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                            >
                              Admin
                              {inviteForm.role === 'admin' && <motion.div layoutId="inviteRoleIndicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsInviteModalOpen(false); setInviteForm({ email: '', name: '', role: '' }); }}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isInviting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
