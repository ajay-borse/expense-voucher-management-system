import React from 'react';
import { SkeletonTableRow, SkeletonMobileCard } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Button from './Button';

export default function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display at this time.',
  actions = [],
  renderActions,
  mobileCardRender,
  skeletonRows = 5,
  className = '',
}) {
  // Handle Error State
  if (error) {
    return (
      <ErrorState
        title="Failed to load table records"
        description={typeof error === 'string' ? error : error.message}
        onRetry={onRetry}
      />
    );
  }

  // Handle Loading State
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Desktop Skeleton Table */}
        <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse" role="table">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                    {col.header}
                  </th>
                ))}
                {(actions.length > 0 || renderActions) && (
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonTableRow
                  key={i}
                  columns={columns.length + (actions.length > 0 || renderActions ? 1 : 0)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Skeleton Cards */}
        <div className="md:hidden space-y-3">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <SkeletonMobileCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Handle Empty State
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ============================================================ */}
      {/* DESKTOP TABLE VIEW */}
      {/* ============================================================ */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" role="table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    scope="col"
                    className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
                {(actions.length > 0 || renderActions) && (
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-normal">
              {data.map((row, rowIdx) => {
                const rowKey = row[keyField] ?? `row-${rowIdx}`;
                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {columns.map((col, colIdx) => {
                      const cellValue = col.key ? row[col.key] : undefined;
                      return (
                        <td
                          key={col.key || colIdx}
                          className={`py-3.5 px-4 align-middle ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          } ${col.className || ''}`}
                        >
                          {col.render ? col.render(row, cellValue) : cellValue ?? '—'}
                        </td>
                      );
                    })}

                    {/* Action Column */}
                    {(actions.length > 0 || renderActions) && (
                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        {renderActions ? (
                          renderActions(row)
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {actions.map((act, actIdx) => {
                              const Icon = act.icon;
                              const isHidden = typeof act.hidden === 'function' ? act.hidden(row) : act.hidden;
                              if (isHidden) return null;

                              return (
                                <Button
                                  key={actIdx}
                                  type="button"
                                  variant={act.variant || 'ghost'}
                                  size="sm"
                                  onClick={() => act.onClick(row)}
                                  disabled={typeof act.disabled === 'function' ? act.disabled(row) : act.disabled}
                                  className={act.className}
                                  title={act.label}
                                  aria-label={act.label}
                                >
                                  {Icon && <Icon className="w-3.5 h-3.5" />}
                                  {!act.iconOnly && <span>{act.label}</span>}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE CARD VIEW */}
      {/* ============================================================ */}
      <div className="md:hidden space-y-3" role="list" aria-label="Records list">
        {data.map((row, rowIdx) => {
          const rowKey = row[keyField] ?? `mobile-row-${rowIdx}`;

          // Custom mobile card renderer if provided
          if (mobileCardRender) {
            return (
              <div key={rowKey} role="listitem">
                {mobileCardRender(row)}
              </div>
            );
          }

          // Default smart mobile card layout
          return (
            <div
              key={rowKey}
              role="listitem"
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
            >
              {/* Card Header: First column or primary identifier */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    {columns[0]?.header || 'Record'}
                  </span>
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {columns[0]?.render ? columns[0].render(row, row[columns[0]?.key]) : row[columns[0]?.key]}
                  </div>
                </div>

                {/* Secondary highlight if column 1 has a badge/status */}
                {columns[1] && (
                  <div className="shrink-0 text-right">
                    {columns[1]?.render ? columns[1].render(row, row[columns[1]?.key]) : row[columns[1]?.key]}
                  </div>
                )}
              </div>

              {/* Card Body: Intermediate columns */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                {columns.slice(2).map((col, idx) => (
                  <div key={col.key || idx} className="min-w-0">
                    <span className="text-slate-400 block font-medium">
                      {col.mobileLabel || col.header}
                    </span>
                    <span className="text-slate-700 font-medium block truncate mt-0.5">
                      {col.render ? col.render(row, row[col.key]) : row[col.key] ?? '—'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card Footer: Row Actions */}
              {(actions.length > 0 || renderActions) && (
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                  {renderActions ? (
                    renderActions(row)
                  ) : (
                    actions.map((act, actIdx) => {
                      const Icon = act.icon;
                      const isHidden = typeof act.hidden === 'function' ? act.hidden(row) : act.hidden;
                      if (isHidden) return null;

                      return (
                        <Button
                          key={actIdx}
                          type="button"
                          variant={act.variant || 'outline'}
                          size="sm"
                          onClick={() => act.onClick(row)}
                          disabled={typeof act.disabled === 'function' ? act.disabled(row) : act.disabled}
                          icon={Icon}
                        >
                          {act.label}
                        </Button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
