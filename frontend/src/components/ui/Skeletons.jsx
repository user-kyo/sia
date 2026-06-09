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
                  <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {[...Array(rows)].map((_, i) => (
              <tr key={i} className="animate-pulse">
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
      <div className="p-4 flex justify-center text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
        Loading data...
      </div>
    </motion.div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <motion.div
      key="skeleton-cards"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
    >
      {[...Array(count)].map((_, i) => (
        <div key={i} className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-6 w-28 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
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
        <div key={i} className="bg-white dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col items-center animate-pulse">
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
