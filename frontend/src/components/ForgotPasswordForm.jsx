import React, { useState } from 'react';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordForm({ onToggle }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 800);
      return;
    }

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      const isNotFound = authError.message.toLowerCase().includes('not found');
      if (isNotFound) {
        setError(
          <span className="flex flex-col gap-1">
            <span>No account found with this email.</span>
            <button type="button" onClick={() => onToggle('register')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
              Create an account
            </button>
          </span>
        );
      } else {
        setError(authError.message);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center lg:text-left">
        <button 
          onClick={() => onToggle('login')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 group bg-transparent border-none p-0 cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
          Back to login
        </button>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Reset password</h2>
        <p className="text-base font-medium text-slate-500 mt-3">Enter your email and we'll send you a reset link</p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-5 text-sm font-medium shadow-sm">
          Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleReset}>
          <div className="space-y-1.5">
            <label className={`block text-sm font-semibold ${error ? 'text-rose-500' : 'text-slate-700'}`} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="e.g. name@company.com"
              className={`w-full rounded-xl border bg-slate-50/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 focus:ring-indigo-600/10 focus:border-indigo-600 hover:border-slate-300'}`}
              required
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-rose-500 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex items-start gap-2">
              <div className="mt-0.5">⚠️</div>
              <div>{error}</div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center rounded-xl bg-slate-900 overflow-hidden px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <span className="flex items-center gap-2 relative z-10">
                  Send reset link
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
