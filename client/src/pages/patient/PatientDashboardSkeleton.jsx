import { Col, Row } from 'react-bootstrap';
import Skeleton from '../../components/Skeleton';

/**
 * Skeleton placeholder that matches the visual layout of PatientDashboard.
 * Eliminates layout shift (CLS) and provides a sleek shimmer loading experience.
 */
export default function PatientDashboardSkeleton() {
  return (
    <div className="sc-dashboard-skeleton" role="status" aria-label="Loading dashboard...">
      <span className="visually-hidden">Loading dashboard content...</span>

      {/* Banner Skeleton */}
      <div className="sc-card sc-welcome-banner-skeleton p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="d-flex align-items-center gap-3 w-100">
            {/* Date tile */}
            <Skeleton width={88} height={88} borderRadius={14} className="flex-shrink-0" />
            <div className="flex-grow-1 min-w-0">
              <Skeleton width={120} height={14} className="mb-2" />
              <Skeleton width="55%" height={26} className="mb-2" />
              <div className="d-flex align-items-center gap-2">
                <Skeleton width={90} height={14} />
                <Skeleton width={110} height={14} />
                <Skeleton width={70} height={20} borderRadius={12} />
              </div>
            </div>
          </div>
          <div className="d-flex gap-2 flex-shrink-0 mt-2 mt-md-0">
            <Skeleton width={110} height={38} borderRadius={10} />
            <Skeleton width={100} height={38} borderRadius={10} />
          </div>
        </div>
      </div>

      {/* Stat Cards Skeleton */}
      <Row className="g-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} xs={6} md={3}>
            <div className="sc-card sc-stat-card h-100">
              <Skeleton width={48} height={48} borderRadius={12} className="flex-shrink-0" />
              <div className="flex-grow-1 min-w-0">
                <Skeleton width="60%" height={14} className="mb-2" />
                <Skeleton width="40%" height={26} className="mb-2" />
                <Skeleton width="75%" height={12} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Main Content Skeleton */}
      <Row className="g-4 mb-4">
        {/* Left Column: Recent Appointments */}
        <Col lg={8}>
          <div className="sc-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Skeleton width={160} height={20} />
              <Skeleton width={120} height={16} />
            </div>

            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="sc-card sc-appointment-card p-3">
                  <Skeleton width={60} height={60} borderRadius={10} className="flex-shrink-0 me-3" />
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Skeleton width="45%" height={18} />
                      <Skeleton width={70} height={22} borderRadius={12} />
                    </div>
                    <div className="d-flex gap-3 mb-1">
                      <Skeleton width={110} height={14} />
                      <Skeleton width={130} height={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Right Column: Quick Actions & Clinic Details */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            {/* Quick Actions */}
            <div className="sc-card">
              <Skeleton width={120} height={18} className="mb-3" />
              <div className="d-flex flex-column gap-2">
                <div className="p-2 border rounded-3 d-flex align-items-center gap-3">
                  <Skeleton width={40} height={40} borderRadius={10} className="flex-shrink-0" />
                  <div className="flex-grow-1">
                    <Skeleton width="70%" height={16} className="mb-1" />
                    <Skeleton width="90%" height={12} />
                  </div>
                </div>
                <div className="p-2 border rounded-3 d-flex align-items-center gap-3">
                  <Skeleton width={40} height={40} borderRadius={10} className="flex-shrink-0" />
                  <div className="flex-grow-1">
                    <Skeleton width="65%" height={16} className="mb-1" />
                    <Skeleton width="85%" height={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Clinic Details */}
            <div className="sc-card">
              <Skeleton width={110} height={18} className="mb-3" />
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="d-flex align-items-start gap-2">
                    <Skeleton width={18} height={18} borderRadius={4} className="mt-1 flex-shrink-0" />
                    <div className="flex-grow-1">
                      <Skeleton width="40%" height={14} className="mb-1" />
                      <Skeleton width="80%" height={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
