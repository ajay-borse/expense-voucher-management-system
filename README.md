# Expense Voucher Management System

A role-based web application for creating, approving and tracking employee expense vouchers, with signature uploads and an audit trail.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v7.10.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-v18.3.1-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4.17-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Jest Tests](https://img.shields.io/badge/Tests-62%20Passing-brightgreen?logo=jest)](https://jestjs.io/)

---

## Quick Start

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/ajay-borse/expense-voucher-management-system.git
   cd expense-voucher-management-system
   ```
2. **Create the database**:
   Create PostgreSQL database `expense_voucher_db`.
3. **Backend setup**:
   ```powershell
   cd backend
   npm install
   copy .env.example .env
   # Set DATABASE_URL in .env
   npx prisma migrate deploy
   npx prisma generate
   npm run seed
   npm run dev
   ```
4. **Frontend setup**:
   ```powershell
   cd ../frontend
   npm install
   copy .env.example .env
   npm run dev
   ```
5. **Open and log in**:
   Open http://localhost:5173 and log in with `employee@demo.com` / `director@demo.com` / `accounts@demo.com`, password `Password@123`.

---

## Table of Contents

- [Quick Start](#quick-start)
- [A. Project Overview](#a-project-overview)
- [B. Features by Role](#b-features-by-role)
- [C. Tech Stack](#c-tech-stack)
- [D. Folder Structure](#d-folder-structure)
- [E. Prerequisites](#e-prerequisites)
- [F. Clone and Install](#f-clone-and-install)
- [G. Environment Setup](#g-environment-setup)
- [H. Create the Database and Run Migrations](#h-create-the-database-and-run-migrations)
- [I. Demo Credentials](#i-demo-credentials)
- [J. Database Schema Explanation](#j-database-schema-explanation)
- [K. Voucher Workflow and Status Transitions](#k-voucher-workflow-and-status-transitions)
- [L. Full API Documentation](#l-full-api-documentation)
- [M. Business Rules and Enforcement](#m-business-rules-and-enforcement)
- [N. Assumptions and Design Decisions](#n-assumptions-and-design-decisions)
- [O. Testing](#o-testing)
- [P. Screenshots Placeholder](#p-screenshots-placeholder)
- [Q. Known Limitations and Future Improvements](#q-known-limitations-and-future-improvements)
- [R. Troubleshooting](#r-troubleshooting)

---

## A. Project Overview

### Purpose
The **Expense Voucher Management System** resolves common inefficiencies, fraud risks, and accounting delays inherent in manual paper or spreadsheet expense reimbursement pipelines. It introduces strict role boundaries, automated sequential voucher numbering, mandatory digital handwritten signature verification, atomic transactional state transitions, and an immutable audit trail.

### User Roles
The application supports three distinct organizational personas:
1. **EMPLOYEE**: Initiates claims, drafts vouchers, uploads their digital handwritten signature, tracks submission statuses, and views feedback on rejections.
2. **DIRECTOR**: Executive authority who reviews pending vouchers, approves claims with an uploaded digital signature, or rejects claims with mandatory written feedback.
3. **ACCOUNTS**: Finance and audit personnel with read-only oversight across all corporate vouchers, financial aggregation metrics, multi-criteria filtering, CSV export, and an A4-compliant document print/download view.

### Architecture
Built on a decoupled client-server architecture:
- **Backend**: Node.js & Express REST API using layered design (`Routes -> Controllers -> Services -> Prisma ORM -> PostgreSQL`).
- **Frontend**: Single Page Application (SPA) built with React 18, Vite, React Router DOM, and Tailwind CSS.
- **Authentication**: Stateless JSON Web Tokens (JWT) with HTTP Bearer Authorization and client-side route guards.

---

## B. Features by Role

### 1. Employee
- **Authentication & Dashboard**: Secure login with personal summary metrics (Total, Draft, Pending, Approved, Rejected, and Total Amount Claimed in ₹) alongside a table of the 5 most recent vouchers.
- **Draft Creation & Management**: Multi-section expense voucher form (`Basic Info`, `Expense Details`, `Signature Preview`) with real-time Zod validation and non-future date restrictions. Drafts can be saved incrementally without a signature.
- **Draft Editing & Deletion**: Full freedom to modify or delete vouchers while they remain in `DRAFT` status.
- **Guarded Submission**: Submitting for Director review transitions status to `PENDING_APPROVAL`. The system strictly blocks submission unless the employee has an uploaded handwritten digital signature.
- **Signature Registration**: Dedicated modal and user profile signature upload interface (PNG/JPG up to 2 MB) with magic byte format validation.
- **Voucher Tracking & History**: Inspect detailed document views displaying voucher status badges, employee signature preview, Director signature (if approved), rejection remarks (if rejected), and chronological activity audit timeline.

### 2. Director
- **Executive Dashboard**: Real-time counter of vouchers requiring attention (`Pending Approval`), total pending financial liability in ₹, approvals made today, rejections made today, and the 10 most recent corporate audit activities.
- **Pending Approvals Queue**: Dedicated queue showcasing all vouchers in `PENDING_APPROVAL` status with quick-action links.
- **Review & Approval**: Inspect full employee voucher breakdown and digitally sign/approve the voucher by uploading the Director's signature image. Atomically sets status to `APPROVED`, records approval timestamp, and stores Director signature.
- **Rejection with Mandatory Reason**: Reject non-compliant or unjustified vouchers by submitting a required rejection explanation (minimum 5 non-whitespace characters). Atomically sets status to `REJECTED`, records timestamp, and logs Director remark.
- **Company-Wide Register**: View all vouchers across all statuses and departments.

### 3. Accounts
- **Financial Audit Dashboard**: High-level financial overview showcasing global voucher counts (`Total`, `Pending`, `Approved`, `Rejected`), total disbursed approved capital in ₹, and a list of the 5 most recently approved claims.
- **Read-Only Voucher Register**: Centralized master ledger of all vouchers across all departments. Accounts cannot create, edit, delete, approve, or reject vouchers.
- **Advanced Filtering & Search**: Real-time debounced keyword search (by voucher number, employee name, title, description), status filters, department filters, category filters, date ranges, and min/max amount boundaries synchronized to URL query parameters.
- **Sorting & Pagination**: Sort by creation date, expense date, amount, or voucher number in ascending/descending order with customizable page sizes (10, 20, 50).
- **CSV Data Export**: Instant client-side CSV export of filtered records with standardized headers and monetary formatting.
- **A4 Print & PDF View**: Dedicated, styled A4 print layout complying with corporate voucher stationery standards (`@page { size: A4 portrait; margin: 12mm; }`), hiding UI shell controls and preserving signature line fidelity.

---

## C. Tech Stack

### Frontend
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^18.3.1` | Component-based UI library |
| **Build Tool** | Vite | `^5.4.14` | Fast development server & bundling |
| **Routing** | React Router DOM | `^6.28.2` | Client-side role-based routing |
| **HTTP Client** | Axios | `^1.7.9` | API requests with interceptors |
| **Styling** | Tailwind CSS | `^3.4.17` | Utility-first responsive styling |
| **Form Handling** | React Hook Form | `^7.54.2` | High-performance form state control |
| **Form Resolvers** | @hookform/resolvers | `^3.10.0` | Zod schema resolver integration |
| **Validation** | Zod | `^3.24.2` | Client-side input validation |
| **Icons** | Lucide React | `^0.475.0` | Accessible SVG icon suite |

### Backend
| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>= 18.0.0` | Server-side JavaScript runtime |
| **Framework** | Express.js | `^4.21.2` | Web API application framework |
| **Database** | PostgreSQL | `>= 14.0` | Relational ACID database |
| **ORM** | Prisma | `^7.10.0` | Schema management & migrations |
| **Client** | @prisma/client | `^7.10.0` | Auto-generated query builder |
| **Driver Adapter** | @prisma/adapter-pg | `^7.10.0` | Prisma 7 PostgreSQL driver adapter |
| **Database Driver**| pg | `^8.13.3` | PostgreSQL client for Node.js |
| **Authentication** | jsonwebtoken | `^9.0.3` | HMAC SHA256 JWT tokens |
| **Hashing** | bcrypt | `^6.0.0` | Salted password hashing (10 rounds) |
| **Validation** | Zod | `^4.6.5` | Server-side payload & query validation |
| **File Uploads** | Multer | `^2.4.0` | Multipart/form-data signature handling |
| **Security** | Helmet | `^8.0.0` | HTTP security headers |
| **CORS** | cors | `^2.8.5` | Cross-Origin Resource Sharing |
| **Logging** | Morgan | `^1.10.0` | HTTP request logger |
| **Environment** | dotenv | `^16.4.7` | Environment variable management |
| **Testing** | Jest & Supertest | `^30.5.2` / `^7.3.1` | Integration & API testing |

---

## D. Folder Structure

```text
expense-voucher-management-system/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20261011120902_init_expense_voucher/
│   │   │   │   └── migration.sql       # Initial database tables, enums & foreign keys
│   │   │   ├── 20261011133708_make_employee_signature_optional_for_drafts/
│   │   │   │   └── migration.sql       # Makes employee signature nullable for drafts
│   │   │   └── migration_lock.toml     # Prisma migration engine lock
│   │   ├── schema.prisma               # Prisma models, enums & database relations
│   │   └── seed.js                     # Seed script for demo accounts & vouchers
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js               # PrismaClient instance with pg adapter
│   │   ├── controllers/
│   │   │   ├── auth.controller.js      # Login and me handlers
│   │   │   ├── dashboard.controller.js # Role-dispatched dashboard summaries
│   │   │   ├── health.controller.js    # Health check endpoint
│   │   │   ├── user.controller.js      # Signature upload and secure image serving
│   │   │   └── voucher.controller.js   # Voucher CRUD, submit, approve, reject
│   │   ├── middleware/
│   │   │   ├── authenticate.js         # JWT verification & req.user injection
│   │   │   ├── authorize.js            # Role authorization guard (EMPLOYEE/DIRECTOR/ACCOUNTS)
│   │   │   ├── errorHandler.js         # Centralized error formatter
│   │   │   ├── notFound.js             # 404 handler for unknown routes
│   │   │   ├── uploadSignature.js      # Multer signature file validator (2 MB limit)
│   │   │   └── validate.js             # Zod middleware for body, query, and params
│   │   ├── routes/
│   │   │   ├── auth.routes.js          # /api/auth routes
│   │   │   ├── dashboard.routes.js     # /api/dashboard routes
│   │   │   ├── health.routes.js        # /api/health routes
│   │   │   ├── index.js                # Central Express router mounting
│   │   │   ├── user.routes.js          # /api/users routes
│   │   │   └── voucher.routes.js       # /api/vouchers routes
│   │   ├── services/
│   │   │   ├── auth.service.js         # Authentication logic & token generation
│   │   │   ├── dashboard.service.js    # Metric aggregations per role
│   │   │   └── voucher.service.js      # Atomic voucher lifecycle & activity logs
│   │   ├── utils/
│   │   │   ├── signatureFiles.js       # File validation & magic bytes inspection
│   │   │   └── voucherNumber.js        # Atomic sequence number generator (VCH-YYYY-000001)
│   │   ├── validators/
│   │   │   ├── auth.validator.js       # Login Zod schemas
│   │   │   └── voucher.validator.js    # Voucher CRUD & search query schemas
│   │   └── app.js                      # Express configuration & middleware pipeline
│   ├── tests/
│   │   ├── integration.test.js         # 17 integration tests: core workflow and business rules
│   │   ├── security_compliance.test.js # 45 security and negative-case tests
│   │   └── setupEnv.js                 # Test environment loader & database safety check
│   ├── uploads/
│   │   └── signatures/                 # Stored signature images (runtime-generated)
│   │       ├── director-demo.png       # Seeded demo Director signature
│   │       └── employee-demo.png       # Seeded demo Employee signature
│   ├── .env.example                    # Backend environment template
│   ├── .env.test.example               # Test database environment template
│   ├── jest.config.js                  # Jest test runner configuration
│   ├── package.json                    # Backend dependencies & npm scripts
│   └── server.js                       # Server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Badge.jsx           # Role badge indicator
│   │   │   │   ├── Button.jsx          # Accessible button with states & spinners
│   │   │   │   ├── Card.jsx            # Document & container card component
│   │   │   │   ├── ConfirmModal.jsx    # Double-click safe confirmation dialog
│   │   │   │   ├── DataTable.jsx       # Responsive table with mobile card fallback
│   │   │   │   ├── EmptyState.jsx      # Clean zero-data placeholder
│   │   │   │   ├── ErrorAlert.jsx      # Dismissible inline error banner
│   │   │   │   ├── ErrorState.jsx      # Recoverable error screen with retry
│   │   │   │   ├── FilterBar.jsx       # Debounced search & collapsible filter drawer
│   │   │   │   ├── Input.jsx           # Accessible labeled text input
│   │   │   │   ├── LoadingSpinner.jsx  # Animated loading indicator
│   │   │   │   ├── MetricCard.jsx      # Dashboard stat card
│   │   │   │   ├── Modal.jsx           # Accessible dialog with focus trap & Escape key
│   │   │   │   ├── PageHeader.jsx      # Standardized title, breadcrumb & action header
│   │   │   │   ├── Pagination.jsx      # Accessible page navigator with row sizes
│   │   │   │   ├── SecureImage.jsx     # Authenticated blob image loader
│   │   │   │   ├── SignatureUpload.jsx # Drag-and-drop signature upload widget
│   │   │   │   ├── Skeleton.jsx        # Animated loading skeletons
│   │   │   │   └── StatusBadge.jsx     # High-contrast voucher status pill
│   │   │   ├── voucher/
│   │   │   │   ├── VoucherForm.jsx     # Unified voucher creation & edit form
│   │   │   │   └── VoucherPrintDocument.jsx # A4 print view for accounting download
│   │   │   ├── ProtectedRoute.jsx      # Unauthenticated route redirector
│   │   │   └── RoleRoute.jsx           # Role-based route guard rendering 403 Forbidden
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User session, JWT persistence & login/logout
│   │   │   └── ToastContext.jsx        # Global toast notifications
│   │   ├── layouts/
│   │   │   └── AppLayout.jsx           # Shell with responsive sidebar & mobile drawer
│   │   ├── pages/
│   │   │   ├── accounts/
│   │   │   │   ├── AccountsDashboard.jsx     # Accounts metrics & approved vouchers
│   │   │   │   ├── AccountsVoucherDetails.jsx # Read-only view with A4 print trigger
│   │   │   │   └── AccountsVouchers.jsx      # Master register with CSV export
│   │   │   ├── director/
│   │   │   │   ├── AllVouchers.jsx           # Director view of all vouchers
│   │   │   │   ├── DirectorDashboard.jsx     # Executive pending & approval stats
│   │   │   │   ├── DirectorVoucherDetails.jsx # Review, approve & reject actions
│   │   │   │   └── PendingApprovals.jsx      # Dedicated pending voucher queue
│   │   │   ├── employee/
│   │   │   │   ├── CreateVoucher.jsx         # New voucher page wrapper
│   │   │   │   ├── EditVoucher.jsx           # Draft editing page wrapper
│   │   │   │   ├── EmployeeDashboard.jsx     # Personal dashboard metrics
│   │   │   │   ├── MyVouchers.jsx            # Employee voucher listing with actions
│   │   │   │   └── VoucherDetails.jsx        # Employee document view & submit trigger
│   │   │   ├── Forbidden.jsx           # Friendly 403 Access Denied page
│   │   │   ├── Login.jsx               # Login page with demo credential buttons
│   │   │   └── NotFound.jsx            # Friendly 404 Not Found page
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance with 401 interceptor latch
│   │   ├── utils/
│   │   │   └── formatters.js           # Currency (₹ INR), dates, and string helpers
│   │   ├── App.jsx                     # Route declarations
│   │   ├── index.css                   # Global styles & @media print A4 directives
│   │   └── main.jsx                    # React DOM root entry point
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # HTML shell
│   ├── package.json                    # Frontend dependencies & npm scripts
│   ├── tailwind.config.js              # Tailwind configuration
│   └── vite.config.js                  # Vite configuration
├── docs/
│   └── screenshots/                    # Screenshot documentation directory (.gitkeep)
├── .gitignore                          # Git ignore rules for node_modules, envs & signatures
└── README.md                           # Master project documentation
```

---

## E. Prerequisites

Before setting up the project on a clean machine, ensure the following tools are installed:

1. **Node.js**: `v18.0.0` or higher (verified on `v24.14.0`).
2. **npm**: `v9.0.0` or higher (verified on `v11.9.0`).
3. **PostgreSQL**: `v14.0` or higher, running locally or accessible via network.
4. **Git**: Installed and available in your command line path.

Verify installations in your terminal:

```powershell
node -v
npm -v
git --version
```

---

## F. Clone and Install

### 1. Clone the Repository

```powershell
git clone https://github.com/ajay-borse/expense-voucher-management-system.git
cd expense-voucher-management-system
```

### 2. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 3. Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

---

## G. Environment Setup

The application uses explicit `.env` configuration files for development and testing.

### 1. Backend Development Configuration

Navigate to `backend/` and copy the example environment file:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend/.env` in your text editor and configure your settings:

```dotenv
PORT=5000
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_voucher_db"
JWT_SECRET="replace_with_a_long_random_secret_at_least_32_characters"
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

The default PostgreSQL port is 5432. Change it in DATABASE_URL if your server uses a different port.

> **Generating a Secure JWT Secret:**
> Generate a secure 64-character secret using Node.js:
> ```powershell
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2. Backend Test Configuration (For Running Tests)

The backend automated test suite requires a dedicated test database to prevent overwriting development data. Create `backend/.env.test`:

```powershell
Copy-Item .env.test.example .env.test
```

Configure `backend/.env.test`:

```dotenv
NODE_ENV=test
PORT=5001
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_voucher_test_db"
JWT_SECRET="test_suite_jwt_secret_do_not_use_in_production"
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

> [!IMPORTANT]
> The test runner contains an explicit safeguard in `backend/tests/setupEnv.js`: it refuses to run if `DATABASE_URL` does not contain `expense_voucher_test_db`. Never point tests at your development database.

### 3. Frontend Configuration

Navigate to `frontend/` and copy the frontend example environment file:

```powershell
cd ../frontend
Copy-Item .env.example .env
```

Contents of `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

---

## H. Create the Database and Run Migrations

Follow these steps to initialize the development database, apply migrations, seed demo accounts, and start the servers.

### 1. Create the PostgreSQL Database
Open PostgreSQL via `psql` or pgAdmin and create the development database:

```sql
CREATE DATABASE expense_voucher_db;
```

*(Optional: If running tests, also create the test database)*:
```sql
CREATE DATABASE expense_voucher_test_db;
```

### 2. Apply Prisma Migrations
In the `backend/` directory, apply the committed Prisma migrations:

```powershell
cd backend
npx prisma migrate deploy
```

This will apply:
1. `20261011120902_init_expense_voucher`: Creates `users`, `vouchers`, `voucher_activities`, enums, and foreign key constraints.
2. `20261011133708_make_employee_signature_optional_for_drafts`: Sets `employeeSignatureUrl` to nullable for drafts.

### 3. Generate Prisma Client
```powershell
npx prisma generate
```

### 4. Seed Demo Data
Populate the database with the 4 demo users and 20 sample expense vouchers across all lifecycle states:

```powershell
npm run seed
```

### 5. Start the Backend Server
```powershell
npm run dev
```

The backend server starts at: `http://localhost:5000`.
Verify backend health in your browser or curl:
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Expected response: `{"success":true,"message":"Expense Voucher Management System API is healthy","timestamp":"...","uptime":...}`

### 6. Start the Frontend Server
In a separate terminal, navigate to `frontend/` and start Vite:

```powershell
cd frontend
npm run dev
```

The frontend application opens at: `http://localhost:5173`.

---

## I. Demo Credentials

The database seed script (`backend/prisma/seed.js`) provides 4 demo accounts pre-configured for evaluation:

| Email | Role | Department | Demo Purpose |
| :--- | :--- | :--- | :--- |
| `employee@demo.com` | `EMPLOYEE` | Engineering | Create drafts, upload signatures, submit vouchers |
| `employee2@demo.com`| `EMPLOYEE` | Marketing & Sales | Second employee to verify user isolation |
| `director@demo.com`  | `DIRECTOR` | Executive Management | Review queue, digitally sign & approve, reject |
| `accounts@demo.com`  | `ACCOUNTS` | Finance & Accounts | Read-only register, audit metrics, CSV export, A4 print |

- **Default Password for All Demo Accounts**: `Password@123`
- **Quick-Fill Buttons**: The login page (`/login`) includes one-click autofill buttons for all 3 primary roles.

> [!WARNING]
> These credentials and hashed passwords are strictly for local testing and demonstration. Change all credentials and JWT secrets before deploying to any production environment.

---

## J. Database Schema Explanation

The schema is defined in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

### 1. `users` Table
Stores user accounts for employees, directors, and accounts staff.
- `id` (`TEXT`, PK): UUID identifier.
- `name` (`TEXT`): Full name of the user.
- `email` (`TEXT`, UNIQUE): Unique email address used for login.
- `passwordHash` (`TEXT`): Bcrypt-hashed password (10 salt rounds).
- `role` (`UserRole` ENUM): Role discriminator (`EMPLOYEE`, `DIRECTOR`, `ACCOUNTS`).
- `employeeId` (`TEXT`, Nullable): Corporate employee badge number (e.g. `EMP-001`).
- `department` (`TEXT`, Nullable): Assigned organizational unit.
- `signatureUrl` (`TEXT`, Nullable): Relative path to registered handwritten signature image.
- `createdAt` (`TIMESTAMP`): Registration timestamp.

### 2. `vouchers` Table
Stores expense vouchers and tracks lifecycle statuses.
- `id` (`TEXT`, PK): UUID identifier.
- `voucherNumber` (`TEXT`, UNIQUE): Auto-generated unique reference number (format: `VCH-YYYY-000001`).
- `voucherDate` (`TIMESTAMP`): Date the voucher record was created.
- `expenseDate` (`TIMESTAMP`): Date the expense incurred (restricted: cannot be in the future).
- `departmentName` (`TEXT`): Department against which expense is claimed.
- `expenseTitle` (`TEXT`): Short descriptive title of the expense.
- `expenseCategory` (`TEXT`): Categorization (e.g., Software & SaaS, Travel, Hardware).
- `expenseDescription` (`TEXT`, Nullable): Detailed explanation (max 1000 characters).
- `amount` (`DECIMAL(12, 2)`): Monetary value claimed (restricted: strictly > 0).
- `status` (`VoucherStatus` ENUM): Current status (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`).
- `createdById` (`TEXT`, FK -> `users.id`): User who drafted the voucher (onDelete: Restrict).
- `employeeSignatureUrl` (`TEXT`, Nullable): Digital signature snapshot attached upon submission.
- `directorSignatureUrl` (`TEXT`, Nullable): Digital signature snapshot attached upon approval.
- `approvedById` (`TEXT`, Nullable, FK -> `users.id`): Director who processed the voucher (onDelete: Restrict).
- `submittedAt` (`TIMESTAMP`, Nullable): Timestamp when employee submitted voucher.
- `approvalDate` (`TIMESTAMP`, Nullable): Timestamp when Director approved or rejected voucher.
- `rejectionReason` (`TEXT`, Nullable): Mandatory explanation if rejected (minimum 5 characters).
- `createdAt` & `updatedAt` (`TIMESTAMP`): Audit timestamps.

**Indexes**:
- `vouchers_voucherNumber_key` (Unique B-tree index)
- `vouchers_status_idx` on `(status)`
- `vouchers_createdById_idx` on `(createdById)`
- `vouchers_expenseDate_idx` on `(expenseDate)`
- `vouchers_expenseCategory_idx` on `(expenseCategory)`
- `vouchers_departmentName_idx` on `(departmentName)`

### 3. `voucher_activities` Table
Immutable chronological audit log of all actions taken on a voucher.
- `id` (`TEXT`, PK): UUID identifier.
- `voucherId` (`TEXT`, FK -> `vouchers.id`, onDelete: Cascade): Linked voucher.
- `userId` (`TEXT`, FK -> `users.id`, onDelete: Restrict): User who performed the action.
- `action` (`VoucherAction` ENUM): Action executed (`CREATED`, `UPDATED`, `SUBMITTED`, `APPROVED`, `REJECTED`).
- `remark` (`TEXT`, Nullable): Audit message or context.
- `createdAt` (`TIMESTAMP`): Event timestamp.

**Indexes**:
- `voucher_activities_voucherId_idx` on `(voucherId)`
- `voucher_activities_userId_idx` on `(userId)`

### Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ vouchers : "creates (createdById)"
    users ||--o{ vouchers : "approves/rejects (approvedById)"
    users ||--o{ voucher_activities : "performs (userId)"
    vouchers ||--o{ voucher_activities : "has audit trail (voucherId)"

    users {
        string id PK "UUID"
        string name
        string email UK
        string passwordHash
        enum role "EMPLOYEE | DIRECTOR | ACCOUNTS"
        string employeeId
        string department
        string signatureUrl
        datetime createdAt
    }

    vouchers {
        string id PK "UUID"
        string voucherNumber UK "VCH-YYYY-000001"
        datetime voucherDate
        datetime expenseDate
        string departmentName
        string expenseTitle
        string expenseCategory
        string expenseDescription
        decimal amount "DECIMAL(12,2)"
        enum status "DRAFT | PENDING_APPROVAL | APPROVED | REJECTED"
        string createdById FK
        string employeeSignatureUrl
        string directorSignatureUrl
        string approvedById FK
        datetime submittedAt
        datetime approvalDate
        string rejectionReason
        datetime createdAt
        datetime updatedAt
    }

    voucher_activities {
        string id PK "UUID"
        string voucherId FK "CASCADE"
        string userId FK "RESTRICT"
        enum action "CREATED | UPDATED | SUBMITTED | APPROVED | REJECTED"
        string remark
        datetime createdAt
    }
```

---

## K. Voucher Workflow and Status Transitions

The application strictly implements the following state machine:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee creates voucher\n[Auto-generates VCH-YYYY-000001]

    DRAFT --> DRAFT : Employee edits or updates\n[Draft only, Creator only]
    DRAFT --> [*] : Employee deletes voucher\n[Draft only, Creator only]

    DRAFT --> PENDING_APPROVAL : Employee submits voucher\n[Requires Employee Signature]

    state PENDING_APPROVAL {
        [*] --> InReview : Forwarded to Director Queue
        InReview --> Approved : Director uploads signature\n& approves
        InReview --> Rejected : Director provides reason (>= 5 chars)\n& rejects
    }

    PENDING_APPROVAL --> APPROVED : Approved by Director\n[directorSignatureUrl attached]
    PENDING_APPROVAL --> REJECTED : Rejected by Director\n[rejectionReason recorded]

    APPROVED --> [*] : Read-only / Terminal State\n[Accounts Audits & Prints A4]
    REJECTED --> [*] : Read-only / Terminal State\n[Feedback reviewed; No resubmission]
```

### Key Workflow Rules:
1. **Creation**: Creates a voucher in `DRAFT` status and assigns a race-safe sequential voucher number (e.g. `VCH-2026-000001`). Signature is optional while in draft.
2. **Editing & Deletion**: Permitted **only** when `status === 'DRAFT'` and by the original creator. Attempts to edit/delete vouchers in any other state return HTTP `409 Conflict`.
3. **Submission**: Transitions status from `DRAFT` to `PENDING_APPROVAL`. The system verifies the employee has a saved signature, captures a snapshot into `employeeSignatureUrl`, sets `submittedAt`, and logs a `SUBMITTED` activity.
4. **Director Approval**: Requires an uploaded Director signature file. Sets status to `APPROVED`, records `approvedById`, `approvalDate`, and logs an `APPROVED` activity.
5. **Director Rejection**: Requires a non-empty `rejectionReason` (min 5 characters). Sets status to `REJECTED`, records `approvalDate`, and logs a `REJECTED` activity.
6. **Terminal States**: Both `APPROVED` and `REJECTED` are final immutable states. In this system, rejected vouchers cannot be re-opened or re-submitted; the employee reviews the feedback and creates a new draft if necessary.

---

## L. Full API Documentation

All API endpoints are prefixed with `/api` and return standardized JSON response envelopes.

### API Reference Table

| Method | Endpoint | Required Role | Request Body / Query / Files | Successful Response | Important Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | None | `200 OK` + Health status | None |
| `POST` | `/api/auth/login` | Public | JSON: `email`, `password` | `200 OK` + JWT token & user | `400` (Validation), `401` (Invalid credentials) |
| `GET` | `/api/auth/me` | Authenticated | None | `200 OK` + User profile | `401` (Unauthorized) |
| `POST` | `/api/users/signature` | Authenticated | Multipart: `signature` (PNG/JPG <= 2MB) | `200 OK` + `signatureUrl` | `400` (Invalid file/size), `401` |
| `GET` | `/api/users/signature/file/:filename` | Authenticated | Path: `:filename` | `200 OK` + Binary Image stream | `400` (Invalid name), `401`, `404` (Not found) |
| `GET` | `/api/vouchers` | Authenticated | Query: `search`, `status`, `department`, `category`, `fromDate`, `toDate`, `minAmount`, `maxAmount`, `sortBy`, `order`, `page`, `limit` | `200 OK` + `items[]`, `pagination` | `400` (Invalid filter), `401` |
| `GET` | `/api/vouchers/meta` | Authenticated | None | `200 OK` + `departments[]`, `categories[]` | `401` |
| `POST` | `/api/vouchers` | `EMPLOYEE` | JSON: `departmentName`, `expenseTitle`, `expenseCategory`, `amount`, `expenseDate`, `expenseDescription?` | `201 Created` + Voucher object | `400` (Validation), `401`, `403` (Forbidden) |
| `GET` | `/api/vouchers/:id` | Authenticated | Path: `:id` (UUID) | `200 OK` + Voucher + relations | `401`, `404` (Not found / unauthorized employee) |
| `PUT` | `/api/vouchers/:id` | `EMPLOYEE` | Path: `:id`, JSON: Voucher fields | `200 OK` + Updated voucher | `400`, `401`, `403`, `404`, `409` (Not DRAFT) |
| `DELETE` | `/api/vouchers/:id` | `EMPLOYEE` | Path: `:id` (UUID) | `200 OK` + Success message | `401`, `403`, `404`, `409` (Not DRAFT) |
| `POST` | `/api/vouchers/:id/submit` | `EMPLOYEE` | Path: `:id` (UUID) | `200 OK` + Submitted voucher | `400` (No signature), `401`, `403`, `404`, `409` |
| `POST` | `/api/vouchers/:id/approve` | `DIRECTOR` | Path: `:id`, Multipart: `signature` file | `200 OK` + Approved voucher | `400` (No file), `401`, `403`, `404`, `409` (Not PENDING) |
| `POST` | `/api/vouchers/:id/reject` | `DIRECTOR` | Path: `:id`, JSON: `rejectionReason` (min 5 chars) | `200 OK` + Rejected voucher | `400` (Reason invalid), `401`, `403`, `404`, `409` |
| `GET` | `/api/dashboard` | Authenticated | None | `200 OK` + Role summary metrics | `401` |

---

### Detailed Request & Response Examples

#### 1. User Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "employee@demo.com",
    "password": "Password@123"
  }
  ```
- **Successful Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c1f185bb-6577-4b7c-87d8-21d96b999f84",
        "name": "Rajesh Sharma",
        "email": "employee@demo.com",
        "role": "EMPLOYEE",
        "employeeId": "EMP-001",
        "department": "Engineering",
        "signatureUrl": "/api/users/signature/file/employee-demo.png"
      }
    }
  }
  ```

#### 2. Create Voucher Draft
- **Endpoint**: `POST /api/vouchers`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
  ```json
  {
    "departmentName": "Engineering",
    "expenseTitle": "AWS Cloud Server Hosting - March",
    "expenseCategory": "Software & SaaS",
    "amount": 14500.50,
    "expenseDate": "2026-03-10",
    "expenseDescription": "Monthly production EC2 and RDS hosting charges."
  }
  ```
- **Successful Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Voucher created successfully",
    "data": {
      "id": "7f8b9a12-34cd-56ef-78ab-9012cdef3456",
      "voucherNumber": "VCH-2026-000021",
      "status": "DRAFT",
      "amount": "14500.50",
      "departmentName": "Engineering",
      "expenseTitle": "AWS Cloud Server Hosting - March",
      "expenseCategory": "Software & SaaS",
      "expenseDescription": "Monthly production EC2 and RDS hosting charges.",
      "expenseDate": "2026-03-10T00:00:00.000Z",
      "createdById": "c1f185bb-6577-4b7c-87d8-21d96b999f84",
      "employeeSignatureUrl": null,
      "directorSignatureUrl": null,
      "approvedById": null,
      "createdAt": "2026-03-11T09:30:00.000Z"
    }
  }
  ```

