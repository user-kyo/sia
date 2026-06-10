import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, ChevronDown, Check, User, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useNavigate } from 'react-router';
import { useToast } from './ui/Toast';

export default function RegisterForm({ onToggle }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const toast = useToast();

  const roleOptions = [
    { id: 'staff', label: 'Staff' },
    { id: 'admin', label: 'Admin' }
  ];

  const handleNameChange = (e) => {
    const value = e.target.value;
    const capitalized = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setFullName(capitalized);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorField(null);

    if (!role) {
      toast("Please select a role.", 'error');
      setErrorField("role");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match.", 'error');
      setErrorField("password");
      setLoading(false);
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setTimeout(() => {
        setLoading(false);
        const MOCK_EMAILS = ['super_admin@stocknroll.com', 'admin@stocknroll.com', 'staff@stocknroll.com'];
        const MOCK_NAMES = ['super admin', 'admin user', 'staff user', 'alice cooper', 'bob smith', 'charlie davis', 'diana prince', 'eve carter'];

        if (MOCK_NAMES.includes(fullName.toLowerCase())) {
          toast("An account with this name already exists.", 'error');
          setErrorField("fullName");
          return;
        }

        if (MOCK_EMAILS.includes(email.toLowerCase())) {
          toast(
            <span className="flex flex-col gap-1">
              <span>This email is already registered.</span>
              <button type="button" onClick={() => onToggle('login')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
                Return to Login
              </button>
            </span>,
            'error'
          );
          setErrorField("email");
          return;
        }

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
          role: role,
          status: 'pending',
        }
      }
    });

    if (authError) {
      const isAlreadyRegistered = authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already exists');
      if (isAlreadyRegistered) {
        toast(
          <span className="flex flex-col gap-1">
            <span>This email is already registered.</span>
            <button type="button" onClick={() => onToggle('login')} className="text-left font-bold underline hover:text-rose-700 w-fit transition-colors">
              Return to Login
            </button>
          </span>,
          'error'
        );
        setErrorField("email");
      } else {
        toast(authError.message, 'error');
        if (authError.message.toLowerCase().includes('password')) setErrorField("password");
      }
      setLoading(false);
    } else {
      console.log('Registered successfully', data);
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 text-center lg:text-left">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6 lg:hidden">
          SR
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Register</h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-3">Register to get started with Stock & Roll</p>
      </div>

      <form className="space-y-6" onSubmit={handleRegister}>
        <div className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'fullName' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="fullName">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors duration-300">
              <User size={18} />
            </div>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={handleNameChange}
              disabled={loading}
              placeholder="e.g. John Doe"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${errorField === 'fullName' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
              required
            />
          </div>
        </div>

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

        <div className="space-y-2.5 relative z-20">
          <label className={`block text-sm font-semibold ${errorField === 'role' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Role <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleOpen(!isRoleOpen)}
              disabled={loading}
              className={`w-full flex items-center justify-between rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] ${errorField === 'role' ? 'border-rose-300 focus:ring-rose-500/20 border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-600/10 focus:border-indigo-600 dark:focus:border-indigo-500 hover:border-slate-300 dark:hover:border-white/20'}`}
            >
              <span className={`font-medium ${role ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {role ? roleOptions.find(r => r.id === role)?.label : 'Select a role'}
              </span>
              <ChevronDown size={18} className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isRoleOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <div 
              className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#12141c] border border-slate-100 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-2xl overflow-hidden transition-all duration-300 origin-top ${
                isRoleOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="p-1.5">
                {roleOptions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      setIsRoleOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      role === r.id 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                    {role === r.id && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'password' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="password">
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
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] tracking-widest placeholder:tracking-normal ${errorField === 'password' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="pt-1">
            <PasswordStrengthIndicator password={password} />
          </div>
        </div>

        <div className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'password' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`} htmlFor="confirmPassword">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors duration-300">
              <Lock size={18} />
            </div>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter password"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/[0.05] tracking-widest placeholder:tracking-normal ${errorField === 'password' ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-500/10 dark:border-rose-500/50' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 hover:border-slate-300 dark:hover:border-white/20 shadow-sm focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:focus:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}`}
              required
            />
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
                Registering...
              </>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Register
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-10 text-center text-sm font-medium">
        <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
        <button
          onClick={() => onToggle('login')}
          className="text-indigo-600 hover:text-indigo-500 transition-colors font-semibold bg-transparent border-none p-0 cursor-pointer"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
