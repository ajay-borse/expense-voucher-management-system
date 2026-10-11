import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & Guards
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import { ToastProvider } from './context/ToastContext';

// Employee Views
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import CreateVoucher from './pages/employee/CreateVoucher';
import EditVoucher from './pages/employee/EditVoucher';
import MyVouchers from './pages/employee/MyVouchers';
import VoucherDetails from './pages/employee/VoucherDetails';

// Director Views
import DirectorDashboard from './pages/director/DirectorDashboard';
import PendingApprovals from './pages/director/PendingApprovals';
import AllVouchers from './pages/director/AllVouchers';
import DirectorVoucherDetails from './pages/director/DirectorVoucherDetails';

// Accounts Views
import AccountsDashboard from './pages/accounts/AccountsDashboard';
import AccountsVouchers from './pages/accounts/AccountsVouchers';
import AccountsVoucherDetails from './pages/accounts/AccountsVoucherDetails';

/**
 * Root redirect handler: Dispatches authenticated users to their
 * role-specific dashboard or redirects unauthenticated visitors to /login.
 */
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading application...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'EMPLOYEE':
      return <Navigate to="/employee/dashboard" replace />;
    case 'DIRECTOR':
      return <Navigate to="/director/dashboard" replace />;
    case 'ACCOUNTS':
      return <Navigate to="/accounts/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

/**
 * Public route guard for Login: Redirects already-logged-in users
 * directly to their active role dashboard.
 */
function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'EMPLOYEE':
        return <Navigate to="/employee/dashboard" replace />;
      case 'DIRECTOR':
        return <Navigate to="/director/dashboard" replace />;
      case 'ACCOUNTS':
        return <Navigate to="/accounts/dashboard" replace />;
      default:
        break;
    }
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Root & Login Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* Authenticated Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* -------------------------------------------------------- */}
              {/* EMPLOYEE ROUTES */}
              {/* -------------------------------------------------------- */}
              <Route
                path="/employee"
                element={<RoleRoute allowedRoles={['EMPLOYEE']} />}
              >
                <Route index element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="vouchers/create" element={<CreateVoucher />} />
                <Route path="vouchers/:id/edit" element={<EditVoucher />} />
                <Route path="vouchers/:id" element={<VoucherDetails />} />
                <Route path="vouchers" element={<MyVouchers />} />
              </Route>

              {/* -------------------------------------------------------- */}
              {/* DIRECTOR ROUTES */}
              {/* -------------------------------------------------------- */}
              <Route
                path="/director"
                element={<RoleRoute allowedRoles={['DIRECTOR']} />}
              >
                <Route index element={<Navigate to="/director/dashboard" replace />} />
                <Route path="dashboard" element={<DirectorDashboard />} />
                <Route path="vouchers/pending" element={<PendingApprovals />} />
                <Route path="vouchers/:id" element={<DirectorVoucherDetails />} />
                <Route path="vouchers" element={<AllVouchers />} />
              </Route>

              {/* -------------------------------------------------------- */}
              {/* ACCOUNTS ROUTES */}
              {/* -------------------------------------------------------- */}
              <Route
                path="/accounts"
                element={<RoleRoute allowedRoles={['ACCOUNTS']} />}
              >
                <Route index element={<Navigate to="/accounts/dashboard" replace />} />
                <Route path="dashboard" element={<AccountsDashboard />} />
                <Route path="vouchers/:id" element={<AccountsVoucherDetails />} />
                <Route path="vouchers" element={<AccountsVouchers />} />
              </Route>
            </Route>

            {/* Forbidden Route */}
            <Route path="/403" element={<Forbidden />} />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
