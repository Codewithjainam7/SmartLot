import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 animate-pulse overflow-y-auto h-full bg-[#F4F6F9] dark:bg-[#0B1121]">
      {/* Top Welcome & KPI Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 dark:bg-white/10 rounded-xl" />
          <div className="h-4 w-40 bg-gray-200 dark:bg-white/5 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-2xl" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        </div>
      </div>

      {/* KPI Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i} 
            className="p-5 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-white/10" />
              <div className="w-16 h-5 rounded-full bg-gray-200 dark:bg-white/5" />
            </div>
            <div className="space-y-1 pt-2">
              <div className="h-7 w-20 bg-gray-200 dark:bg-white/10 rounded-lg" />
              <div className="h-3.5 w-24 bg-gray-200 dark:bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1-col Card Skeleton */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
            <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded-lg" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-white/5 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(j => (
              <div key={j} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-6 w-14 rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Right 2-col Main Panel Skeleton */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="h-5 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
            <div className="h-8 w-28 bg-gray-200 dark:bg-white/10 rounded-xl" />
          </div>
          <div className="h-28 w-full rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-gray-200 dark:bg-white/10 rounded" />
              <div className="h-3.5 w-60 bg-gray-200 dark:bg-white/5 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-20 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5" />
            <div className="h-20 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
