const prisma = require('../config/prisma');
const { generateVoucherNumber } = require('../utils/voucherNumber');
const { safeRemoveFile } = require('../utils/signatureFiles');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ensureValidId = (id) => {
  if (!id || !UUID_REGEX.test(id)) {
    const error = new Error('Voucher not found');
    error.statusCode = 404;
    throw error;
  }
};

/**
 * Creates a new voucher in DRAFT status and logs the CREATED activity in a transaction.
 */
const createVoucher = async (creatorId, data) => {
  return await prisma.$transaction(async (tx) => {
    // Generate race-safe sequential voucher number
    const voucherNumber = await generateVoucherNumber(tx);

    const voucher = await tx.voucher.create({
      data: {
        voucherNumber,
        voucherDate: new Date(),
        expenseDate: new Date(data.expenseDate),
        departmentName: data.departmentName,
        expenseTitle: data.expenseTitle,
        expenseCategory: data.expenseCategory,
        expenseDescription: data.expenseDescription || null,
        amount: data.amount,
        status: 'DRAFT',
        createdById: creatorId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
      },
    });

    // Create CREATED activity record in the same atomic transaction
    await tx.voucherActivity.create({
      data: {
        voucherId: voucher.id,
        userId: creatorId,
        action: 'CREATED',
        remark: `Voucher draft created by ${voucher.createdBy.name}`,
      },
    });

    return voucher;
  });
};

/**
 * Retrieves a voucher by ID with role-based access control.
 * Employees can only access their own vouchers (returns 404 if not owned).
 * Directors and Accounts can view any voucher.
 */
const getVoucherById = async (voucherId, user) => {
  ensureValidId(voucherId);

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeId: true,
          department: true,
          signatureUrl: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeId: true,
          department: true,
          signatureUrl: true,
        },
      },
      activities: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!voucher) {
    const error = new Error('Voucher not found');
    error.statusCode = 404;
    throw error;
  }

  // Enforce employee isolation: Return 404 without revealing other employees' vouchers
  if (user.role === 'EMPLOYEE' && voucher.createdById !== user.id) {
    const error = new Error('Voucher not found');
    error.statusCode = 404;
    throw error;
  }

  return voucher;
};

/**
 * Updates a DRAFT voucher. Only the owner can update, and only while status is DRAFT.
 */
const updateDraftVoucher = async (voucherId, user, updateData) => {
  ensureValidId(voucherId);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!existing || existing.createdById !== user.id) {
      const error = new Error('Voucher not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'DRAFT') {
      const error = new Error('Only DRAFT vouchers can be modified');
      error.statusCode = 409;
      throw error;
    }

    // Atomic update with status condition to protect against concurrent submissions
    const updated = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        departmentName: updateData.departmentName,
        expenseTitle: updateData.expenseTitle,
        expenseDate: new Date(updateData.expenseDate),
        expenseCategory: updateData.expenseCategory,
        expenseDescription: updateData.expenseDescription || null,
        amount: updateData.amount,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Record UPDATED activity
    await tx.voucherActivity.create({
      data: {
        voucherId: voucherId,
        userId: user.id,
        action: 'UPDATED',
        remark: `Voucher details updated by ${user.name}`,
      },
    });

    return updated;
  });
};

/**
 * Deletes a DRAFT voucher. Only the owner can delete, and only while status is DRAFT.
 */
const deleteDraftVoucher = async (voucherId, user) => {
  ensureValidId(voucherId);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!existing || existing.createdById !== user.id) {
      const error = new Error('Voucher not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'DRAFT') {
      const error = new Error('Only DRAFT vouchers can be deleted');
      error.statusCode = 409;
      throw error;
    }

    // Cascades to voucher_activities per schema foreign key
    await tx.voucher.delete({
      where: { id: voucherId },
    });

    return {
      message: 'Voucher deleted successfully',
    };
  });
};

/**
 * Submits a DRAFT voucher for approval. Requires employee signature.
 */
