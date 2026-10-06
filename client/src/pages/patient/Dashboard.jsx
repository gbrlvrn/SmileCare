import { Grid1x2 } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — patient "Dashboard" page (to be implemented). */
export default function PatientDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your upcoming visits and dental care at a glance."
      />
      <div className="sc-card">
        <EmptyState icon={Grid1x2} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
