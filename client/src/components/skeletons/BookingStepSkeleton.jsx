import Skeleton from '../Skeleton';

/**
 * Skeleton loader for BookAppointment option grids (services & dentists).
 *
 * @param {object} props
 * @param {number} [props.count=6]
 */
export default function BookingStepSkeleton({ count = 6 }) {
  return (
    <div className="sc-option-grid" role="status" aria-label="Loading options...">
      <span className="visually-hidden">Loading options...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sc-option-card">
          <div className="sc-option-card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <Skeleton width="60%" height={18} />
              <Skeleton width={20} height={20} borderRadius={6} />
            </div>

            <Skeleton width="100%" height={14} className="mb-2" />
            <Skeleton width="80%" height={14} className="mb-3" />

            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
              <Skeleton width={60} height={14} />
              <Skeleton width={70} height={18} borderRadius={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
