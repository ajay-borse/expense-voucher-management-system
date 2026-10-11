import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Generate pagination page items with ellipses.
 * Example for 10 pages when on page 5: [1, '...', 4, 5, 6, '...', 10]
 */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const showLeftEllipsis = currentPage > 3;
  const showRightEllipsis = currentPage < totalPages - 2;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push('ellipsis-left');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push('ellipsis-right');
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = '',
}) {
  if (totalPages <= 0 && (!totalItems || totalItems === 0)) {
    return null;
  }

  const effectiveTotalPages = Math.max(1, totalPages);
  const pages = getPageNumbers(currentPage, effectiveTotalPages);

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < effectiveTotalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  // Compute item range display
  const startItem = totalItems ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : null;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-sm text-slate-600 select-none ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Summary Info & Optional Page Size Picker */}
      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500">
        {totalItems !== undefined && (
          <span>
            Showing <strong className="font-semibold text-slate-700">{startItem}</strong> to{' '}
            <strong className="font-semibold text-slate-700">{endItem}</strong> of{' '}
            <strong className="font-semibold text-slate-700">{totalItems}</strong> results
          </span>
        )}

        {onPageSizeChange && pageSizeOptions?.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <label htmlFor="pagination-page-size" className="text-xs">
              Rows:
            </label>
            <select
              id="pagination-page-size"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 border border-slate-300 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis-left' || p === 'ellipsis-right') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 text-xs"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= effectiveTotalPages}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
