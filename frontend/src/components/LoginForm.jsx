import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    const { data, authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      console.log('Logged in successfully', data);
      setLoading(false);
      // TODO: Handle post-login routing here (e.g., redirect to dashboard)
    }
  };
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        {/* Placeholder Logo */}
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold mb-6 lg:hidden">
          SI
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Log in to your account to continue</p>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${error ? 'text-red-500' : 'text-slate-700'}`} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="name@company.com"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'}`}
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${error ? 'text-red-500' : 'text-slate-700'}`} htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className={`w-full rounded-xl border bg-white pl-4 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'}`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer disabled:opacity-50"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 cursor-pointer">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        {error && (
          <div className="text-sm font-medium text-red-500 mt-2">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Don't have an account? </span>
          <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
