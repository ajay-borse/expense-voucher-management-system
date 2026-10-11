import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import Button from '../components/common/Button';

export default function Forbidden() {
  const { user, isAuthenticated, logout } = useAuth();

  const getDashboardPath = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'EMPLOYEE':
        return '/employee/dashboard';
      case 'DIRECTOR':
        return '/director/dashboard';
      case 'ACCOUNTS':
        return '/accounts/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        403
      </h1>
      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Access Not Allowed
      </h2>

      <p className="text-sm text-slate-600 max-w-md mb-2 leading-relaxed">
        You do not have permission to view this section of the Expense Voucher Management System.
      </p>

      {user && (
        <p className="text-xs text-slate-400 mb-8 font-medium">
          Signed in as <strong>{user.name}</strong> ({user.role})
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
        <Link to={getDashboardPath()} className="w-full sm:w-auto">
          <Button variant="primary" size="md" icon={Home} className="w-full sm:w-auto">
            {isAuthenticated ? 'Return to Dashboard' : 'Go to Login'}
          </Button>
        </Link>

        {isAuthenticated && (
          <Button
            variant="outline"
            size="md"
            icon={LogOut}
            onClick={logout}
            className="w-full sm:w-auto"
          >
            Switch Account
          </Button>
        )}
      </div>
    </div>
  );
}
