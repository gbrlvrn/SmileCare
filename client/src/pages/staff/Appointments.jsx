import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Col, Form, Row, Table, Badge } from 'react-bootstrap';
import { Calendar2Check, CalendarPlus, X } from 'react-bootstrap-icons';
import { deleteAppointment, getAppointments } from '../../api/appointmentApi';
import { getDentists } from '../../api/dentistApi';
import EmptyState from '../../components/EmptyState';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
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
  todayISO,
} from '../../utils/formatters';

export default function StaffAppointments() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlStatus = searchParams.get('status') || '';
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';
  const urlDentist = searchParams.get('dentist') || '';

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
    initialFilters: {
      sort: '-date',
      ...(urlStatus ? { status: urlStatus } : {}),
      ...(urlFrom ? { from: urlFrom } : {}),
      ...(urlTo ? { to: urlTo } : {}),
      ...(urlDentist ? { dentist: urlDentist } : {}),
    },
    limit: 10,
  });

  // Sync filters whenever the URL search parameters change
  useEffect(() => {
    const s = searchParams.get('status');
    const f = searchParams.get('from');
    const t = searchParams.get('to');
    const d = searchParams.get('dentist');
    setFilter('status', s || undefined);
    setFilter('from', f || undefined);
    setFilter('to', t || undefined);
    setFilter('dentist', d || undefined);
  }, [searchParams, setFilter]);

  const { changeStatus, busyId, modalProps } = useAppointmentActions({
    onChanged: refetch,
  });

  const deleteAction = useDeleteAction({
    deleteFn: (target) => deleteAppointment(target._id),
    successMessage: 'Appointment deleted successfully.',
    onDeleted: refetch,
  });

  const handleResetFilters = () => {
    setSearchParams({});
    resetFilters();
  };

  const handleClearDateFilter = () => {
    setFilter('from', undefined);
    setFilter('to', undefined);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('from');
      next.delete('to');
      return next;
    });
  };

  const isTodayFilter = Boolean(
    filters.from && filters.to && filters.from === filters.to && filters.from === todayISO(),
  );

  const hasActiveFilters = Boolean(
    search || filters.status || filters.dentist || filters.from || filters.to,
  );

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
              onChange={(e) => {
                const val = e.target.value;
                setFilter('status', val || undefined);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (val) next.set('status', val);
                  else next.delete('status');
                  return next;
                });
              }}
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
              onChange={(e) => {
                const val = e.target.value;
                setFilter('dentist', val || undefined);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  if (val) next.set('dentist', val);
                  else next.delete('dentist');
                  return next;
                });
              }}
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
            {hasActiveFilters && (
              <Button variant="link" size="sm" className="text-muted p-0 text-decoration-none" onClick={handleResetFilters}>
                Reset filters
              </Button>
            )}
          </Col>
        </Row>

        {(filters.from || filters.to) && (
          <div className="mt-3 pt-2.5 border-top d-flex align-items-center gap-2">
            <span className="small text-muted">Active date range:</span>
            <span className="badge rounded-pill bg-primary-subtle text-primary fw-semibold px-2.5 py-1 d-inline-flex align-items-center gap-1">
              <span>{isTodayFilter ? "Today's appointments" : `${filters.from || ''} to ${filters.to || ''}`}</span>
              <button
                type="button"
                className="btn-close btn-close-white"
                style={{ fontSize: '0.65rem' }}
                aria-label="Clear date filter"
                onClick={handleClearDateFilter}
              />
            </span>
          </div>
        )}
      </div>

      {/* Table list */}
      {loading && appointments.length === 0 ? (
        <TableSkeleton columns={6} rows={7} />
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
                      {appt.services && appt.services.length > 1 ? (
                        <div>
                          <div
                            className="small fw-semibold text-truncate"
                            style={{ maxWidth: '240px' }}
                            title={appt.services.map((s) => s.name).join(', ')}
                          >
                            {appt.services.map((s) => s.name).join(', ')}
                          </div>
                          <div className="d-flex align-items-center gap-1 mt-1">
                            <span
                              className="badge bg-primary-subtle text-primary border border-primary-subtle"
                              style={{ fontSize: '0.7rem' }}
                            >
                              {appt.services.length} services
                            </span>
                            <span className="small text-muted">
                              {formatDuration(appt.services.reduce((acc, s) => acc + (s.durationMinutes || 0), 0))} &bull;{' '}
                              {formatCurrency(appt.services.reduce((acc, s) => acc + (s.price || 0), 0))}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="small fw-semibold">{appt.service?.name}</div>
                          <div className="small text-muted">
                            {formatDuration(appt.service?.durationMinutes || 0)} &bull; {formatCurrency(appt.service?.price || 0)}
                          </div>
                        </div>
                      )}
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
