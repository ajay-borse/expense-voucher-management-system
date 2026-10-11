import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  role,
  status,
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold',
    lg: 'text-sm px-3 py-1.5 rounded-full font-semibold',
  };

  // Pre-configured role styles
  const roleStyles = {
    EMPLOYEE: 'bg-sky-50 text-sky-700 border border-sky-200',
    DIRECTOR: 'bg-purple-50 text-purple-700 border border-purple-200',
    ACCOUNTS: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  // Pre-configured status styles
  const statusStyles = {
    DRAFT: 'bg-slate-100 text-slate-700 border border-slate-300',
    PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  let style = variants[variant] || variants.default;
  let content = children;

  if (role) {
    style = roleStyles[role] || variants.default;
    content = content || role;
  } else if (status) {
    style = statusStyles[status] || variants.default;
    const formattedStatus = status.replace('_', ' ');
    content = content || formattedStatus;
  }

  return (
    <span
      className={`inline-flex items-center tracking-wide ${sizes[size] || sizes.md} ${style} ${className}`}
    >
      {content}
    </span>
  );
}
