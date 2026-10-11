const request = require('supertest');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

// Valid 1x1 PNG image buffer for testing file uploads
const VALID_PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

describe('Backend Integration Test Suite (Jest + Supertest)', () => {
  // Track test-created entities for isolated deterministic teardown
  const testCreatedVoucherIds = new Set();
  const testCreatedUserIds = new Set();
  const testCreatedFilePaths = new Set();

  let employeeAToken;
  let employeeBToken;
  let directorToken;
  let accountsToken;
  let employeeAId;
  let employeeBId;

  // Helper to log in and return JWT token
  const loginUser = async (email, password = 'Password@123') => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    const token = res.body?.data?.accessToken || res.body?.data?.token;
    return {
      status: res.status,
      body: res.body,
      token,
      user: res.body?.data?.user,
    };
  };

  beforeAll(async () => {
    // Authenticate demo users for test execution
    const empALogin = await loginUser('employee@demo.com');
    employeeAToken = empALogin.token;
    employeeAId = empALogin.user.id;

    const empBLogin = await loginUser('employee2@demo.com');
    employeeBToken = empBLogin.token;
    employeeBId = empBLogin.user.id;

    const dirLogin = await loginUser('director@demo.com');
    directorToken = dirLogin.token;

    const accLogin = await loginUser('accounts@demo.com');
    accountsToken = accLogin.token;
  });

  afterAll(async () => {
    // 1. Clean up test-created vouchers (cascades to activities)
    if (testCreatedVoucherIds.size > 0) {
      await prisma.voucher.deleteMany({
        where: { id: { in: Array.from(testCreatedVoucherIds) } },
      });
    }

    // 2. Clean up test-created users
    if (testCreatedUserIds.size > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: Array.from(testCreatedUserIds) } },
      });
    }

    // 3. Clean up test-created files
    for (const filePath of testCreatedFilePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        // Silently ignore cleanup errors on temp files
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Test 1 — Login success and failure
  // ---------------------------------------------------------------------------
  describe('Test 1 — Login success and failure', () => {
    it('should return HTTP 200 and a usable authentication token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@demo.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      const token = res.body.data.accessToken || res.body.data.token;
      expect(typeof token).toBe('string');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('employee@demo.com');
      expect(res.body.data.user.role).toBe('EMPLOYEE');
      expect(res.body.data.user.passwordHash).toBeUndefined();

      // Verify the token is usable on a protected endpoint
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.email).toBe('employee@demo.com');
    });

    it('should return HTTP 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@demo.com',
          password: 'IncorrectPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeUndefined();
    });

    it('should return HTTP 400 for missing credentials', async () => {
      const resEmpty = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.success).toBe(false);

      const resNoPass = await request(app)
        .post('/api/auth/login')
        .send({ email: 'employee@demo.com' });

      expect(resNoPass.status).toBe(400);
      expect(resNoPass.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 2 — Employee ownership
  // ---------------------------------------------------------------------------
  describe('Test 2 — Employee ownership', () => {
    it('should prevent Employee A from retrieving Employee B\'s voucher and return HTTP 404 to conceal ownership', async () => {
      // Create a voucher owned by Employee B
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeBToken}`)
        .send({
          departmentName: 'Marketing & Sales',
          expenseTitle: 'Confidential Marketing Campaign',
          expenseCategory: 'Advertising & Marketing',
          expenseDescription: 'Restricted campaign budget',
          amount: 15000,
          expenseDate: '2026-02-15',
        });

      expect(createRes.status).toBe(201);
      const voucherBId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherBId);

      // Employee A attempts to retrieve Employee B's voucher
      const getRes = await request(app)
        .get(`/api/vouchers/${voucherBId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(getRes.status).toBe(404);
      expect(getRes.body.success).toBe(false);
      expect(getRes.body.message).toBe('Voucher not found');
      expect(getRes.body.data).toBeUndefined();

      // Confirm Employee B can legitimately retrieve their own voucher
      const ownerRes = await request(app)
        .get(`/api/vouchers/${voucherBId}`)
        .set('Authorization', `Bearer ${employeeBToken}`);

      expect(ownerRes.status).toBe(200);
      expect(ownerRes.body.success).toBe(true);
      expect(ownerRes.body.data.id).toBe(voucherBId);
      expect(ownerRes.body.data.expenseTitle).toBe('Confidential Marketing Campaign');
    });
  });

  // ---------------------------------------------------------------------------
  // Test 3 — Draft-only editing and deletion
  // ---------------------------------------------------------------------------
  describe('Test 3 — Draft-only editing and deletion', () => {
    it('should allow an employee to edit their own DRAFT voucher', async () => {
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Initial Draft Title',
          expenseCategory: 'Software & SaaS',
          amount: 5000,
          expenseDate: '2026-02-10',
        });

      expect(createRes.status).toBe(201);
      const voucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherId);

      // Edit own DRAFT voucher
      const editRes = await request(app)
        .put(`/api/vouchers/${voucherId}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Modified Draft Title',
          expenseCategory: 'Software & SaaS',
          amount: 7500,
          expenseDate: '2026-02-10',
        });

      expect(editRes.status).toBe(200);
      expect(editRes.body.success).toBe(true);
      expect(editRes.body.data.expenseTitle).toBe('Modified Draft Title');
      expect(Number(editRes.body.data.amount)).toBe(7500);

      // Verify database state directly
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
      });
      expect(dbVoucher.expenseTitle).toBe('Modified Draft Title');
      expect(Number(dbVoucher.amount)).toBe(7500);
    });

    it('should allow an employee to delete their own DRAFT voucher', async () => {
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Draft To Be Deleted',
          expenseCategory: 'Office Supplies',
          amount: 1200,
          expenseDate: '2026-02-10',
        });

      expect(createRes.status).toBe(201);
      const voucherId = createRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/vouchers/${voucherId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify deletion in database
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
      });
      expect(dbVoucher).toBeNull();
    });

    it('should reject editing or deleting vouchers in PENDING_APPROVAL, APPROVED, or REJECTED status', async () => {
      // 1. Create and submit voucher to PENDING_APPROVAL
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Pending Voucher For Edit Check',
          expenseCategory: 'Hardware & Equipment',
          amount: 8000,
          expenseDate: '2026-02-10',
        });
      const pendingVoucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(pendingVoucherId);

      const submitRes = await request(app)
        .post(`/api/vouchers/${pendingVoucherId}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(submitRes.status).toBe(200);

      // Attempt to edit PENDING_APPROVAL voucher
      const editPendingRes = await request(app)
        .put(`/api/vouchers/${pendingVoucherId}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Attempted Change',
          expenseCategory: 'Hardware & Equipment',
          amount: 9000,
          expenseDate: '2026-02-10',
        });
      expect(editPendingRes.status).toBe(409);

      // Attempt to delete PENDING_APPROVAL voucher
      const delPendingRes = await request(app)
        .delete(`/api/vouchers/${pendingVoucherId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delPendingRes.status).toBe(409);

      // 2. Test with an APPROVED voucher (EV-2026-0011 created by employee1)
      const approvedVoucher = await prisma.voucher.findFirst({
        where: { createdById: employeeAId, status: 'APPROVED' },
      });
      expect(approvedVoucher).toBeDefined();

      const editApprovedRes = await request(app)
        .put(`/api/vouchers/${approvedVoucher.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Illegal Edit On Approved',
          expenseCategory: 'Software & SaaS',
          amount: 50000,
          expenseDate: '2026-01-10',
        });
      expect(editApprovedRes.status).toBe(409);

      const delApprovedRes = await request(app)
        .delete(`/api/vouchers/${approvedVoucher.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delApprovedRes.status).toBe(409);

      // 3. Test with a REJECTED voucher (EV-2026-0016 created by employee1)
      const rejectedVoucher = await prisma.voucher.findFirst({
        where: { createdById: employeeAId, status: 'REJECTED' },
      });
      expect(rejectedVoucher).toBeDefined();

      const editRejectedRes = await request(app)
        .put(`/api/vouchers/${rejectedVoucher.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Illegal Edit On Rejected',
          expenseCategory: 'Software & SaaS',
          amount: 50000,
          expenseDate: '2026-01-10',
        });
      expect(editRejectedRes.status).toBe(409);

      const delRejectedRes = await request(app)
        .delete(`/api/vouchers/${rejectedVoucher.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delRejectedRes.status).toBe(409);
    });

    it('should reject editing or deleting another employee\'s voucher with HTTP 404', async () => {
      // Create a DRAFT voucher owned by Employee B
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeBToken}`)
        .send({
          departmentName: 'Marketing & Sales',
          expenseTitle: 'Employee B Private Draft',
          expenseCategory: 'Travel & Transport',
          amount: 3200,
          expenseDate: '2026-02-12',
        });
      const voucherBId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherBId);

      // Employee A attempts to edit Employee B's voucher
      const editRes = await request(app)
        .put(`/api/vouchers/${voucherBId}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Unauthorized Tampering',
          expenseCategory: 'Travel & Transport',
          amount: 9999,
          expenseDate: '2026-02-12',
        });
      expect(editRes.status).toBe(404);

      // Employee A attempts to delete Employee B's voucher
      const delRes = await request(app)
        .delete(`/api/vouchers/${voucherBId}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delRes.status).toBe(404);

      // Verify voucher B remains completely intact
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherBId },
      });
      expect(dbVoucher).toBeDefined();
      expect(dbVoucher.expenseTitle).toBe('Employee B Private Draft');
      expect(Number(dbVoucher.amount)).toBe(3200);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 4 — Submit without an employee signature
  // ---------------------------------------------------------------------------
  describe('Test 4 — Submit without an employee signature', () => {
    it('should fail submission if employee has no saved signature and keep voucher in DRAFT', async () => {
      // Create a test employee without signatureUrl
      const testEmpNoSig = await prisma.user.create({
        data: {
          name: 'Employee Without Signature',
          email: 'employee_nosig_test@demo.com',
          passwordHash: await bcrypt.hash('Password@123', 10),
          role: 'EMPLOYEE',
          employeeId: 'EMP-NOSIG-999',
          department: 'Engineering',
          signatureUrl: null,
        },
      });
      testCreatedUserIds.add(testEmpNoSig.id);

      // Log in as employee without signature
      const loginRes = await loginUser('employee_nosig_test@demo.com');
      const noSigToken = loginRes.token;

      // Create a DRAFT voucher
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${noSigToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Draft Without Signature Attempt',
          expenseCategory: 'Software & SaaS',
          amount: 4500,
          expenseDate: '2026-02-14',
        });
      expect(createRes.status).toBe(201);
      const voucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherId);

      // Attempt to submit the voucher
      const submitRes = await request(app)
        .post(`/api/vouchers/${voucherId}/submit`)
        .set('Authorization', `Bearer ${noSigToken}`);

      expect(submitRes.status).toBe(400);
      expect(submitRes.body.success).toBe(false);
      expect(submitRes.body.message).toContain('Employee signature is required');

      // Verify in DB that voucher remains DRAFT and no SUBMITTED activity exists
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        include: { activities: true },
      });

      expect(dbVoucher.status).toBe('DRAFT');
      expect(dbVoucher.submittedAt).toBeNull();
      expect(dbVoucher.employeeSignatureUrl).toBeNull();

      const submittedActivity = dbVoucher.activities.find((a) => a.action === 'SUBMITTED');
      expect(submittedActivity).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 5 — Approve without a director signature
  // ---------------------------------------------------------------------------
  describe('Test 5 — Approve without a director signature', () => {
    it('should reject approval when director signature file is missing and keep voucher in PENDING_APPROVAL', async () => {
      // Create and submit voucher by Employee A
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Voucher For No-Signature Director Approval Test',
          expenseCategory: 'Software & SaaS',
          amount: 6500,
          expenseDate: '2026-02-14',
        });
      const voucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherId);

      await request(app)
        .post(`/api/vouchers/${voucherId}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      // Director attempts to approve without attaching a signature file
      const approveRes = await request(app)
        .post(`/api/vouchers/${voucherId}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({});

      expect(approveRes.status).toBe(400);
      expect(approveRes.body.success).toBe(false);
      expect(approveRes.body.message).toMatch(/signature/i);

      // Verify DB: status remains PENDING_APPROVAL, no APPROVED activity
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        include: { activities: true },
      });

      expect(dbVoucher.status).toBe('PENDING_APPROVAL');
      expect(dbVoucher.approvedById).toBeNull();
      expect(dbVoucher.approvalDate).toBeNull();
      expect(dbVoucher.directorSignatureUrl).toBeNull();

      const approvedActivity = dbVoucher.activities.find((a) => a.action === 'APPROVED');
      expect(approvedActivity).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 6 — Reject without a reason
  // ---------------------------------------------------------------------------
  describe('Test 6 — Reject without a reason', () => {
    it('should reject when rejectionReason is missing, empty, or whitespace-only, leaving voucher in PENDING_APPROVAL', async () => {
      // Create and submit a voucher
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Voucher For Rejection Reason Validation',
          expenseCategory: 'Hardware & Equipment',
          amount: 11000,
          expenseDate: '2026-02-14',
        });
      const voucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherId);

      await request(app)
        .post(`/api/vouchers/${voucherId}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      // 1. Missing rejectionReason
      const resMissing = await request(app)
        .post(`/api/vouchers/${voucherId}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({});
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.success).toBe(false);

      // 2. Empty rejectionReason
      const resEmpty = await request(app)
        .post(`/api/vouchers/${voucherId}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: '' });
      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.success).toBe(false);

      // 3. Whitespace-only rejectionReason
      const resWhitespace = await request(app)
        .post(`/api/vouchers/${voucherId}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: '      ' });
      expect(resWhitespace.status).toBe(400);
      expect(resWhitespace.body.success).toBe(false);

      // 4. Too short (< 5 chars)
      const resShort = await request(app)
        .post(`/api/vouchers/${voucherId}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'bad' });
      expect(resShort.status).toBe(400);
      expect(resShort.body.success).toBe(false);

      // Verify DB: remains PENDING_APPROVAL, no REJECTED activity
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
        include: { activities: true },
      });

      expect(dbVoucher.status).toBe('PENDING_APPROVAL');
      expect(dbVoucher.rejectionReason).toBeNull();
      expect(dbVoucher.approvalDate).toBeNull();

      const rejectedActivity = dbVoucher.activities.find((a) => a.action === 'REJECTED');
      expect(rejectedActivity).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 7 — ACCOUNTS permissions
  // ---------------------------------------------------------------------------
  describe('Test 7 — ACCOUNTS permissions', () => {
    it('should forbid ACCOUNTS from creating, editing, deleting, approving, or rejecting vouchers', async () => {
      // Find a voucher to test action targets
      const targetVoucher = await prisma.voucher.findFirst({
        where: { status: 'DRAFT' },
      });
      const voucherId = targetVoucher.id;

      // 1. Create -> 403 Forbidden
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          departmentName: 'Finance & Accounts',
          expenseTitle: 'Accounts Unauthorized Creation',
          expenseCategory: 'Office Supplies',
          amount: 2000,
          expenseDate: '2026-02-14',
        });
      expect(createRes.status).toBe(403);
      expect(createRes.body.success).toBe(false);

      // 2. Edit -> 403 Forbidden
      const editRes = await request(app)
        .put(`/api/vouchers/${voucherId}`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          departmentName: 'Finance & Accounts',
          expenseTitle: 'Accounts Unauthorized Edit',
          expenseCategory: 'Office Supplies',
          amount: 3000,
          expenseDate: '2026-02-14',
        });
      expect(editRes.status).toBe(403);
      expect(editRes.body.success).toBe(false);

      // 3. Delete -> 403 Forbidden
      const delRes = await request(app)
        .delete(`/api/vouchers/${voucherId}`)
        .set('Authorization', `Bearer ${accountsToken}`);
      expect(delRes.status).toBe(403);
      expect(delRes.body.success).toBe(false);

      // 4. Approve -> 403 Forbidden
      const approveRes = await request(app)
        .post(`/api/vouchers/${voucherId}/approve`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(approveRes.status).toBe(403);
      expect(approveRes.body.success).toBe(false);

      // 5. Reject -> 403 Forbidden
      const rejectRes = await request(app)
        .post(`/api/vouchers/${voucherId}/reject`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({ rejectionReason: 'Unauthorized accounts rejection' });
      expect(rejectRes.status).toBe(403);
      expect(rejectRes.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 8 — DIRECTOR cannot edit employee voucher fields
  // ---------------------------------------------------------------------------
  describe('Test 8 — DIRECTOR cannot edit employee voucher fields', () => {
    it('should reject DIRECTOR attempts to use employee-only edit endpoints and prevent data mutation', async () => {
      // Create a voucher owned by Employee A
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Original Employee Voucher Title',
          expenseCategory: 'Software & SaaS',
          amount: 8800,
          expenseDate: '2026-02-15',
        });
      const voucherId = createRes.body.data.id;
      testCreatedVoucherIds.add(voucherId);

      // Director attempts to update voucher details
      const directorEditRes = await request(app)
        .put(`/api/vouchers/${voucherId}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          departmentName: 'Executive Management',
          expenseTitle: 'Malicious Director Overwrite',
          expenseCategory: 'Consulting',
          amount: 99999,
          expenseDate: '2026-02-15',
        });

      expect(directorEditRes.status).toBe(403);
      expect(directorEditRes.body.success).toBe(false);

      // Verify in DB that original voucher data remains completely unmodified
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: voucherId },
      });
      expect(dbVoucher.expenseTitle).toBe('Original Employee Voucher Title');
      expect(dbVoucher.departmentName).toBe('Engineering');
      expect(Number(dbVoucher.amount)).toBe(8800);
    });
  });

  // ---------------------------------------------------------------------------
  // Test 9 — Cannot approve a non-pending voucher
  // ---------------------------------------------------------------------------
  describe('Test 9 — Cannot approve a non-pending voucher', () => {
    it('should return HTTP 409 Conflict when attempting to approve a DRAFT voucher with valid signature', async () => {
      // Create a DRAFT voucher
      const createRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Draft For Invalid Approval Test',
          expenseCategory: 'Software & SaaS',
          amount: 4200,
          expenseDate: '2026-02-15',
        });
      const draftId = createRes.body.data.id;
      testCreatedVoucherIds.add(draftId);

      // Attempt to approve DRAFT voucher with valid signature file attached
      const approveRes = await request(app)
        .post(`/api/vouchers/${draftId}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'director-sig.png');

      expect(approveRes.status).toBe(409);
      expect(approveRes.body.success).toBe(false);
      expect(approveRes.body.message).toContain('pending approval');

      // Verify DB: status is still DRAFT
      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: draftId },
      });
      expect(dbVoucher.status).toBe('DRAFT');
      expect(dbVoucher.approvedById).toBeNull();
    });

    it('should return HTTP 409 Conflict when attempting to approve an already APPROVED voucher', async () => {
      const approvedVoucher = await prisma.voucher.findFirst({
        where: { status: 'APPROVED' },
      });
      expect(approvedVoucher).toBeDefined();

      const approveRes = await request(app)
        .post(`/api/vouchers/${approvedVoucher.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'director-sig.png');

      expect(approveRes.status).toBe(409);
      expect(approveRes.body.success).toBe(false);

      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: approvedVoucher.id },
      });
      expect(dbVoucher.status).toBe('APPROVED');
    });

    it('should return HTTP 409 Conflict when attempting to approve an already REJECTED voucher', async () => {
      const rejectedVoucher = await prisma.voucher.findFirst({
        where: { status: 'REJECTED' },
      });
      expect(rejectedVoucher).toBeDefined();

      const approveRes = await request(app)
        .post(`/api/vouchers/${rejectedVoucher.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'director-sig.png');

      expect(approveRes.status).toBe(409);
      expect(approveRes.body.success).toBe(false);

      const dbVoucher = await prisma.voucher.findUnique({
        where: { id: rejectedVoucher.id },
      });
      expect(dbVoucher.status).toBe('REJECTED');
    });
  });

  // ---------------------------------------------------------------------------
  // Test 10 — Invalid amount
  // ---------------------------------------------------------------------------
  describe('Test 10 — Invalid amount', () => {
    it('should reject amount zero and negative amounts with HTTP 400 and create no DB records', async () => {
      const vouchersCountBefore = await prisma.voucher.count();
      const activitiesCountBefore = await prisma.voucherActivity.count();

      // 1. Amount 0
      const zeroAmountRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Zero Amount Voucher',
          expenseCategory: 'Office Supplies',
          amount: 0,
          expenseDate: '2026-02-15',
        });
      expect(zeroAmountRes.status).toBe(400);
      expect(zeroAmountRes.body.success).toBe(false);

      // 2. Negative amount
      const negativeAmountRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Negative Amount Voucher',
          expenseCategory: 'Office Supplies',
          amount: -250,
          expenseDate: '2026-02-15',
        });
      expect(negativeAmountRes.status).toBe(400);
      expect(negativeAmountRes.body.success).toBe(false);

      // 3. String / invalid format
      const stringAmountRes = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Invalid Format Voucher',
          expenseCategory: 'Office Supplies',
          amount: 'not-a-number',
          expenseDate: '2026-02-15',
        });
      expect(stringAmountRes.status).toBe(400);
      expect(stringAmountRes.body.success).toBe(false);

      // Verify no records created in database
      const vouchersCountAfter = await prisma.voucher.count();
      const activitiesCountAfter = await prisma.voucherActivity.count();

      expect(vouchersCountAfter).toBe(vouchersCountBefore);
      expect(activitiesCountAfter).toBe(activitiesCountBefore);
    });
  });
});
