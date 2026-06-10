import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, ShieldAlert, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginForm({ onToggle }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState(null); // 'Pending' | 'Revoked'
  const [notifying, setNotifying] = useState(false);
  const [adminNotified, setAdminNotified] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const savedEmail = localStorage.getItem('sia_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleNotifyAdmin = () => {
    setNotifying(true);
    setTimeout(() => {
      setNotifying(false);
      setAdminNotified(true);
      toast(<div className="font-medium text-emerald-500">Administrator has been notified. We will review your account status shortly.</div>);
    }, 1500);
  };

  const closeModal = () => {
    setShowModal(false);
    // Reset states after animation
    setTimeout(() => {
      setAdminNotified(false);
    }, 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorField(null);

    if (rememberMe) {
      localStorage.setItem('sia_saved_email', email);
    } else {
      localStorage.removeItem('sia_saved_email');
    }

    // Mock logic
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setLoading(false);
        const MOCK_USERS = {
          'super_admin@stocknroll.com': 'password123',
          'admin@stocknroll.com': 'password123',
          'staff@stocknroll.com': 'password123',
          'eve@stocknroll.com': 'password123',    // Mock revoked
          'charlie@stocknroll.com': 'password123' // Mock pending
        };
        
        if (!MOCK_USERS[email.toLowerCase()]) {
          setErrorField('email');
          toast(<div className="font-medium">Account does not exist. Please check your email or register.</div>, 'error');
          return;
        }
        
        if (password !== MOCK_USERS[email.toLowerCase()] && password !== '123456') {
          setErrorField('password');
          toast(<div className="font-medium">Invalid password. Please try again.</div>, 'error');
          setFailedAttempts(prev => prev + 1);
          return;
        }

        // Mock statuses
        if (email.toLowerCase() === 'eve@stocknroll.com') {
          setModalStatus('Revoked');
          setShowModal(true);
          return;
        }
        if (email.toLowerCase() === 'charlie@stocknroll.com') {
          setModalStatus('Pending');
          setShowModal(true);
          return;
        }

        setFailedAttempts(0);
        navigate('/dashboard');
      }, 800);
      return;
    }

    // Supabase logic
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const isInvalid = authError.message.toLowerCase().includes('invalid login credentials');
      setErrorField('both');
      const newAttempts = failedAttempts + 1;

      toast(
        <div className="flex flex-col gap-2">
          <div>{isInvalid ? "Invalid email or password. Please try again." : authError.message}</div>
          {newAttempts >= 3 && (
            <button
              type="button"
              onClick={() => onToggle('forgot_password')}
              className="text-left font-semibold underline hover:text-rose-700 w-fit transition-colors"
            >
              Too many failed attempts. Forgot your password?
            </button>
          )}
        </div>,
        'error'
      );
      
      setFailedAttempts(newAttempts);
      setLoading(false);
    } else {
      // Check custom status
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', data.user.id)
        .single();

      const realStatus = profile?.status || 'active';

      if (realStatus !== 'active') {
        setModalStatus(realStatus === 'pending' ? 'Pending' : 'Revoked');
        setShowModal(true);
        setLoading(false);
        return;
      }

      setFailedAttempts(0);
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <>
    <div className="w-full max-w-[400px] relative">
      <div className="mb-10 text-center lg:text-left">
        {/* Mobile Logo */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6 lg:hidden">
          SR
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-3">Log in to your account to continue</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'email' || errorField === 'both' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="email">
            Email address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors duration-300">
              <Mail size={18} />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="e.g. name@company.com"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${errorField === 'email' || errorField === 'both' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
              required
            />
          </div>
        </div>

        <div className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'password' || errorField === 'both' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="password">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors duration-300">
              <Lock size={18} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter password"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] tracking-widest placeholder:tracking-normal ${errorField === 'password' || errorField === 'both' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div
            className="flex items-center group cursor-pointer"
            onClick={() => !loading && setRememberMe(!rememberMe)}
          >
            <div className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${rememberMe ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${rememberMe ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="ml-3 block text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors select-none">
              Remember me
            </span>
          </div>
          <div className="text-sm">
            <button
              type="button"
              onClick={() => onToggle('forgot_password')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center rounded-xl bg-slate-900 dark:bg-indigo-600 overflow-hidden px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Login
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <span className="text-slate-500 dark:text-slate-400">Don't have an account? </span>
        <button
          type="button"
          onClick={() => onToggle('register')}
          className="text-indigo-600 hover:text-indigo-500 transition-colors font-semibold bg-transparent border-none p-0 cursor-pointer"
        >
          Register
        </button>
      </div>
    </div>

    {/* Account Status Modal */}
    <AnimatePresence>
      {showModal && (
        <motion.div 
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
          className="absolute -inset-6 z-50 flex items-center justify-center p-6 bg-slate-900/90 dark:bg-[#050505]/95 rounded-[2rem] border border-white/10 shadow-2xl"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="relative w-full h-full flex flex-col items-center justify-center text-center z-10 px-8 sm:px-12"
          >

            {/* Subtle background glow attached to the content */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-30 dark:opacity-40 blur-[60px] pointer-events-none ${modalStatus === 'Revoked' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />

            {/* Icon Container with multi-layered glow */}
            <div className="relative mb-6">
              <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${modalStatus === 'Revoked' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
              <div className={`relative h-20 w-20 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0B] shadow-xl ${modalStatus === 'Revoked'
                ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                }`}>
                {modalStatus === 'Revoked' ? <ShieldAlert size={36} strokeWidth={2.5} /> : <Clock size={36} strokeWidth={2.5} />}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              {modalStatus === 'Revoked' ? 'Account Disabled' : 'Account Pending'}
            </h3>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
              {modalStatus === 'Revoked'
                ? "Your access to Stock & Roll has been temporarily revoked."
                : "Your account is awaiting administrator approval."}
            </p>

            <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-4 w-full border border-slate-100 dark:border-white/5 mb-8">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {modalStatus === 'Revoked'
                  ? "This usually happens due to security concerns or a violation of our terms of service. Please contact your system administrator to restore access."
                  : "You will receive an email notification as soon as your account is fully activated. Thank you for your patience."
                }
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-auto pt-6">
              <button
                onClick={handleNotifyAdmin}
                disabled={notifying || adminNotified}
                className={`group relative w-full flex justify-center items-center rounded-xl overflow-hidden px-4 py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 border-none ${adminNotified
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] cursor-pointer'
                  }`}
              >
                {!adminNotified && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}

                {notifying ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Notifying...
                  </>
                ) : adminNotified ? (
                  "Administrator Notified"
                ) : (
                  <span className="relative z-10">Notify Administrator</span>
                )}
              </button>

              <button
                onClick={closeModal}
                className="w-full flex justify-center items-center rounded-xl bg-transparent border border-slate-300 dark:border-white/20 px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30 transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">Return to Login</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
