# Expense Voucher Management System

A full-stack, role-based application for creating, reviewing, approving, and auditing employee expense vouchers.

## Overview

The Expense Voucher Management System streamlines company expense reimbursement with strict server-side validation and role-based workflows:
- **EMPLOYEE**: Create and manage draft expense vouchers, sign and submit vouchers.
- **DIRECTOR**: Review submitted vouchers, sign to approve or provide reason to reject.
- **ACCOUNTS**: Audit and track approved vouchers in read-only mode.

---

## Technology Stack

- **Frontend**: React (Vite), React Router DOM, Tailwind CSS, React Hook Form, Zod, Axios, Lucide React icons
- **Backend**: Node.js, Express.js, PostgreSQL (`pg`), Helmet, Morgan, CORS, Dotenv
- **Architecture**: Separated frontend and backend monorepo with clean layered backend structure (Routes -> Controllers -> Services -> Middleware).

---

## Folder Structure

```text
expense-voucher-management-system/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection pool & app configuration
│   │   ├── routes/         # Express API route definitions
│   │   ├── controllers/    # Request handlers & response formatting
│   │   ├── services/       # Business logic layer
│   │   ├── middleware/     # Error handling, 404, auth & validation middleware
│   │   ├── validators/     # Request schema validations
│   │   ├── utils/          # Helper utilities
│   │   └── app.js          # Express app configuration & middleware pipeline
│   ├── uploads/            # Uploaded receipts/files (.gitkeep tracked)
│   ├── server.js           # Server entry point & listener
│   ├── package.json        # Backend dependencies & npm scripts
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views/pages
│   │   ├── layouts/        # Layout wrappers
│   │   ├── services/       # API clients (Axios instance)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Frontend utility functions
│   │   ├── App.jsx         # Root component & routing setup
│   │   ├── main.jsx        # Frontend entry point
│   │   └── index.css       # Tailwind CSS directives & global styles
│   ├── index.html          # HTML entry point
│   ├── package.json        # Frontend dependencies & npm scripts
│   ├── vite.config.js      # Vite build & dev server configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── postcss.config.js   # PostCSS configuration
│   └── .env.example        # Frontend environment variable template
├── docs/
│   └── screenshots/        # Project documentation assets (.gitkeep tracked)
├── .gitignore              # Root git ignore rules
└── README.md               # Project documentation
```

---

## Prerequisites

- **Node.js**: v18 or higher (v24+ recommended)
- **npm**: v9 or higher
- **PostgreSQL**: Running locally on port `5234`

---

## Environment Configuration

Both backend and frontend require environment configuration files. Copy the provided `.env.example` templates to `.env`:

### 1. Backend Environment Setup

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Default variables in `backend/.env`:

```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5234/expense_voucher_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

> **Note on PostgreSQL Port:** The local PostgreSQL server is configured on port `5234`. Replace `YOUR_PASSWORD` with your local database password and create the database `expense_voucher_db` in PostgreSQL.

### 2. Frontend Environment Setup

Create `frontend/.env` from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Default variables in `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## Running the Development Servers

### 1. Start the Backend

In the `backend` directory:

```bash
npm run dev
```

The backend server starts with nodemon on `http://localhost:5000`.

- **Health Endpoint URL**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Expected response:
  ```json
  {
    "success": true
  }
  ```

### 2. Start the Frontend

In the `frontend` directory:

```bash
npm run dev
```

The Vite dev server starts on `http://localhost:5173`. Open your browser to test the UI and check backend connectivity.

### 3. Build Frontend for Production

```bash
cd frontend
npm run build
```

---

## Security & Best Practices

- All secrets and credentials are loaded via environment variables and excluded from version control via `.gitignore`.
- Helmet is applied to secure HTTP headers.
- CORS is restricted to the frontend client URL (`CLIENT_URL`).
- Centralized error and 404 handlers prevent stack trace leakage in production.