import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ReceiptText,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import MetricCard from '../../components/common/MetricCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';

export default function AccountsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApprovedAmount: 0,
    recentApprovedVouchers: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/dashboard');
      if (response.data?.success && response.data?.data) {
        setMetrics(response.data.data);
      } else {
        throw new Error('Malformed dashboard response');
      }
    } catch (err) {
      console.error('Failed to load Accounts dashboard:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load financial dashboard'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Columns definition for Recent Approved Vouchers Table
  const recentApprovedColumns = [
    {
      key: 'voucherNumber',
      header: 'Voucher No',
      render: (row) => (
        <Link
          to={`/accounts/vouchers/${row.id}`}
          className="font-mono text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          {row.voucherNumber}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge status="APPROVED" size="sm" />,
    },
    {
      key: 'creatorName',
      header: 'Claimant',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
            {row.creatorName || row.createdBy?.name || 'Employee'}
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
      key: 'amount',
      header: 'Approved Amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'approvalDate',
      header: 'Approval Date',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.approvalDate || row.createdAt)}
        </span>
      ),
    },
  ];

  const recentApprovedActions = [
    {
      label: 'View Voucher',
      icon: Eye,
      variant: 'ghost',
      onClick: (row) => navigate(`/accounts/vouchers/${row.id}`),
    },
  ];

  if (error && !metrics.total && metrics.recentApprovedVouchers.length === 0) {
    return (
      <ErrorState
        title="Unable to load Accounts Dashboard"
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
          title={`Finance & Accounts — ${user?.name || 'Staff'}`}
          description="Global financial overview, approved expenditure totals, and verified disbursement claims."
          breadcrumbs={[{ label: 'Accounts' }, { label: 'Dashboard' }]}
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

          <Link to="/accounts/vouchers">
            <Button
              variant="primary"
              size="sm"
              icon={ReceiptText}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold"
            >
              All Vouchers Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5 ACCOUNTS FINANCIAL METRIC CARDS                             */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* 1. Total Vouchers */}
        <MetricCard
          title="Total Vouchers"
          value={isLoading ? null : metrics.total}
          icon={FileText}
          description="All system vouchers"
          supportingText="Across organization"
          isLoading={isLoading}
          iconBgClass="bg-slate-100"
          iconColorClass="text-slate-700"
        />

        {/* 2. Pending Approval */}
        <MetricCard
          title="Pending Approval"
          value={isLoading ? null : metrics.pending}
          icon={Clock}
          description="Awaiting director review"
          supportingText="Unsettled claims"
          isLoading={isLoading}
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />

        {/* 3. Approved Vouchers */}
        <MetricCard
          title="Approved Vouchers"
          value={isLoading ? null : metrics.approved}
          icon={CheckCircle2}
          description="Director signed & authorized"
          supportingText="Ready for payment"
          isLoading={isLoading}
          iconBgClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
        />

        {/* 4. Rejected Vouchers */}
        <MetricCard
          title="Rejected Vouchers"
          value={isLoading ? null : metrics.rejected}
          icon={XCircle}
          description="Disallowed by director"
          supportingText="Declined claims"
          isLoading={isLoading}
          iconBgClass="bg-rose-50"
          iconColorClass="text-rose-600"
        />

        {/* 5. Total Approved Amount */}
        <MetricCard
          title="Total Approved Amount"
          value={isLoading ? null : formatCurrency(metrics.totalApprovedAmount)}
          icon={DollarSign}
          description="Approved corporate expenditure"
          supportingText="Total INR disbursed"
          isLoading={isLoading}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RECENT APPROVED VOUCHERS TABLE                                */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Recent Approved Vouchers</span>
              {metrics.approved > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {metrics.approved} approved total
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Latest expense claims authorized by the Director ready for ledger auditing and disbursement.
            </p>
          </div>

          <Link
            to="/accounts/vouchers?status=APPROVED"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <span>View all approved vouchers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DataTable
          columns={recentApprovedColumns}
          data={metrics.recentApprovedVouchers || []}
          isLoading={isLoading}
          error={error}
          onRetry={fetchDashboardData}
          actions={recentApprovedActions}
          emptyTitle="No Approved Vouchers"
          emptyDescription="There are currently no approved vouchers on record."
        />
      </div>
    </div>
  );
}
