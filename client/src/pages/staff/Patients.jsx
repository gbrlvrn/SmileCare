import { People } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Patients" page (to be implemented). */
export default function StaffPatients() {
  return (
    <>
      <PageHeader
        title="Patients"
        subtitle="Manage patient records."
      />
      <div className="sc-card">
        <EmptyState icon={People} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
