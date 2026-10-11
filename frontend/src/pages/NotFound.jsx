import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  const { user, isAuthenticated } = useAuth();

  const getHomeLink = () => {
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
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-semibold text-slate-800 mb-3">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        The page you are looking for doesn't exist, has been moved, or you may not have sufficient permissions to view it.
      </p>

      <div className="flex items-center gap-3">
        <Link to={getHomeLink()}>
          <Button variant="primary" size="md" icon={Home}>
            {isAuthenticated ? 'Return to Dashboard' : 'Return to Login'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
