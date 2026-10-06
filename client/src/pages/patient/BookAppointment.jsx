import { CalendarPlus } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — patient "Book Appointment" page (to be implemented). */
export default function PatientBookAppointment() {
  return (
    <>
      <PageHeader
        title="Book Appointment"
        subtitle="Choose a service, dentist and time slot."
      />
      <div className="sc-card">
        <EmptyState icon={CalendarPlus} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
