import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    type = 'text',
    id,
    name,
    placeholder,
    disabled = false,
    required = false,
    className = '',
    icon: Icon,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name;
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-lg border text-sm transition-colors py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${isPassword ? 'pr-10' : ''} ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-slate-400'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
