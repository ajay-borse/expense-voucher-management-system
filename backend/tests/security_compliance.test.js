const request = require('supertest');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

// Valid 1x1 PNG image buffer for testing
const VALID_PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

// Spoofed file buffer (plain text disguised as PNG)
const SPOOFED_IMAGE_BUFFER = Buffer.from('Plain text content attempting to bypass MIME check');

// Oversized buffer (2.2 MB > 2 MB limit)
const OVERSIZED_BUFFER = Buffer.alloc(2.2 * 1024 * 1024, 0xaa);

describe('Comprehensive Security, Compliance & Negative QA Suite', () => {
  const testCreatedVoucherIds = new Set();
  const testCreatedFilePaths = new Set();

  let employeeAToken;
  let employeeBToken;
  let directorToken;
  let accountsToken;
  let employeeAId;
  let employeeBId;

  const loginUser = async (email, password = 'Password@123') => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    return {
      status: res.status,
      token: res.body?.data?.accessToken || res.body?.data?.token,
      user: res.body?.data?.user,
    };
  };

  beforeAll(async () => {
    // Authenticate test users
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
    // Clean up test created vouchers
    if (testCreatedVoucherIds.size > 0) {
      await prisma.voucher.deleteMany({
        where: { id: { in: Array.from(testCreatedVoucherIds) } },
      });
    }

    // Clean up test uploaded files
    for (const filePath of testCreatedFilePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {}
    }
  });

  // Helper to create disposable draft voucher
  const createDisposableDraft = async (token = employeeAToken) => {
    const res = await request(app)
      .post('/api/vouchers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        departmentName: 'QA Engineering',
        expenseTitle: `QA Test Voucher ${Date.now()}`,
        expenseCategory: 'Software & SaaS',
        amount: 2500.0,
        expenseDate: '2026-03-01',
        expenseDescription: 'Security negative test voucher',
      });
    if (res.body?.data?.id) {
      testCreatedVoucherIds.add(res.body.data.id);
    }
    return res.body?.data;
  };

  // ---------------------------------------------------------------------------
  // 1. Wrong-Role Access Control Tests
  // ---------------------------------------------------------------------------
  describe('1. Wrong-Role Access Control', () => {
    let testVoucher;

    beforeAll(async () => {
      testVoucher = await createDisposableDraft();
    });

    it('should forbid EMPLOYEE from calling director approval endpoint (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/approve`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(res.status).toBe(403);
    });

    it('should forbid EMPLOYEE from calling director rejection endpoint (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/reject`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({ rejectionReason: 'Unauthorized rejection attempt' });
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from creating vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          departmentName: 'Finance',
          expenseTitle: 'Accounts Unauthorized Creation',
          expenseCategory: 'Utilities',
          amount: 500,
          expenseDate: '2026-03-01',
        });
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from updating draft vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/vouchers/${testVoucher.id}`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          departmentName: 'Finance',
          expenseTitle: 'Accounts Unauthorized Update',
          expenseCategory: 'Utilities',
          amount: 500,
          expenseDate: '2026-03-01',
        });
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from deleting vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/vouchers/${testVoucher.id}`)
        .set('Authorization', `Bearer ${accountsToken}`);
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from submitting vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/submit`)
        .set('Authorization', `Bearer ${accountsToken}`);
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from approving vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/approve`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(res.status).toBe(403);
    });

    it('should forbid ACCOUNTS from rejecting vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/reject`)
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({ rejectionReason: 'Accounts cannot reject' });
      expect(res.status).toBe(403);
    });

    it('should forbid DIRECTOR from editing employee draft voucher fields (HTTP 403)', async () => {
      const res = await request(app)
        .put(`/api/vouchers/${testVoucher.id}`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          departmentName: 'Director Override',
          expenseTitle: 'Director Edit Attempt',
          expenseCategory: 'Software & SaaS',
          amount: 1000,
          expenseDate: '2026-03-01',
        });
      expect(res.status).toBe(403);
    });

    it('should forbid DIRECTOR from deleting employee vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/vouchers/${testVoucher.id}`)
        .set('Authorization', `Bearer ${directorToken}`);
      expect(res.status).toBe(403);
    });

    it('should forbid DIRECTOR from submitting employee draft vouchers (HTTP 403)', async () => {
      const res = await request(app)
        .post(`/api/vouchers/${testVoucher.id}/submit`)
        .set('Authorization', `Bearer ${directorToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request to /api/vouchers with HTTP 401', async () => {
      const res = await request(app).get('/api/vouchers');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/dashboard with HTTP 401', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.status).toBe(401);
    });

    it('should return HTTP 404 when Employee A attempts to retrieve Employee B voucher', async () => {
      const bVoucher = await createDisposableDraft(employeeBToken);
      const res = await request(app)
        .get(`/api/vouchers/${bVoucher.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Voucher not found');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Editing and Deleting Submitted & Terminal Vouchers
  // ---------------------------------------------------------------------------
  describe('2. Submitted & Terminal State Immutability', () => {
    it('should reject editing and deleting a submitted PENDING_APPROVAL voucher (HTTP 409)', async () => {
      const v = await createDisposableDraft();
      // Submit voucher
      const submitRes = await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(submitRes.status).toBe(200);

      // Attempt to edit
      const editRes = await request(app)
        .put(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'QA',
          expenseTitle: 'Mutate submitted',
          expenseCategory: 'Software & SaaS',
          amount: 999,
          expenseDate: '2026-03-01',
        });
      expect(editRes.status).toBe(409);

      // Attempt to delete
      const delRes = await request(app)
        .delete(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delRes.status).toBe(409);
    });

    it('should reject editing and deleting an APPROVED voucher (HTTP 409)', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const appRes = await request(app)
        .post(`/api/vouchers/${v.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(appRes.status).toBe(200);

      // Attempt edit
      const editRes = await request(app)
        .put(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'QA',
          expenseTitle: 'Mutate approved',
          expenseCategory: 'Software & SaaS',
          amount: 999,
          expenseDate: '2026-03-01',
        });
      expect(editRes.status).toBe(409);

      // Attempt delete
      const delRes = await request(app)
        .delete(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delRes.status).toBe(409);
    });

    it('should reject editing, deleting, or resubmitting a REJECTED voucher (HTTP 409)', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const rejRes = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'Insufficient documentation provided' });
      expect(rejRes.status).toBe(200);

      // Attempt edit
      const editRes = await request(app)
        .put(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'QA',
          expenseTitle: 'Mutate rejected',
          expenseCategory: 'Software & SaaS',
          amount: 999,
          expenseDate: '2026-03-01',
        });
      expect(editRes.status).toBe(409);

      // Attempt delete
      const delRes = await request(app)
        .delete(`/api/vouchers/${v.id}`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(delRes.status).toBe(409);

      // Attempt resubmission
      const subRes = await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(subRes.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Duplicate Approval & Rejection Transitions
  // ---------------------------------------------------------------------------
  describe('3. Duplicate Transitions & Lifecycle Guards', () => {
    it('should reject approving an already APPROVED voucher with HTTP 409', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      // First approval
      await request(app)
        .post(`/api/vouchers/${v.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');

      // Duplicate approval attempt
      const dupRes = await request(app)
        .post(`/api/vouchers/${v.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.message).toMatch(/Only vouchers pending approval can be approved/i);
    });

    it('should reject rejecting an already APPROVED voucher with HTTP 409', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      await request(app)
        .post(`/api/vouchers/${v.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');

      const rejRes = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'Cannot reject after approval' });
      expect(rejRes.status).toBe(409);
    });

    it('should reject approving an already REJECTED voucher with HTTP 409', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'Already rejected voucher' });

      const appRes = await request(app)
        .post(`/api/vouchers/${v.id}/approve`)
        .set('Authorization', `Bearer ${directorToken}`)
        .attach('signature', VALID_PNG_BUFFER, 'sig.png');
      expect(appRes.status).toBe(409);
    });

    it('should reject duplicate rejection on an already REJECTED voucher with HTTP 409', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'First rejection' });

      const dupRejRes = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'Second rejection attempt' });
      expect(dupRejRes.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. File Upload & Signature Security Tests
  // ---------------------------------------------------------------------------
  describe('4. File Upload & Signature Security', () => {
    it('should reject spoofed image content (text file with .png extension) via magic bytes validation', async () => {
      const res = await request(app)
        .post('/api/users/signature')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .attach('signature', SPOOFED_IMAGE_BUFFER, 'spoofed.png');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/does not match valid image signature/i);
    });

    it('should reject unsupported file extension (.txt)', async () => {
      const res = await request(app)
        .post('/api/users/signature')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .attach('signature', Buffer.from('hello'), 'signature.txt');
      expect(res.status).toBe(400);
    });

    it('should reject oversized file upload exceeding 2 MB with HTTP 413 or 400', async () => {
      const res = await request(app)
        .post('/api/users/signature')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .attach('signature', OVERSIZED_BUFFER, 'large_sig.png');
      expect([400, 413]).toContain(res.status);
    });

    it('should reject missing file upload with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/users/signature')
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/signature file is required/i);
    });

    it('should reject path traversal in signature file retrieval endpoint', async () => {
      const res = await request(app)
        .get('/api/users/signature/file/..%2F..%2Fpackage.json')
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect([400, 404]).toContain(res.status);
    });

    it('should reject unauthenticated request to signature file retrieval with HTTP 401', async () => {
      const res = await request(app).get('/api/users/signature/file/employee-demo.png');
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. SQL-Injection-Like Search Input Resilience
  // ---------------------------------------------------------------------------
  describe('5. SQL-Injection-Like Search Input Resilience', () => {
    const maliciousInputs = [
      "' OR 1=1 --",
      '"; DROP TABLE users; --',
      '%',
      '_',
      "admin'--",
      'A'.repeat(500),
    ];

    test.each(maliciousInputs)('should safely handle search input: %s', async (input) => {
      const res = await request(app)
        .get('/api/vouchers')
        .query({ search: input })
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Token Security & Expiration Handling
  // ---------------------------------------------------------------------------
  describe('6. Token Security & Authentication Boundary', () => {
    it('should reject malformed token string with HTTP 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally.invalid.jwt.token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject token signed with invalid secret with HTTP 401', async () => {
      const fakeToken = jwt.sign(
        { id: employeeAId, email: 'employee@demo.com', role: 'EMPLOYEE' },
        'wrong_secret_123456789'
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);
      expect(res.status).toBe(401);
    });

    it('should reject expired JWT token with HTTP 401', async () => {
      const secret = process.env.JWT_SECRET || 'test_suite_jwt_secret_do_not_use_in_production';
      const expiredToken = jwt.sign(
        { id: employeeAId, email: 'employee@demo.com', role: 'EMPLOYEE' },
        secret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/token expired|invalid/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Additional Boundary Tests
  // ---------------------------------------------------------------------------
  describe('7. Payload Boundary Validations', () => {
    it('should reject amount zero with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Zero Amount Test',
          expenseCategory: 'Utilities',
          amount: 0,
          expenseDate: '2026-03-01',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/greater than zero/i);
    });

    it('should reject negative amount with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Negative Amount Test',
          expenseCategory: 'Utilities',
          amount: -150.75,
          expenseDate: '2026-03-01',
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/greater than zero/i);
    });

    it('should reject future expense date with HTTP 400', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send({
          departmentName: 'Engineering',
          expenseTitle: 'Future Date Test',
          expenseCategory: 'Utilities',
          amount: 500,
          expenseDate: futureDate.toISOString().split('T')[0],
        });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/cannot be in the future/i);
    });

    it('should reject rejection reason shorter than 5 characters with HTTP 400', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const res = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'No' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/at least 5 characters/i);
    });

    it('should reject rejection reason consisting only of whitespace with HTTP 400', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const res = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: '      ' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/at least 5 characters/i);
    });

    it('should accept valid rejection reason of exactly 5 trimmed characters', async () => {
      const v = await createDisposableDraft();
      await request(app)
        .post(`/api/vouchers/${v.id}/submit`)
        .set('Authorization', `Bearer ${employeeAToken}`);

      const res = await request(app)
        .post(`/api/vouchers/${v.id}/reject`)
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ rejectionReason: 'Valid' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Valid');
    });

    it('should return HTTP 404 for invalid UUID format in voucher ID', async () => {
      const res = await request(app)
        .get('/api/vouchers/not-a-valid-uuid')
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Voucher not found');
    });

    it('should reject invalid query sortBy field with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/vouchers')
        .query({ sortBy: 'injected_column' })
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/"field":"sortBy"/i);
    });

    it('should reject invalid query status with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/vouchers')
        .query({ status: 'INVALID_STATUS' })
        .set('Authorization', `Bearer ${employeeAToken}`);
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/"field":"status"/i);
    });
  });
});
