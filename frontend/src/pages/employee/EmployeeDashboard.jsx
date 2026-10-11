import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { PlusCircle, Receipt, User, Building, Mail, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              Employee Portal
            </span>
            <Badge role={user?.role} size="sm" className="bg-sky-400/20 text-sky-200 border-sky-400/30" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-indigo-200 text-sm mt-1">
            Track, create, and manage your company expense vouchers.
          </p>
        </div>

        <Link to="/employee/vouchers/create">
          <Button
            variant="secondary"
            size="md"
            icon={PlusCircle}
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm"
          >
            Create Voucher
          </Button>
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Employee Profile Overview</CardTitle>
            <Badge role={user?.role} />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Full Name</span>
                  <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Email Address</span>
                  <span className="font-semibold text-slate-800 truncate">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Department</span>
                  <span className="font-semibold text-slate-800">{user?.department || 'Engineering'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Employee ID</span>
                  <span className="font-semibold text-slate-800">{user?.employeeId || 'EMP-001'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/employee/vouchers/create"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                  New Expense Voucher
                </span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-indigo-600">→</span>
            </Link>

            <Link
              to="/employee/vouchers"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                  View My Vouchers
                </span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-indigo-600">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
