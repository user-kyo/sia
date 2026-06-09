import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import RoleProtectedRoute from './components/layout/RoleProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import InventoryPage from './pages/InventoryPage';
import POSPage from './pages/POSPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UserManagementPage from './pages/UserManagementPage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          {/* Inventory and POS are accessible to all roles */}
          <Route element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']} />}>
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<POSPage />} />
          </Route>
          
          {/* Dashboard and Reports accessible to admin and super_admin */}
          <Route element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
            <Route path="/dashboard" element={<AnalyticsDashboard />} />
            <Route path="/reports" element={<AuditLogsPage />} />
          </Route>

          {/* User Management accessible only to super_admin */}
          <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
