import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
    xl: 'w-14 h-14 border-4',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-slate-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
