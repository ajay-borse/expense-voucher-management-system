import React from 'react';
import { SkeletonMetricCard } from './Skeleton';

export default function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendDirection = 'neutral', // 'up' | 'down' | 'neutral'
  supportingText,
  isLoading = false,
  className = '',
  iconBgClass = 'bg-indigo-50',
  iconColorClass = 'text-indigo-600',
}) {
  if (isLoading) {
    return <SkeletonMetricCard className={className} />;
  }

  const trendColors = {
    up: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    down: 'text-rose-700 bg-rose-50 border-rose-200',
    neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value ?? '—'}
            </h3>
            {trend && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  trendColors[trendDirection] || trendColors.neutral
                }`}
              >
                {trend}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(description || supportingText) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {description && <span className="truncate">{description}</span>}
          {supportingText && (
            <span className="font-medium text-slate-600 ml-auto pl-2 shrink-0">
              {supportingText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
