import { Table } from 'react-bootstrap';
import Skeleton from '../Skeleton';

/**
 * Modern Skeleton loader for table views (Appointments, Patients, Dentists, Services, Staff).
 * Eliminates CLS (Cumulative Layout Shift) by perfectly preserving table structure.
 *
 * @param {object} props
 * @param {number} [props.columns=5] number of table columns
 * @param {number} [props.rows=6] number of skeleton rows
 * @param {boolean} [props.hasAvatar=false] whether column 1 or 2 contains an avatar circle
 * @param {boolean} [props.showPagination=true] whether to render the footer pagination skeleton
 */
export default function TableSkeleton({
  columns = 5,
  rows = 6,
  hasAvatar = false,
  showPagination = true,
}) {
  return (
    <div className="sc-table-card" role="status" aria-label="Loading content...">
      <div className="table-responsive">
        <Table hover align="middle" className="sc-table mb-0">
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, c) => (
                <th key={c}>
                  <Skeleton
                    width={c === 0 ? '70%' : c === columns - 1 ? '40%' : '55%'}
                    height={14}
                    borderRadius={4}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c}>
                    {hasAvatar && c === 0 ? (
                      <div className="d-flex align-items-center gap-2">
                        <Skeleton variant="circular" width={34} height={34} className="flex-shrink-0" />
                        <div className="flex-grow-1">
                          <Skeleton width="75%" height={14} className="mb-1" />
                          <Skeleton width="50%" height={11} />
                        </div>
                      </div>
                    ) : c === columns - 1 ? (
                      <div className="d-flex justify-content-end gap-1">
                        <Skeleton width={68} height={28} borderRadius={6} />
                      </div>
                    ) : c === 3 ? (
                      <Skeleton width={74} height={22} borderRadius={12} />
                    ) : (
                      <Skeleton
                        width={c === 1 ? '85%' : c === 2 ? '65%' : '50%'}
                        height={14}
                        borderRadius={4}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {showPagination && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-3">
          <Skeleton width={140} height={14} borderRadius={4} />
          <div className="d-flex gap-1">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={32} height={32} borderRadius={8} />
          </div>
        </div>
      )}
    </div>
  );
}
