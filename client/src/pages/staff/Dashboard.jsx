import { Grid1x2 } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Dashboard" page (to be implemented). */
export default function StaffDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Clinic overview, today’s schedule and analytics."
      />
      <div className="sc-card">
        <EmptyState icon={Grid1x2} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
