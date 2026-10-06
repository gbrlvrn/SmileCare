import { Person } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Patient Details" page (to be implemented). */
export default function StaffPatientDetail() {
  return (
    <>
      <PageHeader
        title="Patient Details"
        subtitle="Patient profile and appointment history."
        backTo="/staff/patients"
        backLabel="Back to patients"
      />
      <div className="sc-card">
        <EmptyState icon={Person} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
