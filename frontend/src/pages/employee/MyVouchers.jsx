import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, Edit2, Trash2, PlusCircle, Receipt } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function MyVouchers() {
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
  const [error, setError] = useState(null);

  // Delete modal state
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch vouchers whenever searchParams change
  const fetchVouchers = async () => {
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
      console.error('Failed to load vouchers:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
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
      p.delete('page'); // Reset to page 1
      return p;
    });
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!voucherToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      await api.delete(`/vouchers/${voucherToDelete.id}`);
      toast.success(`Draft voucher ${voucherToDelete.voucherNumber} deleted successfully`);
      setVoucherToDelete(null);
      // Refresh list
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete draft voucher');
    } finally {
      setIsDeleting(false);
    }
  };

  // Columns definition for DataTable
  const columns = [
    {
      key: 'voucherNumber',
      header: 'Voucher No',
      render: (row) => (
        <Link
          to={`/employee/vouchers/${row.id}`}
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
      key: 'expenseTitle',
      header: 'Expense Title',
      render: (row) => (
        <div className="max-w-xs truncate font-medium text-slate-900" title={row.expenseTitle}>
          {row.expenseTitle}
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      mobileLabel: 'Dept',
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
      render: (row) => formatDate(row.expenseDate),
    },
  ];

  // Actions for table rows:
  // - View: always available
  // - Edit: only for DRAFT
  // - Delete: only for DRAFT
  const tableActions = [
    {
      label: 'View',
      icon: Eye,
      variant: 'ghost',
      onClick: (row) => navigate(`/employee/vouchers/${row.id}`),
    },
    {
      label: 'Edit',
      icon: Edit2,
      variant: 'ghost',
      className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50',
      hidden: (row) => row.status !== 'DRAFT',
      onClick: (row) => navigate(`/employee/vouchers/${row.id}/edit`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'ghost',
      className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
      hidden: (row) => row.status !== 'DRAFT',
      onClick: (row) => setVoucherToDelete(row),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Expense Vouchers"
        description="Search, filter, track, and manage all your submitted and draft expense vouchers."
        breadcrumbs={[
          { label: 'Dashboard', href: '/employee/dashboard' },
          { label: 'My Vouchers' },
        ]}
        primaryAction={{
          label: 'Create Voucher',
          icon: PlusCircle,
          onClick: () => navigate('/employee/vouchers/create'),
        }}
      />

      {/* Synchronized FilterBar */}
      <FilterBar
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
      />

      {/* Vouchers Data Table */}
      <DataTable
        columns={columns}
        data={vouchers}
        isLoading={isLoading}
        error={error}
        onRetry={fetchVouchers}
        emptyTitle="No vouchers found"
        emptyDescription="Try adjusting your search criteria, or create a new voucher."
        actions={tableActions}
      />

      {/* Pagination Controls */}
      {!isLoading && !error && vouchers.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!voucherToDelete}
        title="Delete Draft Voucher?"
        message={`Are you sure you want to delete draft voucher ${voucherToDelete?.voucherNumber} ("${voucherToDelete?.expenseTitle}")? This cannot be undone.`}
        confirmLabel="Delete Voucher"
        cancelLabel="Keep Draft"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setVoucherToDelete(null)}
      />
    </div>
  );
}
