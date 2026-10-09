import { Col, Row, Table } from 'react-bootstrap';
import Skeleton from '../Skeleton';

/**
 * Skeleton loader for the clinic staff Dashboard.
 * Matches the 5-metric row, today's schedule table, and sidebar panels.
 */
export default function StaffDashboardSkeleton() {
  return (
    <div className="sc-staff-dashboard-skeleton" role="status" aria-label="Loading clinic dashboard...">
      <span className="visually-hidden">Loading clinic dashboard...</span>

      {/* Top Metric Cards */}
      <Row className="g-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Col key={i} xs={6} md={4} lg>
            <div className="sc-card sc-stat-card h-100">
              <Skeleton width={44} height={44} borderRadius={12} className="flex-shrink-0" />
              <div className="flex-grow-1 min-w-0">
                <Skeleton width="65%" height={13} className="mb-2" />
                <Skeleton width="45%" height={24} className="mb-2" />
                <Skeleton width="80%" height={11} />
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-4 mb-4">
        {/* Left Column: Today's Schedule Table */}
        <Col xs={12} xl={8}>
          <div className="sc-table-card h-100">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <div>
                <Skeleton width={140} height={18} className="mb-1" />
                <Skeleton width={100} height={12} />
              </div>
              <Skeleton width={80} height={30} borderRadius={6} />
            </div>

            <div className="table-responsive">
              <Table hover align="middle" className="sc-table sc-schedule-table mb-0">
                <thead>
                  <tr>
                    <th><Skeleton width="50%" height={14} /></th>
                    <th><Skeleton width="65%" height={14} /></th>
                    <th><Skeleton width="55%" height={14} /></th>
                    <th><Skeleton width="40%" height={14} /></th>
                    <th className="text-end"><Skeleton width={50} height={14} className="ms-auto" /></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <tr key={r}>
                      <td><Skeleton width="70%" height={14} /></td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Skeleton variant="circular" width={28} height={28} className="flex-shrink-0" />
                          <Skeleton width="60%" height={14} />
                        </div>
                      </td>
                      <td><Skeleton width="75%" height={14} /></td>
                      <td><Skeleton width={70} height={22} borderRadius={10} /></td>
                      <td className="text-end">
                        <Skeleton width={60} height={28} borderRadius={6} className="ms-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Col>

        {/* Right Column: Dentist duty & Quick links */}
        <Col xs={12} xl={4}>
          <div className="d-flex flex-column gap-4">
            {/* Quick Actions */}
            <div className="sc-card p-4">
              <Skeleton width={120} height={18} className="mb-3" />
              <div className="d-flex flex-column gap-2">
                <Skeleton width="100%" height={42} borderRadius={8} />
                <Skeleton width="100%" height={42} borderRadius={8} />
                <Skeleton width="100%" height={42} borderRadius={8} />
              </div>
            </div>

            {/* Dentists on duty */}
            <div className="sc-card p-4">
              <Skeleton width={130} height={18} className="mb-3" />
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((d) => (
                  <div key={d} className="d-flex align-items-center gap-3">
                    <Skeleton variant="circular" width={38} height={38} className="flex-shrink-0" />
                    <div className="flex-grow-1">
                      <Skeleton width="60%" height={14} className="mb-1" />
                      <Skeleton width="40%" height={12} />
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
