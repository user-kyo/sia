import React, { useState, useEffect } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import ForgotPasswordForm from '../components/ForgotPasswordForm';
import { Box, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine initial mode from path
  const getInitialMode = () => {
    if (location.pathname === '/register') return 'register';
    if (location.pathname === '/forgot-password') return 'forgot_password';
    return 'login';
  };

  const [authMode, setAuthMode] = useState(getInitialMode());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync state if URL changes directly
  useEffect(() => {
    const mode = getInitialMode();
    if (mode !== authMode) {
      setAuthMode(mode);
    }
  }, [location.pathname]);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleToggle = (newMode) => {
    if (newMode === authMode) return;
    
    setIsTransitioning(true);
    
    // Wait for fade out
    setTimeout(() => {
      setAuthMode(newMode);
      
      // Update URL to match state without reloading
      const newPath = newMode === 'register' ? '/register' : newMode === 'forgot_password' ? '/forgot-password' : '/';
      navigate(newPath, { replace: true });
      
      // Trigger fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 300);
  };

  return (
    <div className="h-screen w-full flex bg-[#0A0A0B] font-inter overflow-hidden selection:bg-indigo-500/30">
      {/* Left Brand Section - Hidden on Mobile */}
      <div className="relative hidden lg:flex w-[55%] flex-col justify-between p-12 overflow-hidden z-0">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 z-[-2] bg-[#0A0A0B]" />
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 z-[-1] opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-auto">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-white/10">
              SI
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SalesInvent</span>
          </div>
          
          <div className="my-auto max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Next-Generation Inventory Intelligence</span>
            </div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tight leading-[1.15] mb-6">
              Empower your sales with intelligent forecasting.
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              The all-in-one platform to track stock levels in real-time, predict demand accurately, and drive sustainable revenue growth.
            </p>

            <div className="mt-12 space-y-5">
              <div className="flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] max-w-sm animate-floating">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-base font-semibold text-white tracking-tight">+24% Sales YoY</p>
                  <p className="text-sm text-slate-400">Average customer growth</p>
                </div>
              </div>
              
              <div className="flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] max-w-sm ml-12 animate-floating-delayed">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Box size={24} />
                </div>
                <div>
                  <p className="text-base font-semibold text-white tracking-tight">99.8% Accuracy</p>
                  <p className="text-sm text-slate-400">Real-time stock tracking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500 mt-auto pt-12">
            <span className="font-medium">v1.0.0</span>
            <span className="flex items-center gap-2 font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <ShieldCheck size={16} className="text-emerald-400" />
              Secure Connection
            </span>
          </div>
        </div>
      </div>

      {/* Right Auth Section */}
      <div className="w-full lg:w-[45%] h-full flex overflow-y-auto bg-white relative rounded-l-[2.5rem] lg:shadow-[-20px_0_40px_rgba(0,0,0,0.3)] z-10">
        <div className="m-auto w-full p-8 lg:p-16 flex justify-center">
          <div 
            className={`w-full flex justify-center py-8 transition-all duration-300 ease-in-out transform ${
              isTransitioning ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            {authMode === 'login' && <LoginForm onToggle={handleToggle} />}
            {authMode === 'register' && <RegisterForm onToggle={handleToggle} />}
            {authMode === 'forgot_password' && <ForgotPasswordForm onToggle={handleToggle} />}
          </div>
        </div>
      </div>
    </div>
  );
}
