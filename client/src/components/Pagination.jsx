import { Pagination as BsPagination } from 'react-bootstrap';

/**
 * Builds the list of page numbers to show, with '…' gaps.
 * e.g. current 6 of 12 → [1, '…', 5, 6, 7, '…', 12]
 */
function getPageItems(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) items.push(`gap-${page}`);
    items.push(page);
  });
  return items;
}

/**
 * Server-side pagination controls + "Showing x–y of z".
 * @param {object} props
 * @param {{ page: number, limit: number, total: number, totalPages: number } | null} props.pagination from the API
 * @param {(page: number) => void} props.onPageChange
 * @param {string} [props.itemLabel='results'] e.g. 'appointments'
 */
export default function Pagination({ pagination, onPageChange, itemLabel = 'results' }) {
  if (!pagination || !pagination.total) return null;

  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="sc-pagination">
      <p className="text-muted small mb-0" aria-live="polite">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> {itemLabel}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Pagination">
          <BsPagination size="sm" className="mb-0">
            <BsPagination.Prev
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            />
            {getPageItems(page, totalPages).map((item) =>
              typeof item === 'string' ? (
                <BsPagination.Ellipsis key={item} disabled />
              ) : (
                <BsPagination.Item
                  key={item}
                  active={item === page}
                  onClick={() => item !== page && onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </BsPagination.Item>
              ),
            )}
            <BsPagination.Next
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            />
          </BsPagination>
        </nav>
      )}
    </div>
  );
}
