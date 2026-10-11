import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Send,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/common/MetricCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';

export default function DirectorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    pendingCount: 0,
    totalPendingAmount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    recentActivities: [],
  });
  const [pendingVouchers, setPendingVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch director metrics & activity from GET /api/dashboard
      // 2. Fetch pending vouchers queue from GET /api/vouchers?status=PENDING_APPROVAL&limit=5
      const [dashboardRes, vouchersRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/vouchers?status=PENDING_APPROVAL&limit=5'),
      ]);

      if (dashboardRes.data?.success && dashboardRes.data?.data) {
        setMetrics(dashboardRes.data.data);
      }

      if (vouchersRes.data?.success && vouchersRes.data?.data) {
        setPendingVouchers(vouchersRes.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load Director dashboard:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load executive dashboard'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Columns for Needs Your Action (Pending Vouchers)
  const pendingColumns = [
    {
      key: 'voucherNumber',
      header: 'Voucher No',
      render: (row) => (
        <Link
          to={`/director/vouchers/${row.id}`}
          className="font-mono text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
        >
          {row.voucherNumber}
        </Link>
      ),
    },
    {
      key: 'createdBy',
      header: 'Claimant',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
            {row.createdBy?.name || 'Unknown Employee'}
          </span>
          <span className="text-[11px] text-slate-500">
            {row.departmentName}
          </span>
        </div>
      ),
    },
    {
      key: 'expenseTitle',
      header: 'Expense Title',
      render: (row) => (
        <div className="max-w-xs truncate font-medium text-slate-900" title={row.expenseTitle}>
          {row.expenseTitle}
        </div>
      ),
    },
    {
      key: 'expenseCategory',
      header: 'Category',
      mobileLabel: 'Category',
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.submittedAt || row.createdAt)}
        </span>
      ),
    },
  ];

  const pendingTableActions = [
    {
      label: 'Review',
      icon: Eye,
      variant: 'primary',
      className: 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs',
      onClick: (row) => navigate(`/director/vouchers/${row.id}`),
    },
  ];

  if (error && !metrics.pendingCount && pendingVouchers.length === 0) {
    return (
      <ErrorState
        title="Unable to load Director Dashboard"
        description={error}
        onRetry={fetchDashboardData}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title={`Executive Portal — ${user?.name || 'Director'}`}
          description="Authorize corporate expense claims, inspect pending reviews, and track organization activity."
          breadcrumbs={[{ label: 'Director' }, { label: 'Dashboard' }]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            icon={RefreshCw}
            isLoading={isLoading}
            title="Refresh dashboard metrics"
          >
            Refresh
          </Button>

          <Link to="/director/vouchers/pending">
            <Button
              variant="primary"
              size="sm"
              icon={Clock}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold"
            >
              Review Pending ({metrics.pendingCount || 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4 EXECUTIVE METRIC CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Pending Approval Count */}
        <MetricCard
          title="Pending Approval"
          value={isLoading ? null : metrics.pendingCount}
          icon={Clock}
          description="Vouchers awaiting your review"
          supportingText={metrics.pendingCount > 0 ? 'Requires action' : 'All clear'}
          isLoading={isLoading}
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />

        {/* 2. Total Pending Amount */}
        <MetricCard
          title="Total Pending Amount"
          value={isLoading ? null : formatCurrency(metrics.totalPendingAmount)}
          icon={DollarSign}
          description="Awaiting disbursement review"
          supportingText="Corporate liability"
          isLoading={isLoading}
          iconBgClass="bg-indigo-50"
          iconColorClass="text-indigo-600"
        />

        {/* 3. Approved Today */}
        <MetricCard
          title="Approved Today"
          value={isLoading ? null : metrics.approvedToday}
          icon={CheckCircle2}
          description="Signed and authorized today"
          supportingText="Server local day"
          isLoading={isLoading}
          iconBgClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
        />

        {/* 4. Rejected Today */}
        <MetricCard
          title="Rejected Today"
          value={isLoading ? null : metrics.rejectedToday}
          icon={XCircle}
          description="Returned with feedback today"
          supportingText="Server local day"
          isLoading={isLoading}
          iconBgClass="bg-rose-50"
          iconColorClass="text-rose-600"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* NEEDS YOUR ACTION: PENDING VOUCHERS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Needs Your Action</span>
              {metrics.pendingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  {metrics.pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Vouchers submitted by employees requiring your digital signature or decision.
            </p>
          </div>

          <Link
            to="/director/vouchers/pending"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>View all pending vouchers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={pendingColumns}
          data={pendingVouchers}
          isLoading={isLoading}
          error={error}
          onRetry={fetchDashboardData}
          actions={pendingTableActions}
          emptyTitle="No Pending Approvals"
          emptyDescription="You're all caught up! There are currently no vouchers awaiting Director signature."
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RECENT ACTIVITY AUDIT TRAIL */}
      {/* ------------------------------------------------------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              System Audit & Recent Activity
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological log of latest voucher lifecycle actions across the organization.
            </p>
          </div>
          <Link
            to="/director/vouchers"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            All Vouchers →
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-xs text-slate-400">Loading activity feed...</p>
            </div>
          ) : metrics.recentActivities && metrics.recentActivities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {metrics.recentActivities.map((act) => {
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                let icon = <Clock className="w-3.5 h-3.5" />;

                switch (act.action) {
                  case 'CREATED':
                    badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                    break;
                  case 'UPDATED':
                    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                    break;
                  case 'SUBMITTED':
                    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    icon = <Send className="w-3.5 h-3.5" />;
                    break;
                  case 'APPROVED':
                    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
                    break;
                  case 'REJECTED':
                    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                    icon = <XCircle className="w-3.5 h-3.5" />;
                    break;
                  default:
                    break;
                }

                return (
                  <div
                    key={act.id}
                    className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-lg transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase shrink-0 ${badgeStyle}`}
                      >
                        {icon}
                        <span>{act.action}</span>
                      </span>

                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {act.voucherNumber && (
                            <span className="font-mono font-bold text-slate-900">
                              {act.voucherNumber}
                            </span>
                          )}
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-700 font-medium">
                            {act.actorName || 'User'}
                          </span>
                        </div>

                        {act.remark && (
                          <p className="text-slate-500 truncate max-w-lg mt-0.5">
                            {act.remark}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0 self-end sm:self-auto">
                      {formatDateTime(act.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
