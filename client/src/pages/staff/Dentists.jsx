import { PersonBadge } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Dentists" page (to be implemented). */
export default function StaffDentists() {
  return (
    <>
      <PageHeader
        title="Dentists"
        subtitle="Manage dentists and their working hours."
      />
      <div className="sc-card">
        <EmptyState icon={PersonBadge} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
