import { CalendarCheck } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Appointment Details" page (to be implemented). */
export default function StaffAppointmentDetail() {
  return (
    <>
      <PageHeader
        title="Appointment Details"
        subtitle="Update status and record treatment notes."
        backTo="/staff/appointments"
        backLabel="Back to appointments"
      />
      <div className="sc-card">
        <EmptyState icon={CalendarCheck} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
