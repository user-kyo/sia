import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import MainLayout from './components/layout/MainLayout';
import AnalyticsDashboard from './features/dashboard/AnalyticsDashboard';
import InventoryPage from './features/inventory/InventoryPage';
import POSPage from './features/sales/POSPage';
import AuditLogsPage from './features/reports/AuditLogsPage';
import LoginPage from './features/auth/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Protected Routes (Static for now) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<AnalyticsDashboard />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/sales" element={<POSPage />} />
          <Route path="/reports" element={<AuditLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