#### 3. Director Approval
- **Endpoint**: `POST /api/vouchers/:id/approve`
- **Headers**: `Authorization: Bearer <DIRECTOR_TOKEN>`
- **Multipart Form Data**: `signature` (attached image file)
- **Successful Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Voucher approved successfully",
    "data": {
      "id": "7f8b9a12-34cd-56ef-78ab-9012cdef3456",
      "voucherNumber": "VCH-2026-000021",
      "status": "APPROVED",
      "amount": "14500.50",
      "approvalDate": "2026-03-11T11:45:00.000Z",
      "approvedById": "d2e296cc-7688-5c8d-98e9-32ea7caa0a95",
      "directorSignatureUrl": "/api/users/signature/file/sig-65e9f81a-281a-4d7a-8f19-3c87e4125b21.png"
    }
  }
  ```

#### 4. Director Rejection
- **Endpoint**: `POST /api/vouchers/:id/reject`
- **Headers**: `Authorization: Bearer <DIRECTOR_TOKEN>`
- **Request Body**:
  ```json
  {
    "rejectionReason": "Itemized tax invoices are required for hosting claims exceeding ₹10,000."
  }
  ```
- **Successful Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Voucher rejected",
    "data": {
      "id": "7f8b9a12-34cd-56ef-78ab-9012cdef3456",
      "voucherNumber": "VCH-2026-000021",
      "status": "REJECTED",
      "approvalDate": "2026-03-11T12:00:00.000Z",
      "rejectionReason": "Itemized tax invoices are required for hosting claims exceeding ₹10,000."
    }
  }
  ```

