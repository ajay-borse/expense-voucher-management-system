import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import SecureImage from '../common/SecureImage';

/**
 * Dedicated formal A4 Print View for corporate expense vouchers.
 * Designed strictly to follow A4 margins (12mm), formal business document layout,
 * high-contrast borders, clear tabular breakdowns, and authentic signature authorization seals.
 *
 * This component is hidden on screen and displayed only during print (`hidden print:block`).
 */
export default function VoucherPrintDocument({ voucher }) {
  if (!voucher) return null;

  const isApproved = voucher.status === 'APPROVED';
  const isRejected = voucher.status === 'REJECTED';
  const isPending = voucher.status === 'PENDING_APPROVAL';

  return (
    <div className="hidden print:block font-sans text-slate-900 bg-white p-6 max-w-full">
      {/* ----------------------------------------------------------- */}
      {/* 1. OFFICIAL CORPORATE LETTERHEAD & TITLE                    */}
      {/* ----------------------------------------------------------- */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-0.5">
              Corporate Financial Accounting
            </h2>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
              EXPENSE VOUCHER
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Expense Voucher Management System • Internal Corporate Audit
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block border-2 border-slate-900 px-3 py-1 rounded bg-slate-50">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Voucher Document Number
              </span>
              <span className="font-mono text-lg font-black text-slate-950">
                {voucher.voucherNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Issue Date: <strong>{formatDate(voucher.voucherDate || voucher.createdAt)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. REQUISITION & CLAIMANT DETAILS (2-Column Box)            */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 mb-6 bg-slate-50/50 print-avoid-break text-xs">
        {/* Left Column: Claimant Info */}
        <div className="space-y-1.5 border-r border-slate-200 pr-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Claimant Information
          </p>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Employee:</span>
            <span className="col-span-2 font-bold text-slate-900">
              {voucher.createdBy?.name || 'Staff Member'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Employee ID:</span>
            <span className="col-span-2 font-mono text-slate-800">
              {voucher.createdBy?.employeeId || '—'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="col-span-2 font-semibold text-slate-800">
              {voucher.departmentName}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="col-span-2 text-slate-700 truncate">
              {voucher.createdBy?.email || '—'}
            </span>
          </div>
        </div>

        {/* Right Column: Claim & Processing Dates */}
        <div className="space-y-1.5 pl-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Authorization & Status
          </p>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Status:</span>
            <span className="col-span-2 font-bold text-slate-900 uppercase">
              {voucher.status.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Expense Date:</span>
            <span className="col-span-2 font-medium text-slate-800">
              {formatDate(voucher.expenseDate)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-slate-500 font-medium">Category:</span>
            <span className="col-span-2 font-medium text-slate-800">
              {voucher.expenseCategory}
            </span>
          </div>
          {voucher.submittedAt && (
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Submitted:</span>
              <span className="col-span-2 text-slate-700">
                {formatDateTime(voucher.submittedAt)}
              </span>
            </div>
          )}
          {voucher.approvalDate && (
            <div className="grid grid-cols-3 gap-1">
              <span className="text-slate-500 font-medium">Evaluated:</span>
              <span className="col-span-2 text-slate-700">
                {formatDateTime(voucher.approvalDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. EXPENSE ITEMIZATION TABLE                                */}
      {/* ----------------------------------------------------------- */}
      <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden print-avoid-break">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-slate-700 w-12 text-center">
                #
              </th>
              <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-slate-700">
                Expense Description & Justification
              </th>
              <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-slate-700 w-36">
                Category
              </th>
              <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-slate-700 w-32 text-right">
                Amount (INR)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr>
              <td className="py-3 px-3 text-center font-mono font-medium text-slate-500 align-top">
                1
              </td>
              <td className="py-3 px-3 align-top">
                <p className="font-bold text-slate-950 text-sm mb-1">
                  {voucher.expenseTitle}
                </p>
                <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {voucher.expenseDescription || 'Standard business expenditure.'}
                </p>
              </td>
              <td className="py-3 px-3 align-top text-slate-700 font-medium">
                {voucher.expenseCategory}
              </td>
              <td className="py-3 px-3 align-top text-right font-mono font-bold text-slate-950 text-sm">
                {formatCurrency(voucher.amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-300">
              <td colSpan={3} className="py-3 px-4 font-bold text-slate-900 text-right uppercase text-xs">
                Total Approved Disbursement:
              </td>
              <td className="py-3 px-4 font-mono font-black text-slate-950 text-base text-right">
                {formatCurrency(voucher.amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4. REJECTION REASON (If Rejected)                           */}
      {/* ----------------------------------------------------------- */}
      {isRejected && (
        <div className="mb-6 p-3.5 border-2 border-slate-400 rounded-lg bg-slate-50 print-avoid-break text-xs">
          <p className="font-bold uppercase text-slate-900 mb-1">
            Director Reviewer Rejection Remark:
          </p>
          <p className="text-slate-800 leading-relaxed italic">
            "{voucher.rejectionReason || 'Claim returned by director.'}"
          </p>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 5. DUAL AUTHORIZATION & SIGNATURE PANELS                    */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t border-slate-300 print-avoid-break text-xs">
        {/* Claimant Signature Block */}
        <div className="border border-slate-300 rounded-lg p-4 flex flex-col justify-between h-44">
          <div>
            <p className="font-bold uppercase text-slate-600 text-[10px] tracking-wider mb-2">
              Claimant Digital Signature
            </p>
            <div className="h-20 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded">
              {voucher.employeeSignatureUrl ? (
                <SecureImage
                  src={voucher.employeeSignatureUrl}
                  alt="Employee Signature"
                  className="max-h-16 max-w-full object-contain"
                  fallbackLabel="Digitally Signed by Employee"
                />
              ) : (
                <span className="text-slate-400 italic text-[11px]">Signature Pending</span>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <p className="font-bold text-slate-900 text-xs">
              {voucher.createdBy?.name || 'Staff Employee'}
            </p>
            <p className="text-[10px] text-slate-500">
              Department of {voucher.departmentName}
            </p>
          </div>
        </div>

        {/* Director Signature Block */}
        <div className="border border-slate-300 rounded-lg p-4 flex flex-col justify-between h-44">
          <div>
            <p className="font-bold uppercase text-slate-600 text-[10px] tracking-wider mb-2">
              Director Authorization Seal
            </p>
            <div className="h-20 flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded">
              {isApproved && voucher.directorSignatureUrl ? (
                <SecureImage
                  src={voucher.directorSignatureUrl}
                  alt="Director Signature"
                  className="max-h-16 max-w-full object-contain"
                  fallbackLabel="Authorized & Approved by Director"
                />
              ) : isApproved ? (
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  ✓ Authorized & Approved
                </span>
              ) : isRejected ? (
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                  ✗ Rejected by Director
                </span>
              ) : (
                <span className="text-slate-400 italic text-[11px]">
                  Pending Director Authorization
                </span>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <p className="font-bold text-slate-900 text-xs">
              {voucher.approvedBy?.name || 'Executive Director'}
            </p>
            <p className="text-[10px] text-slate-500">
              {isApproved && voucher.approvalDate
                ? `Authorized on ${formatDate(voucher.approvalDate)}`
                : isRejected && voucher.approvalDate
                ? `Evaluated on ${formatDate(voucher.approvalDate)}`
                : 'Corporate Review Authority'}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 6. DOCUMENT AUDIT FOOTER                                    */}
      {/* ----------------------------------------------------------- */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          Confidential Business Record • Voucher ID: {voucher.id}
        </span>
        <span>
          Printed: {formatDateTime(new Date())}
        </span>
      </div>
    </div>
  );
}
