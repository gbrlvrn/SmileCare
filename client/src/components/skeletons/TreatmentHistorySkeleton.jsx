import Skeleton from '../Skeleton';

/**
 * Skeleton loader for TreatmentHistory page.
 * Matches the clinical treatment cards layout.
 *
 * @param {object} props
 * @param {number} [props.count=2]
 */
export default function TreatmentHistorySkeleton({ count = 2 }) {
  return (
    <div className="d-flex flex-column gap-4 mb-4" role="status" aria-label="Loading treatment history...">
      <span className="visually-hidden">Loading treatment history...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sc-card p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center pb-3 mb-3 border-bottom gap-2">
            <div>
              <Skeleton width={80} height={20} borderRadius={6} className="mb-2" />
              <Skeleton width={180} height={22} className="mb-1" />
              <Skeleton width={130} height={14} />
            </div>
            <div className="text-sm-end">
              <Skeleton width={100} height={16} className="mb-1" />
              <Skeleton width={120} height={14} />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <Skeleton width={90} height={14} className="mb-2" />
              <Skeleton width="90%" height={16} className="mb-1" />
              <Skeleton width="75%" height={16} />
            </div>
            <div className="col-md-6">
              <Skeleton width={100} height={14} className="mb-2" />
              <div className="p-2 border rounded-2">
                <Skeleton width="60%" height={15} className="mb-1" />
                <Skeleton width="40%" height={13} />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-top text-end">
            <Skeleton width={110} height={16} className="ms-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
