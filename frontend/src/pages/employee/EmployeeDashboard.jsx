import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  PlusCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { SkeletonTableRow } from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard');
      if (response.data?.success && response.data?.data) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Malformed dashboard response');
      }
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Dashboard</h1>
        </div>
        <ErrorState
          title="Could not load your dashboard statistics"
          description={error}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const {
    total = 0,
    draft = 0,
    pending = 0,
    approved = 0,
    rejected = 0,
    totalAmountClaimed = 0,
    recentVouchers = [],
  } = dashboardData || {};

  return (
    <div className="space-y-8">
      {/* Welcome & Primary Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Employee Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {user?.department || 'Engineering'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {user?.name || 'Employee'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your expense vouchers, claim status, and approvals.
          </p>
        </div>

        <Link to="/employee/vouchers/create">
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={PlusCircle}
            className="w-full sm:w-auto shadow-sm"
          >
            Create Voucher
          </Button>
        </Link>
      </div>

      {/* 6 Core Metric Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Voucher Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Total Vouchers */}
          <MetricCard
            title="Total Vouchers"
            value={total}
            icon={Receipt}
            description="All vouchers created by you"
            isLoading={isLoading}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
          />

          {/* 2. Draft Vouchers */}
          <MetricCard
            title="Drafts"
            value={draft}
            icon={FileText}
            description="Editable and awaiting submission"
            isLoading={isLoading}
            iconBgClass="bg-slate-100"
            iconColorClass="text-slate-600"
          />

          {/* 3. Pending Approval */}
          <MetricCard
            title="Pending Approval"
            value={pending}
            icon={Clock}
            description="Submitted for Director review"
            isLoading={isLoading}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
          />

          {/* 4. Approved */}
          <MetricCard
            title="Approved"
            value={approved}
            icon={CheckCircle2}
            description="Authorized by Director"
            isLoading={isLoading}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
          />

          {/* 5. Rejected */}
          <MetricCard
            title="Rejected"
            value={rejected}
            icon={XCircle}
            description="Returned with feedback"
            isLoading={isLoading}
            iconBgClass="bg-rose-50"
            iconColorClass="text-rose-600"
          />

          {/* 6. Total Amount Claimed */}
          <MetricCard
            title="Total Claimed"
            value={formatCurrency(totalAmountClaimed)}
            icon={IndianRupee}
            description="Gross claim value across all statuses"
            isLoading={isLoading}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
          />
        </div>
      </div>

      {/* Recent Vouchers Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>Recent Vouchers</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Your 5 most recently created vouchers
            </p>
          </div>
          <Link
            to="/employee/vouchers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>View All My Vouchers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Expense Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={6} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : recentVouchers.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={Receipt}
                title="No vouchers created yet"
                description="Get started by submitting your first business expense claim."
                actionLabel="Create Voucher"
                onAction={() => {}}
                actionIcon={PlusCircle}
              />
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
                    <tr>
                      <th scope="col" className="py-3 px-4">Voucher No</th>
                      <th scope="col" className="py-3 px-4">Title</th>
                      <th scope="col" className="py-3 px-4">Expense Date</th>
                      <th scope="col" className="py-3 px-4 text-right">Amount</th>
                      <th scope="col" className="py-3 px-4 text-center">Status</th>
                      <th scope="col" className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {recentVouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">
                          {voucher.voucherNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate" title={voucher.expenseTitle}>
                          {voucher.expenseTitle}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs">
                          {formatDate(voucher.expenseDate)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {formatCurrency(voucher.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={voucher.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/employee/vouchers/${voucher.id}`}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              className="text-slate-600 hover:text-indigo-600"
                            >
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Card List */}
              <div className="md:hidden divide-y divide-slate-100">
                {recentVouchers.map((voucher) => (
                  <div key={voucher.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {voucher.voucherNumber}
                      </span>
                      <StatusBadge status={voucher.status} size="sm" />
                    </div>

                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {voucher.expenseTitle}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{formatDate(voucher.expenseDate)}</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(voucher.amount)}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link to={`/employee/vouchers/${voucher.id}`}>
                        <Button type="button" variant="outline" size="sm" icon={Eye}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
