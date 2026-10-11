import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { Clock } from 'lucide-react';

export default function PendingApprovals() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Voucher Approvals</h2>
          <p className="text-sm text-slate-500 mt-1">
            Vouchers awaiting Director signature or rejection decision.
          </p>
        </div>
        <Badge status="PENDING_APPROVAL" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Pending Vouchers Queue</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-slate-500">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-800">Approval Queue Ready</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Director approval modal with digital signature upload and rejection reasons will render here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
