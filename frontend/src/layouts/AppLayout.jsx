import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Clock,
  FileCheck2,
  ReceiptText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  User,
  Building,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';

export default function AppLayout() {
  const { user, logout, networkError } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation configuration scoped by user role
  const getNavItems = () => {
    switch (user?.role) {
      case 'EMPLOYEE':
        return [
          {
            name: 'Dashboard',
            path: '/employee/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Create Voucher',
            path: '/employee/vouchers/create',
            icon: PlusCircle,
          },
          {
            name: 'My Vouchers',
            path: '/employee/vouchers',
            icon: Receipt,
          },
        ];
      case 'DIRECTOR':
        return [
          {
            name: 'Dashboard',
            path: '/director/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Pending Approvals',
            path: '/director/vouchers/pending',
            icon: Clock,
          },
          {
            name: 'All Vouchers',
            path: '/director/vouchers',
            icon: FileCheck2,
          },
        ];
      case 'ACCOUNTS':
        return [
          {
            name: 'Dashboard',
            path: '/accounts/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'All Vouchers',
            path: '/accounts/vouchers',
            icon: ReceiptText,
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Derive current page title from active path
  const getPageTitle = () => {
    const current = navItems.find((item) => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname.includes('/create')) return 'Create Voucher';
    if (location.pathname.includes('/pending')) return 'Pending Approvals';
    if (location.pathname.includes('/vouchers')) return 'Voucher Management';
    return 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Network Warning Banner */}
      {networkError && (
        <div className="bg-amber-500 text-white text-xs font-medium px-4 py-1.5 flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Cannot reach backend server. Displaying cached session data.</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================ */}
        {/* DESKTOP SIDEBAR */}
        {/* ============================================================ */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out select-none z-20 ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                <ReceiptText className="w-5 h-5" />
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                    VoucherFlow
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                    Expense System
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Mini Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                      {user?.department || user?.employeeId || user?.role}
                    </p>
                  </div>
                </div>
                <Badge role={user?.role} size="sm" />
              </div>
            ) : (
              <div
                className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs"
                title={`${user?.name} (${user?.role})`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* MOBILE SIDEBAR DRAWER */}
        {/* ============================================================ */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-xs bg-white h-full flex flex-col shadow-xl z-10">
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-900 tracking-tight text-base">
                    VoucherFlow
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Mobile User Section */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <Badge role={user?.role} size="sm" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN CONTENT WRAPPER */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right Header: User Info & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user?.name}
                </span>
                <span className="text-xs text-slate-500 leading-tight">
                  {user?.department || user?.email}
                </span>
              </div>

              <Badge role={user?.role} size="md" className="hidden xs:inline-flex" />

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                title="Log out of system"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
