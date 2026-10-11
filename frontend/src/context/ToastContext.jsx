import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timerId = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timerId);
      }

      return id;
    },
    [removeToast]
  );

  // Convenient helper methods
  const toast = {
    success: (message, title, duration) =>
      addToast({ type: 'success', message, title, duration }),
    error: (message, title, duration) =>
      addToast({ type: 'error', message, title, duration }),
    warning: (message, title, duration) =>
      addToast({ type: 'warning', message, title, duration }),
    info: (message, title, duration) =>
      addToast({ type: 'info', message, title, duration }),
    remove: removeToast,
  };

  const toastIcons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const toastStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  };

  const iconStyles = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    warning: 'text-amber-600',
    info: 'text-indigo-600',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = toastIcons[t.type] || Info;
          const style = toastStyles[t.type] || toastStyles.info;
          const iconColor = iconStyles[t.type] || iconStyles.info;

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto border rounded-xl p-3.5 shadow-lg flex items-start gap-3 transition-all duration-200 transform translate-y-0 opacity-100 ${style}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />

              <div className="flex-1 min-w-0 text-xs sm:text-sm">
                {t.title && (
                  <h5 className="font-bold tracking-tight mb-0.5 leading-snug">
                    {t.title}
                  </h5>
                )}
                <p className="leading-relaxed opacity-95">{t.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-current opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