const submitDraftVoucher = async (voucherId, user) => {
  ensureValidId(voucherId);

  return await prisma.$transaction(async (tx) => {
    // Check if user has a registered signature in the database
    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, signatureUrl: true },
    });

    if (!currentUser || !currentUser.signatureUrl) {
      const error = new Error('Employee signature is required before submission');
      error.statusCode = 400;
      throw error;
    }

    const existing = await tx.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!existing || existing.createdById !== user.id) {
      const error = new Error('Voucher not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'DRAFT') {
      const error = new Error('Only DRAFT vouchers can be submitted');
      error.statusCode = 409;
      throw error;
    }

    // Atomically transition status to PENDING_APPROVAL and attach employee signature
    const submitted = await tx.voucher.update({
      where: { id: voucherId },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        employeeSignatureUrl: currentUser.signatureUrl,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Create SUBMITTED activity
    await tx.voucherActivity.create({
      data: {
        voucherId: voucherId,
        userId: user.id,
        action: 'SUBMITTED',
        remark: 'Voucher submitted with employee digital signature for Director review',
      },
    });

    return submitted;
  });
};

/**
 * Approves a PENDING_APPROVAL voucher (DIRECTOR only).
 * Attaches the Director's uploaded signature and transitions status to APPROVED atomically.
 */
const approveVoucher = async (voucherId, directorUser, signatureFile) => {
  const directorSignatureUrl = `/api/users/signature/file/${signatureFile.filename}`;

  try {
    ensureValidId(voucherId);

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.voucher.findUnique({
        where: { id: voucherId },
      });

      if (!existing) {
        const error = new Error('Voucher not found');
        error.statusCode = 404;
        throw error;
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        const error = new Error('Only vouchers pending approval can be approved');
        error.statusCode = 409;
        throw error;
      }

      // Atomic status transition at database operation boundary
      const updateResult = await tx.voucher.updateMany({
        where: {
          id: voucherId,
          status: 'PENDING_APPROVAL',
        },
        data: {
          status: 'APPROVED',
          approvedById: directorUser.id,
          approvalDate: new Date(),
          directorSignatureUrl,
        },
      });

      if (updateResult.count === 0) {
        const error = new Error('Only vouchers pending approval can be approved');
        error.statusCode = 409;
        throw error;
      }

      // Record APPROVED activity
      await tx.voucherActivity.create({
        data: {
          voucherId,
          userId: directorUser.id,
          action: 'APPROVED',
          remark: `Voucher approved and digitally signed by Director ${directorUser.name}`,
        },
      });

      // Return updated voucher with creator, approver, and activities
      return await tx.voucher.findUnique({
        where: { id: voucherId },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true, department: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true, role: true, department: true },
          },
          activities: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      });
    });
  } catch (error) {
    // If voucher approval fails for any reason, clean up newly uploaded signature file
    if (signatureFile && signatureFile.path) {
      safeRemoveFile(signatureFile.path);
    }
    throw error;
  }
};

/**
 * Rejects a PENDING_APPROVAL voucher (DIRECTOR only).
 * Sets rejectionReason, approvalDate, and transitions status to REJECTED atomically.
 */
const rejectVoucher = async (voucherId, directorUser, rejectionReason) => {
  ensureValidId(voucherId);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!existing) {
      const error = new Error('Voucher not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'PENDING_APPROVAL') {
      const error = new Error('Only vouchers pending approval can be rejected');
      error.statusCode = 409;
      throw error;
    }

    // Atomic updateMany status guard
    const updateResult = await tx.voucher.updateMany({
      where: {
        id: voucherId,
        status: 'PENDING_APPROVAL',
      },
      data: {
        status: 'REJECTED',
        approvalDate: new Date(),
        rejectionReason,
      },
    });

    if (updateResult.count === 0) {
      const error = new Error('Only vouchers pending approval can be rejected');
      error.statusCode = 409;
      throw error;
    }

    // Record REJECTED activity
    await tx.voucherActivity.create({
      data: {
        voucherId,
        userId: directorUser.id,
        action: 'REJECTED',
        remark: `Rejection reason: ${rejectionReason}`,
      },
    });

    return await tx.voucher.findUnique({
      where: { id: voucherId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true, role: true, department: true },
        },
        activities: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });
  });
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
