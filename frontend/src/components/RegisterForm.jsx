import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, ArrowRight, ChevronDown, Check, User, Mail, Lock, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useNavigate } from 'react-router';
import { useToast } from './ui/Toast';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterForm({ onToggle }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration Type
  const [regType, setRegType] = useState('join'); // 'join' or 'create'
  
  // Separate State for Join vs Create
  const [formData, setFormData] = useState({
    join: { fullName: '', email: '', role: '', password: '', confirmPassword: '', companyId: '' },
    create: { companyName: '', fullName: '', email: '', password: '', confirmPassword: '' }
  });
  
  const currentData = formData[regType];
  
  // Data state
  const [companies, setCompanies] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState(null);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const toast = useToast();

  const roleOptions = [
    { id: 'staff', label: 'Staff' },
    { id: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    // Fetch companies for dropdown
    const fetchCompanies = async () => {
      try {
        const { data } = await api.get('/companies');
        setCompanies(data);
      } catch (err) {
        console.error("Failed to fetch companies", err);
      }
    };
    if (regType === 'join') {
      fetchCompanies();
    }
  }, [regType]);

  const companyDropdownRef = React.useRef(null);
  const roleDropdownRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setIsCompanyOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClear = () => {
    setErrorField(null);
    setFormData(prev => ({
      ...prev,
      [regType]: regType === 'join' 
        ? { fullName: '', email: '', role: '', password: '', confirmPassword: '', companyId: '' }
        : { companyName: '', fullName: '', email: '', password: '', confirmPassword: '' }
    }));
    setIsRoleOpen(false);
    setIsCompanyOpen(false);
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    const capitalized = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setFormData(prev => ({ ...prev, [regType]: { ...prev[regType], fullName: capitalized } }));
  };

  const handleCompanyNameChange = (e) => {
    const value = e.target.value;
    const capitalized = value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setFormData(prev => ({ ...prev, [regType]: { ...prev[regType], companyName: capitalized } }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [regType]: { ...prev[regType], [field]: value } }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorField(null);

    const { password, confirmPassword, companyName, fullName, email, companyId, role } = currentData;

    // Validate top-to-bottom based on UI layout
    if (regType === 'create') {
      if (!companyName) {
        toast("Please enter a company name.", 'error');
        setErrorField("companyName");
        setLoading(false);
        return;
      }
    } else {
      if (!companyId) {
        toast("Please select a company.", 'error');
        setErrorField("companyId");
        setLoading(false);
        return;
      }
    }

    if (!fullName) {
      toast("Please enter your full name.", 'error');
      setErrorField("fullName");
      setLoading(false);
      return;
    }

    if (!email) {
      toast("Please enter your email address.", 'error');
      setErrorField("email");
      setLoading(false);
      return;
    }

    if (regType === 'join') {
      if (!role) {
        toast("Please select a role.", 'error');
        setErrorField("role");
        setLoading(false);
        return;
      }
    }

    if (!password) {
      toast("Please enter a password.", 'error');
      setErrorField("password");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match.", 'error');
      setErrorField("password");
      setLoading(false);
      return;
    }

    try {
      if (regType === 'create') {
        // Create company and seed super admin
        await api.post('/companies', {
          company_name: companyName,
          admin_name: fullName,
          admin_email: email,
          admin_password: password
        });

        toast("Company registered successfully! Please log in.", "success");
        setLoading(false);
        onToggle('login');
      } else {
        // Join existing company
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              status: 'pending',
              company_id: companyId
            }
          }
        });

        if (authError) throw authError;

        console.log('Registered successfully', data);
        toast("Registered successfully! Pending admin approval.", "success");
        setLoading(false);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      
      let errorMessage = '';
      if (typeof error.response?.data?.detail === 'string') {
        errorMessage = error.response.data.detail.toLowerCase();
      } else if (Array.isArray(error.response?.data?.detail)) {
        errorMessage = error.response.data.detail.map(d => d.msg).join(', ').toLowerCase();
      } else {
        errorMessage = error.message?.toLowerCase() || '';
      }

      if (errorMessage.includes('already taken') && errorMessage.includes('company')) {
        toast(`That company name is already taken. Please choose another.`, 'error');
        setErrorField("companyName");
      } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('email')) {
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
      } else if (errorMessage.includes('name')) {
        toast("This full name may already be in use or is invalid.", "error");
        setErrorField("fullName");
      } else if (errorMessage.includes('password')) {
        toast("Password is too weak or invalid.", "error");
        setErrorField("password");
      } else {
        const fallbackMessage = typeof error.response?.data?.detail === 'string' 
          ? error.response.data.detail 
          : "Registration failed. Please check your inputs and try again.";
        toast(fallbackMessage, 'error');
      }
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center lg:text-left">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-6 lg:hidden">
          SR
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Register</h2>
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-2">Get started with Stock & Roll</p>
      </div>

      <div className="flex relative mb-6 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
        <button
          type="button"
          disabled={loading}
          onClick={() => { setRegType('join'); setErrorField(null); setIsRoleOpen(false); setIsCompanyOpen(false); }}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${regType === 'join' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Join Company
          {regType === 'join' && (
            <motion.div
              layoutId="register-active-tab"
              className="absolute inset-0 bg-white dark:bg-[#1e2028] rounded-lg shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => { setRegType('create'); setErrorField(null); setIsRoleOpen(false); setIsCompanyOpen(false); }}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${regType === 'create' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Register Company
          {regType === 'create' && (
            <motion.div
              layoutId="register-active-tab"
              className="absolute inset-0 bg-white dark:bg-[#1e2028] rounded-lg shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      </div>

      <motion.form layout className="space-y-5" onSubmit={handleRegister}>
        <AnimatePresence mode="wait">
          {regType === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5 relative group/input"
            >
              <label className={`block text-sm font-semibold ${errorField === 'companyName' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 transition-colors">
                  <Building size={18} />
                </div>
                <input
                  type="text"
                  value={currentData.companyName || ''}
                  onChange={handleCompanyNameChange}
                  disabled={loading}
                  placeholder="Enter company name"
                  className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 ${errorField === 'companyName' ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 hover:border-slate-300'}`}
                  required
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5 relative z-30"
            >
              <label className={`block text-sm font-semibold ${errorField === 'companyId' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                Company <span className="text-rose-500">*</span>
              </label>
              <div className="relative" ref={companyDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                  disabled={loading}
                  className={`w-full flex items-center justify-between rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all disabled:opacity-50 ${errorField === 'companyId' ? 'border-rose-300' : 'border-slate-200 dark:border-white/10 focus:border-indigo-600'}`}
                >
                  <span className={`font-medium line-clamp-1 ${currentData.companyId ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                    {currentData.companyId ? companies.find(c => c.id === currentData.companyId)?.name : 'Select a company'}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#12141c] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg overflow-y-auto max-h-48 transition-all origin-top ${isCompanyOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  <div className="p-1.5">
                    {companies.length === 0 ? (
                      <div className="p-3 text-sm text-center text-slate-500">No companies found.</div>
                    ) : companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { updateField('companyId', c.id); setIsCompanyOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentData.companyId === c.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {c.name}
                        {currentData.companyId === c.id && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'fullName' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              value={currentData.fullName || ''}
              onChange={handleNameChange}
              disabled={loading}
              placeholder="e.g. John Doe"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 ${errorField === 'fullName' ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 hover:border-slate-300'}`}
              required
            />
          </div>
        </motion.div>

        <motion.div layout className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'email' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Email address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={currentData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={loading}
              placeholder="e.g. name@company.com"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 ${errorField === 'email' ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 hover:border-slate-300'}`}
              required
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {regType === 'join' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5 relative z-20"
            >
              <label className={`block text-sm font-semibold ${errorField === 'role' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative" ref={roleDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  disabled={loading || !currentData.companyId}
                  className={`w-full flex items-center justify-between rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${errorField === 'role' ? 'border-rose-300' : 'border-slate-200 dark:border-white/10 focus:border-indigo-600'}`}
                >
                  <span className={`font-medium ${currentData.role ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                    {!currentData.companyId ? 'Select a company first' : (currentData.role ? roleOptions.find(r => r.id === currentData.role)?.label : 'Select a role')}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#12141c] border border-slate-100 dark:border-white/10 rounded-xl shadow-lg transition-all origin-top ${isRoleOpen && currentData.companyId ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  <div className="p-1.5">
                    {roleOptions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { updateField('role', r.id); setIsRoleOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentData.role === r.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {r.label}
                        {currentData.role === r.id && <Check size={16} className="text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'password' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentData.password || ''}
              onChange={(e) => updateField('password', e.target.value)}
              disabled={loading}
              placeholder="Enter password"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 ${errorField === 'password' ? 'border-rose-300' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'} tracking-widest placeholder:tracking-normal`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="pt-1">
            <PasswordStrengthIndicator password={currentData.password || ''} />
          </div>
        </motion.div>

        <motion.div layout className="space-y-2.5 relative group/input">
          <label className={`block text-sm font-semibold ${errorField === 'password' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentData.confirmPassword || ''}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              disabled={loading}
              placeholder="Enter password"
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-white/[0.03] pl-11 pr-12 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 ${errorField === 'password' ? 'border-rose-300' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'} tracking-widest placeholder:tracking-normal`}
              required
            />
          </div>
        </motion.div>

        <motion.div layout className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="flex-1 max-w-[100px] flex justify-center items-center rounded-xl bg-slate-100 dark:bg-white/5 px-4 py-3.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex-[2] flex justify-center items-center rounded-xl bg-slate-900 dark:bg-indigo-600 overflow-hidden px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Registering...
              </>
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Register
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </motion.div>
      </motion.form>

      <div className="mt-8 text-center text-sm font-medium">
        <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => onToggle('login')}
          className="text-indigo-600 hover:text-indigo-500 transition-colors font-semibold bg-transparent border-none p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Log in
        </button>
      </div>
    </div>
  );
}
