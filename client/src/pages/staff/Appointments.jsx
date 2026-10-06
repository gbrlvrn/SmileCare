import { CalendarCheck } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Appointments" page (to be implemented). */
export default function StaffAppointments() {
  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Search, filter and manage all appointments."
      />
      <div className="sc-card">
        <EmptyState icon={CalendarCheck} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
