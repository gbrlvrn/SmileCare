import { PersonGear } from 'react-bootstrap-icons';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';

/** PLACEHOLDER — staff "Staff Accounts" page (to be implemented). */
export default function StaffStaffAccounts() {
  return (
    <>
      <PageHeader
        title="Staff Accounts"
        subtitle="Manage clinic staff accounts."
      />
      <div className="sc-card">
        <EmptyState icon={PersonGear} title="Coming soon" message="This page is under construction." />
      </div>
    </>
  );
}
