import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Clock, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleProtectedRoute({ allowedRoles }) {
  const { user, userRole, userStatus, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isMocked = !import.meta.env.VITE_SUPABASE_URL;

  if (!user && !isMocked) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (userStatus && userStatus !== 'approved') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center z-10"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-6">
            {userStatus === 'pending' ? (
              <Clock className="h-8 w-8 text-amber-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-rose-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {userStatus === 'pending' ? 'Approval Pending' : 'Access Revoked'}
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {userStatus === 'pending' 
              ? "Your account has been created but is waiting for an administrator's approval before you can access the system. Please check back later."
              : "Your access to this system has been revoked by an administrator. Please contact support if you believe this is a mistake."}
          </p>
          <button 
            onClick={signOut}
            className="w-full inline-flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </motion.div>
      </div>
    );
  }

  // If mocked and no userRole set (for local dev testing), we allow access
  if (isMocked && !userRole && allowedRoles.includes('staff')) {
    return <Outlet />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    // If user is logged in but doesn't have permission for this route,
    // redirect them to a route they DO have permission for.
    if (userRole === 'staff') {
      return <Navigate to="/inventory" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
