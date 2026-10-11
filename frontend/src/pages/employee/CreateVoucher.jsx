import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import VoucherForm from '../../components/voucher/VoucherForm';

export default function CreateVoucher() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Expense Voucher"
        description="Fill out the voucher details below. You can save your work as a draft or submit immediately for Director approval."
        breadcrumbs={[
          { label: 'Dashboard', href: '/employee/dashboard' },
          { label: 'My Vouchers', href: '/employee/vouchers' },
          { label: 'Create Voucher' },
        ]}
      />

      <VoucherForm isEdit={false} />
    </div>
  );
}
