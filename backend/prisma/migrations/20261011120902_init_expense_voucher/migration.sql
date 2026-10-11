-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'DIRECTOR', 'ACCOUNTS');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VoucherAction" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "employeeId" TEXT,
    "department" TEXT,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "voucherDate" TIMESTAMP(3) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "departmentName" TEXT NOT NULL,
    "expenseTitle" TEXT NOT NULL,
    "expenseCategory" TEXT NOT NULL,
    "expenseDescription" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "employeeSignatureUrl" TEXT NOT NULL,
    "directorSignatureUrl" TEXT,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_activities" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "VoucherAction" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_voucherNumber_key" ON "vouchers"("voucherNumber");

-- CreateIndex
CREATE INDEX "vouchers_status_idx" ON "vouchers"("status");

-- CreateIndex
CREATE INDEX "vouchers_createdById_idx" ON "vouchers"("createdById");

-- CreateIndex
CREATE INDEX "vouchers_expenseDate_idx" ON "vouchers"("expenseDate");

-- CreateIndex
CREATE INDEX "vouchers_expenseCategory_idx" ON "vouchers"("expenseCategory");

-- CreateIndex
CREATE INDEX "vouchers_departmentName_idx" ON "vouchers"("departmentName");

-- CreateIndex
CREATE INDEX "voucher_activities_voucherId_idx" ON "voucher_activities"("voucherId");

-- CreateIndex
CREATE INDEX "voucher_activities_userId_idx" ON "voucher_activities"("userId");

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_activities" ADD CONSTRAINT "voucher_activities_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_activities" ADD CONSTRAINT "voucher_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
