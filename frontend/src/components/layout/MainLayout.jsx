import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import CommandPalette from '../ui/CommandPalette';
import { useGlobalRealtimeSubscription } from '../../hooks/useGlobalRealtimeSubscription';
import { useEffect } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { fetchSuppliers, createSupplier } from '../../features/suppliers/api/suppliersApi';

let isInitializingSupplier = false;
let initializedSupplierKey = null;

const MainLayout = () => {
  const { session, signOut, companyId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  useGlobalRealtimeSubscription();

  const { settings } = useAppSettings();

  useEffect(() => {
    const initInHouseSupplier = async () => {
      const storeName = settings?.storeName;
      if (!storeName || !session?.user) return;
      
      const key = `${companyId || session.user.id}-${storeName}`;
      if (isInitializingSupplier || initializedSupplierKey === key) return;
      
      isInitializingSupplier = true;
      try {
        const suppliers = await fetchSuppliers();
        const exists = suppliers.find(s => s.name === 'In-House Production');
        if (!exists) {
          const userEmail = session.user.email || '';
          const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'In-House Production';

          await createSupplier({
            name: 'In-House Production',
            contact_name: userName,
            email: userEmail,
            phone: null,
            address: null,
            status: 'active'
          });
        }
        initializedSupplierKey = key;
      } catch (err) {
        console.error('Failed to initialize in-house supplier:', err);
      } finally {
        isInitializingSupplier = false;
      }
    };
    initInHouseSupplier();
  }, [settings?.storeName, session?.user]);

  const confirmLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0A0A0B] font-inter text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 overflow-hidden relative transition-colors duration-300">
      <CommandPalette onLogoutClick={() => setShowLogoutModal(true)} />
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="hidden dark:block absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen" />
        <div className="hidden dark:block absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 z-[-1] opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      {/* Main UI Wrapper */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header onLogoutClick={() => setShowLogoutModal(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 lg:p-10 scroll-smooth">
            <div className="max-w-7xl mx-auto min-h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="min-h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      {/* Logout Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {showLogoutModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={() => setShowLogoutModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative w-full max-w-sm bg-white dark:bg-[#12141c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 mx-4 z-10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                    <LogOut size={20} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm logout</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Are you sure you want to log out and end your current session?</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-rose-500/20"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default MainLayout;
