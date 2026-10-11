import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, Download, RefreshCw, ReceiptText } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';

export default function AccountsVouchers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Load dropdown options once from /api/vouchers/meta
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await api.get('/vouchers/meta');
        if (res.data?.success && res.data?.data) {
          setDepartmentOptions(res.data.data.departments || []);
          setCategoryOptions(res.data.data.categories || []);
        }
      } catch (e) {
        console.warn('Could not load filter metadata:', e);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch vouchers across all statuses whenever searchParams change
  const fetchAllVouchers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryString = searchParams.toString();
      const res = await api.get(`/vouchers${queryString ? `?${queryString}` : ''}`);

      if (res.data?.success && res.data?.data) {
        setVouchers(res.data.data.items || []);
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      } else {
        throw new Error('Malformed vouchers response');
      }
    } catch (err) {
      console.error('Failed to load accounts vouchers:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllVouchers();
  }, [searchParams]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('page', String(newPage));
      return p;
    });
  };

  // Handle page size change
  const handlePageSizeChange = (newLimit) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('limit', String(newLimit));
      p.delete('page');
      return p;
    });
  };

  // Safe CSV export of all matching filtered records
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const exportParams = new URLSearchParams(searchParams);
      exportParams.delete('page');
      exportParams.set('limit', '1000'); // Export all matching records up to 1000

      const res = await api.get(`/vouchers?${exportParams.toString()}`);
      const itemsToExport = res.data?.data?.items || [];

      if (itemsToExport.length === 0) {
        toast.info('No voucher records found to export with active filters.');
        return;
      }

      // Format CSV headers and records with rigorous quote-escaping
      const headers = [
        'Voucher Number',
        'Status',
        'Claimant Name',
        'Department',
        'Expense Title',
        'Expense Category',
        'Amount (INR)',
        'Expense Date',
        'Voucher Date',
        'Submission Date',
        'Approval Date',
        'Rejection Reason',
      ];

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvRows = [
        headers.join(','),
        ...itemsToExport.map((row) =>
          [
            escapeCSV(row.voucherNumber),
            escapeCSV(row.status),
            escapeCSV(row.createdBy?.name || ''),
            escapeCSV(row.departmentName),
            escapeCSV(row.expenseTitle),
            escapeCSV(row.expenseCategory),
            escapeCSV(row.amount),
            escapeCSV(row.expenseDate ? row.expenseDate.split('T')[0] : ''),
            escapeCSV(row.voucherDate ? row.voucherDate.split('T')[0] : ''),
            escapeCSV(row.submittedAt ? row.submittedAt.split('T')[0] : ''),
            escapeCSV(row.approvalDate ? row.approvalDate.split('T')[0] : ''),
            escapeCSV(row.rejectionReason || ''),
          ].join(',')
        ),
      ];

      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `expense_vouchers_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported ${itemsToExport.length} vouchers to CSV.`);
    } catch (e) {
      console.error('CSV Export failed:', e);
      toast.error('Failed to export vouchers to CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  // Columns definition for DataTable (Strictly read-only)
  const columns = [
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
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'createdBy',
      header: 'Claimant',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs sm:text-sm">
            {row.createdBy?.name || 'Employee'}
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
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'expenseDate',
      header: 'Expense Date',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.expenseDate)}
        </span>
      ),
    },
  ];

  // Actions: Read-only View action only
  const tableActions = [
    {
      label: 'View',
      icon: Eye,
      variant: 'ghost',
      onClick: (row) => navigate(`/accounts/vouchers/${row.id}`),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Accounts Voucher Registry"
          description="Read-only ledger of all company expense claims across all employees, departments, and workflow statuses."
          breadcrumbs={[
            { label: 'Accounts', href: '/accounts/dashboard' },
            { label: 'All Vouchers' },
          ]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllVouchers}
            icon={RefreshCw}
            isLoading={isLoading}
            title="Refresh voucher records"
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={Download}
            isLoading={isExporting}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
            title="Export filtered records to CSV"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar with all statuses enabled */}
      <FilterBar
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
      />

      {/* Vouchers Table */}
      <DataTable
        columns={columns}
        data={vouchers}
        isLoading={isLoading}
        error={error}
        onRetry={fetchAllVouchers}
        actions={tableActions}
        emptyTitle="No Vouchers Found"
        emptyDescription="There are no voucher records matching your active search and filter criteria."
      />

      {/* Pagination */}
      {!isLoading && !error && vouchers.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
