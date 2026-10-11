import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Send,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import SecureImage from '../../components/common/SecureImage';
import VoucherPrintDocument from '../../components/voucher/VoucherPrintDocument';

export default function AccountsVoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVoucherDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/vouchers/${id}`);
      if (response.data?.success && response.data?.data) {
        setVoucher(response.data.data);
      } else {
        throw new Error('Voucher details not found');
      }
    } catch (err) {
      console.error('Failed to load voucher details:', err);
      setError(
        err.response?.data?.message || err.message || 'Failed to load voucher record'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucherDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading voucher document for financial audit...
        </p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <ErrorState
        title="Could not load voucher"
        description={error || 'The requested voucher was not found or access is restricted.'}
        onRetry={fetchVoucherDetails}
      />
    );
  }

  const isApproved = voucher.status === 'APPROVED';
  const isRejected = voucher.status === 'REJECTED';
  const isPending = voucher.status === 'PENDING_APPROVAL';

  return (
    <>
      {/* ----------------------------------------------------------- */}
      {/* 1. DEDICATED A4 PRINT VIEW (Only visible during printing)    */}
      {/* ----------------------------------------------------------- */}
      <VoucherPrintDocument voucher={voucher} />

      {/* ----------------------------------------------------------- */}
      {/* 2. ON-SCREEN INTERACTIVE VIEW (Hidden during printing)       */}
      {/* ----------------------------------------------------------- */}
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:hidden">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title={`Voucher ${voucher.voucherNumber}`}
            description={`Claimant: ${voucher.createdBy?.name || 'Staff'} • Department: ${voucher.departmentName}`}
            breadcrumbs={[
              { label: 'Accounts', href: '/accounts/dashboard' },
              { label: 'All Vouchers', href: '/accounts/vouchers' },
              { label: voucher.voucherNumber },
            ]}
          />

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/accounts/vouchers')}
              icon={ArrowLeft}
            >
              Back to List
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              title="Print voucher or save as PDF"
            >
              Print / Download
            </Button>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* REJECTION REASON PANEL (If Rejected)                        */}
        {/* ----------------------------------------------------------- */}
        {isRejected && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-5 sm:p-6 shadow-xs animate-in fade-in duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600 shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                    <span>Voucher Rejected by Director</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-200 text-rose-900">
                      Disallowed Claim
                    </span>
                  </h3>
                  {voucher.approvalDate && (
                    <span className="text-xs text-rose-700 font-medium">
                      Evaluated on {formatDateTime(voucher.approvalDate)}
                    </span>
                  )}
                </div>

                <div className="pt-1 text-sm text-rose-900 leading-relaxed font-medium bg-white/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                  <p className="text-xs uppercase font-bold tracking-wider text-rose-600 mb-1">
                    Director Justification / Feedback:
                  </p>
                  <p className="whitespace-pre-line text-rose-950">
                    {voucher.rejectionReason || 'No specific rejection reason provided.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* DOCUMENT-STYLE CARD (Read-only presentation)                */}
        {/* ----------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-900/60 px-2.5 py-1 rounded-md border border-teal-700/50">
                    Financial Audit Record
                  </span>
                  <StatusBadge status={voucher.status} size="md" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
                  {voucher.voucherNumber}
                </h1>
                <p className="text-xs text-slate-300">
                  Department:{' '}
                  <span className="font-semibold text-white">
                    {voucher.departmentName}
                  </span>{' '}
                  • Claimant:{' '}
                  <span className="font-semibold text-white">
                    {voucher.createdBy?.name || 'Employee'}
                  </span>
                </p>
              </div>

              {/* Emphasized Amount */}
              <div className="sm:text-right bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shadow-inner">
                <span className="block text-xs font-semibold uppercase tracking-wider text-teal-200">
                  Total Claim Amount
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-xs font-mono">
                  {formatCurrency(voucher.amount)}
                </span>
                <span className="block text-[11px] text-teal-200/80 mt-0.5">
                  Indian Rupees (INR)
                </span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div>
                <span className="block text-xs font-medium text-slate-500">Voucher Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(voucher.voucherDate || voucher.createdAt)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Expense Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(voucher.expenseDate)}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Expense Category</span>
                <span className="font-semibold text-slate-800">
                  {voucher.expenseCategory}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">Claimant ID</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {voucher.createdBy?.employeeId || '—'}
                </span>
              </div>
            </div>

            {/* Expense Title & Description */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Expense Title
                </h2>
                <p className="text-xl font-bold text-slate-900">
                  {voucher.expenseTitle}
                </p>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expense Description & Business Justification
                </h2>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {voucher.expenseDescription || (
                    <span className="text-slate-400 italic">No description provided.</span>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* DIGITAL SIGNATURE BLOCKS                                  */}
            {/* --------------------------------------------------------- */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Digital Signatures & Authorization Blocks</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Claimant Signature Block */}
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        1. Claimant Signature
                      </span>
                      {voucher.employeeSignatureUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Unsigned
                        </span>
                      )}
                    </div>

                    <div className="h-28 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-3 shadow-2xs overflow-hidden">
                      {voucher.employeeSignatureUrl ? (
                        <SecureImage
                          src={voucher.employeeSignatureUrl}
                          alt="Employee Signature"
                          className="max-h-full max-w-full"
                          fallbackLabel="Employee Signature Verified"
                        />
                      ) : (
                        <p className="text-center text-slate-400 text-xs italic">
                          No employee signature on record
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {voucher.createdBy?.name || 'Employee'}
                    </p>
                    <p className="text-slate-500">
                      {voucher.departmentName} • {voucher.createdBy?.email || 'claimant'}
                    </p>
                    {voucher.submittedAt && (
                      <p className="text-[11px] text-slate-400 pt-1">
                        Submitted: {formatDateTime(voucher.submittedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Director Authorization Block */}
                <div
                  className={`rounded-2xl border p-5 flex flex-col justify-between ${
                    isApproved
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        2. Director Authorization
                      </span>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Approved
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Awaiting Review
                        </span>
                      )}
                    </div>

                    <div className="h-28 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-3 shadow-2xs overflow-hidden">
                      {isApproved && voucher.directorSignatureUrl ? (
                        <SecureImage
                          src={voucher.directorSignatureUrl}
                          alt="Director Signature"
                          className="max-h-full max-w-full"
                          fallbackLabel="Director Authorized Signature"
                        />
                      ) : isApproved ? (
                        <div className="text-center text-emerald-700">
                          <ShieldCheck className="w-8 h-8 mx-auto mb-1" />
                          <p className="text-xs font-bold">Approved & Authorized</p>
                        </div>
                      ) : isRejected ? (
                        <div className="text-center text-rose-600">
                          <XCircle className="w-8 h-8 mx-auto mb-1" />
                          <p className="text-xs font-bold">Claim Disallowed</p>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 text-xs italic">
                          Pending director authorization
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {voucher.approvedBy?.name || (isApproved ? 'Executive Director' : 'Reviewing Director')}
                    </p>
                    <p className="text-slate-500">
                      {voucher.approvedBy?.department || 'Executive Management'}
                    </p>
                    {voucher.approvalDate && (
                      <p className="text-[11px] text-slate-400 pt-1">
                        {isApproved ? 'Approved: ' : 'Evaluated: '}
                        {formatDateTime(voucher.approvalDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* ACTIVITY & AUDIT TRAIL TIMELINE                           */}
            {/* --------------------------------------------------------- */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Financial Activity Audit Trail</span>
              </h2>

              {voucher.activities && voucher.activities.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {voucher.activities.map((activity, index) => {
                    let badgeColor = 'bg-slate-500';
                    let icon = <Clock className="w-3 h-3 text-white" />;

                    switch (activity.action) {
                      case 'CREATED':
                        badgeColor = 'bg-slate-600';
                        break;
                      case 'UPDATED':
                        badgeColor = 'bg-blue-600';
                        break;
                      case 'SUBMITTED':
                        badgeColor = 'bg-indigo-600';
                        icon = <Send className="w-3 h-3 text-white" />;
                        break;
                      case 'APPROVED':
                        badgeColor = 'bg-emerald-600';
                        icon = <CheckCircle2 className="w-3 h-3 text-white" />;
                        break;
                      case 'REJECTED':
                        badgeColor = 'bg-rose-600';
                        icon = <XCircle className="w-3 h-3 text-white" />;
                        break;
                      default:
                        break;
                    }

                    return (
                      <div key={activity.id || index} className="relative group">
                        <span
                          className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full ${badgeColor} ring-4 ring-white shadow-xs`}
                        >
                          {icon}
                        </span>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-sm shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{activity.action}</span>
                              <span className="text-xs font-normal text-slate-500">
                                by {activity.user?.name || 'User'} ({activity.user?.role || 'System'})
                              </span>
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>

                          {activity.remark && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                              {activity.remark}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No audit trail history recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