---

## M. Business Rules and Enforcement

| Business Rule | Where Enforced | Enforcement Mechanism | Result When Violated |
| :--- | :--- | :--- | :--- |
| **Employee Isolation** | `voucher.service.js` | Database query condition checking `createdById === user.id` | Returns `HTTP 404 Not Found` (avoids leaking voucher existence) |
| **Draft-Only Edits** | `voucher.service.js` | Checks `existing.status === 'DRAFT'` inside `$transaction` | Returns `HTTP 409 Conflict`: *"Only DRAFT vouchers can be modified"* |
| **Draft-Only Deletion** | `voucher.service.js` | Checks `existing.status === 'DRAFT'` inside `$transaction` | Returns `HTTP 409 Conflict`: *"Only DRAFT vouchers can be deleted"* |
| **Mandatory Employee Signature** | `voucher.service.js` | Checks `currentUser.signatureUrl` before transitioning to pending | Returns `HTTP 400 Bad Request`: *"Employee signature is required before submission"* |
| **Director Role Exclusivity** | `authorize.js` | Middleware checking `req.user.role === 'DIRECTOR'` | Returns `HTTP 403 Forbidden`: *"Access denied"* |
| **Mandatory Director Signature** | `uploadSignature.js` & service | Multer file presence check on approve route | Returns `HTTP 400 Bad Request`: *"Director digital signature image is required"* |
| **Mandatory Rejection Reason** | `voucher.validator.js` | Zod schema: `rejectionReason.trim().min(5)` | Returns `HTTP 400 Bad Request`: *"Rejection reason must be at least 5 characters"* |
| **Pending Status Guard** | `voucher.service.js` | Atomic query: `WHERE id = ? AND status = 'PENDING_APPROVAL'` | Returns `HTTP 409 Conflict`: *"Only vouchers pending approval can be approved/rejected"* |
| **Accounts Read-Only Access** | `voucher.routes.js` | Routes for mutations restrict access to `EMPLOYEE` or `DIRECTOR` | Returns `HTTP 403 Forbidden` if Accounts attempts POST/PUT/DELETE |
| **Voucher Number Uniqueness** | `voucherNumber.js` & PostgreSQL | Sequence generation `CREATE SEQUENCE IF NOT EXISTS` + `nextval` | Guaranteed race-safe unique sequential number |
| **Non-Zero Positive Amount** | `voucher.validator.js` | Zod schema: `amount.positive()` & PostgreSQL `DECIMAL(12,2)` | Returns `HTTP 400 Bad Request`: *"Amount must be greater than zero"* |
| **No Future Expense Date** | `voucher.validator.js` | Zod refinement comparing to end of current local day | Returns `HTTP 400 Bad Request`: *"Expense date cannot be in the future"* |
| **Signature Format & Magic Bytes**| `signatureFiles.js` | Inspects magic bytes (PNG `89 50 4E 47`, JPEG `FF D8 FF`) | Returns `HTTP 400 Bad Request`: *"File content does not match image signature"* |
| **Signature Size Limit** | `uploadSignature.js` | Multer limit `fileSize: 2 * 1024 * 1024` (2 MB) | Returns `HTTP 400 Bad Request`: *"File too large"* |

