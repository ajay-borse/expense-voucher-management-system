const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const voucherController = require('../controllers/voucher.controller');
const {
  createVoucherSchema,
  updateVoucherSchema,
} = require('../validators/voucher.validator');

const router = express.Router();

// 1. Create a Voucher (EMPLOYEE only)
router.post(
  '/',
  authenticate,
  authorize('EMPLOYEE'),
  validate(createVoucherSchema),
  voucherController.createVoucher
);

// 2. Get a Voucher by ID (EMPLOYEE own, DIRECTOR all, ACCOUNTS all)
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

module.exports = router;
