import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/Toast';

export default function ForgotPasswordForm({ onToggle }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (countdownTimer > 0) {
      const timerId = setTimeout(() => setCountdownTimer(countdownTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdownTimer]);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorField(null);
    setSuccess(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast("Please enter a valid email address.", 'error');
      setErrorField("email");
      setLoading(false);
      return;
    }

    // For demonstration purposes, check against known mock users to demonstrate the UX for different account states.
    // (In a real app, this would be an RPC call to check the user's status safely).
    const MOCK_USERS = [
      { email: 'super_admin@stocknroll.com', status: 'Approved' },
      { email: 'admin@stocknroll.com', status: 'Approved' },
      { email: 'staff@stocknroll.com', status: 'Approved' },
      { email: 'alice@stocknroll.com', status: 'Approved' },
      { email: 'bob@stocknroll.com', status: 'Approved' },
      { email: 'charlie@stocknroll.com', status: 'Revoked' }, // Disabled
      { email: 'diana@stocknroll.com', status: 'Approved' },
      { email: 'eve@stocknroll.com', status: 'Pending' }
    ];

    const mockUser = MOCK_USERS.find(u => u.email === email.toLowerCase());

    if (mockUser) {
      if (mockUser.status === 'Pending') {
        toast("Your account is still pending approval by an administrator.", 'warning');
        setErrorField("email");
        setLoading(false);
        return;
      }
      if (mockUser.status === 'Revoked') {
        toast("Your account has been disabled. Please contact support.", 'error');
        setErrorField("email");
        setLoading(false);
        return;
      }
    } else if (!import.meta.env.VITE_SUPABASE_URL) {
      // If we are fully mocked and the user was not found
      setTimeout(() => {
        setLoading(false);
        toast(
          <span className="flex flex-col gap-1">
            <span>No account found with this email.</span>
            <button type="button" onClick={() => onToggle('register')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
              Create an account
            </button>
          </span>,
          'error'
        );
        setErrorField("email");
      }, 800);
      return;
    } else {
      // Real Supabase environment: Strict check using RPC
      try {
        const { data: exists, error: rpcError } = await supabase.rpc('check_user_exists', { 
          lookup_email: email.toLowerCase() 
        });
        
        // If the RPC is successfully called and returns false, the user does not exist
        if (!rpcError && exists === false) {
          toast(
            <span className="flex flex-col gap-1">
              <span>No account found with this email.</span>
              <button type="button" onClick={() => onToggle('register')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
                Create an account
              </button>
            </span>,
            'error'
          );
          setErrorField("email");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("RPC check_user_exists failed or not set up yet. Falling back to default Supabase behavior.", err);
      }
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setSuccess(true);
        setCountdownTimer(60);
        setLoading(false);
      }, 800);
      return;
    }

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      const isNotFound = authError.message.toLowerCase().includes('not found');
      if (isNotFound) {
        toast(
          <span className="flex flex-col gap-1">
            <span>No account found with this email.</span>
            <button type="button" onClick={() => onToggle('register')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
              Create an account
            </button>
          </span>,
          'error'
        );
      } else {
        toast(authError.message, 'error');
      }
      setErrorField("email");
      setLoading(false);
    } else {
      setSuccess(true);
      setCountdownTimer(60);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center lg:text-left">
        <button 
          onClick={() => onToggle('login')}
          className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 group bg-transparent border-none p-0 cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
          Back to login
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reset password</h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-3">Enter your email and we'll send you a reset link</p>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-xl p-5 text-sm font-medium shadow-sm mb-6">
          Check your email for a link to reset your password. This link will expire in 15 minutes. If it doesn't appear within a few minutes, check your spam folder.
        </div>
      )}

      <form className="space-y-6" onSubmit={handleReset}>
          <div className="space-y-2.5 relative group/input">
            <label className={`block text-sm font-semibold ${errorField === 'email' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="email">
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
                className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${errorField === 'email' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || countdownTimer > 0}
              className="group relative w-full flex justify-center items-center rounded-xl bg-slate-900 dark:bg-indigo-600 overflow-hidden px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : countdownTimer > 0 ? (
                <span className="flex items-center gap-2 relative z-10">
                  Resend link in {countdownTimer}s
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  {success ? "Resend reset link" : "Send reset link"}
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </div>
        </form>
    </div>
  );
}
