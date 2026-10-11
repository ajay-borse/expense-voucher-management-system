import React from 'react';
import { FileQuestion } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are no items to display matching your criteria.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200 border-dashed rounded-xl p-8 sm:p-12 text-center max-w-xl mx-auto my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
