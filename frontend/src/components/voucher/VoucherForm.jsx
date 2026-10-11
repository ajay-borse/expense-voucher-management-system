import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  DollarSign,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Send,
  Save,
  X,
  FileCheck2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../common/Card';
import ConfirmModal from '../common/ConfirmModal';
import Modal from '../common/Modal';
import SignatureUpload from '../common/SignatureUpload';

const CATEGORY_OPTIONS = [
  'Software & SaaS',
  'Hardware & Equipment',
  'Travel & Transport',
  'Office Supplies',
  'Client Entertainment',
  'Utilities',
  'Marketing & Advertising',
  'Consulting & Professional Services',
  'Training & Education',
  'Other',
];

// Zod validation schema matching backend constraints
const voucherFormSchema = z.object({
  departmentName: z
    .string()
    .trim()
    .min(1, 'Department name is required'),
  expenseTitle: z
    .string()
    .trim()
    .min(1, 'Expense title is required'),
  expenseCategory: z
    .string()
    .trim()
    .min(1, 'Please select an expense category'),
  amount: z
    .union([
      z.number({ invalid_type_error: 'Amount must be a valid number' }),
      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
    ])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Amount must be greater than zero',
    }),
  expenseDate: z
    .string()
    .min(1, 'Expense date is required')
    .refine((val) => {
      const selected = new Date(val);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return selected <= endOfToday;
    }, { message: 'Expense date cannot be in the future' }),
  expenseDescription: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

