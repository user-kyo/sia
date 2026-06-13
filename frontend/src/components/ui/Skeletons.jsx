import React from 'react';
import { motion } from 'framer-motion';

export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <motion.div
      key="skeleton-table"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none w-full"
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {[...Array(rows)].map((_, i) => (
              <tr key={i} >
                {[...Array(columns)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    {j === 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded" />
                          <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded" />
                        </div>
                      </div>
                    ) : (
                      <div className={`h-4 bg-slate-200 dark:bg-white/10 rounded ${j === columns - 1 ? 'w-8 ml-auto' : 'w-20'}`} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex justify-center text-xs font-semibold text-slate-500 dark:text-slate-400 animate-shimmer">
        Loading data...
      </div>
    </motion.div>
  );
};

export const CardSkeleton = ({ count = 4, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full" }) => {
  return (
    <motion.div
      key="skeleton-cards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between animate-shimmer">
          <div className="flex justify-between items-start mb-6">
            <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-white/10 rounded-md" />
          </div>
          <div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-white/10 rounded mb-3" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export const ChartCardSkeleton = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col animate-shimmer ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-8 w-8 bg-slate-200 dark:bg-white/10 rounded-lg" />
      </div>
      <div className="flex-1 w-full h-full min-h-[220px] bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5" />
    </motion.div>
  );
};

export const TrendsChartSkeleton = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col animate-shimmer ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
        </div>
        <div className="h-4 w-12 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
      <div className="flex-1 w-full h-full min-h-[220px] bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5" />
    </motion.div>
  );
};

export const CategoryChartSkeleton = ({ className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative h-full w-full bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col animate-shimmer ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 w-32 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-4 w-12 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
      <div className="flex-1 w-full h-full min-h-[220px] bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const ReportCardSkeleton = ({ count = 3, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full" }) => {
  return (
    <motion.div
      key="skeleton-reports"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#1b2035] rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10 mb-5 animate-shimmer" />
            <div className="h-6 w-32 bg-slate-200 dark:bg-white/10 rounded mb-3 animate-shimmer" />
            <div className="space-y-2 mb-2">
              <div className="h-4 w-full bg-slate-200 dark:bg-white/10 rounded animate-shimmer" />
              <div className="h-4 w-4/5 bg-slate-200 dark:bg-white/10 rounded animate-shimmer" />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
            <div className="h-10 w-full bg-slate-200 dark:bg-white/10 rounded-xl animate-shimmer" />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <motion.div
      key="skeleton-product-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full"
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center animate-shimmer">
          <div className="w-full h-32 bg-slate-200 dark:bg-white/10 rounded-lg mb-4 mt-6" />
          <div className="w-full space-y-2 mb-4">
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          <div className="w-full flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-4">
            <div className="space-y-2">
              <div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
            <div className="h-9 w-9 bg-slate-200 dark:bg-white/10 rounded-xl" />
          </div>
        </div>
      ))}
    </motion.div>
  );
};

export const SectionSkeleton = ({ count = 3 }) => {
  return (
    <motion.div
      key="skeleton-sections"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-6 w-full"
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm animate-shimmer">
          <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-10 w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
          </div>
        </div>
      ))}
    </motion.div>
  );
};
