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
  Edit2,
  Trash2,
  Send,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Info,
  DollarSign,
  Tag,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import ConfirmModal from '../../components/common/ConfirmModal';
import Modal from '../../components/common/Modal';
import SecureImage from '../../components/common/SecureImage';
import SignatureUpload from '../../components/common/SignatureUpload';
import VoucherPrintDocument from '../../components/voucher/VoucherPrintDocument';

export default function VoucherDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Draft actions state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSignatureBlocker, setShowSignatureBlocker] = useState(false);
  const [showUploadSignatureModal, setShowUploadSignatureModal] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [tempSignatureFile, setTempSignatureFile] = useState(null);

  const fetchVoucher = async () => {
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
      setError(
        err.response?.data?.message || err.message || 'Failed to load voucher details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoucher();
  }, [id]);

  // Handle Delete Draft
  const handleDeleteDraft = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Draft voucher deleted successfully');
      navigate('/employee/vouchers', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete draft voucher');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Check and initiate submit
  const handleInitiateSubmit = () => {
    // Check if employee has a registered signature on file
    const hasSignature = !!user?.signatureUrl || !!voucher?.employeeSignatureUrl;
    if (!hasSignature) {
      setShowSignatureBlocker(true);
      return;
    }
    setShowSubmitModal(true);
  };

  // Execute Submit for Approval
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post(`/vouchers/${id}/submit`);
      toast.success(response.data?.message || 'Voucher submitted for Director approval!');
      setShowSubmitModal(false);
      await fetchVoucher();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to submit voucher for approval'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload user signature modal submission
  const handleSaveUploadedSignature = async () => {
    if (!tempSignatureFile) {
      toast.error('Please choose a valid signature file first');
      return;
    }
    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('signature', tempSignatureFile);
      const res = await api.post('/users/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Digital signature uploaded successfully!');
      setShowUploadSignatureModal(false);
      setTempSignatureFile(null);
      // Now open confirmation modal
      setShowSubmitModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
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
          Loading voucher document...
        </p>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <ErrorState
        title="Could not load voucher"
        description={error || 'The requested voucher was not found or access is restricted.'}
        onRetry={fetchVoucher}
      />
    );
  }

  const isDraft = voucher.status === 'DRAFT';
  const isRejected = voucher.status === 'REJECTED';
  const isApproved = voucher.status === 'APPROVED';
  const isPending = voucher.status === 'PENDING_APPROVAL';

  return (
    <>
      <VoucherPrintDocument voucher={voucher} />
      <div className="space-y-6 max-w-5xl mx-auto pb-12 print:hidden">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <PageHeader
          title={`Voucher ${voucher.voucherNumber}`}
          description={`Created on ${formatDate(voucher.voucherDate || voucher.createdAt)}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/employee/dashboard' },
            { label: 'My Vouchers', href: '/employee/vouchers' },
            { label: voucher.voucherNumber },
          ]}
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employee/vouchers')}
            icon={ArrowLeft}
          >
            Back
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
            title="Print or save as PDF"
          >
            Print
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REJECTION REASON CALLOUT (prominent red-tinted panel) */}
      {/* ------------------------------------------------------------- */}
      {isRejected && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-5 sm:p-6 shadow-xs transition-all animate-in fade-in duration-300"
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
                    Action Required
                  </span>
                </h3>
                {voucher.approvalDate && (
                  <span className="text-xs text-rose-700 font-medium">
                    Reviewed on {formatDateTime(voucher.approvalDate)}
                  </span>
                )}
              </div>

              <div className="pt-1 text-sm text-rose-900 leading-relaxed font-medium bg-white/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                <p className="text-xs uppercase font-bold tracking-wider text-rose-600 mb-1">
                  Reason for Rejection:
                </p>
                <p className="whitespace-pre-line text-rose-950">
                  {voucher.rejectionReason || 'No specific reason provided by director.'}
                </p>
              </div>

              <p className="text-xs text-rose-700 pt-1">
                Note: This voucher cannot be edited directly. To resubmit, please review the director feedback above and create a new voucher with the corrected expense details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* OFFICIAL DOCUMENT-STYLE VOUCHER CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Document Header Band */}
        <div className="border-b border-slate-200 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-md border border-indigo-700/50">
                  Official Expense Voucher
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
                • Claimed by:{' '}
                <span className="font-semibold text-white">
                  {voucher.createdBy?.name || 'Employee'}
                </span>
              </p>
            </div>

            {/* Emphasized Amount Display */}
            <div className="sm:text-right bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shadow-inner">
              <span className="block text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Total Claim Amount
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

        {/* Voucher Body Details */}
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
              <span className="block text-xs font-medium text-slate-500">Employee ID</span>
              <span className="font-semibold text-slate-800 font-mono">
                {voucher.createdBy?.employeeId || '—'}
              </span>
            </div>
          </div>

          {/* Expense Description Section */}
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
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {voucher.expenseDescription || (
                  <span className="text-slate-400 italic">No description provided.</span>
                )}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------- */}
          {/* DIGITAL SIGNATURE BLOCKS (Employee & Director) */}
          {/* ----------------------------------------------------------- */}
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Digital Authorization & Signatures</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Signature Card */}
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
                        <Clock className="w-3 h-3" /> Not Signed
                      </span>
                    )}
                  </div>

                  {/* Signature Visual Canvas */}
                  <div className="h-28 w-full rounded-xl border border-slate-200 bg-white flex items-center justify-center p-3 shadow-2xs overflow-hidden">
                    {voucher.employeeSignatureUrl ? (
                      <SecureImage
                        src={voucher.employeeSignatureUrl}
                        alt="Employee Digital Signature"
                        className="max-h-full max-w-full"
                        fallbackLabel="Employee Signature on Record"
                      />
                    ) : (
                      <div className="text-center text-slate-400 text-xs">
                        <p className="italic">Signature required upon submission</p>
                      </div>
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
                      Submitted on: {formatDateTime(voucher.submittedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Director Authorization Card */}
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
                      2. Director Approval
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
                        <Clock className="w-3 h-3" /> Awaiting Review
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
                        <p className="text-xs font-bold">Authorized & Approved</p>
                      </div>
                    ) : isRejected ? (
                      <div className="text-center text-rose-600">
                        <XCircle className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-xs font-bold">Rejected by Director</p>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 text-xs">
                        <p className="italic">
                          {isPending
                            ? 'Pending Director authorization'
                            : 'Will be reviewed after submission'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">
                    {voucher.approvedBy?.name ||
                      (isApproved ? 'Executive Director' : 'Director Reviewer')}
                  </p>
                  <p className="text-slate-500">
                    {voucher.approvedBy?.department || 'Executive Management'}
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
                      {/* Timeline node */}
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
        {/* DRAFT ACTIONS FOOTER (Edit / Delete / Submit for Draft only) */}
        {/* ------------------------------------------------------------- */}
        {isDraft && (
          <div className="border-t border-slate-200 bg-slate-50/80 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                This voucher is in <strong>Draft</strong> mode. You can edit, delete, or submit it for Director review.
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Delete Draft Button */}
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => setShowDeleteModal(true)}
                icon={Trash2}
                className="flex-1 sm:flex-none"
              >
                Delete Draft
              </Button>

              {/* Edit Draft Button */}
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate(`/employee/vouchers/${id}/edit`)}
                icon={Edit2}
                className="flex-1 sm:flex-none"
              >
                Edit Draft
              </Button>

              {/* Submit for Approval Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleInitiateSubmit}
                icon={Send}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Submit for Approval
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* 1. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Draft Voucher?"
        message={`Are you sure you want to permanently delete draft voucher "${voucher.voucherNumber}"? This action cannot be undone.`}
        confirmText="Yes, Delete Draft"
        cancelText="Keep Draft"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteDraft}
        onClose={() => setShowDeleteModal(false)}
      />

      {/* 2. Submit for Approval Confirmation Modal */}
      <ConfirmModal
        isOpen={showSubmitModal}
        title="Submit Voucher for Director Approval?"
        message={`You are submitting "${voucher.voucherNumber}" for ₹${Number(voucher.amount).toLocaleString('en-IN')}. Your registered digital signature will be affixed to this document. Once submitted, you will not be able to modify the voucher details.`}
        confirmText="Confirm & Submit"
        cancelText="Go Back"
        variant="primary"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* 3. Signature Blocker Explanation Modal */}
      <Modal
        isOpen={showSignatureBlocker}
        onClose={() => setShowSignatureBlocker(false)}
        title="Digital Signature Required"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Signature Missing</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Company policy requires an employee digital signature on all expense vouchers prior to director review. Please upload your digital signature to proceed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSignatureBlocker(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowSignatureBlocker(false);
                setShowUploadSignatureModal(true);
              }}
            >
              Upload Signature Now
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Inline Signature Upload Modal */}
      <Modal
        isOpen={showUploadSignatureModal}
        onClose={() => setShowUploadSignatureModal(false)}
        title="Upload Digital Signature"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Upload an image of your physical signature on a plain white background (PNG or JPG format, max 2MB).
          </p>

          <SignatureUpload
            onFileSelect={(file) => setTempSignatureFile(file)}
            onFileRemove={() => setTempSignatureFile(null)}
            isUploading={isUploadingSignature}
            required={true}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setShowUploadSignatureModal(false)}
              disabled={isUploadingSignature}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveUploadedSignature}
              isLoading={isUploadingSignature}
              disabled={!tempSignatureFile}
            >
              Save & Attach Signature
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </>
  );
}
