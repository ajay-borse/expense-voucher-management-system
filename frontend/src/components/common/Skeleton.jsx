import React from 'react';

/**
 * Base skeleton element with subtle pulse animation.
 */
export function SkeletonBlock({ className = '', ...props }) {
  return (
    <div
      className={`bg-slate-200/80 rounded-md animate-pulse motion-reduce:animate-none ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton for standard text lines.
 */
export function SkeletonText({ lines = 1, className = '', height = 'h-4' }) {
  return (
    <div className={`space-y-2 w-full ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`${height} ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * Skeleton placeholder for dashboard metric cards.
 */
export function SkeletonMetricCard({ className = '' }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 ${className}`}
      role="status"
      aria-label="Loading metric"
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-9 w-9 rounded-lg" />
      </div>
      <SkeletonBlock className="h-8 w-36" />
      <SkeletonBlock className="h-3 w-44" />
      <span className="sr-only">Loading metric data...</span>
    </div>
  );
}

/**
 * Skeleton placeholder for desktop table rows.
 */
export function SkeletonTableRow({ columns = 5 }) {
  return (
    <tr className="border-b border-slate-100 animate-pulse motion-reduce:animate-none">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <SkeletonBlock className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton placeholder for mobile card list items.
 */
export function SkeletonMobileCard() {
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs animate-pulse motion-reduce:animate-none"
      role="status"
      aria-label="Loading item"
    >
      <div className="flex justify-between items-start">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-48" />
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-5 w-24" />
      </div>
    </div>
  );
}

export default SkeletonBlock;