---

## N. Assumptions and Design Decisions

1. **Terminal Nature of Rejected Vouchers**: Once a voucher is rejected, it transitions to `REJECTED` and is read-only. Resubmission of the same voucher record is disallowed. If an employee addresses feedback, they generate a new draft voucher.
2. **Director Model**: The system permits any user with the `DIRECTOR` role to approve or reject pending vouchers, recording the approving Director's ID and signature on the voucher.
3. **Local Filesystem Signature Storage**: Signatures are stored securely on the local filesystem under `backend/uploads/signatures/` with randomized UUID filenames (`sig-<uuid>.<ext>`) and served via an authenticated streaming endpoint rather than exposed through public static folders.
4. **Currency Handling**: Amounts are maintained in Indian Rupees (₹ INR) using PostgreSQL `DECIMAL(12, 2)` to eliminate floating-point rounding errors.
5. **Atomic Audit Trail**: Activity log records (`VoucherActivity`) are written inside the exact same Prisma database transaction (`$transaction`) as the voucher mutation, guaranteeing that a voucher status never diverges from its audit log.
6. **Merged Status**: "Submitted" and "Pending Approval" are merged into one status, `PENDING_APPROVAL`.
7. **Employee ID**: Employee ID is optional.
8. **Voucher Date**: `voucherDate` is set automatically to the creation date.
9. **Decision Date**: `approvalDate` also stores the decision date when a voucher is rejected.
10. **Profile Signature**: Each user has one saved profile signature; the employee's is copied onto the voucher at submission.

