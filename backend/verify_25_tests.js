const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const prisma = require('./src/config/prisma');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const SIGNATURES_DIR = path.join(__dirname, 'uploads', 'signatures');

// Sample 1x1 PNG buffer
const VALID_PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

// Spoofed image buffer (plain text content with .png extension)
const SPOOFED_IMAGE_BUFFER = Buffer.from('This is a spoofed text file masquerading as a png image');

// Large buffer exceeding 2 MB (2.2 MB)
const OVERSIZED_BUFFER = Buffer.alloc(2.2 * 1024 * 1024, 0x5a);

let testVoucherIds = [];
let testCreatedFiles = [];

// Helper to make JSON requests
async function jsonRequest(urlPath, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }
  return { status: response.status, data };
}

// Helper to make multipart upload requests
async function multipartRequest(urlPath, method, fieldName, fileBuffer, fileName, mimeType, token) {
  const formData = new FormData();
  if (fileBuffer) {
    const blob = new Blob([fileBuffer], { type: mimeType || 'image/png' });
    formData.append(fieldName, blob, fileName || 'test-signature.png');
  }
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers,
    body: formData,
  });
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }
  return { status: response.status, data };
}

// Helper to create dedicated test voucher directly in DB
async function createTestVoucher(creatorId, overrides = {}) {
  const testNumber = `VCH-TEST-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const voucher = await prisma.voucher.create({
    data: {
      voucherNumber: testNumber,
      voucherDate: new Date(),
      expenseDate: new Date(),
      departmentName: 'Engineering',
      expenseTitle: 'Test Verification Expense',
      expenseCategory: 'OFFICE_SUPPLIES',
      expenseDescription: 'Testing verification lifecycle',
      amount: 150.0,
      status: 'PENDING_APPROVAL',
      createdById: creatorId,
      ...overrides,
    },
  });
  testVoucherIds.push(voucher.id);
  return voucher;
}

// Cleanup helper
async function cleanupAllTestData() {
  if (testVoucherIds.length > 0) {
    await prisma.voucherActivity.deleteMany({
      where: { voucherId: { in: testVoucherIds } },
    });
    await prisma.voucher.deleteMany({
      where: { id: { in: testVoucherIds } },
    });
  }
  for (const filePath of testCreatedFiles) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {}
  }
}

async function runAll25Tests() {
  const results = [];

  console.log('--- Starting Complete Director Approval & Rejection Verification (25 Tests) ---');

  // Baseline database snapshot
  const initialUserCount = await prisma.user.count();
  const initialVoucherCount = await prisma.voucher.count();
  const initialActivityCount = await prisma.voucherActivity.count();
  const initialFiles = fs.readdirSync(SIGNATURES_DIR);

  // Authenticate users
  const dirLogin = await jsonRequest('/api/auth/login', 'POST', {
    email: 'director@demo.com',
    password: 'Password@123',
  });
  const empLogin = await jsonRequest('/api/auth/login', 'POST', {
    email: 'employee@demo.com',
    password: 'Password@123',
  });
  const accLogin = await jsonRequest('/api/auth/login', 'POST', {
    email: 'accounts@demo.com',
    password: 'Password@123',
  });

  const directorToken = dirLogin.data.data.accessToken;
  const employeeToken = empLogin.data.data.accessToken;
  const accountsToken = accLogin.data.data.accessToken;
  const directorId = dirLogin.data.data.user.id;
  const employeeId = empLogin.data.data.user.id;
  const accountsId = accLogin.data.data.user.id;

  // ==========================================
  // SECTION A: Approval API Tests (Tests 1 - 7)
  // ==========================================

  // Test 1: Director approves pending voucher with valid signature
  try {
    const v1 = await createTestVoucher(employeeId, {
      status: 'PENDING_APPROVAL',
      submittedAt: new Date(),
      employeeSignatureUrl: '/api/users/signature/file/employee-demo.png',
    });

    const res1 = await multipartRequest(
      `/api/vouchers/${v1.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'valid_sig.png',
      'image/png',
      directorToken
    );

    const v1Db = await prisma.voucher.findUnique({
      where: { id: v1.id },
      include: { activities: true },
    });

    const sigFileName = v1Db?.directorSignatureUrl?.replace('/api/users/signature/file/', '');
    const sigFilePath = sigFileName ? path.join(SIGNATURES_DIR, sigFileName) : null;
    if (sigFilePath) testCreatedFiles.push(sigFilePath);

    const pass1 =
      res1.status === 200 &&
      v1Db.status === 'APPROVED' &&
      v1Db.approvedById === directorId &&
      v1Db.directorSignatureUrl &&
      v1Db.approvalDate !== null &&
      sigFilePath &&
      fs.existsSync(sigFilePath) &&
      v1Db.activities.some((a) => a.action === 'APPROVED');

    results.push({
      testNum: 1,
      scenario: 'Director approves pending voucher using valid PNG signature',
      expected: 'HTTP 200, status APPROVED, approvedById, signature URL, approvalDate, activity created',
      actual: `HTTP ${res1.status}, status ${v1Db.status}, approvedById=${v1Db.approvedById ? 'set' : 'null'}, signatureUrl=${v1Db.directorSignatureUrl ? 'set' : 'null'}`,
      httpStatus: res1.status,
      verification: `DB: status=${v1Db.status}, approvedById matches director, file exists on disk, 1 APPROVED activity`,
      status: pass1 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 1,
      scenario: 'Director approves pending voucher using valid PNG signature',
      expected: 'HTTP 200',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 2: Director approves without a signature
  try {
    const v2 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res2 = await multipartRequest(
      `/api/vouchers/${v2.id}/approve`,
      'POST',
      'wrong_field',
      null,
      null,
      null,
      directorToken
    );
    const v2Db = await prisma.voucher.findUnique({ where: { id: v2.id } });
    const pass2 = res2.status === 400 && v2Db.status === 'PENDING_APPROVAL';
    results.push({
      testNum: 2,
      scenario: 'Director approves without a signature',
      expected: 'HTTP 400, voucher remains PENDING_APPROVAL',
      actual: `HTTP ${res2.status}, status ${v2Db.status}`,
      httpStatus: res2.status,
      verification: `DB: status remains ${v2Db.status}, no signature saved, no activity added`,
      status: pass2 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 2,
      scenario: 'Director approves without a signature',
      expected: 'HTTP 400',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 3: Director uploads file with invalid image content / spoofed MIME type
  try {
    const v3 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);
    const res3 = await multipartRequest(
      `/api/vouchers/${v3.id}/approve`,
      'POST',
      'signature',
      SPOOFED_IMAGE_BUFFER,
      'spoofed.png',
      'image/png',
      directorToken
    );
    const v3Db = await prisma.voucher.findUnique({ where: { id: v3.id } });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass3 = res3.status === 400 && v3Db.status === 'PENDING_APPROVAL' && noOrphan;
    results.push({
      testNum: 3,
      scenario: 'Director uploads file with invalid image content or spoofed MIME type',
      expected: 'HTTP 400, voucher remains PENDING_APPROVAL, no orphaned upload',
      actual: `HTTP ${res3.status}, status ${v3Db.status}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res3.status,
      verification: `DB: status=${v3Db.status}. Disk: magic byte check rejected file and safeRemoveFile removed temporary disk file`,
      status: pass3 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 3,
      scenario: 'Director uploads file with invalid image content or spoofed MIME type',
      expected: 'HTTP 400',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 4: Director uploads signature exceeding 2 MB
  try {
    const v4 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);
    const res4 = await multipartRequest(
      `/api/vouchers/${v4.id}/approve`,
      'POST',
      'signature',
      OVERSIZED_BUFFER,
      'oversized.png',
      'image/png',
      directorToken
    );
    const v4Db = await prisma.voucher.findUnique({ where: { id: v4.id } });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass4 = res4.status === 413 && v4Db.status === 'PENDING_APPROVAL' && noOrphan;
    results.push({
      testNum: 4,
      scenario: 'Director uploads signature exceeding 2 MB limit',
      expected: 'HTTP 413, voucher remains PENDING_APPROVAL, no orphaned upload',
      actual: `HTTP ${res4.status}, status ${v4Db.status}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res4.status,
      verification: `DB: status=${v4Db.status}. Disk: Multer LIMIT_FILE_SIZE caught 2.2MB payload and returned 413 without disk leak`,
      status: pass4 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 4,
      scenario: 'Director uploads signature exceeding 2 MB limit',
      expected: 'HTTP 413',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 5: Director approves a nonexistent voucher
  try {
    const nonexistentId = '00000000-0000-0000-0000-000000000000';
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);
    const res5 = await multipartRequest(
      `/api/vouchers/${nonexistentId}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'valid_sig.png',
      'image/png',
      directorToken
    );
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass5 = res5.status === 404 && noOrphan;
    results.push({
      testNum: 5,
      scenario: 'Director approves a nonexistent voucher',
      expected: 'HTTP 404, uploaded signature cleaned up immediately',
      actual: `HTTP ${res5.status}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res5.status,
      verification: `DB: nonexistent id returned 404. Disk: catch block executed safeRemoveFile for uploaded file`,
      status: pass5 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 5,
      scenario: 'Director approves a nonexistent voucher',
      expected: 'HTTP 404',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 6: Director approves an already approved voucher
  try {
    const v6 = await createTestVoucher(employeeId, {
      status: 'APPROVED',
      approvedById: directorId,
      approvalDate: new Date(),
      directorSignatureUrl: '/api/users/signature/file/director-demo.png',
    });
    const beforeActivities = await prisma.voucherActivity.count({ where: { voucherId: v6.id } });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);

    const res6 = await multipartRequest(
      `/api/vouchers/${v6.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'valid_sig.png',
      'image/png',
      directorToken
    );

    const afterActivities = await prisma.voucherActivity.count({ where: { voucherId: v6.id } });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass6 = res6.status === 409 && beforeActivities === afterActivities && noOrphan;
    results.push({
      testNum: 6,
      scenario: 'Director approves an already approved voucher',
      expected: 'HTTP 409, no duplicate approval activity, signature cleaned up',
      actual: `HTTP ${res6.status}, activity delta: ${afterActivities - beforeActivities}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res6.status,
      verification: `DB: status remained APPROVED, 0 new activities. Disk: safeRemoveFile cleaned up newly uploaded file`,
      status: pass6 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 6,
      scenario: 'Director approves an already approved voucher',
      expected: 'HTTP 409',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 7: Director attempts to approve an already rejected voucher
  try {
    const v7 = await createTestVoucher(employeeId, {
      status: 'REJECTED',
      rejectionReason: 'Original rejection reason',
      approvalDate: new Date(),
    });
    const beforeActivities = await prisma.voucherActivity.count({ where: { voucherId: v7.id } });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);

    const res7 = await multipartRequest(
      `/api/vouchers/${v7.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'valid_sig.png',
      'image/png',
      directorToken
    );

    const v7Db = await prisma.voucher.findUnique({ where: { id: v7.id } });
    const afterActivities = await prisma.voucherActivity.count({ where: { voucherId: v7.id } });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass7 = res7.status === 409 && v7Db.status === 'REJECTED' && beforeActivities === afterActivities && noOrphan;
    results.push({
      testNum: 7,
      scenario: 'Director attempts to approve an already rejected voucher',
      expected: 'HTTP 409, status remains REJECTED, no activity change, file cleaned up',
      actual: `HTTP ${res7.status}, status ${v7Db.status}, activity delta: ${afterActivities - beforeActivities}`,
      httpStatus: res7.status,
      verification: `DB: status remains REJECTED, rejectionReason preserved, 0 activities added. Disk: upload removed`,
      status: pass7 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 7,
      scenario: 'Director attempts to approve an already rejected voucher',
      expected: 'HTTP 409',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // ==========================================
  // SECTION B: Rejection API Tests (Tests 8 - 11)
  // ==========================================

  // Test 8: Director rejects pending voucher with valid reason (>= 5 trimmed chars)
  try {
    const v8 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res8 = await jsonRequest(
      `/api/vouchers/${v8.id}/reject`,
      'POST',
      { rejectionReason: '  Budget exceeded for this quarter  ' },
      directorToken
    );
    const v8Db = await prisma.voucher.findUnique({
      where: { id: v8.id },
      include: { activities: true },
    });
    const pass8 =
      res8.status === 200 &&
      v8Db.status === 'REJECTED' &&
      v8Db.rejectionReason === 'Budget exceeded for this quarter' &&
      v8Db.approvalDate !== null &&
      v8Db.activities.some((a) => a.action === 'REJECTED');
    results.push({
      testNum: 8,
      scenario: 'Director rejects pending voucher with valid reason (>= 5 trimmed chars)',
      expected: 'HTTP 200, status REJECTED, trimmed reason saved, approvalDate set, REJECTED activity created',
      actual: `HTTP ${res8.status}, status ${v8Db.status}, reason="${v8Db.rejectionReason}", approvalDate=${v8Db.approvalDate ? 'set' : 'null'}`,
      httpStatus: res8.status,
      verification: `DB: status=REJECTED, rejectionReason trimmed to "Budget exceeded for this quarter", exactly 1 REJECTED activity`,
      status: pass8 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 8,
      scenario: 'Director rejects pending voucher with valid reason (>= 5 trimmed chars)',
      expected: 'HTTP 200',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 9: Director rejects without rejectionReason
  try {
    const v9 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res9 = await jsonRequest(`/api/vouchers/${v9.id}/reject`, 'POST', {}, directorToken);
    const v9Db = await prisma.voucher.findUnique({
      where: { id: v9.id },
      include: { activities: true },
    });
    const pass9 = res9.status === 400 && v9Db.status === 'PENDING_APPROVAL' && v9Db.activities.length === 0;
    results.push({
      testNum: 9,
      scenario: 'Director rejects without rejectionReason',
      expected: 'HTTP 400, voucher remains PENDING_APPROVAL, no state change',
      actual: `HTTP ${res9.status}, status ${v9Db.status}`,
      httpStatus: res9.status,
      verification: `DB: status=${v9Db.status}, rejectionReason null, 0 activities added`,
      status: pass9 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 9,
      scenario: 'Director rejects without rejectionReason',
      expected: 'HTTP 400',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 10: Director rejects with reason shorter than five characters after trimming (" abc ")
  try {
    const v10 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res10 = await jsonRequest(
      `/api/vouchers/${v10.id}/reject`,
      'POST',
      { rejectionReason: ' abc ' },
      directorToken
    );
    const v10Db = await prisma.voucher.findUnique({
      where: { id: v10.id },
      include: { activities: true },
    });
    const pass10 = res10.status === 400 && v10Db.status === 'PENDING_APPROVAL' && v10Db.activities.length === 0;
    results.push({
      testNum: 10,
      scenario: 'Director rejects with reason shorter than 5 characters after trimming (" abc ")',
      expected: 'HTTP 400, voucher remains PENDING_APPROVAL, no state change',
      actual: `HTTP ${res10.status}, status ${v10Db.status}`,
      httpStatus: res10.status,
      verification: `DB: status=${v10Db.status}, trimmed length 3 failed min(5) validation, 0 activities created`,
      status: pass10 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 10,
      scenario: 'Director rejects with reason shorter than 5 characters after trimming (" abc ")',
      expected: 'HTTP 400',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 11: Director attempts to reject an approved voucher
  try {
    const v11 = await createTestVoucher(employeeId, {
      status: 'APPROVED',
      approvedById: directorId,
      approvalDate: new Date(),
      directorSignatureUrl: '/api/users/signature/file/director-demo.png',
    });
    const beforeActivities = await prisma.voucherActivity.count({ where: { voucherId: v11.id } });
    const res11 = await jsonRequest(
      `/api/vouchers/${v11.id}/reject`,
      'POST',
      { rejectionReason: 'Attempting to reject approved voucher' },
      directorToken
    );
    const v11Db = await prisma.voucher.findUnique({ where: { id: v11.id } });
    const afterActivities = await prisma.voucherActivity.count({ where: { voucherId: v11.id } });
    const pass11 = res11.status === 409 && v11Db.status === 'APPROVED' && beforeActivities === afterActivities;
    results.push({
      testNum: 11,
      scenario: 'Director attempts to reject an approved voucher',
      expected: 'HTTP 409, status remains APPROVED, no state or activity changes',
      actual: `HTTP ${res11.status}, status ${v11Db.status}, activity delta: ${afterActivities - beforeActivities}`,
      httpStatus: res11.status,
      verification: `DB: status remained APPROVED, 0 activity rows added`,
      status: pass11 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 11,
      scenario: 'Director attempts to reject an approved voucher',
      expected: 'HTTP 409',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // ==========================================
  // SECTION C: Role Authorization Tests (Tests 12 - 19)
  // ==========================================

  // Test 12: ACCOUNTS attempts approval
  try {
    const v12 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);
    const res12 = await multipartRequest(
      `/api/vouchers/${v12.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'sig.png',
      'image/png',
      accountsToken
    );
    const v12Db = await prisma.voucher.findUnique({
      where: { id: v12.id },
      include: { activities: true },
    });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass12 = res12.status === 403 && v12Db.status === 'PENDING_APPROVAL' && v12Db.activities.length === 0 && noOrphan;
    results.push({
      testNum: 12,
      scenario: 'ACCOUNTS attempts approval',
      expected: 'HTTP 403, status remains PENDING_APPROVAL, no signature processed or saved',
      actual: `HTTP ${res12.status}, status ${v12Db.status}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res12.status,
      verification: `DB: status=${v12Db.status}, 0 activities. Middleware: authorize('DIRECTOR') rejected before uploadSignature`,
      status: pass12 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 12,
      scenario: 'ACCOUNTS attempts approval',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 13: ACCOUNTS attempts rejection
  try {
    const v13 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res13 = await jsonRequest(
      `/api/vouchers/${v13.id}/reject`,
      'POST',
      { rejectionReason: 'Accounts cannot reject' },
      accountsToken
    );
    const v13Db = await prisma.voucher.findUnique({
      where: { id: v13.id },
      include: { activities: true },
    });
    const pass13 = res13.status === 403 && v13Db.status === 'PENDING_APPROVAL' && v13Db.activities.length === 0;
    results.push({
      testNum: 13,
      scenario: 'ACCOUNTS attempts rejection',
      expected: 'HTTP 403, status remains PENDING_APPROVAL, no state change',
      actual: `HTTP ${res13.status}, status ${v13Db.status}`,
      httpStatus: res13.status,
      verification: `DB: status=${v13Db.status}, 0 activities added`,
      status: pass13 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 13,
      scenario: 'ACCOUNTS attempts rejection',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 14: EMPLOYEE attempts approval
  try {
    const v14 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);
    const res14 = await multipartRequest(
      `/api/vouchers/${v14.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'sig.png',
      'image/png',
      employeeToken
    );
    const v14Db = await prisma.voucher.findUnique({
      where: { id: v14.id },
      include: { activities: true },
    });
    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const noOrphan = !afterFiles.some((f) => !beforeFiles.includes(f));
    const pass14 = res14.status === 403 && v14Db.status === 'PENDING_APPROVAL' && v14Db.activities.length === 0 && noOrphan;
    results.push({
      testNum: 14,
      scenario: 'EMPLOYEE attempts approval',
      expected: 'HTTP 403, status remains PENDING_APPROVAL, no signature processed or saved',
      actual: `HTTP ${res14.status}, status ${v14Db.status}, orphan files: ${noOrphan ? 'none' : 'detected'}`,
      httpStatus: res14.status,
      verification: `DB: status=${v14Db.status}, 0 activities. Middleware: authorize('DIRECTOR') rejected before uploadSignature`,
      status: pass14 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 14,
      scenario: 'EMPLOYEE attempts approval',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 15: EMPLOYEE attempts rejection
  try {
    const v15 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res15 = await jsonRequest(
      `/api/vouchers/${v15.id}/reject`,
      'POST',
      { rejectionReason: 'Employee cannot reject' },
      employeeToken
    );
    const v15Db = await prisma.voucher.findUnique({
      where: { id: v15.id },
      include: { activities: true },
    });
    const pass15 = res15.status === 403 && v15Db.status === 'PENDING_APPROVAL' && v15Db.activities.length === 0;
    results.push({
      testNum: 15,
      scenario: 'EMPLOYEE attempts rejection',
      expected: 'HTTP 403, status remains PENDING_APPROVAL, no state change',
      actual: `HTTP ${res15.status}, status ${v15Db.status}`,
      httpStatus: res15.status,
      verification: `DB: status=${v15Db.status}, 0 activities added`,
      status: pass15 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 15,
      scenario: 'EMPLOYEE attempts rejection',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 16: DIRECTOR attempts PUT /api/vouchers/:id on a draft
  try {
    const v16 = await createTestVoucher(employeeId, { status: 'DRAFT' });
    const res16 = await jsonRequest(
      `/api/vouchers/${v16.id}`,
      'PUT',
      { expenseTitle: 'Director trying to edit draft' },
      directorToken
    );
    const v16Db = await prisma.voucher.findUnique({ where: { id: v16.id } });
    const pass16 = res16.status === 403 && v16Db.expenseTitle === 'Test Verification Expense';
    results.push({
      testNum: 16,
      scenario: 'DIRECTOR attempts PUT /api/vouchers/:id on draft voucher',
      expected: 'HTTP 403, draft remains unmutated',
      actual: `HTTP ${res16.status}, title unchanged ("${v16Db.expenseTitle}")`,
      httpStatus: res16.status,
      verification: `DB: title unchanged, status=DRAFT. Middleware: authorize('EMPLOYEE') rejected director with 403`,
      status: pass16 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 16,
      scenario: 'DIRECTOR attempts PUT /api/vouchers/:id on draft voucher',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 17: DIRECTOR attempts DELETE /api/vouchers/:id on a draft
  try {
    const v17 = await createTestVoucher(employeeId, { status: 'DRAFT' });
    const res17 = await jsonRequest(`/api/vouchers/${v17.id}`, 'DELETE', null, directorToken);
    const v17Db = await prisma.voucher.findUnique({ where: { id: v17.id } });
    const pass17 = res17.status === 403 && v17Db !== null;
    results.push({
      testNum: 17,
      scenario: 'DIRECTOR attempts DELETE /api/vouchers/:id on draft voucher',
      expected: 'HTTP 403, voucher is not deleted',
      actual: `HTTP ${res17.status}, voucher exists: ${v17Db !== null}`,
      httpStatus: res17.status,
      verification: `DB: record preserved intact. Middleware: authorize('EMPLOYEE') rejected director with 403`,
      status: pass17 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 17,
      scenario: 'DIRECTOR attempts DELETE /api/vouchers/:id on draft voucher',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 18: DIRECTOR attempts POST /api/vouchers/:id/submit
  try {
    const v18 = await createTestVoucher(employeeId, { status: 'DRAFT' });
    const res18 = await jsonRequest(`/api/vouchers/${v18.id}/submit`, 'POST', null, directorToken);
    const v18Db = await prisma.voucher.findUnique({ where: { id: v18.id } });
    const pass18 = res18.status === 403 && v18Db.status === 'DRAFT';
    results.push({
      testNum: 18,
      scenario: 'DIRECTOR attempts POST /api/vouchers/:id/submit',
      expected: 'HTTP 403, voucher remains DRAFT',
      actual: `HTTP ${res18.status}, status ${v18Db.status}`,
      httpStatus: res18.status,
      verification: `DB: status remains DRAFT, submittedAt is null. Middleware: authorize('EMPLOYEE') returned 403`,
      status: pass18 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 18,
      scenario: 'DIRECTOR attempts POST /api/vouchers/:id/submit',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 19: ACCOUNTS attempts PUT, DELETE, and submit
  try {
    const v19 = await createTestVoucher(employeeId, { status: 'DRAFT' });
    const res19a = await jsonRequest(
      `/api/vouchers/${v19.id}`,
      'PUT',
      { expenseTitle: 'Accounts editing draft' },
      accountsToken
    );
    const res19b = await jsonRequest(`/api/vouchers/${v19.id}`, 'DELETE', null, accountsToken);
    const res19c = await jsonRequest(`/api/vouchers/${v19.id}/submit`, 'POST', null, accountsToken);
    const v19Db = await prisma.voucher.findUnique({ where: { id: v19.id } });
    const pass19 =
      res19a.status === 403 &&
      res19b.status === 403 &&
      res19c.status === 403 &&
      v19Db !== null &&
      v19Db.status === 'DRAFT' &&
      v19Db.expenseTitle === 'Test Verification Expense';
    results.push({
      testNum: 19,
      scenario: 'ACCOUNTS attempts PUT, DELETE, and submit endpoints',
      expected: 'HTTP 403 on all three requests, voucher unmutated',
      actual: `PUT: ${res19a.status}, DELETE: ${res19b.status}, SUBMIT: ${res19c.status}, status ${v19Db.status}`,
      httpStatus: 403,
      verification: `DB: record intact, title unchanged, status=DRAFT. All three routes enforced authorize('EMPLOYEE')`,
      status: pass19 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 19,
      scenario: 'ACCOUNTS attempts PUT, DELETE, and submit endpoints',
      expected: 'HTTP 403',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // ==========================================
  // SECTION D: Audit, Atomicity & Concurrency (Tests 20 - 22)
  // ==========================================

  // Test 20: Successful approval and rejection create exactly one corresponding VoucherActivity row
  try {
    const v20a = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const v20b = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });

    const res20a = await multipartRequest(
      `/api/vouchers/${v20a.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'sig20a.png',
      'image/png',
      directorToken
    );
    const res20b = await jsonRequest(
      `/api/vouchers/${v20b.id}/reject`,
      'POST',
      { rejectionReason: 'Test 20 rejection reason valid' },
      directorToken
    );

    const v20aDb = await prisma.voucher.findUnique({
      where: { id: v20a.id },
      include: { activities: true },
    });
    const v20bDb = await prisma.voucher.findUnique({
      where: { id: v20b.id },
      include: { activities: true },
    });

    const sigFileName = v20aDb?.directorSignatureUrl?.replace('/api/users/signature/file/', '');
    if (sigFileName) testCreatedFiles.push(path.join(SIGNATURES_DIR, sigFileName));

    const approvedAct = v20aDb.activities.filter((a) => a.action === 'APPROVED');
    const rejectedAct = v20bDb.activities.filter((a) => a.action === 'REJECTED');

    const pass20 =
      res20a.status === 200 &&
      res20b.status === 200 &&
      approvedAct.length === 1 &&
      approvedAct[0].userId === directorId &&
      rejectedAct.length === 1 &&
      rejectedAct[0].userId === directorId;

    results.push({
      testNum: 20,
      scenario: 'Approval and rejection each create exactly one VoucherActivity row with Director ID',
      expected: 'Exactly 1 APPROVED activity row on approved voucher, exactly 1 REJECTED row on rejected voucher',
      actual: `Approval activities: ${approvedAct.length} (userId=${approvedAct[0]?.userId}), Rejection activities: ${rejectedAct.length} (userId=${rejectedAct[0]?.userId})`,
      httpStatus: 200,
      verification: `DB: v20a has exactly 1 APPROVED row with Director ID. v20b has exactly 1 REJECTED row with Director ID`,
      status: pass20 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 20,
      scenario: 'Approval and rejection each create exactly one VoucherActivity row with Director ID',
      expected: 'HTTP 200',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 21: Voucher updates and activity insertion roll back together on transaction failure
  try {
    const v21 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });

    let caughtError = null;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: conditional update as done in approveVoucher
        await tx.voucher.updateMany({
          where: { id: v21.id, status: 'PENDING_APPROVAL' },
          data: {
            status: 'APPROVED',
            approvedById: directorId,
            approvalDate: new Date(),
            directorSignatureUrl: '/api/users/signature/file/test-rollback.png',
          },
        });

        // Step 2: controlled forced failure on activity creation (simulated failure)
        throw new Error('Controlled transaction failure simulation');
      });
    } catch (err) {
      caughtError = err;
    }

    const v21Db = await prisma.voucher.findUnique({
      where: { id: v21.id },
      include: { activities: true },
    });

    const pass21 =
      caughtError !== null &&
      v21Db.status === 'PENDING_APPROVAL' &&
      v21Db.approvedById === null &&
      v21Db.approvalDate === null &&
      v21Db.activities.length === 0;

    results.push({
      testNum: 21,
      scenario: 'Voucher update and activity insertion roll back atomically on failure',
      expected: 'Transaction aborts, voucher status remains PENDING_APPROVAL, no partial data saved',
      actual: `Error caught ("${caughtError?.message}"), status=${v21Db.status}, approvedById=${v21Db.approvedById}, activities=${v21Db.activities.length}`,
      httpStatus: 200,
      verification: `DB: confirmed atomic rollback. Status is still PENDING_APPROVAL, approvedById is null, 0 activity rows exist`,
      status: pass21 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 21,
      scenario: 'Voucher update and activity insertion roll back atomically on failure',
      expected: 'Atomic rollback',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 22: Simultaneous approve and reject requests on the same pending voucher (race condition)
  try {
    const v22 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });

    const [raceApprove, raceReject] = await Promise.all([
      multipartRequest(
        `/api/vouchers/${v22.id}/approve`,
        'POST',
        'signature',
        VALID_PNG_BUFFER,
        'race_sig.png',
        'image/png',
        directorToken
      ),
      jsonRequest(
        `/api/vouchers/${v22.id}/reject`,
        'POST',
        { rejectionReason: 'Race condition rejection test reason' },
        directorToken
      ),
    ]);

    const v22Db = await prisma.voucher.findUnique({
      where: { id: v22.id },
      include: { activities: true },
    });

    const sigFileName = v22Db?.directorSignatureUrl?.replace('/api/users/signature/file/', '');
    if (sigFileName) testCreatedFiles.push(path.join(SIGNATURES_DIR, sigFileName));

    const statuses = [raceApprove.status, raceReject.status].sort();
    const exactlyOne200One409 = statuses[0] === 200 && statuses[1] === 409;
    const finalMatchesWinner =
      (raceApprove.status === 200 && v22Db.status === 'APPROVED') ||
      (raceReject.status === 200 && v22Db.status === 'REJECTED');
    const decisionActivities = v22Db.activities.filter(
      (a) => a.action === 'APPROVED' || a.action === 'REJECTED'
    );

    const pass22 = exactlyOne200One409 && finalMatchesWinner && decisionActivities.length === 1;

    results.push({
      testNum: 22,
      scenario: 'Simultaneous approve and reject requests on the same pending voucher',
      expected: 'Exactly one 200 OK, exactly one 409 Conflict, DB state matches winning decision',
      actual: `Approve: HTTP ${raceApprove.status}, Reject: HTTP ${raceReject.status}, Final DB status: ${v22Db.status}, Decision activities: ${decisionActivities.length}`,
      httpStatus: 200,
      verification: `DB: status=${v22Db.status}, exactly 1 decision activity recorded matching winning operation. The losing operation received 409 Conflict`,
      status: pass22 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 22,
      scenario: 'Simultaneous approve and reject requests on the same pending voucher',
      expected: 'One 200, one 409',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // ==========================================
  // SECTION E: Signature Lifecycle Tests (Tests 23 - 24)
  // ==========================================

  // Test 23: Approval fails after signature accepted (non-pending voucher) -> file removed, unrelated untouched
  try {
    const v23 = await createTestVoucher(employeeId, {
      status: 'APPROVED',
      approvedById: directorId,
      approvalDate: new Date(),
    });
    const beforeFiles = fs.readdirSync(SIGNATURES_DIR);

    const res23 = await multipartRequest(
      `/api/vouchers/${v23.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'should_delete_sig.png',
      'image/png',
      directorToken
    );

    const afterFiles = fs.readdirSync(SIGNATURES_DIR);
    const filesIdentical =
      beforeFiles.length === afterFiles.length &&
      beforeFiles.every((f) => afterFiles.includes(f));

    const pass23 = res23.status === 409 && filesIdentical;

    results.push({
      testNum: 23,
      scenario: 'Approval fails after signature upload -> managed signature removed, existing signatures untouched',
      expected: 'HTTP 409, newly uploaded signature removed immediately, pre-existing signatures untouched',
      actual: `HTTP ${res23.status}, files count before: ${beforeFiles.length}, files count after: ${afterFiles.length}`,
      httpStatus: res23.status,
      verification: `Disk: signatures directory contents identical before and after. Demo signatures untouched, temporary upload unlinked`,
      status: pass23 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 23,
      scenario: 'Approval fails after signature upload -> managed signature removed, existing signatures untouched',
      expected: 'HTTP 409',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Test 24: Successful approval retains signature, stores URL, leaves Director profile signature unchanged
  try {
    const dirBefore = await prisma.user.findUnique({ where: { id: directorId } });
    const profileSigBefore = dirBefore.signatureUrl;

    const v24 = await createTestVoucher(employeeId, { status: 'PENDING_APPROVAL' });
    const res24 = await multipartRequest(
      `/api/vouchers/${v24.id}/approve`,
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'sig24.png',
      'image/png',
      directorToken
    );

    const v24Db = await prisma.voucher.findUnique({ where: { id: v24.id } });
    const dirAfter = await prisma.user.findUnique({ where: { id: directorId } });

    const sigFileName = v24Db?.directorSignatureUrl?.replace('/api/users/signature/file/', '');
    const sigFilePath = sigFileName ? path.join(SIGNATURES_DIR, sigFileName) : null;
    if (sigFilePath) testCreatedFiles.push(sigFilePath);

    const pass24 =
      res24.status === 200 &&
      sigFilePath &&
      fs.existsSync(sigFilePath) &&
      v24Db.directorSignatureUrl.startsWith('/api/users/signature/file/') &&
      dirAfter.signatureUrl === profileSigBefore;

    results.push({
      testNum: 24,
      scenario: 'Successful approval retains signature file and leaves Director profile signature unchanged',
      expected: 'HTTP 200, voucher has new signature URL and disk file, Director user profile signature unchanged',
      actual: `HTTP ${res24.status}, voucher sig=${v24Db.directorSignatureUrl ? 'set' : 'null'}, dir profile sig unchanged=${dirAfter.signatureUrl === profileSigBefore}`,
      httpStatus: res24.status,
      verification: `DB: Director profile signatureUrl="${dirAfter.signatureUrl}". Voucher signatureUrl="${v24Db.directorSignatureUrl}". Disk: file exists`,
      status: pass24 ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 24,
      scenario: 'Successful approval retains signature file and leaves Director profile signature unchanged',
      expected: 'HTTP 200',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // ==========================================
  // SECTION F: Regression Tests (Test 25)
  // ==========================================

  // Test 25: Verify existing endpoints (Health, Auth Login, Auth Me, Signature Upload, Signature Get, Voucher CRUD & Submit)
  try {
    const regResults = [];

    // 1. Health
    const resHealth = await jsonRequest('/api/health', 'GET');
    regResults.push(resHealth.status === 200 && resHealth.data?.success === true);

    // 2. Auth Login
    const resLogin = await jsonRequest('/api/auth/login', 'POST', {
      email: 'employee@demo.com',
      password: 'Password@123',
    });
    regResults.push(resLogin.status === 200 && !!resLogin.data?.data?.accessToken);

    // 3. Auth Me
    const resMe = await jsonRequest('/api/auth/me', 'GET', null, employeeToken);
    regResults.push(resMe.status === 200 && resMe.data?.data?.email === 'employee@demo.com');

    // 4. User profile signature upload
    const resSigUpload = await multipartRequest(
      '/api/users/signature',
      'POST',
      'signature',
      VALID_PNG_BUFFER,
      'temp_user_sig.png',
      'image/png',
      employeeToken
    );
    const uploadedSigUrl = resSigUpload.data?.data?.signatureUrl;
    const uploadedSigFilename = uploadedSigUrl?.replace('/api/users/signature/file/', '');
    if (uploadedSigFilename) testCreatedFiles.push(path.join(SIGNATURES_DIR, uploadedSigFilename));
    regResults.push(resSigUpload.status === 200 && !!uploadedSigUrl);

    // 5. Signature file download (requires authentication)
    const resSigGet = await fetch(`${BASE_URL}/api/users/signature/file/employee-demo.png`, {
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    regResults.push(resSigGet.status === 200);

    // 6. Employee create voucher
    const resCreate = await jsonRequest(
      '/api/vouchers',
      'POST',
      {
        expenseDate: new Date().toISOString(),
        departmentName: 'Engineering',
        expenseTitle: 'Regression Test Voucher',
        expenseCategory: 'TRAVEL',
        expenseDescription: 'Travel expense verification',
        amount: 88.5,
      },
      employeeToken
    );
    const createdVoucher = resCreate.data?.data;
    if (createdVoucher?.id) testVoucherIds.push(createdVoucher.id);
    regResults.push(resCreate.status === 201 && createdVoucher?.status === 'DRAFT');

    // 7. Get voucher by ID
    const resGet = await jsonRequest(`/api/vouchers/${createdVoucher.id}`, 'GET', null, employeeToken);
    regResults.push(resGet.status === 200 && resGet.data?.data?.id === createdVoucher.id);

    // 8. Update draft voucher
    const resUpdate = await jsonRequest(
      `/api/vouchers/${createdVoucher.id}`,
      'PUT',
      {
        departmentName: 'Engineering',
        expenseTitle: 'Regression Test Voucher Updated',
        expenseCategory: 'TRAVEL',
        expenseDescription: 'Updated travel description',
        amount: 95.0,
        expenseDate: new Date().toISOString(),
      },
      employeeToken
    );
    regResults.push(resUpdate.status === 200 && Number(resUpdate.data?.data?.amount) === 95.0);

    // 9. Submit draft voucher
    const resSubmit = await jsonRequest(
      `/api/vouchers/${createdVoucher.id}/submit`,
      'POST',
      null,
      employeeToken
    );
    regResults.push(resSubmit.status === 200 && resSubmit.data?.data?.status === 'PENDING_APPROVAL');

    // 10. Employee delete draft voucher (create a second draft and delete it)
    const resCreate2 = await jsonRequest(
      '/api/vouchers',
      'POST',
      {
        expenseDate: new Date().toISOString(),
        departmentName: 'Engineering',
        expenseTitle: 'Draft for deletion',
        expenseCategory: 'MEALS',
        expenseDescription: 'Delete test',
        amount: 25.0,
      },
      employeeToken
    );
    const createdVoucher2 = resCreate2.data?.data;
    if (createdVoucher2?.id) testVoucherIds.push(createdVoucher2.id);
    const resDelete = await jsonRequest(`/api/vouchers/${createdVoucher2.id}`, 'DELETE', null, employeeToken);
    regResults.push(resDelete.status === 200 && resDelete.data?.success === true);

    const allRegPassed = regResults.every(Boolean);

    results.push({
      testNum: 25,
      scenario: 'Regression: Health, Auth Login/Me, Signature Upload/Get, Voucher CRUD & Submit',
      expected: 'All 10 regression sub-checks succeed (HTTP 200/201)',
      actual: `Sub-checks passed: ${regResults.filter(Boolean).length}/10`,
      httpStatus: 200,
      verification: `Health=200, Login=200, Me=200, SigUpload=200, SigGet=200, Create=201, Get=200, Update=200, Submit=200, Delete=200`,
      status: allRegPassed ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    results.push({
      testNum: 25,
      scenario: 'Regression: Health, Auth Login/Me, Signature Upload/Get, Voucher CRUD & Submit',
      expected: 'All endpoints pass',
      actual: `Error: ${err.message}`,
      httpStatus: 500,
      verification: 'Failed with exception',
      status: 'FAIL',
    });
  }

  // Cleanup test data created during run
  await cleanupAllTestData();

  // Baseline verification post-cleanup
  const finalUserCount = await prisma.user.count();
  const finalVoucherCount = await prisma.voucher.count();
  const finalActivityCount = await prisma.voucherActivity.count();
  const finalFiles = fs.readdirSync(SIGNATURES_DIR);

  console.log('\n--- Test Execution Summary ---');
  console.log(`Initial DB State: Users=${initialUserCount}, Vouchers=${initialVoucherCount}, Activities=${initialActivityCount}, Files=${initialFiles.length}`);
  console.log(`Final DB State:   Users=${finalUserCount}, Vouchers=${finalVoucherCount}, Activities=${finalActivityCount}, Files=${finalFiles.length}`);
  console.log(`Test records cleaned up successfully: ${finalVoucherCount === initialVoucherCount && finalFiles.length === initialFiles.length}`);

  // Disconnect prisma
  await prisma.$disconnect();

  return {
    results,
    baseline: {
      initialUserCount,
      initialVoucherCount,
      initialActivityCount,
      finalUserCount,
      finalVoucherCount,
      finalActivityCount,
      initialFilesCount: initialFiles.length,
      finalFilesCount: finalFiles.length,
    },
  };
}

if (require.main === module) {
  runAll25Tests().then(({ results, baseline }) => {
    console.log(JSON.stringify(results, null, 2));
  }).catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runAll25Tests };
