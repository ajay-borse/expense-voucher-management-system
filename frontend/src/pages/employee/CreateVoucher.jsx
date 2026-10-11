import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PlusCircle, FileText } from 'lucide-react';

export default function CreateVoucher() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Expense Voucher</h2>
          <p className="text-sm text-slate-500 mt-1">Submit a new company expense claim for managerial review.</p>
        </div>
        <Badge status="DRAFT" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Voucher Creation Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">Form Ready for Lifecycle Integration</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            This route is configured and protected. Detailed voucher creation forms and file attachments will be rendered here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
