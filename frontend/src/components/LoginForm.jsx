import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/supabase';

export default function LoginForm({ onToggle }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    const savedEmail = localStorage.getItem('sia_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple email persistence if remember me is checked
    if (rememberMe) {
      localStorage.setItem('sia_saved_email', email);
    } else {
      localStorage.removeItem('sia_saved_email');
    }

    // Mock login if using placeholder Supabase URL (no .env file)
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setLoading(false);
        const MOCK_USERS = {
          'super_admin@stocknroll.com': 'password123',
          'admin@stocknroll.com': 'password123',
          'staff@stocknroll.com': 'password123',
        };
        
        if (!MOCK_USERS[email.toLowerCase()]) {
          setError("Account does not exist. Please check your email or register.");
          return;
        }
        
        if (password !== MOCK_USERS[email.toLowerCase()] && password !== '123456') {
          setError("Invalid password. Please try again.");
          setFailedAttempts(prev => prev + 1);
          return;
        }

        setFailedAttempts(0);
        navigate('/dashboard');
      }, 800);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const isInvalid = authError.message.toLowerCase().includes('invalid login credentials');
      setError(isInvalid ? "Invalid email or password. Please try again." : authError.message);
      setFailedAttempts(prev => prev + 1);
      setLoading(false);
    } else {
      console.log('Logged in successfully', data);
      setFailedAttempts(0);
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center lg:text-left">
        {/* Mobile Logo */}
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6 lg:hidden">
          SR
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-3">Log in to your account to continue</p>
      </div>

      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-1.5">
          <label className={`block text-sm font-semibold ${error ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="e.g. name@company.com"
            className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-600/10 focus:border-indigo-600 dark:focus:border-indigo-500 hover:border-slate-300 dark:hover:border-white/20'}`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={`block text-sm font-semibold ${error ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="password">
            Password
          </label>
          <div className="relative group">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter password"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-4 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] tracking-widest placeholder:tracking-normal ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-600/10 focus:border-indigo-600 dark:focus:border-indigo-500 hover:border-slate-300 dark:hover:border-white/20'}`}
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
          <div className="flex items-center group">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-50 transition-all"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
              Remember me
            </label>
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

        {error && (
          <div className="text-sm font-medium text-rose-500 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">⚠️</div>
              <div>{error}</div>
            </div>
            {failedAttempts >= 3 && (
              <button 
                type="button" 
                onClick={() => onToggle('forgot_password')}
                className="text-left ml-6 text-rose-600 font-semibold hover:text-rose-700 hover:underline transition-colors"
              >
                Too many failed attempts. Forgot your password?
              </button>
            )}
          </div>
        )}

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
                Signing in...
              </>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Sign in
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-[#0A0A0B] px-4 text-slate-400 dark:text-slate-500 font-medium transition-colors duration-300">Or continue with</span>
          </div>
        </div>

        <div className="mt-8 text-center text-sm font-medium">
          <span className="text-slate-500 dark:text-slate-400">Don't have an account? </span>
          <button 
            type="button"
            onClick={() => onToggle('register')} 
            className="text-indigo-600 hover:text-indigo-500 transition-colors font-semibold bg-transparent border-none p-0 cursor-pointer"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
