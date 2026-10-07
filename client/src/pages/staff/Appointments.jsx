import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { Calendar2Check, CalendarPlus } from 'react-bootstrap-icons';
import { deleteAppointment, getAppointments } from '../../api/appointmentApi';
import { getDentists } from '../../api/dentistApi';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import AppointmentActionsMenu from '../../components/staff/AppointmentActionsMenu';
import AppointmentFormModal from '../../components/staff/AppointmentFormModal';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import StatusChangeModal from '../../components/staff/StatusChangeModal';
import useAppointmentActions from '../../components/staff/useAppointmentActions';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useFetch from '../../hooks/useFetch';
import useListQuery from '../../hooks/useListQuery';
import { STATUS_OPTIONS } from '../../utils/constants';
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTimeRange,
  fullName,
  initials,
} from '../../utils/formatters';

export default function StaffAppointments() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Load dentists for the filter dropdown
  const { data: dentists } = useFetch(
    () => getDentists({ all: true }),
    [],
  );

  const {
    items: appointments,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    refetch,
  } = useListQuery(getAppointments, {
    initialFilters: { sort: '-date' },
    limit: 10,
  });

  const { changeStatus, busyId, modalProps } = useAppointmentActions({
    onChanged: refetch,
  });

  const deleteAction = useDeleteAction({
    deleteFn: (target) => deleteAppointment(target._id),
    successMessage: 'Appointment deleted successfully.',
    onDeleted: refetch,
  });

  return (
    <div>
      <PageHeader
        title="Appointments management"
        subtitle="View, schedule, update status, and manage all patient dental appointments."
        actions={
          <Button variant="primary" onClick={() => setShowBookingModal(true)}>
            <CalendarPlus className="me-2" />
            New appointment
          </Button>
        }
      />

      {/* Filter toolbar */}
      <div className="sc-card mb-4 p-3">
        <Row className="g-3">
          <Col md={4}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by patient, dentist, or service..."
            />
          </Col>

          <Col sm={6} md={3}>
            <Form.Select
              value={filters.status || ''}
              onChange={(e) => setFilter('status', e.target.value || undefined)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col sm={6} md={3}>
            <Form.Select
              value={filters.dentist || ''}
              onChange={(e) => setFilter('dentist', e.target.value || undefined)}
              aria-label="Filter by dentist"
            >
              <option value="">All dentists</option>
              {dentists?.map((dent) => (
                <option key={dent._id} value={dent._id}>
                  {fullName(dent)}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2} className="d-flex align-items-center justify-content-md-end">
            {(search || filters.status || filters.dentist) && (
              <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* Table list */}
      {loading && appointments.length === 0 ? (
        <Loader label="Loading appointments..." className="my-5" />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar2Check}
          title="No appointments found"
          message="No appointment records matched your query or filters."
          action={
            <Button variant="primary" size="sm" onClick={() => setShowBookingModal(true)}>
              Schedule an appointment
            </Button>
          }
        />
      ) : (
        <div className="sc-table-card">
          <div className="table-responsive">
            <Table hover align="middle" className="sc-table mb-0">
              <thead>
                <tr>
                  <th>Date & time</th>
                  <th>Patient</th>
                  <th>Attending dentist</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <div className="fw-semibold text-body">
                        {formatDate(appt.date, { weekday: 'short' })}
                      </div>
                      <div className="small text-muted font-monospace">
                        {formatTimeRange(appt.startTime, appt.endTime)}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="sc-avatar" aria-hidden="true">
                          {initials(fullName(appt.patient))}
                        </span>
                        <div>
                          <Link
                            to={`/staff/patients/${appt.patient?._id}`}
                            className="fw-semibold text-body text-decoration-none"
                          >
                            {fullName(appt.patient)}
                          </Link>
                          <div className="small text-muted">{appt.patient?.phone || appt.patient?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small fw-semibold">{fullName(appt.dentist)}</div>
                      <div className="small text-muted">{appt.dentist?.specialization}</div>
                    </td>
                    <td>
                      <div className="small fw-semibold">{appt.service?.name}</div>
                      <div className="small text-muted">
                        {formatDuration(appt.service?.durationMinutes || 0)} &bull; {formatCurrency(appt.service?.price || 0)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="text-end">
                      <AppointmentActionsMenu
                        appointment={appt}
                        onStatusChange={changeStatus}
                        onDelete={deleteAction.open}
                        disabled={busyId === appt._id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="appointments" />
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingModal && (
        <AppointmentFormModal
          show={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSaved={() => {
            setShowBookingModal(false);
            refetch();
          }}
        />
      )}

      {/* Status Change Dialog */}
      <StatusChangeModal {...modalProps} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete appointment?"
        body="This will permanently delete this appointment record. This action cannot be undone."
      />
    </div>
  );
}
