import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import RoleProtectedRoute from './components/layout/RoleProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import InventoryPage from './pages/InventoryPage';
import POSPage from './pages/POSPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <AppSettingsProvider>
          <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/forgot-password" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route element={<MainLayout />}>
                  <Route element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']} />}>
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/sales" element={<POSPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>

                  <Route element={<RoleProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                    <Route path="/dashboard" element={<AnalyticsDashboard />} />
                    <Route path="/data-reports" element={<ReportsPage />} />
                    <Route path="/reports" element={<AuditLogsPage />} />
                  </Route>

                  <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/users/:id" element={<UserProfilePage />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
          </NotificationProvider>
          </AppSettingsProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