---

## O. Testing

The backend includes a comprehensive automated integration test suite written with **Jest** and **Supertest** covering authentication, role isolation, signature rules, status transition guards, and input validation.

### Automated Integration Test Suite

#### 1. Configure the Test Database
Ensure `backend/.env.test` exists and points to `expense_voucher_test_db`:
```dotenv
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_voucher_test_db"
```

Apply migrations to the test database:
```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/expense_voucher_test_db"
npx prisma migrate deploy
```

#### 2. Run the Tests
Execute the test command from `backend/`:

```powershell
npm test
```

Test Suites: 2 passed, 2 total / Tests: 62 passed, 62 total

| Test Suite | Tests | Coverage |
| :--- | :--- | :--- |
| `tests/integration.test.js` | 17 | Core workflow and business rules: authentication, employee isolation (404), draft-only edits & deletion (409), submission without employee signature (400), approval without director signature (400), rejection without reason (400), accounts read-only restrictions (403), director mutation restrictions, non-pending approval guards, and positive amount validation. |
| `tests/security_compliance.test.js` | 45 | Security and negative-case testing: wrong-role 403s, terminal-state immutability, duplicate approve/reject, file upload security (magic bytes inspection, file size limits), SQL-injection-style search input, invalid/expired JWT, and payload validation. |

