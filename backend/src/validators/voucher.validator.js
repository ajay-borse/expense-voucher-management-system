const { z } = require('zod');

// Safe check ensuring date is not in the future (allowing up to end of current local day)
const isNotFutureDate = (val) => {
  const inputDate = new Date(val);
  if (isNaN(inputDate.getTime())) return false;

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return inputDate <= endOfToday;
};

// Reusable schema fields
const voucherFields = {
  departmentName: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(1, 'Department name cannot be empty'),
  expenseTitle: z
    .string({ required_error: 'Expense title is required' })
    .trim()
    .min(1, 'Expense title cannot be empty'),
  expenseCategory: z
    .string({ required_error: 'Expense category is required' })
    .trim()
    .min(1, 'Expense category cannot be empty'),
  expenseDescription: z
    .string()
    .trim()
    .max(1000, 'Expense description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a valid number',
    })
    .positive('Amount must be greater than zero')
    .finite('Amount must be a finite number'),
  expenseDate: z
    .string({ required_error: 'Expense date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format for expense date',
    })
    .refine(isNotFutureDate, {
      message: 'Expense date cannot be in the future',
    }),
};

// Schema for creating a voucher - strictly disallows protected fields
const createVoucherSchema = z.object(voucherFields).strict();

// Schema for updating a voucher - strictly disallows protected fields
const updateVoucherSchema = z.object(voucherFields).strict();

// Schema for voucher ID route param
const voucherIdParamSchema = z.object({
  id: z.string().uuid('Invalid voucher ID format'),
});

// Schema for rejecting a voucher - requires non-empty rejectionReason (min 5 trimmed characters)
const rejectVoucherSchema = z
  .object({
    rejectionReason: z
      .string({ required_error: 'Rejection reason is required' })
      .trim()
      .min(5, 'Rejection reason must be at least 5 characters')
      .max(1000, 'Rejection reason cannot exceed 1000 characters'),
  })
  .strict();

module.exports = {
  createVoucherSchema,
  updateVoucherSchema,
  voucherIdParamSchema,
  rejectVoucherSchema,
};
