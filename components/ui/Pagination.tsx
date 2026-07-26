'use client';

interface PaginationProps {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages: number[] = [];
  const windowSize = 2;
  for (let p = Math.max(1, page - windowSize); p <= Math.min(pageCount, page + windowSize); p++) {
    pages.push(p);
  }

  return (
    <nav
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-neutral-100"
      aria-label="Pagination"
    >
      <span className="text-xs text-neutral-450 font-medium">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 text-xs font-medium border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <i className="bx bx-chevron-left"></i>
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="px-2.5 py-1.5 text-xs font-medium border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              1
            </button>
            {pages[0] > 2 && <span className="text-neutral-400 text-xs px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              p === page
                ? 'bg-amber-500 text-white'
                : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < pageCount && (
          <>
            {pages[pages.length - 1] < pageCount - 1 && <span className="text-neutral-400 text-xs px-1">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(pageCount)}
              className="px-2.5 py-1.5 text-xs font-medium border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {pageCount}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pageCount}
          className="px-2.5 py-1.5 text-xs font-medium border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    </nav>
  );
}
