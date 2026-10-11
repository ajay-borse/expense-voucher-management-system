import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Button from './Button';

// Backend supported sort options
const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Creation Date' },
  { value: 'expenseDate', label: 'Expense Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'voucherNumber', label: 'Voucher Number' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function FilterBar({
  departmentOptions = [],
  categoryOptions = [],
  className = '',
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Read current URL search parameters
  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentDepartment = searchParams.get('department') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentFromDate = searchParams.get('fromDate') || '';
  const currentToDate = searchParams.get('toDate') || '';
  const currentMinAmount = searchParams.get('minAmount') || '';
  const currentMaxAmount = searchParams.get('maxAmount') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentOrder = searchParams.get('order') || 'desc';

  // Local state for debouncing search input
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [rangeError, setRangeError] = useState(null);
  const debounceTimerRef = useRef(null);

  // Sync search input if URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Helper to atomically update query params, preserving unrelated parameters
  const updateParams = useCallback(
    (updates, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          Object.entries(updates).forEach(([key, val]) => {
            if (val === undefined || val === null || val === '') {
              newParams.delete(key);
            } else {
              newParams.set(key, String(val));
            }
          });

          // Reset page to 1 whenever filters or search criteria change
          if (resetPage) {
            newParams.delete('page');
          }

          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Validate range bounds (amount & date)
  const validateRanges = useCallback(
    (minAmt, maxAmt, fromDt, toDt) => {
      if (minAmt && maxAmt && Number(minAmt) > Number(maxAmt)) {
        return 'Min amount cannot exceed max amount';
      }
      if (fromDt && toDt && new Date(fromDt) > new Date(toDt)) {
        return 'Start date cannot be after end date';
      }
      return null;
    },
    []
  );

  // Debounced search effect (350ms)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      updateParams({ search: val.trim() });
    }, 350);
  };

  // Immediate filter handlers (status, department, category, sorting)
  const handleFilterChange = (key, val) => {
    updateParams({ [key]: val });
  };

  // Amount & date change handler with inline range validation
  const handleRangeFieldChange = (key, val) => {
    let nextMin = key === 'minAmount' ? val : currentMinAmount;
    let nextMax = key === 'maxAmount' ? val : currentMaxAmount;
    let nextFrom = key === 'fromDate' ? val : currentFromDate;
    let nextTo = key === 'toDate' ? val : currentToDate;

    const error = validateRanges(nextMin, nextMax, nextFrom, nextTo);
    setRangeError(error);

    if (!error) {
      updateParams({ [key]: val });
    }
  };

  // Reset all filters to default state
  const handleReset = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchInput('');
    setRangeError(null);

    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      // Remove all voucher filter keys
      newParams.delete('search');
      newParams.delete('status');
      newParams.delete('department');
      newParams.delete('category');
      newParams.delete('fromDate');
      newParams.delete('toDate');
      newParams.delete('minAmount');
      newParams.delete('maxAmount');
      newParams.delete('sortBy');
      newParams.delete('order');
      newParams.delete('page');
      return newParams;
    }, { replace: true });
  };

  // Count active non-default filters for badge
  const activeFiltersCount = [
    currentStatus,
    currentDepartment,
    currentCategory,
    currentFromDate,
    currentToDate,
    currentMinAmount,
    currentMaxAmount,
    currentSortBy !== 'createdAt' ? currentSortBy : null,
    currentOrder !== 'desc' ? currentOrder : null,
  ].filter(Boolean).length;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      role="search"
      aria-label="Voucher listings filter"
    >
      {/* Primary Bar: Search, Status & Advanced Filter Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Debounced Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by title, number, or description..."
            className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            aria-label="Search vouchers"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full sm:w-48">
          <select
            value={currentStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full py-2 px-3 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            aria-label="Filter by voucher status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Advanced Filters Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showAdvanced || activeFiltersCount > 0 ? 'primary' : 'outline'}
            size="md"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
            aria-expanded={showAdvanced}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            )}
          </Button>

          {/* Reset Filters Button */}
          {(currentSearch || activeFiltersCount > 0) && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleReset}
              title="Reset all filters"
              className="text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Range Error Notice */}
      {rangeError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{rangeError}</span>
        </div>
      )}

      {/* Advanced Filter Drawer (Collapsible) */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Department
            </label>
            <select
              value={currentDepartment}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="block w-full py-1.5 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Expense Category
            </label>
            <select
              value={currentCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="block w-full py-1.5 px-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: From & To */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={currentFromDate}
                onChange={(e) => handleRangeFieldChange('fromDate', e.target.value)}
                placeholder="From"
                className="block w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="From date"
              />
              <input
                type="date"
                value={currentToDate}
                onChange={(e) => handleRangeFieldChange('toDate', e.target.value)}
                placeholder="To"
                className="block w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="To date"
              />
            </div>
          </div>

          {/* Amount Range: Min & Max */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Amount Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="0"
                value={currentMinAmount}
                onChange={(e) => handleRangeFieldChange('minAmount', e.target.value)}
                placeholder="Min ₹"
                className="block w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Minimum amount"
              />
              <input
                type="number"
                min="0"
                value={currentMaxAmount}
                onChange={(e) => handleRangeFieldChange('maxAmount', e.target.value)}
                placeholder="Max ₹"
                className="block w-full py-1.5 px-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Maximum amount"
              />
            </div>
          </div>

          {/* Sort By & Order */}
          <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-600">Sort By:</span>
              <select
                value={currentSortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {SORT_BY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={currentOrder}
                onChange={(e) => handleFilterChange('order', e.target.value)}
                className="py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="desc">Descending (Newest / Highest)</option>
                <option value="asc">Ascending (Oldest / Lowest)</option>
              </select>
            </div>

            <div className="text-slate-400">
              Filters automatically sync with browser URL history.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
