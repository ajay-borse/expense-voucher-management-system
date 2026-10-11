import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, FileCheck2, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';

export default function AllVouchers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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
      console.error('Failed to load all vouchers:', err);
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

  // Columns definition for DataTable
  const columns = [
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
        <span className="font-bold text-slate-900">
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

  const tableActions = [
    {
      label: 'View',
      icon: Eye,
      variant: 'ghost',
      onClick: (row) => navigate(`/director/vouchers/${row.id}`),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="All Organization Vouchers"
          description="Complete registry of all vouchers across all departments, employees, and workflow statuses."
          breadcrumbs={[
            { label: 'Director', href: '/director/dashboard' },
            { label: 'All Vouchers' },
          ]}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllVouchers}
          icon={RefreshCw}
          isLoading={isLoading}
          className="self-start sm:self-auto"
        >
          Refresh List
        </Button>
      </div>

      {/* Filter Bar with all statuses enabled (no fixedStatus) */}
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
        emptyDescription="There are no vouchers matching your active search and filter criteria."
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
