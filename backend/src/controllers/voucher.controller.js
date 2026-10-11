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

/**
 * Approve a PENDING_APPROVAL voucher (DIRECTOR only)
 * POST /api/vouchers/:id/approve
 */
const approveVoucher = async (req, res, next) => {
  try {
    const voucherId = req.params.id;
    const directorUser = req.user;
    const signatureFile = req.file;

    if (!signatureFile) {
      return res.status(400).json({
        success: false,
        message: 'Signature file is required for voucher approval',
      });
    }

    const approved = await voucherService.approveVoucher(
      voucherId,
      directorUser,
      signatureFile
    );

    return res.status(200).json({
      success: true,
      message: 'Voucher approved successfully',
      data: approved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a PENDING_APPROVAL voucher (DIRECTOR only)
 * POST /api/vouchers/:id/reject
 */
const rejectVoucher = async (req, res, next) => {
  try {
    const voucherId = req.params.id;
    const directorUser = req.user;
    const { rejectionReason } = req.body;

    const rejected = await voucherService.rejectVoucher(
      voucherId,
      directorUser,
      rejectionReason
    );

    return res.status(200).json({
      success: true,
      message: 'Voucher rejected successfully',
      data: rejected,
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
  approveVoucher,
  rejectVoucher,
};
