import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Clock, FileCheck2, User, Building, Mail, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DirectorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              Executive Portal
            </span>
            <Badge role={user?.role} size="sm" className="bg-purple-400/20 text-purple-200 border-purple-400/30" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Director Overview — {user?.name}
          </h2>
          <p className="text-purple-200 text-sm mt-1">
            Review pending voucher submissions, authorize corporate claims, and inspect audit activity.
          </p>
        </div>

        <Link to="/director/vouchers/pending">
          <Button
            variant="secondary"
            size="md"
            icon={Clock}
            className="bg-white text-purple-800 hover:bg-purple-50 font-semibold shadow-sm"
          >
            Review Pending
          </Button>
        </Link>
      </div>

      {/* Profile & Fast Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Executive Information</CardTitle>
            <Badge role={user?.role} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <User className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-500 block">Director Name</span>
                  <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-500 block">Email Address</span>
                  <span className="font-semibold text-slate-800 truncate">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Building className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-500 block">Department</span>
                  <span className="font-semibold text-slate-800">{user?.department || 'Executive Management'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs text-slate-500 block">Authorization Level</span>
                  <span className="font-semibold text-slate-800">Final Claim Approver</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/director/vouchers/pending"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700">
                  Pending Approvals
                </span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-purple-600">→</span>
            </Link>

            <Link
              to="/director/vouchers"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-purple-700">
                  All System Vouchers
                </span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-purple-600">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
