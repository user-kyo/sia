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
    // If they somehow get here (e.g. direct navigation), send them back to AuthPage
    // AuthPage will handle showing the proper modal and blocking access
    return <Navigate to="/" replace />;
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
