import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { ReceiptText, FileSpreadsheet } from 'lucide-react';

export default function AccountsVouchers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Accounts Voucher Registry</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete voucher records across all employees and departments.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-emerald-600" />
            <span>Financial Ledger Table</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-slate-500">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">Accounts Ledger Ready</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Disbursement tracking, financial summary cards, and data export tables will render here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