---

## P. Screenshots Placeholder

To add screenshots to your repository, save PNG images to the `docs/screenshots/` directory matching the names below:

1. **Login Page**: `docs/screenshots/login.png`
2. **Employee Dashboard**: `docs/screenshots/employee-dashboard.png`
3. **Voucher Creation Form**: `docs/screenshots/voucher-form.png`
4. **Director Dashboard**: `docs/screenshots/director-dashboard.png`
5. **Director Approval Modal**: `docs/screenshots/director-approval.png`
6. **Accounts Register & CSV Export**: `docs/screenshots/accounts-register.png`
7. **Voucher Details with Digital Signatures**: `docs/screenshots/voucher-details.png`
8. **A4 Printable Voucher View**: `docs/screenshots/print-preview.png`
9. **Mobile Responsive View (360px)**: `docs/screenshots/mobile-responsive.png`

---

## Q. Known Limitations and Future Improvements

### Current Limitations
1. **Local File Storage**: Uploaded signatures reside on the server's local disk volume. In a multi-instance containerized deployment (e.g. Kubernetes, AWS ECS), a shared object store is needed.
2. **Synchronous Email Notifications**: The application currently records database audit activities; it does not dispatch email notifications upon submission, approval, or rejection.
3. **Single Currency**: All vouchers are natively denominated in Indian Rupees (₹ INR); multi-currency conversion is not currently supported.

