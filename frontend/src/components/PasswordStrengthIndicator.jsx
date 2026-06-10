import React from 'react';
import { Check, X } from 'lucide-react';

export default function PasswordStrengthIndicator({ password }) {
  const criteria = [
    { label: 'At least 8 characters', met: password?.length > 7 },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special char ($@#&!)', met: /[$@#&!]/.test(password) },
  ];

  const score = criteria.filter(c => c.met).length;

  const getStrengthLabel = (s) => {
    if (s <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (s <= 4) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const { label, color } = getStrengthLabel(score);

  return (
    <div 
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        password ? 'max-h-[200px] opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
      }`}
    >
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Password strength</span>
            <span className={`text-xs font-bold ${color.replace('bg-', 'text-')}`}>
              {password ? label : ''}
            </span>
          </div>
          <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  i < score && password ? color : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-y-2 gap-x-2 bg-slate-50 dark:bg-white/[0.02] rounded-lg p-3 border border-slate-100 dark:border-white/5">
          {criteria.map((c, i) => (
            <div key={i} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${c.met && password ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {c.met && password ? <Check size={12} className="shrink-0" strokeWidth={3} /> : <X size={12} className="shrink-0 opacity-50" strokeWidth={2.5} />}
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
