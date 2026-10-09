import { Col, Row } from 'react-bootstrap';
import Skeleton from '../Skeleton';

/**
 * Skeleton loader for AppointmentDetail page (patient & staff portals).
 * Replaces the fullPage spinner with an accurate layout skeleton.
 */
export default function AppointmentDetailSkeleton() {
  return (
    <div className="sc-detail-skeleton" role="status" aria-label="Loading appointment details...">
      <span className="visually-hidden">Loading appointment details...</span>

      {/* Header Skeleton */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <Skeleton width={120} height={14} className="mb-2" />
          <Skeleton width={260} height={28} className="mb-2" />
          <Skeleton width={180} height={16} />
        </div>
        <div className="d-flex gap-2">
          <Skeleton width={100} height={38} borderRadius={8} />
          <Skeleton width={90} height={38} borderRadius={8} />
        </div>
      </div>

      <Row className="g-4 mb-4">
        {/* Left / Main Column */}
        <Col lg={8}>
          <div className="sc-card mb-4 p-4">
            {/* Status & Booked Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div>
                <Skeleton width={50} height={12} className="mb-1" />
                <Skeleton width={90} height={24} borderRadius={12} />
              </div>
              <div className="text-end">
                <Skeleton width={60} height={12} className="mb-1" />
                <Skeleton width={120} height={16} />
              </div>
            </div>

            {/* Time & Date Block */}
            <div className="p-3 bg-light rounded-3 mb-4">
              <div className="d-flex align-items-center gap-3">
                <Skeleton width={44} height={44} borderRadius={10} className="flex-shrink-0" />
                <div className="flex-grow-1">
                  <Skeleton width="45%" height={16} className="mb-1" />
                  <Skeleton width="30%" height={14} />
                </div>
              </div>
            </div>

            {/* Services Breakdown */}
            <div className="mb-4">
              <Skeleton width={140} height={18} className="mb-3" />
              <div className="border rounded-3 p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <Skeleton width="40%" height={16} />
                  <Skeleton width={70} height={16} />
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <Skeleton width="35%" height={16} />
                  <Skeleton width={70} height={16} />
                </div>
              </div>
            </div>

            {/* Dentist Card */}
            <div>
              <Skeleton width={130} height={18} className="mb-3" />
              <div className="d-flex align-items-center gap-3 p-3 border rounded-3">
                <Skeleton variant="circular" width={48} height={48} className="flex-shrink-0" />
                <div className="flex-grow-1">
                  <Skeleton width="40%" height={16} className="mb-1" />
                  <Skeleton width="25%" height={13} />
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* Right / Sidebar Column */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            <div className="sc-card p-4">
              <Skeleton width={130} height={18} className="mb-3" />
              <div className="d-flex flex-column gap-3">
                <div>
                  <Skeleton width={70} height={12} className="mb-1" />
                  <Skeleton width="80%" height={15} />
                </div>
                <div>
                  <Skeleton width={60} height={12} className="mb-1" />
                  <Skeleton width="60%" height={15} />
                </div>
                <div>
                  <Skeleton width={50} height={12} className="mb-1" />
                  <Skeleton width="90%" height={15} />
                </div>
              </div>
            </div>

            <div className="sc-card p-4">
              <Skeleton width={110} height={18} className="mb-3" />
              <Skeleton width="100%" height={14} className="mb-2" />
              <Skeleton width="85%" height={14} className="mb-2" />
              <Skeleton width="70%" height={14} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