### Future Improvements
1. **Cloud Object Storage**: Integrate AWS S3, Google Cloud Storage, or Cloudflare R2 for signature image persistence.
2. **Email Alerts & Webhooks**: Integrate Nodemailer / SendGrid for real-time submission alerts to Directors and status updates to Employees.
3. **Receipt Attachment Pipeline**: Expand file upload capabilities from handwritten signature images to supporting itemized PDF receipts and invoices.
4. **Batch Approvals**: Enable Directors to review and approve multiple pending vouchers in a single batched operation.

---

## R. Troubleshooting

### 1. PostgreSQL Connection Refused
- **Symptom**: `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
- **Resolution**: Verify your PostgreSQL service is running. Check your PostgreSQL port in `postgresql.conf` (default is `5432`). Update `DATABASE_URL` in `backend/.env` accordingly.

### 2. Port Already in Use (EADDRINUSE)
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`.
- **Resolution**: Another process is occupying port 5000. In PowerShell, find and terminate the process:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  ```

### 3. Frontend Cannot Connect to Backend (Network Error)
- **Symptom**: Yellow notification banner *"Cannot reach backend server. Displaying cached session data."*
- **Resolution**: Verify the backend is running at `http://localhost:5000`. Confirm `VITE_API_URL=http://localhost:5000/api` in `frontend/.env` and verify CORS settings in `backend/.env` match `CLIENT_URL=http://localhost:5173`.

### 4. Tests Fail with "Attempted to run tests against non-test database"
- **Symptom**: `FATAL: Attempted to run tests against non-test database`.
- **Resolution**: Safety guard in `backend/tests/setupEnv.js` was triggered. Ensure `DATABASE_URL` in `backend/.env.test` includes `expense_voucher_test_db`.

---

## License

ISC License. Developed as an internship assignment submission.