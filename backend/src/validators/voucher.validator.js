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

// Schema for listing vouchers with search, filters, sorting, and pagination
const listVouchersQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, 'Search query cannot be empty')
      .optional(),
    department: z
      .string()
      .trim()
      .min(1, 'Department cannot be empty')
      .optional(),
    category: z
      .string()
      .trim()
      .min(1, 'Category cannot be empty')
      .optional(),
    status: z
      .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'], {
        errorMap: () => ({ message: 'Invalid status value' }),
      })
      .optional(),
    fromDate: z
      .string()
      .trim()
      .min(1, 'fromDate cannot be empty')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format for fromDate',
      })
      .optional(),
    toDate: z
      .string()
      .trim()
      .min(1, 'toDate cannot be empty')
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format for toDate',
      })
      .optional(),
    minAmount: z
      .union([
        z.number().nonnegative('minAmount must be greater than or equal to 0'),
        z
          .string()
          .trim()
          .regex(/^\d+(\.\d+)?$/, 'minAmount must be a valid non-negative number')
          .transform(Number),
      ])
      .optional(),
    maxAmount: z
      .union([
        z.number().nonnegative('maxAmount must be greater than or equal to 0'),
        z
          .string()
          .trim()
          .regex(/^\d+(\.\d+)?$/, 'maxAmount must be a valid non-negative number')
          .transform(Number),
      ])
      .optional(),
    sortBy: z
      .enum(['createdAt', 'expenseDate', 'amount', 'voucherNumber'], {
        errorMap: () => ({ message: 'Invalid sortBy field' }),
      })
      .default('createdAt'),
    order: z
      .enum(['asc', 'desc'], {
        errorMap: () => ({ message: 'Invalid order value' }),
      })
      .default('desc'),
    page: z
      .preprocess(
        (val) => (val === undefined ? 1 : val),
        z.union([
          z.number().int().positive('page must be a positive integer'),
          z
            .string()
            .trim()
            .regex(/^[1-9]\d*$/, 'page must be a positive integer')
            .transform(Number),
        ])
      ),
    limit: z
      .preprocess(
        (val) => (val === undefined ? 10 : val),
        z.union([
          z
            .number()
            .int()
            .positive('limit must be a positive integer')
            .refine((val) => val <= 50, 'limit cannot exceed 50'),
          z
            .string()
            .trim()
            .regex(/^[1-9]\d*$/, 'limit must be a positive integer')
            .transform(Number)
            .refine((val) => val <= 50, 'limit cannot exceed 50'),
        ])
      ),
  })
  .strict({ message: 'Unrecognized query parameter' })
  .refine(
    (data) => {
      if (data.minAmount !== undefined && data.maxAmount !== undefined) {
        return data.minAmount <= data.maxAmount;
      }
      return true;
    },
    {
      message: 'minAmount cannot be greater than maxAmount',
      path: ['minAmount'],
    }
  )
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        return new Date(data.fromDate) <= new Date(data.toDate);
      }
      return true;
    },
    {
      message: 'fromDate cannot be after toDate',
      path: ['fromDate'],
    }
  );

module.exports = {
  createVoucherSchema,
  updateVoucherSchema,
  voucherIdParamSchema,
  rejectVoucherSchema,
  listVouchersQuerySchema,
};
