import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Building,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Send,
  FileCheck,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import SecureImage from '../../components/common/SecureImage';
import SignatureUpload from '../../components/common/SignatureUpload';
import VoucherPrintDocument from '../../components/voucher/VoucherPrintDocument';

export default function DirectorVoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Approval modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [directorSignatureFile, setDirectorSignatureFile] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState(null);

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
        err.response?.data?.message || err.message || 'Failed to load voucher document'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucherDetails();
  }, [id]);

  // Handle Approve Submission
  const handleConfirmApproval = async () => {
    if (!directorSignatureFile) {
      setApproveError('Please select a valid digital signature file.');
      return;
    }

    setIsApproving(true);
    setApproveError(null);

    try {
      const formData = new FormData();
      formData.append('signature', directorSignatureFile);

      const response = await api.post(`/vouchers/${id}/approve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data?.message || 'Voucher approved successfully!');
      setShowApproveModal(false);
      setDirectorSignatureFile(null);

      // Refetch voucher details to ensure fresh backend state
      await fetchVoucherDetails();
    } catch (err) {
      console.error('Approval failed:', err);
      const errMsg =
        err.response?.data?.message || err.message || 'Failed to approve voucher';
      setApproveError(errMsg);
      toast.error(errMsg);

      // If voucher is no longer pending (e.g. 409 Conflict), refresh view
      if (err.response?.status === 409) {
        await fetchVoucherDetails();
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Rejection Submission
  const trimmedReason = rejectionReason.trim();
  const isReasonValid = trimmedReason.length >= 5;

  const handleConfirmRejection = async () => {
    setReasonTouched(true);
    if (!isReasonValid) {
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    try {
      const response = await api.post(`/vouchers/${id}/reject`, {
        rejectionReason: trimmedReason,
      });

      toast.success(response.data?.message || 'Voucher rejected.');
      setShowRejectModal(false);
      setRejectionReason('');
      setReasonTouched(false);

      // Refetch voucher details to ensure fresh backend state
      await fetchVoucherDetails();
    } catch (err) {
      console.error('Rejection failed:', err);
      const errMsg =
        err.response?.data?.message || err.message || 'Failed to reject voucher';
      setRejectError(errMsg);
      toast.error(errMsg);

      // If voucher is no longer pending (e.g. 409 Conflict), refresh view
      if (err.response?.status === 409) {
        await fetchVoucherDetails();
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading voucher document for executive review...
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

  const isPending = voucher.status === 'PENDING_APPROVAL';
  const isApproved = voucher.status === 'APPROVED';
  const isRejected = voucher.status === 'REJECTED';
  const isDraft = voucher.status === 'DRAFT';

  return (
    <>
      <VoucherPrintDocument voucher={voucher} />
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:hidden">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <PageHeader
          title={`Review Voucher ${voucher.voucherNumber}`}
          description={`Submitted by ${voucher.createdBy?.name || 'Employee'} (${voucher.departmentName})`}
          breadcrumbs={[
            { label: 'Director', href: '/director/dashboard' },
            { label: 'Pending Approvals', href: '/director/vouchers/pending' },
            { label: voucher.voucherNumber },
          ]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
          >
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
            title="Print or export voucher"
          >
            Print
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REJECTION REASON CALLOUT (when REJECTED) */}
      {/* ------------------------------------------------------------- */}
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
                    Decision Logged
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
                  Reason for Rejection:
                </p>
                <p className="whitespace-pre-line text-rose-950">
                  {voucher.rejectionReason || 'No specific reason provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* OFFICIAL DOCUMENT-STYLE VOUCHER CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Document Header Band */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-md border border-indigo-700/50">
                  Executive Voucher Review
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

            {/* Emphasized Total Amount */}
            <div className="sm:text-right bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shadow-inner">
              <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Claim Amount Requested
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-xs">
                {formatCurrency(voucher.amount)}
              </span>
              <span className="block text-[11px] text-indigo-200/80 mt-0.5">
                Indian Rupees (INR)
              </span>
            </div>
          </div>
        </div>

        {/* Voucher Body: Read-only Information */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Meta Information Strip */}
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

          {/* Expense Title & Description (Strictly Read-Only) */}
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
                Expense Description & Justification
              </h2>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap select-text">
                {voucher.expenseDescription || (
                  <span className="text-slate-400 italic">No description provided.</span>
                )}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* DIGITAL SIGNATURE BLOCKS */}
          {/* ----------------------------------------------------------- */}
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Digital Authorization & Signatures</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Employee / Claimant Signature Block */}
              <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      1. Claimant Signature
                    </span>
                    {voucher.employeeSignatureUrl ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Signed & Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Unsigned
                      </span>
                    )}
                  </div>

                  {/* Claimant Signature Canvas */}
                  <div className="h-28 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-3 shadow-2xs overflow-hidden">
                    {voucher.employeeSignatureUrl ? (
                      <SecureImage
                        src={voucher.employeeSignatureUrl}
                        alt="Employee Digital Signature"
                        className="max-h-full max-w-full"
                        fallbackLabel="Employee Signature Verified"
                      />
                    ) : (
                      <p className="text-center text-slate-400 text-xs italic">
                        No claimant signature attached
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">
                    {voucher.createdBy?.name || 'Employee'}
                  </p>
                  <p className="text-slate-500">
                    {voucher.departmentName} Dept •{' '}
                    {voucher.createdBy?.email || 'claimant'}
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
                    : isPending
                    ? 'border-amber-200 bg-amber-50/20'
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
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 animate-spin" /> Awaiting Your Decision
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Draft Stage
                      </span>
                    )}
                  </div>

                  {/* Director Signature Visual Canvas */}
                  <div className="h-28 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-3 shadow-2xs overflow-hidden">
                    {isApproved && voucher.directorSignatureUrl ? (
                      <SecureImage
                        src={voucher.directorSignatureUrl}
                        alt="Director Digital Signature"
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
                        <p className="text-xs font-bold">Claim Rejected</p>
                      </div>
                    ) : (
                      <div className="text-center text-amber-600/80">
                        <Clock className="w-7 h-7 mx-auto mb-1" />
                        <p className="text-xs font-semibold">Requires Director Signature</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">
                    {voucher.approvedBy?.name || (isPending ? user?.name : 'Executive Reviewer')}
                  </p>
                  <p className="text-slate-500">
                    {voucher.approvedBy?.department || user?.department || 'Executive Management'}
                  </p>
                  {voucher.approvalDate && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      {isApproved ? 'Approved on: ' : 'Evaluated on: '}
                      {formatDateTime(voucher.approvalDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* ACTIVITY AUDIT TIMELINE */}
          {/* ----------------------------------------------------------- */}
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Activity & Audit Trail</span>
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
              <p className="text-xs text-slate-400 italic">No activity history recorded yet.</p>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* EXECUTIVE ACTIONS FOOTER: Only visible when PENDING_APPROVAL */}
        {/* ------------------------------------------------------------- */}
        {isPending && (
          <div className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                This voucher is awaiting executive review. Approving requires affixing your digital signature image.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Reject Action Button */}
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => {
                  setRejectError(null);
                  setShowRejectModal(true);
                }}
                icon={XCircle}
                className="flex-1 sm:flex-none"
              >
                Reject Voucher
              </Button>

              {/* Approve Action Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  setApproveError(null);
                  setShowApproveModal(true);
                }}
                icon={CheckCircle2}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Approve Voucher
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. APPROVE CONFIRMATION MODAL (MANDATORY DIRECTOR SIGNATURE) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          if (!isApproving) {
            setShowApproveModal(false);
            setApproveError(null);
          }
        }}
        title="Approve Voucher & Affix Signature"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold text-indigo-950 text-sm">
              Authorizing Claim: {voucher.voucherNumber}
            </p>
            <p>
              Claimant: <strong>{voucher.createdBy?.name}</strong> • Amount:{' '}
              <strong>{formatCurrency(voucher.amount)}</strong>
            </p>
            <p className="text-indigo-800 pt-1">
              As Director, corporate governance requires uploading your digital signature file (PNG, JPG, max 2MB) to authorize this disbursement.
            </p>
          </div>

          {approveError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{approveError}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Select Director Signature Image <span className="text-rose-500">*</span>
            </label>
            <SignatureUpload
              onFileSelect={(file) => {
                setDirectorSignatureFile(file);
                setApproveError(null);
              }}
              onFileRemove={() => setDirectorSignatureFile(null)}
              disabled={isApproving}
              required={true}
              label="Director Signature Image"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowApproveModal(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleConfirmApproval}
              isLoading={isApproving}
              disabled={!directorSignatureFile || isApproving}
              icon={CheckCircle2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Confirm & Authorize
            </Button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* 2. REJECT CONFIRMATION MODAL (MANDATORY REASON >= 5 CHARS) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          if (!isRejecting) {
            setShowRejectModal(false);
            setRejectError(null);
          }
        }}
        title="Reject Expense Voucher"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs text-rose-900 space-y-1">
            <p className="font-semibold text-rose-950 text-sm">
              Rejecting Claim: {voucher.voucherNumber}
            </p>
            <p>
              Claimant: <strong>{voucher.createdBy?.name}</strong> • Amount:{' '}
              <strong>{formatCurrency(voucher.amount)}</strong>
            </p>
            <p className="text-rose-800 pt-1">
              Please provide clear justification. This feedback will be recorded in the audit trail and displayed directly to the employee.
            </p>
          </div>

          {rejectError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{rejectError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="rejectionReasonInput"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Rejection Reason & Feedback <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="rejectionReasonInput"
              rows={4}
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                setReasonTouched(true);
                setRejectError(null);
              }}
              placeholder="Explain why this expense claim is being rejected (minimum 5 characters)..."
              disabled={isRejecting}
              className={`block w-full p-3 text-sm rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                reasonTouched && !isReasonValid
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Minimum 5 characters (excluding whitespace)</span>
              <span>{trimmedReason.length}/1000</span>
            </div>
            {reasonTouched && !isReasonValid && (
              <p className="text-xs text-rose-600 font-medium pt-0.5">
                Rejection reason must be at least 5 characters after trimming.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowRejectModal(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={handleConfirmRejection}
              isLoading={isRejecting}
              disabled={!isReasonValid || isRejecting}
              icon={XCircle}
              className="font-semibold"
            >
              Reject Claim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
}
