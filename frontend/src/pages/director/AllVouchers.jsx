import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { FileCheck2, Filter } from 'lucide-react';

export default function AllVouchers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">All Organization Vouchers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Global view across all departments and statuses.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            <span>Master Voucher Registry</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-slate-500">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">Organization Registry Ready</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Full-text search, departmental filters, date boundaries, and CSV/PDF export options will render here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
