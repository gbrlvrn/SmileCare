import { ClipboardPulse } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Services" page (to be implemented). */
export default function StaffServices() {
  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Manage dental services, durations and prices."
      />
      <div className="sc-card">
        <EmptyState icon={ClipboardPulse} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
