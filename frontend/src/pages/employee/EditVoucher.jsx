import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import VoucherForm from '../../components/voucher/VoucherForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function EditVoucher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVoucher = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/vouchers/${id}`);
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        if (data.status !== 'DRAFT') {
          toast.warning('Only vouchers in DRAFT status can be modified.');
          navigate(`/employee/vouchers/${id}`, { replace: true });
          return;
        }
        setVoucher(data);
      } else {
        throw new Error('Voucher data not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch voucher');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading draft voucher...
        </p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <ErrorState
        title="Could not load voucher"
        description={error || 'Voucher not found or access denied.'}
        onRetry={fetchVoucher}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit Draft: ${voucher.voucherNumber}`}
        description="Update your draft voucher information before submitting for Director review."
        breadcrumbs={[
          { label: 'Dashboard', href: '/employee/dashboard' },
          { label: 'My Vouchers', href: '/employee/vouchers' },
          { label: voucher.voucherNumber, href: `/employee/vouchers/${id}` },
          { label: 'Edit' },
        ]}
      />

      <VoucherForm
        initialData={voucher}
        isEdit={true}
        voucherId={id}
      />
    </div>
  );
}
