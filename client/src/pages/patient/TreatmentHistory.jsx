import { ClockHistory } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — patient "Treatment History" page (to be implemented). */
export default function PatientTreatmentHistory() {
  return (
    <>
      <PageHeader
        title="Treatment History"
        subtitle="Your completed visits and treatment notes."
      />
      <div className="sc-card">
        <EmptyState icon={ClockHistory} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
