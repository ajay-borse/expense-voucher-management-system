import React from 'react';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    classes: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-400',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

export default function StatusBadge({ status, size = 'md', showDot = true, className = '' }) {
  const normalizedStatus = (status || '').toUpperCase().trim();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full gap-1.5',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5',
    lg: 'text-sm px-3 py-1.5 rounded-full gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold border tracking-wide select-none ${
        sizes[size] || sizes.md
      } ${config.classes} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
