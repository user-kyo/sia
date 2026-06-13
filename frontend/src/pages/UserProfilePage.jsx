import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, User, Mail, Shield, CheckCircle, Clock, 
  Activity, ShieldAlert, Key, Smartphone, Globe, Edit, Ban, RefreshCcw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

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

const ProfileStatCard = ({ title, value, subtext, icon: Icon, colorClass }) => {
  const colors = {
    indigo: {
      bg: 'bg-white dark:bg-[#1a1f36]',
      border: 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30',
      iconText: 'text-indigo-500 dark:text-indigo-400',
      glow: 'from-indigo-500/5 to-purple-500/5',
      bgGlow: 'dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]'
    },
    emerald: {
      bg: 'bg-white dark:bg-[#1a1f36]',
      border: 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30',
      iconText: 'text-emerald-500 dark:text-emerald-400',
      glow: 'from-emerald-500/5 to-teal-500/5',
      bgGlow: 'dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
    },
    purple: {
      bg: 'bg-white dark:bg-[#1a1f36]',
      border: 'border-slate-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/30',
      iconText: 'text-purple-500 dark:text-purple-400',
      glow: 'from-purple-500/5 to-pink-500/5',
      bgGlow: 'dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]'
    },
    amber: {
      bg: 'bg-white dark:bg-[#1a1f36]',
      border: 'border-slate-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30',
      iconText: 'text-amber-500 dark:text-amber-400',
      glow: 'from-amber-500/5 to-orange-500/5',
      bgGlow: 'dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]'
    }
  };
  const theme = colors[colorClass] || colors.indigo;

  return (
    <div className={`relative h-full w-full rounded-2xl p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300 shadow-sm overflow-hidden border ${theme.bg} ${theme.border} ${theme.bgGlow}`}>
      <div className={`absolute -inset-4 bg-gradient-to-br ${theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-lg`} />

      <div className={`absolute -top-2 -right-2 p-4 opacity-5 dark:opacity-10 transition-transform duration-500 group-hover:scale-[1.2] group-hover:-rotate-6 ${theme.iconText}`}>
        <Icon size={100} strokeWidth={1} />
      </div>

      <div className={`flex items-center gap-3 mb-2 relative z-10 ${theme.iconText}`}>
        <Icon size={20} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white truncate relative z-10 capitalize">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate relative z-10">{subtext}</p>
    </div>
  );
};

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user: currentUser, userRole } = useAuth();
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ role: '', status: '' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/users/${id}`);
      setUser(res.data);
    } catch {
      toast.error('Failed to load user profile');
      navigate('/users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${user.email}`);
    } catch (error) {
      toast.error(error.message || 'Failed to send password reset');
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = user.status === 'revoked' ? 'approved' : 'revoked';
    try {
      const res = await api.put(`/users/${id}/status`, { status: newStatus });
      setUser(res.data);
      toast.success(`User access has been ${newStatus}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const openEditModal = () => {
    setEditForm({ role: user.role, status: user.status });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      let updatedUser = { ...user };
      
      if (editForm.status && editForm.status !== user.status) {
        const res = await api.put(`/users/${id}/status`, { status: editForm.status });
        updatedUser = res.data;
      }
      
      if (editForm.role && editForm.role !== user.role && userRole === 'super_admin') {
        const res = await api.put(`/users/${id}/role`, { role: editForm.role });
        updatedUser = res.data;
      }
      
      setUser(updatedUser);
      toast.success('User information updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
      staff: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/20'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${badges[role] || badges.staff}`}>
        {role?.replace('_', ' ') || 'STAFF'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
      revoked: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${badges[status] || badges.pending}`}>
        {status || 'UNKNOWN'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-slate-200 dark:bg-white/10 rounded-xl animate-shimmer"></div>
          <div className="w-48 h-8 bg-slate-200 dark:bg-white/10 rounded-lg animate-shimmer"></div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-1/4 shrink-0 h-96 bg-slate-200 dark:bg-white/5 rounded-3xl animate-shimmer"></div>
          {/* Canvas Skeleton */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-white/5 rounded-2xl animate-shimmer"></div>)}
            </div>
            <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-3xl animate-shimmer"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activities = [
    {
      id: 1,
      title: "Logged into System",
      time: user.last_active ? new Date(user.last_active).toLocaleString() : 'No recent login',
      active: true
    },
    {
      id: 2,
      title: "Updated Profile Information",
      time: "No recent updates",
      active: false
    },
    {
      id: 3,
      title: "Account Created",
      time: "System default creation date",
      active: false
    },
    {
      id: 4,
      title: "Password Changed",
      time: "No recent updates",
      active: false
    },
    {
      id: 5,
      title: "Role Updated",
      time: "No recent updates",
      active: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Header / Nav */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Profile</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT SIDEBAR: Identity & Actions */}
        <div className="w-full lg:w-1/4 lg:max-w-xs shrink-0 flex flex-col gap-6 lg:sticky lg:top-8">
          <div className="bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            
            <div className="h-28 w-28 shrink-0 rounded-full bg-white dark:bg-[#1a1f36] p-2 shadow-xl relative z-10 mb-4 border-4 border-slate-50 dark:border-white/5">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-50 dark:from-indigo-500/20 to-purple-50 dark:to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-3xl font-bold tracking-wide">
                {getInitials(user.name || user.email)}
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white truncate w-full">{user.name || 'Unnamed User'}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-slate-500 dark:text-slate-400 w-full">
              <Mail size={14} className="shrink-0" />
              <p className="text-sm truncate font-medium">{user.email}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {getRoleBadge(user.role)}
              {getStatusBadge(user.status)}
            </div>

            <div className="w-full h-px bg-slate-200 dark:bg-white/10 my-8"></div>

            <div className="w-full flex flex-col gap-3">
              <button onClick={openEditModal} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/20 active:scale-[0.98]">
                <Edit size={18} />
                Edit Information
              </button>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => window.location.href = `mailto:${user.email}`} className="flex items-center justify-center p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl transition-colors tooltip-trigger" title="Message">
                  <Mail size={18} />
                </button>
                <button onClick={handleResetPassword} className="flex items-center justify-center p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl transition-colors tooltip-trigger" title="Reset Password">
                  <Key size={18} />
                </button>
                {(userRole === 'admin' || userRole === 'super_admin') && user.id !== currentUser?.id ? (
                  <button 
                    onClick={handleToggleStatus} 
                    className={`flex items-center justify-center p-3 rounded-xl transition-colors tooltip-trigger ${user.status === 'revoked' ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`} 
                    title={user.status === 'revoked' ? 'Restore User' : 'Suspend User'}
                  >
                    {user.status === 'revoked' ? <RefreshCcw size={18} /> : <Ban size={18} />}
                  </button>
                ) : (
                  <button disabled className="flex items-center justify-center p-3 bg-slate-50/50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-600 rounded-xl cursor-not-allowed" title="Not authorized">
                    <Ban size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CANVAS */}
        <div className="flex-1 flex flex-col gap-8 min-w-0 w-full">
          
          {/* Stat Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <ProfileStatCard 
              title="Last Active"
              value={user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
              subtext={user.last_active ? new Date(user.last_active).toLocaleTimeString() : 'No recent login'}
              icon={Clock}
              colorClass="indigo"
            />
            <ProfileStatCard 
              title="Account Standing"
              value={user.status === 'revoked' ? 'Suspended' : user.status === 'pending' ? 'Pending' : 'Good'}
              subtext={user.status === 'revoked' ? 'Account access revoked' : user.status === 'pending' ? 'Awaiting approval' : 'No security alerts or flags'}
              icon={user.status === 'revoked' ? Ban : Activity}
              colorClass={user.status === 'revoked' ? 'amber' : user.status === 'pending' ? 'amber' : 'emerald'}
            />
            <ProfileStatCard 
              title="Access Level"
              value={user.role?.replace('_', ' ') || 'Staff'}
              subtext="Based on assigned role"
              icon={Shield}
              colorClass="purple"
            />
            <ProfileStatCard 
              title="Account Type"
              value="Internal"
              subtext="Corporate member"
              icon={User}
              colorClass="amber"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-8 border-b border-slate-200 dark:border-white/10 px-2 mt-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
              Activity Log
            </button>
          </div>

          {/* Tab Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 gap-6"
                >
                  {/* Security Score Card */}
                  <div className="bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden relative group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={20} className="text-emerald-500 dark:text-emerald-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Score</h3>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-md shadow-sm">ATTENTION</span>
                    </div>
                    
                    <div className="p-8 flex flex-col md:flex-row gap-10 items-center">
                      
                      {/* Circular Progress */}
                      <div className="relative h-40 w-40 shrink-0">
                        <svg className="h-full w-full -rotate-90 transform drop-shadow-xl" viewBox="0 0 100 100">
                          <circle className="text-slate-100 dark:text-white/5 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                          <circle className="text-amber-500 stroke-current drop-shadow-md" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.66)}></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">66%</span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Score</span>
                        </div>
                      </div>

                      {/* Security Items List */}
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm">
                              <Key size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Password Authentication</h4>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Enabled via Email</p>
                            </div>
                          </div>
                          <CheckCircle size={24} className="text-emerald-500" />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shadow-sm">
                              <Smartphone size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Auth</h4>
                              <p className="text-xs font-medium text-amber-700/70 dark:text-amber-400/70 mt-0.5">Not Configured</p>
                            </div>
                          </div>
                          <button onClick={() => toast.info('Enable 2FA coming soon')} className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors shadow-md shadow-amber-500/20 active:scale-[0.98]">
                            Enable 2FA
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-xl shadow-sm">
                              <Globe size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent IP Address</h4>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">Hidden for privacy</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div 
                  key="activity" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden relative group hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <Activity size={20} className="text-indigo-500 dark:text-indigo-400" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Full Activity History</h3>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="relative border-l-2 border-slate-100 dark:border-white/10 ml-3 pb-4">
                        {activities.map((activity) => (
                          <div key={activity.id} className={`relative mb-10 last:mb-0 ${activity.active ? '' : 'opacity-60'}`}>
                            <div className={`absolute -left-[1.35rem] top-0 h-4 w-4 rounded-full border-4 border-white dark:border-[#1a1f36] ${activity.active ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600 shadow-sm'}`}></div>
                            <div className="pl-8">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">{activity.title}</h4>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Information</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input type="text" value={user.name} disabled className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                  <p className="text-[11px] text-slate-400 mt-1">Name can only be changed by the user.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input type="text" value={user.email} disabled className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">System Role</label>
                    <select 
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      disabled={userRole !== 'super_admin'}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Account Status</label>
                    <select 
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                      className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 bg-slate-50 dark:bg-white/[0.02]">
                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
