import Skeleton from '../Skeleton';

/**
 * Skeleton loader for appointment list cards (e.g. MyAppointments page).
 *
 * @param {object} props
 * @param {number} [props.count=3] number of skeleton cards to render
 */
export default function AppointmentListSkeleton({ count = 3 }) {
  return (
    <div className="d-flex flex-column gap-3 mb-4" role="status" aria-label="Loading appointments...">
      <span className="visually-hidden">Loading appointments...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sc-card sc-appointment-card">
          {/* Date tile skeleton */}
          <div className="sc-date-tile" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <Skeleton width={32} height={10} className="mb-1" />
            <Skeleton width={26} height={20} className="mb-1" />
            <Skeleton width={28} height={10} />
          </div>

          {/* Card Body */}
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
              <div className="d-flex align-items-center gap-2">
                <Skeleton width={160} height={18} />
                <Skeleton width={65} height={18} borderRadius={10} />
              </div>
              <Skeleton width={80} height={22} borderRadius={12} />
            </div>

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-2">
              <Skeleton width={110} height={14} />
              <Skeleton width={130} height={14} />
              <Skeleton width={85} height={14} />
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
              <Skeleton width={85} height={30} borderRadius={6} />
              <Skeleton width={75} height={30} borderRadius={6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
