import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Button from './Button';

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  secondaryAction,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-2 mb-6 ${className}`}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs?.length > 0 && (
        <nav aria-label="Breadcrumbs" className="mb-2">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {crumb.href && !isLast ? (
                    <Link
                      to={crumb.href}
                      className="hover:text-indigo-600 transition-colors font-medium truncate max-w-[150px]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`truncate max-w-[150px] ${isLast ? 'text-slate-800 font-semibold' : ''}`}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Main Header Flex Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        {(primaryAction || secondaryAction || children) && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {secondaryAction && (
              React.isValidElement(secondaryAction) ? (
                secondaryAction
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={secondaryAction.onClick}
                  icon={secondaryAction.icon}
                  disabled={secondaryAction.disabled}
                >
                  {secondaryAction.label}
                </Button>
              )
            )}

            {primaryAction && (
              React.isValidElement(primaryAction) ? (
                primaryAction
              ) : (
                <Button
                  type="button"
                  variant={primaryAction.variant || 'primary'}
                  size="md"
                  onClick={primaryAction.onClick}
                  icon={primaryAction.icon}
                  disabled={primaryAction.disabled}
                  isLoading={primaryAction.isLoading}
                >
                  {primaryAction.label}
                </Button>
              )
            )}

            {children}
          </div>
        )}
      </div>
    </div>
  );
}
