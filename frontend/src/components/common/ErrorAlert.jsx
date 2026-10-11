import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorAlert({
  message,
  title,
  onDismiss,
  className = '',
}) {
  if (!message) return null;

  return (
    <div
      className={`rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-start gap-3 ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-semibold text-rose-900 mb-0.5">{title}</h4>}
        <p className="text-rose-700 leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-600 focus:outline-none p-1 rounded-md"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
