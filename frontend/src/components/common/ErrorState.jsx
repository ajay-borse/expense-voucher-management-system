import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

/**
 * Sanitizes technical error message to prevent accidental leakage of sensitive credentials or stack traces.
 */
function sanitizeErrorMessage(raw) {
  if (!raw) return null;
  const str = String(raw);

  // Mask sensitive tokens, connection strings or JWT patterns
  return str
    .replace(/(postgres|postgresql):\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [TOKEN_REDACTED]')
    .replace(/password[:=]\s*[^\s,]+/gi, 'password=[REDACTED]');
}

export default function ErrorState({
  title = 'Unable to load data',
  description = 'An error occurred while fetching information. Please verify your connection and try again.',
  errorDetails,
  onRetry,
  className = '',
}) {
  const safeDetails = sanitizeErrorMessage(errorDetails);

  return (
    <div
      className={`bg-rose-50/50 border border-rose-200 rounded-xl p-8 sm:p-12 text-center max-w-xl mx-auto my-4 ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-rose-900 tracking-tight">
        {title}
      </h3>

      <p className="mt-1 text-sm text-rose-700/80 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {safeDetails && (
        <div className="mt-3 p-2 bg-white/80 rounded border border-rose-200 text-xs text-rose-800 font-mono text-left overflow-x-auto max-h-24">
          {safeDetails}
        </div>
      )}

      {onRetry && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            icon={RotateCcw}
            className="border-rose-300 text-rose-700 hover:bg-rose-100/60"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
