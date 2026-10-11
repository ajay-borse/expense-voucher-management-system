import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Receipt, ListFilter } from 'lucide-react';

export default function MyVouchers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Vouchers</h2>
          <p className="text-sm text-slate-500 mt-1">Review the status and history of all vouchers submitted by you.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Vouchers Record List</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-slate-500">
          <ListFilter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">My Vouchers List Ready</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Role-scoped listing, filtering, search, and pagination table will render here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
