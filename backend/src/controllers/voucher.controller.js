const voucherService = require('../services/voucher.service');

/**
 * Create a new voucher in DRAFT status
 * POST /api/vouchers (EMPLOYEE only)
 */
const createVoucher = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const voucher = await voucherService.createVoucher(creatorId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a voucher by ID with role-based visibility
 * GET /api/vouchers/:id (EMPLOYEE own, DIRECTOR all, ACCOUNTS all)
 */
const getVoucherById = async (req, res, next) => {
  try {
    const voucher = await voucherService.getVoucherById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing DRAFT voucher
 * PUT /api/vouchers/:id (EMPLOYEE own only)
 */
const updateDraftVoucher = async (req, res, next) => {
  try {
    const updated = await voucherService.updateDraftVoucher(
      req.params.id,
      req.user,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Voucher updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an existing DRAFT voucher
 * DELETE /api/vouchers/:id (EMPLOYEE own only)
 */
const deleteDraftVoucher = async (req, res, next) => {
  try {
    await voucherService.deleteDraftVoucher(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit a DRAFT voucher for Director approval
 * POST /api/vouchers/:id/submit (EMPLOYEE own only)
 */
const submitDraftVoucher = async (req, res, next) => {
  try {
    const submitted = await voucherService.submitDraftVoucher(
      req.params.id,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: 'Voucher submitted successfully',
      data: submitted,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoucher,
  getVoucherById,
  updateDraftVoucher,
  deleteDraftVoucher,
  submitDraftVoucher,
};
