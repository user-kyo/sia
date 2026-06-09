import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReset = async (e) => {
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
        navigate('/');
      }, 800);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      password: password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      console.log('Password reset successfully');
      setLoading(false);
      navigate('/');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create new password</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">Your new password must be different from previous used passwords.</p>
      </div>

      <form className="space-y-4" onSubmit={handleReset}>
        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${error ? 'text-red-500' : 'text-slate-700'}`} htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter password"
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
            placeholder="Enter password"
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
