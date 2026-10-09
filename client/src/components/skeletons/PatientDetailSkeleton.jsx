import { Col, Row } from 'react-bootstrap';
import Skeleton from '../Skeleton';
import TableSkeleton from './TableSkeleton';

/**
 * Skeleton loader for staff PatientDetail page.
 */
export default function PatientDetailSkeleton() {
  return (
    <div className="sc-patient-detail-skeleton" role="status" aria-label="Loading patient record...">
      <span className="visually-hidden">Loading patient record...</span>

      {/* Header Skeleton */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <Skeleton width={130} height={14} className="mb-2" />
          <Skeleton width={220} height={28} className="mb-2" />
          <Skeleton width={180} height={16} />
        </div>
        <div className="d-flex gap-2">
          <Skeleton width={150} height={38} borderRadius={8} />
          <Skeleton width={110} height={38} borderRadius={8} />
        </div>
      </div>

      {/* Patient info and stats */}
      <Row className="g-4 mb-4">
        <Col lg={4}>
          <div className="sc-card p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <Skeleton variant="circular" width={60} height={60} className="flex-shrink-0" />
              <div className="flex-grow-1">
                <Skeleton width="70%" height={18} className="mb-1" />
                <Skeleton width={80} height={22} borderRadius={10} />
              </div>
            </div>

            <div className="d-flex flex-column gap-3">
              <div>
                <Skeleton width={60} height={12} className="mb-1" />
                <Skeleton width="85%" height={15} />
              </div>
              <div>
                <Skeleton width={50} height={12} className="mb-1" />
                <Skeleton width="65%" height={15} />
              </div>
              <div>
                <Skeleton width={60} height={12} className="mb-1" />
                <Skeleton width="50%" height={15} />
              </div>
              <div>
                <Skeleton width={70} height={12} className="mb-1" />
                <Skeleton width="90%" height={15} />
              </div>
            </div>
          </div>
        </Col>

        <Col lg={8}>
          <div className="d-flex flex-column gap-4 h-100">
            {/* Stats row */}
            <Row className="g-3">
              {[1, 2, 3].map((i) => (
                <Col key={i} sm={4}>
                  <div className="sc-card p-3">
                    <Skeleton width="50%" height={12} className="mb-2" />
                    <Skeleton width={40} height={26} />
                  </div>
                </Col>
              ))}
            </Row>

            {/* Medical notes card */}
            <div className="sc-card p-4 flex-grow-1">
              <Skeleton width={120} height={18} className="mb-3" />
              <Skeleton width="100%" height={14} className="mb-2" />
              <Skeleton width="85%" height={14} className="mb-2" />
              <Skeleton width="60%" height={14} />
            </div>
          </div>
        </Col>
      </Row>

      {/* Appointment History Table */}
      <div className="mt-4">
        <Skeleton width={180} height={22} className="mb-3" />
        <TableSkeleton columns={5} rows={4} showPagination={false} />
      </div>
    </div>
  );
}
