require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

async function seed() {
  console.log('--- Starting Database Seeding ---');

  // Work factor for password hashing
  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash('Password@123', saltRounds);

  // 1. Seed Demo Users
  console.log('Seeding demo users...');
  const usersData = [
    {
      email: 'employee@demo.com',
      name: 'Rajesh Sharma',
      passwordHash: defaultPassword,
      role: 'EMPLOYEE',
      employeeId: 'EMP-001',
      department: 'Engineering',
      signatureUrl: '/uploads/signatures/employee-demo.png',
    },
    {
      email: 'director@demo.com',
      name: 'Vikram Malhotra',
      passwordHash: defaultPassword,
      role: 'DIRECTOR',
      employeeId: 'DIR-001',
      department: 'Executive Management',
      signatureUrl: '/uploads/signatures/director-demo.png',
    },
    {
      email: 'accounts@demo.com',
      name: 'Sunita Patel',
      passwordHash: defaultPassword,
      role: 'ACCOUNTS',
      employeeId: 'ACC-001',
      department: 'Finance & Accounts',
      signatureUrl: null,
    },
    {
      email: 'employee2@demo.com',
      name: 'Ananya Iyer',
      passwordHash: defaultPassword,
      role: 'EMPLOYEE',
      employeeId: 'EMP-002',
      department: 'Marketing & Sales',
      signatureUrl: '/uploads/signatures/employee-demo.png',
    },
  ];

  const userMap = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash: u.passwordHash,
        role: u.role,
        employeeId: u.employeeId,
        department: u.department,
        signatureUrl: u.signatureUrl,
      },
      create: u,
    });
    userMap[u.email] = user;
    console.log(`  Upserted user: ${user.name} (${user.role} - ${user.email})`);
  }

  const employee1 = userMap['employee@demo.com'];
  const employee2 = userMap['employee2@demo.com'];
  const director = userMap['director@demo.com'];

  // 2. Demo Vouchers Data (20 realistic vouchers across all 4 statuses)
  console.log('Seeding demo vouchers and activity audit trails...');

  const employeeSignaturePlaceholder = '/uploads/signatures/employee-demo.png';
  const directorSignaturePlaceholder = '/uploads/signatures/director-demo.png';

  const vouchersData = [
    // --- DRAFT VOUCHERS (5) ---
    {
      voucherNumber: 'EV-2026-0001',
      voucherDate: new Date('2026-01-11T10:00:00Z'),
      expenseDate: new Date('2026-01-10T09:30:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'JetBrains All Products Pack License',
      expenseCategory: 'Software & SaaS',
      expenseDescription: 'Annual developer IDE license renewal for backend core service team.',
      amount: '24999.00',
      status: 'DRAFT',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0002',
      voucherDate: new Date('2026-01-15T11:00:00Z'),
      expenseDate: new Date('2026-01-14T15:00:00Z'),
      departmentName: 'Marketing & Sales',
      expenseTitle: 'LinkedIn Sponsored Content Campaign Q1',
      expenseCategory: 'Advertising & Promotion',
      expenseDescription: 'Lead acquisition and B2B branding campaign targeting financial institutions.',
      amount: '45000.00',
      status: 'DRAFT',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0003',
      voucherDate: new Date('2026-01-18T14:30:00Z'),
      expenseDate: new Date('2026-01-18T10:00:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'Ergonomic Keyboards and Wrist Supports',
      expenseCategory: 'Hardware & Accessories',
      expenseDescription: 'Mechanical ergonomic keyboards for workstation ergonomics and developer wellness.',
      amount: '14500.00',
      status: 'DRAFT',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0004',
      voucherDate: new Date('2026-01-21T09:15:00Z'),
      expenseDate: new Date('2026-01-20T16:00:00Z'),
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Conference Swag Bags & Branded Notebooks',
      expenseCategory: 'Office Supplies',
      expenseDescription: 'Merchandise kit fabrication for company delegates at National FinTech Summit.',
      amount: '18200.00',
      status: 'DRAFT',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0005',
      voucherDate: new Date('2026-01-23T16:45:00Z'),
      expenseDate: new Date('2026-01-22T11:00:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'Cloud Architecture Certification Vouchers',
      expenseCategory: 'Books & Training',
      expenseDescription: 'AWS Certified Solutions Architect Associate exam vouchers for two team members.',
      amount: '28000.00',
      status: 'DRAFT',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },

    // --- PENDING_APPROVAL VOUCHERS (5) ---
    {
      voucherNumber: 'EV-2026-0006',
      voucherDate: new Date('2026-01-06T10:00:00Z'),
      expenseDate: new Date('2026-01-05T08:00:00Z'),
      submittedAt: new Date('2026-01-07T14:20:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'AWS Cloud Hosting & Database Cluster - Dec 2025',
      expenseCategory: 'Cloud Infrastructure',
      expenseDescription: 'Primary AWS cloud infrastructure bill including ECS instances and managed PostgreSQL.',
      amount: '87500.00',
      status: 'PENDING_APPROVAL',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0007',
      voucherDate: new Date('2026-01-09T12:00:00Z'),
      expenseDate: new Date('2026-01-08T06:30:00Z'),
      submittedAt: new Date('2026-01-10T16:40:00Z'),
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Flight Tickets Delhi to Mumbai - Client Pitch',
      expenseCategory: 'Travel & Conveyance',
      expenseDescription: 'Round-trip airfare on IndiGo for enterprise banking prospect RFP presentation at BKC.',
      amount: '16800.00',
      status: 'PENDING_APPROVAL',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0008',
      voucherDate: new Date('2026-01-13T10:30:00Z'),
      expenseDate: new Date('2026-01-12T15:00:00Z'),
      submittedAt: new Date('2026-01-14T11:15:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'Dedicated Leased Line High-Speed Fiber Internet',
      expenseCategory: 'Internet & Telephony',
      expenseDescription: 'Quarterly dedicated corporate fiber bandwidth renewal with Airtel Business.',
      amount: '35400.00',
      status: 'PENDING_APPROVAL',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0009',
      voucherDate: new Date('2026-01-16T14:00:00Z'),
      expenseDate: new Date('2026-01-15T20:30:00Z'),
      submittedAt: new Date('2026-01-16T18:00:00Z'),
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Client Networking Dinner at The Leela Palace',
      expenseCategory: 'Client Entertainment',
      expenseDescription: 'Official business dinner with senior directors of prospective banking partner.',
      amount: '12450.00',
      status: 'PENDING_APPROVAL',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0010',
      voucherDate: new Date('2026-01-20T11:00:00Z'),
      expenseDate: new Date('2026-01-19T13:45:00Z'),
      submittedAt: new Date('2026-01-21T09:30:00Z'),
      departmentName: 'Engineering',
      expenseTitle: 'Dual 4K Color-Calibrated Workstation Monitors',
      expenseCategory: 'Hardware & Accessories',
      expenseDescription: 'Two 27-inch Dell UltraSharp 4K monitors for UI design and visual accessibility testing.',
      amount: '56000.00',
      status: 'PENDING_APPROVAL',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },

    // --- APPROVED VOUCHERS (5) ---
    {
      voucherNumber: 'EV-2026-0011',
      voucherDate: new Date('2026-01-03T09:30:00Z'),
      expenseDate: new Date('2026-01-02T14:00:00Z'),
      submittedAt: new Date('2026-01-04T10:00:00Z'),
      approvalDate: new Date('2026-01-05T15:30:00Z'),
      approvedBy: director,
      directorSignatureUrl: directorSignaturePlaceholder,
      departmentName: 'Engineering',
      expenseTitle: 'GitHub Enterprise & Copilot Annual Subscription',
      expenseCategory: 'Software & SaaS',
      expenseDescription: 'Company-wide license for source control, automated CI/CD runners, and AI tooling.',
      amount: '62000.00',
      status: 'APPROVED',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0012',
      voucherDate: new Date('2026-01-04T11:00:00Z'),
      expenseDate: new Date('2026-01-03T16:00:00Z'),
      submittedAt: new Date('2026-01-05T11:30:00Z'),
      approvalDate: new Date('2026-01-07T12:00:00Z'),
      approvedBy: director,
      directorSignatureUrl: directorSignaturePlaceholder,
      departmentName: 'Marketing & Sales',
      expenseTitle: 'TechSparks Bengaluru 2026 Exhibition Booth',
      expenseCategory: 'Event Sponsorship',
      expenseDescription: 'Sponsorship registration and demo stall construction for flagship tech expo.',
      amount: '125000.00',
      status: 'APPROVED',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0013',
      voucherDate: new Date('2026-01-07T15:00:00Z'),
      expenseDate: new Date('2026-01-06T13:00:00Z'),
      submittedAt: new Date('2026-01-08T09:45:00Z'),
      approvalDate: new Date('2026-01-09T14:10:00Z'),
      approvedBy: director,
      directorSignatureUrl: directorSignaturePlaceholder,
      departmentName: 'Engineering',
      expenseTitle: 'Engineering Sprint Milestone Celebration Lunch',
      expenseCategory: 'Team Welfare',
      expenseDescription: 'Team lunch at Barbeque Nation Gurgaon following delivery of quarterly deliverables.',
      amount: '9800.00',
      status: 'APPROVED',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0014',
      voucherDate: new Date('2026-01-09T10:00:00Z'),
      expenseDate: new Date('2026-01-08T18:00:00Z'),
      submittedAt: new Date('2026-01-10T12:00:00Z'),
      approvalDate: new Date('2026-01-11T16:30:00Z'),
      approvedBy: director,
      directorSignatureUrl: directorSignaturePlaceholder,
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Hotel Accommodation - Bengaluru Tech Expo',
      expenseCategory: 'Travel & Conveyance',
      expenseDescription: 'Three nights corporate lodging at Taj Yeshwantpur during conference deployment.',
      amount: '24600.00',
      status: 'APPROVED',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0015',
      voucherDate: new Date('2026-01-12T13:30:00Z'),
      expenseDate: new Date('2026-01-11T11:00:00Z'),
      submittedAt: new Date('2026-01-13T10:15:00Z'),
      approvalDate: new Date('2026-01-14T11:45:00Z'),
      approvedBy: director,
      directorSignatureUrl: directorSignaturePlaceholder,
      departmentName: 'Engineering',
      expenseTitle: 'Server Room UPS Battery Pack Replacement',
      expenseCategory: 'Office Maintenance',
      expenseDescription: 'Scheduled replacement of uninterruptible power supply battery modules in primary server room.',
      amount: '31500.00',
      status: 'APPROVED',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },

    // --- REJECTED VOUCHERS (5) ---
    {
      voucherNumber: 'EV-2026-0016',
      voucherDate: new Date('2026-01-05T14:00:00Z'),
      expenseDate: new Date('2026-01-04T10:00:00Z'),
      submittedAt: new Date('2026-01-06T11:00:00Z'),
      approvalDate: new Date('2026-01-07T16:00:00Z'),
      rejectionReason: 'Private luxury chauffeur rental is not permitted under corporate travel policy. Please claim standard taxi rates.',
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Executive Luxury Intercity Chauffeur',
      expenseCategory: 'Travel & Conveyance',
      expenseDescription: 'Chauffeur driven luxury vehicle hired for Delhi-Agra personal tour combined with client pitch.',
      amount: '38500.00',
      status: 'REJECTED',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0017',
      voucherDate: new Date('2026-01-08T16:00:00Z'),
      expenseDate: new Date('2026-01-07T12:00:00Z'),
      submittedAt: new Date('2026-01-09T14:30:00Z'),
      approvalDate: new Date('2026-01-10T17:15:00Z'),
      rejectionReason: 'Team offsite outings require written advance approval from HR and Director before vendor booking.',
      departmentName: 'Engineering',
      expenseTitle: 'Unapproved Weekend Resort Team Outing',
      expenseCategory: 'Team Welfare',
      expenseDescription: 'Weekend resort booking charges booked without prior requisition or budget allocation.',
      amount: '54000.00',
      status: 'REJECTED',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0018',
      voucherDate: new Date('2026-01-11T12:30:00Z'),
      expenseDate: new Date('2026-01-10T15:00:00Z'),
      submittedAt: new Date('2026-01-12T16:00:00Z'),
      approvalDate: new Date('2026-01-13T10:30:00Z'),
      rejectionReason: 'Missing GST tax invoice. Company accounting requires formal invoice with company GSTIN for reimbursement.',
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Non-Tax Invoice Retail Gift Purchases',
      expenseCategory: 'Office Supplies',
      expenseDescription: 'Cash voucher gifts procured from retail store with summary POS slip only.',
      amount: '15000.00',
      status: 'REJECTED',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0019',
      voucherDate: new Date('2026-01-14T10:00:00Z'),
      expenseDate: new Date('2026-01-13T14:30:00Z'),
      submittedAt: new Date('2026-01-15T09:00:00Z'),
      approvalDate: new Date('2026-01-16T11:20:00Z'),
      rejectionReason: 'Company already provides enterprise Zoom licenses through corporate IT portal. Duplicate personal subscription cannot be approved.',
      departmentName: 'Engineering',
      expenseTitle: 'Duplicate Video Conferencing Subscription',
      expenseCategory: 'Software & SaaS',
      expenseDescription: 'Personal Zoom Pro individual annual subscription renewal.',
      amount: '14200.00',
      status: 'REJECTED',
      creator: employee1,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
    {
      voucherNumber: 'EV-2026-0020',
      voucherDate: new Date('2026-01-17T11:15:00Z'),
      expenseDate: new Date('2026-01-16T22:00:00Z'),
      submittedAt: new Date('2026-01-18T10:00:00Z'),
      approvalDate: new Date('2026-01-19T14:45:00Z'),
      rejectionReason: 'Alcohol and night lounge expenses are strictly non-reimbursable per employee handbook code of conduct clause 8.3.',
      departmentName: 'Marketing & Sales',
      expenseTitle: 'Late-Night Lounge & Bar Charges',
      expenseCategory: 'Client Entertainment',
      expenseDescription: 'Post-conference social drinks and cocktails bill claimed under business entertainment.',
      amount: '22800.00',
      status: 'REJECTED',
      creator: employee2,
      employeeSignatureUrl: employeeSignaturePlaceholder,
    },
  ];

  for (const item of vouchersData) {
    const voucherPayload = {
      voucherNumber: item.voucherNumber,
      voucherDate: item.voucherDate,
      expenseDate: item.expenseDate,
      departmentName: item.departmentName,
      expenseTitle: item.expenseTitle,
      expenseCategory: item.expenseCategory,
      expenseDescription: item.expenseDescription,
      amount: item.amount,
      status: item.status,
      createdById: item.creator.id,
      employeeSignatureUrl: item.employeeSignatureUrl,
      directorSignatureUrl: item.directorSignatureUrl || null,
      approvedById: item.approvedBy ? item.approvedBy.id : null,
      submittedAt: item.submittedAt || null,
      approvalDate: item.approvalDate || null,
      rejectionReason: item.rejectionReason || null,
    };

    const voucher = await prisma.voucher.upsert({
      where: { voucherNumber: item.voucherNumber },
      update: voucherPayload,
      create: voucherPayload,
    });

    // Delete existing activities for this voucher to guarantee idempotency
    await prisma.voucherActivity.deleteMany({
      where: { voucherId: voucher.id },
    });

    // Build chronological audit trail based on status
    const activitiesToCreate = [];

    // 1. CREATED activity
    activitiesToCreate.push({
      voucherId: voucher.id,
      userId: item.creator.id,
      action: 'CREATED',
      remark: `Voucher draft created by ${item.creator.name}`,
      createdAt: item.voucherDate,
    });

    // 2. SUBMITTED activity (for PENDING_APPROVAL, APPROVED, REJECTED)
    if (item.submittedAt) {
      activitiesToCreate.push({
        voucherId: voucher.id,
        userId: item.creator.id,
        action: 'SUBMITTED',
        remark: 'Voucher submitted with employee digital signature for Director review',
        createdAt: item.submittedAt,
      });
    }

    // 3. APPROVED activity
    if (item.status === 'APPROVED' && item.approvalDate) {
      activitiesToCreate.push({
        voucherId: voucher.id,
        userId: director.id,
        action: 'APPROVED',
        remark: 'Voucher approved and digitally signed by Director for Accounts disbursement',
        createdAt: item.approvalDate,
      });
    }

    // 4. REJECTED activity
    if (item.status === 'REJECTED' && item.approvalDate) {
      activitiesToCreate.push({
        voucherId: voucher.id,
        userId: director.id,
        action: 'REJECTED',
        remark: `Voucher rejected: ${item.rejectionReason}`,
        createdAt: item.approvalDate,
      });
    }

    await prisma.voucherActivity.createMany({
      data: activitiesToCreate,
    });

    console.log(
      `  Upserted voucher: ${voucher.voucherNumber} [${voucher.status}] - ₹${voucher.amount} (${activitiesToCreate.length} activities)`
    );
  }

  console.log('--- Database Seeding Completed Successfully ---');
}

seed()
  .catch((e) => {
    console.error('Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
