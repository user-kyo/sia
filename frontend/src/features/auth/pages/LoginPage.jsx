import React from 'react';
import LoginForm from '../components/LoginForm';
import { Box, TrendingUp, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white font-inter">
      {/* Left Brand Section - Hidden on Mobile */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-slate-50 border-r border-slate-200 p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="h-8 w-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              SI
            </div>
            <span className="text-xl font-bold text-slate-900">SalesInvent</span>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6 max-w-md">
            Empowering your sales and inventory decisions.
          </h1>
          <p className="text-lg text-slate-500 max-w-md mb-12">
            The all-in-one platform to track stock levels, forecast demand, and drive revenue growth.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-sm">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">+24% Sales YoY</p>
                <p className="text-xs text-slate-500">Average customer growth</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-sm ml-8">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Box size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">99.8% Accuracy</p>
                <p className="text-xs text-slate-500">Real-time stock tracking</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>v1.0.0</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={16} />
            Secure Connection
          </span>
        </div>
      </div>

      {/* Right Auth Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white">
        <LoginForm />
      </div>
    </div>
  );
}