export default function VoucherForm({
  initialData = null,
  isEdit = false,
  voucherId = null,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showSignatureBlockerModal, setShowSignatureBlockerModal] = useState(false);
  const [showUploadSignatureModal, setShowUploadSignatureModal] = useState(false);
  const [userSignatureUrl, setUserSignatureUrl] = useState(user?.signatureUrl || null);
  const [tempSignatureFile, setTempSignatureFile] = useState(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // Today's date in YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(voucherFormSchema),
    defaultValues: {
      departmentName: initialData?.departmentName || user?.department || 'Engineering',
      expenseTitle: initialData?.expenseTitle || '',
      expenseCategory: initialData?.expenseCategory || '',
      amount: initialData?.amount ? String(initialData.amount) : '',
      expenseDate: initialData?.expenseDate
        ? new Date(initialData.expenseDate).toISOString().split('T')[0]
        : todayDateStr,
      expenseDescription: initialData?.expenseDescription || '',
    },
  });

  // Re-fetch latest signature status on mount
  useEffect(() => {
    const checkSignatureStatus = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.data?.signatureUrl) {
          setUserSignatureUrl(res.data.data.signatureUrl);
        }
      } catch (e) {
        // Fallback to context user signature
      }
    };
    checkSignatureStatus();
  }, []);

  /**
   * Save voucher as DRAFT (Create or Update).
   */
  const onSaveDraft = async (formData) => {
    setIsSavingDraft(true);
    try {
      const payload = {
        departmentName: formData.departmentName.trim(),
        expenseTitle: formData.expenseTitle.trim(),
        expenseCategory: formData.expenseCategory.trim(),
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        expenseDescription: formData.expenseDescription?.trim() || null,
      };

      let response;
      if (isEdit && voucherId) {
        response = await api.put(`/vouchers/${voucherId}`, payload);
        toast.success('Draft voucher updated successfully');
      } else {
        response = await api.post('/vouchers', payload);
        toast.success('Voucher created and saved as Draft');
      }

      navigate('/employee/vouchers', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  /**
   * Pre-validation before submitting for approval.
   * Checks if user has a registered signature.
   */
  const onTriggerSubmitForApproval = (formData) => {
    // If employee does not have a signature on file, block submission
    if (!userSignatureUrl) {
      setShowSignatureBlockerModal(true);
      return;
    }
    // Open confirmation modal
    setShowConfirmSubmit(true);
  };

  /**
   * Confirmed Submission:
   * 1. Saves or updates draft voucher
   * 2. Calls POST /api/vouchers/:id/submit
   */
  const handleConfirmedSubmit = async () => {
    setIsSubmittingApproval(true);
    setShowConfirmSubmit(false);

    try {
      const formData = watch();
      const payload = {
        departmentName: formData.departmentName.trim(),
        expenseTitle: formData.expenseTitle.trim(),
        expenseCategory: formData.expenseCategory.trim(),
        amount: Number(formData.amount),
        expenseDate: formData.expenseDate,
        expenseDescription: formData.expenseDescription?.trim() || null,
      };

      let targetVoucherId = voucherId;

      // 1. Create or update first
      if (isEdit && voucherId) {
        await api.put(`/vouchers/${voucherId}`, payload);
      } else {
        const createRes = await api.post('/vouchers', payload);
        targetVoucherId = createRes.data?.data?.id;
      }

      // 2. Submit for approval
      await api.post(`/vouchers/${targetVoucherId}/submit`);

      toast.success('Voucher successfully submitted for Director approval!');
      navigate('/employee/vouchers', { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Failed to submit voucher for approval'
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  /**
   * Upload signature directly from blocker modal
   */
  const handleUploadSignature = async () => {
    if (!tempSignatureFile) {
      toast.warning('Please select a signature image file first');
      return;
    }

    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('signature', tempSignatureFile);

      const res = await api.post('/users/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newSignatureUrl = res.data?.data?.signatureUrl;
      setUserSignatureUrl(newSignatureUrl);
      setShowUploadSignatureModal(false);
      setShowSignatureBlockerModal(false);
      toast.success('Signature successfully uploaded and registered!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  return (
    <form className="space-y-6" noValidate>
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ============================================================ */}
        {/* SECTION 1: BASIC INFORMATION */}
        {/* ============================================================ */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Section 1: Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Department Name */}
            <Input
              label="Department Name"
              placeholder="e.g. Engineering, Sales, Operations"
              required
              error={errors.departmentName?.message}
              {...register('departmentName')}
            />

            {/* Expense Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type="date"
                  max={todayDateStr}
                  className={`block w-full rounded-lg border text-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    errors.expenseDate
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                  {...register('expenseDate')}
                />
              </div>
              {errors.expenseDate ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.expenseDate.message}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">
                  Date when the business expense occurred (cannot be in the future).
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* SECTION 2: EXPENSE DETAILS */}
        {/* ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Section 2: Expense Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Expense Title */}
            <Input
              label="Expense Title"
              placeholder="e.g. JetBrains All Pack License renewal"
              required
              error={errors.expenseTitle?.message}
              {...register('expenseTitle')}
            />

            {/* Expense Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                className={`block w-full rounded-lg border text-sm py-2 px-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.expenseCategory
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                }`}
                {...register('expenseCategory')}
              >
                <option value="">-- Select a Category --</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.expenseCategory && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.expenseCategory.message}
                </p>
              )}
            </div>

            {/* Amount with ₹ prefix */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Claim Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={`block w-full pl-8 pr-3 py-2 rounded-lg border text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    errors.amount
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                  {...register('amount')}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expense Description <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Provide business justification, purpose, and billing details..."
                className={`block w-full rounded-lg border text-sm py-2 px-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.expenseDescription
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                }`}
                {...register('expenseDescription')}
              />
              {errors.expenseDescription && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.expenseDescription.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: SIGNATURE VERIFICATION */}
      {/* ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Section 3: Signature Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-start gap-3">
              {userSignatureUrl ? (
                <div className="w-24 h-14 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={userSignatureUrl}
                    alt="Employee Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {userSignatureUrl
                      ? 'Employee Digital Signature on File'
                      : 'No Digital Signature Registered'}
                  </h4>
                  {userSignatureUrl && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-lg leading-relaxed">
                  {userSignatureUrl
                    ? 'Your registered signature will be automatically attached to this voucher when submitted for approval.'
                    : 'A digital signature is required before submitting vouchers for Director approval. You can still save as Draft.'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUploadSignatureModal(true)}
              className="shrink-0"
            >
              {userSignatureUrl ? 'Update Signature' : 'Upload Signature'}
            </Button>
          </div>
        </CardContent>

        {/* ============================================================ */}
        {/* ACTION BUTTONS: CANCEL | SAVE DRAFT | SUBMIT FOR APPROVAL */}
        {/* ============================================================ */}
        <CardFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            icon={X}
            onClick={() => navigate('/employee/vouchers')}
            disabled={isSavingDraft || isSubmittingApproval}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Save Draft Button */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={Save}
              isLoading={isSavingDraft}
              disabled={isSubmittingApproval}
              onClick={handleSubmit(onSaveDraft)}
              className="flex-1 sm:flex-initial"
            >
              Save Draft
            </Button>

            {/* Submit for Approval Button */}
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Send}
              isLoading={isSubmittingApproval}
              disabled={isSavingDraft}
              onClick={handleSubmit(onTriggerSubmitForApproval)}
              className="flex-1 sm:flex-initial shadow-sm"
            >
              Submit for Approval
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* ============================================================ */}
      {/* CONFIRM SUBMISSION MODAL */}
      {/* ============================================================ */}
      <ConfirmModal
        isOpen={showConfirmSubmit}
        title="Submit Voucher for Approval?"
        message="Once submitted, this voucher will enter PENDING_APPROVAL status and will be forwarded to the Director. It will become read-only and cannot be edited or deleted."
        confirmLabel="Confirm & Submit"
        cancelLabel="Keep as Draft"
        isLoading={isSubmittingApproval}
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />

      {/* ============================================================ */}
      {/* SIGNATURE BLOCKER MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showSignatureBlockerModal}
        onClose={() => setShowSignatureBlockerModal(false)}
        title="Digital Signature Required"
        description="Submission requires a registered signature."
        size="sm"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignatureBlockerModal(false)}
            >
              Dismiss
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowSignatureBlockerModal(false);
                setShowUploadSignatureModal(true);
              }}
            >
              Upload Signature Now
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
            <p>
              You cannot submit this voucher because your account does not have a registered digital signature.
            </p>
            <p className="text-xs text-slate-500">
              You may save your work as a <strong>Draft</strong> at any time, or upload your signature now to proceed with submission.
            </p>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* UPLOAD SIGNATURE MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showUploadSignatureModal}
        onClose={() => setShowUploadSignatureModal(false)}
        title="Register Employee Signature"
        description="Upload a transparent PNG or high-contrast JPG of your handwritten signature."
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadSignatureModal(false)}
              disabled={isUploadingSignature}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUploadSignature}
              isLoading={isUploadingSignature}
              disabled={!tempSignatureFile}
            >
              Save Signature
            </Button>
          </div>
        }
      >
        <SignatureUpload
          label="Select Signature Image"
          onFileSelect={(file) => setTempSignatureFile(file)}
          onFileRemove={() => setTempSignatureFile(null)}
          existingSignatureUrl={userSignatureUrl}
        />
      </Modal>
    </form>
  );
}
