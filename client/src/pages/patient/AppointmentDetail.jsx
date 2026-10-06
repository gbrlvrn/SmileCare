import { CalendarCheck } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — patient "Appointment Details" page (to be implemented). */
export default function PatientAppointmentDetail() {
  return (
    <>
      <PageHeader
        title="Appointment Details"
        subtitle="Details of your appointment."
        backTo="/patient/appointments"
        backLabel="Back to my appointments"
      />
      <div className="sc-card">
        <EmptyState icon={CalendarCheck} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
