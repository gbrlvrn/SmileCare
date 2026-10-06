import { CalendarCheck } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — patient "My Appointments" page (to be implemented). */
export default function PatientMyAppointments() {
  return (
    <>
      <PageHeader
        title="My Appointments"
        subtitle="View, reschedule or cancel your appointments."
      />
      <div className="sc-card">
        <EmptyState icon={CalendarCheck} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
