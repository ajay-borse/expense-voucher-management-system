import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Authenticating session...
        </p>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
}
