import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/supabase';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setLoading(false);
        navigate('/dashboard');
      }, 800);
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      console.log('Registered successfully', data);
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold mb-6 lg:hidden">
          SI
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Register to get started with SalesInvent</p>
      </div>

      <form className="space-y-4" onSubmit={handleRegister}>
        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${error ? 'text-red-500' : 'text-slate-700'}`} htmlFor="fullName">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
            placeholder="e.g. John Doe"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 border-slate-200 focus:ring-blue-600/20 focus:border-blue-600`}
            required
          />
        </div>

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
            placeholder="e.g. name@company.com"
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
              placeholder="e.g. ••••••••"
              className={`w-full rounded-xl border bg-white pl-4 pr-10 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'}`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <PasswordStrengthIndicator password={password} />
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${error ? 'text-red-500' : 'text-slate-700'}`} htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="e.g. ••••••••"
            className={`w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/20 focus:border-blue-600'}`}
            required
          />
        </div>

        {error && (
          <div className="text-sm font-medium text-red-500 mt-2">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Registering...
              </>
            ) : (
              'Register'
            )}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">Already have an account? </span>
          <Link to="/" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
