const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const uploadSignature = require('../middleware/uploadSignature');
const voucherController = require('../controllers/voucher.controller');
const {
  createVoucherSchema,
  updateVoucherSchema,
  rejectVoucherSchema,
  listVouchersQuerySchema,
} = require('../validators/voucher.validator');

const router = express.Router();

// 1. List Vouchers with Search, Filters, Sorting, and Pagination (Any authenticated role, role-scoped)
router.get(
  '/',
  authenticate,
  validate(listVouchersQuerySchema, 'query'),
  voucherController.listVouchers
);

// 2. Get Filter Dropdown Metadata (Any authenticated role, role-scoped)
router.get(
  '/meta',
  authenticate,
  voucherController.getVoucherMetadata
);

// 3. Create a Voucher (EMPLOYEE only)
router.post(
  '/',
  authenticate,
  authorize('EMPLOYEE'),
  validate(createVoucherSchema),
  voucherController.createVoucher
);

// 4. Get a Voucher by ID (EMPLOYEE own, DIRECTOR all, ACCOUNTS all)
router.get(
  '/:id',
  authenticate,
  voucherController.getVoucherById
);

// 3. Update a Draft Voucher (EMPLOYEE own only)
router.put(
  '/:id',
  authenticate,
  authorize('EMPLOYEE'),
  validate(updateVoucherSchema),
  voucherController.updateDraftVoucher
);

// 4. Delete a Draft Voucher (EMPLOYEE own only)
router.delete(
  '/:id',
  authenticate,
  authorize('EMPLOYEE'),
  voucherController.deleteDraftVoucher
);

// 5. Submit a Draft Voucher (EMPLOYEE own only)
router.post(
  '/:id/submit',
  authenticate,
  authorize('EMPLOYEE'),
  voucherController.submitDraftVoucher
);

// 6. Approve a Voucher (DIRECTOR only, requires signature file upload)
router.post(
  '/:id/approve',
  authenticate,
  authorize('DIRECTOR'),
  uploadSignature,
  voucherController.approveVoucher
);

// 7. Reject a Voucher (DIRECTOR only, requires rejectionReason)
router.post(
  '/:id/reject',
  authenticate,
  authorize('DIRECTOR'),
  validate(rejectVoucherSchema),
  voucherController.rejectVoucher
);

module.exports = router;
