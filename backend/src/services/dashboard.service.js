const prisma = require('../config/prisma');

/**
 * Helper to compute start of today and start of tomorrow in the server's local timezone.
 * Inclusive start (startOfToday) and exclusive end (startOfTomorrow).
 */
const getLocalTodayBoundaries = () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return {
    startOfToday,
    startOfTomorrow,
    todayFilter: {
      gte: startOfToday,
      lt: startOfTomorrow,
    },
  };
};

/**
 * Fetch role-specific dashboard summary for EMPLOYEE.
 * Scoped strictly to the authenticated employee's own vouchers.
 */
const getEmployeeDashboard = async (userId) => {
  const [statusGroups, amountAggregate, recentVouchers] = await Promise.all([
    // Database-side count grouped by status for this employee
    prisma.voucher.groupBy({
      by: ['status'],
      where: { createdById: userId },
      _count: { _all: true },
    }),

    // Database-side sum of all voucher amounts for this employee
    prisma.voucher.aggregate({
      where: { createdById: userId },
      _sum: { amount: true },
      _count: { _all: true },
    }),

    // 5 most recently created vouchers for this employee
    prisma.voucher.findMany({
      where: { createdById: userId },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      take: 5,
      select: {
        id: true,
        voucherNumber: true,
        expenseTitle: true,
        amount: true,
        status: true,
        expenseDate: true,
        createdAt: true,
      },
    }),
  ]);

  const counts = {
    DRAFT: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  for (const group of statusGroups) {
    if (counts[group.status] !== undefined) {
      counts[group.status] = group._count._all;
    }
  }

  const total = amountAggregate._count._all || 0;
  const totalAmountClaimed = amountAggregate._sum.amount ? Number(amountAggregate._sum.amount) : 0;

  return {
    total,
    draft: counts.DRAFT,
    pending: counts.PENDING_APPROVAL,
    approved: counts.APPROVED,
    rejected: counts.REJECTED,
    totalAmountClaimed,
    recentVouchers,
  };
};

/**
 * Fetch role-specific dashboard summary for DIRECTOR.
 * Includes pending counts, today's approval/rejection decisions, and recent activities.
 */
const getDirectorDashboard = async () => {
  const { todayFilter } = getLocalTodayBoundaries();

  const [pendingAggregate, approvedTodayCount, rejectedTodayCount, recentActivitiesRaw] = await Promise.all([
    // Aggregate pending vouchers count and amount sum
    prisma.voucher.aggregate({
      where: { status: 'PENDING_APPROVAL' },
      _count: { _all: true },
      _sum: { amount: true },
    }),

    // Vouchers approved today within server local-day boundaries
    prisma.voucher.count({
      where: {
        status: 'APPROVED',
        approvalDate: todayFilter,
      },
    }),

    // Vouchers rejected today within server local-day boundaries
    prisma.voucher.count({
      where: {
        status: 'REJECTED',
        approvalDate: todayFilter,
      },
    }),

    // 10 most recent activity logs across the entire system
    prisma.voucherActivity.findMany({
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' },
      ],
      take: 10,
      select: {
        id: true,
        action: true,
        remark: true,
        createdAt: true,
        voucher: {
          select: {
            voucherNumber: true,
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const pendingCount = pendingAggregate._count._all || 0;
  const totalPendingAmount = pendingAggregate._sum.amount ? Number(pendingAggregate._sum.amount) : 0;

  const recentActivities = recentActivitiesRaw.map((act) => ({
    id: act.id,
    action: act.action,
    createdAt: act.createdAt,
    remark: act.remark,
    voucherNumber: act.voucher?.voucherNumber || null,
    creatorName: act.voucher?.createdBy?.name || null,
    actorName: act.user?.name || null,
  }));

  return {
    pendingCount,
    approvedToday: approvedTodayCount,
    rejectedToday: rejectedTodayCount,
    totalPendingAmount,
    recentActivities,
  };
};

/**
 * Fetch role-specific dashboard summary for ACCOUNTS.
 * Includes global voucher totals, approved metrics, and recent approved vouchers.
 */
const getAccountsDashboard = async () => {
  const [statusGroups, totalCount, approvedAggregate, recentApprovedRaw] = await Promise.all([
    // Status counts grouped by status across all employees
    prisma.voucher.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    // Total count including DRAFT vouchers
    prisma.voucher.count(),

    // Sum of amounts for approved vouchers only
    prisma.voucher.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    }),

    // 5 most recently approved vouchers
    prisma.voucher.findMany({
      where: { status: 'APPROVED' },
      orderBy: [
        { approvalDate: 'desc' },
        { id: 'asc' },
      ],
      take: 5,
      select: {
        id: true,
        voucherNumber: true,
        expenseTitle: true,
        departmentName: true,
        amount: true,
        expenseDate: true,
        approvalDate: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const counts = {
    DRAFT: 0,
    PENDING_APPROVAL: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  for (const group of statusGroups) {
    if (counts[group.status] !== undefined) {
      counts[group.status] = group._count._all;
    }
  }

  const totalApprovedAmount = approvedAggregate._sum.amount ? Number(approvedAggregate._sum.amount) : 0;

  const recentApprovedVouchers = recentApprovedRaw.map((v) => ({
    id: v.id,
    voucherNumber: v.voucherNumber,
    expenseTitle: v.expenseTitle,
    departmentName: v.departmentName,
    amount: v.amount,
    expenseDate: v.expenseDate,
    approvalDate: v.approvalDate,
    createdAt: v.createdAt,
    creatorName: v.createdBy?.name || null,
    createdBy: v.createdBy,
  }));

  return {
    total: totalCount,
    pending: counts.PENDING_APPROVAL,
    approved: counts.APPROVED,
    rejected: counts.REJECTED,
    totalApprovedAmount,
    recentApprovedVouchers,
  };
};

/**
 * Main dashboard summary dispatcher based on authenticated user's role.
 */
const getDashboardSummary = async (user) => {
  switch (user.role) {
    case 'EMPLOYEE':
      return await getEmployeeDashboard(user.id);
    case 'DIRECTOR':
      return await getDirectorDashboard();
    case 'ACCOUNTS':
      return await getAccountsDashboard();
    default: {
      const error = new Error('Unauthorized role for dashboard access');
      error.statusCode = 403;
      throw error;
    }
  }
};

module.exports = {
  getDashboardSummary,
  getEmployeeDashboard,
  getDirectorDashboard,
  getAccountsDashboard,
  getLocalTodayBoundaries,
};
