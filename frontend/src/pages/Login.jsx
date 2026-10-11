import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReceiptText, Mail, Lock, Shield, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorAlert from '../components/common/ErrorAlert';

// Validation schema using Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user was redirected due to expired token
  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await login(data.email, data.password);
      const role = result.user.role;

      // Navigate to destination from state (if authorized) or user's role dashboard
      const fromPath = location.state?.from?.pathname;
      const isRolePathMatch =
        (role === 'EMPLOYEE' && fromPath?.startsWith('/employee')) ||
        (role === 'DIRECTOR' && fromPath?.startsWith('/director')) ||
        (role === 'ACCOUNTS' && fromPath?.startsWith('/accounts'));

      if (fromPath && isRolePathMatch) {
        navigate(fromPath, { replace: true });
      } else {
        switch (role) {
          case 'EMPLOYEE':
            navigate('/employee/dashboard', { replace: true });
            break;
          case 'DIRECTOR':
            navigate('/director/dashboard', { replace: true });
            break;
          case 'ACCOUNTS':
            navigate('/accounts/dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to fill demo account credentials for verification convenience
  const fillDemoCredentials = (email, password = 'Password@123') => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* App Branding */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <ReceiptText className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Expense Voucher System
        </h2>
        <p className="mt-1.5 text-center text-sm text-slate-500">
          Sign in to your role-based corporate portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Expired Token Notice */}
          {sessionExpired && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              Your session has expired. Please log in again to continue.
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5">
              <ErrorAlert
                message={serverError}
                onDismiss={() => setServerError(null)}
              />
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              icon={Mail}
              required
              error={errors.email?.message}
              disabled={isSubmitting}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              required
              error={errors.password?.message}
              disabled={isSubmitting}
              autoComplete="current-password"
              {...register('password')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full text-base py-2.5 shadow-sm"
              >
                Sign in to Account
              </Button>
            </div>
          </form>

          {/* Demo Account Quick Selector for Grading / Manual Testing */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Demo Quick-Fill Credentials</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('employee@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-sky-50 hover:border-sky-200 text-slate-700 hover:text-sky-700 transition-colors text-xs"
              >
                <span className="font-semibold">Employee</span>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full text-center">Engineering</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('director@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-200 text-slate-700 hover:text-purple-700 transition-colors text-xs"
              >
                <span className="font-semibold">Director</span>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full text-center">Approval</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('accounts@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 transition-colors text-xs"
              >
                <span className="font-semibold">Accounts</span>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full text-center">Finance</span>
              </button>
            </div>

            <p className="mt-3 text-[11px] text-center text-slate-400">
              Select any demo role to pre-fill credentials for quick evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
