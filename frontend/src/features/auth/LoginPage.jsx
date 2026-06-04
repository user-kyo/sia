import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, ShieldCheck, Activity, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      navigate('/');
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* Left Pane - Brand Section */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-slate-50 border-r border-slate-200 p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">SIA System</span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6 max-w-md">
            Empowering your sales and inventory decisions.
          </h1>
          <p className="text-lg text-slate-500 mb-12 max-w-md">
            Access intelligent, predictive data and streamline your operations with enterprise-grade analytics.
          </p>

          <div className="space-y-4 max-w-sm">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">+24% Sales YoY</p>
                <p className="text-xs text-slate-500 font-medium">Average user growth</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">99.8% Accuracy</p>
                <p className="text-xs text-slate-500 font-medium">In automated stock tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-slate-400">
            <BarChart3 className="w-24 h-24 opacity-20 stroke-1" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            Secure Connection
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">SIA System</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">Log in to your account to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email address
              </label>
              <input 
                id="email"
                type="email" 
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
                placeholder="name@company.com"
                defaultValue="admin@example.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
                  placeholder="••••••••"
                  defaultValue="password123"
                  required
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input 
                id="remember" 
                type="checkbox" 
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" 
              />
              <label htmlFor="remember" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">
                Remember for 30 days
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-xl bg-slate-800 mt-2 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center h-11"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Log in to app"
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-center text-sm font-medium text-slate-500">
              Don't have an account? <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors">Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
