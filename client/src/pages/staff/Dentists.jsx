import { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { PencilSquare, PersonBadge, PersonPlus, Trash } from 'react-bootstrap-icons';
import { createDentist, deleteDentist, getDentists, updateDentist } from '../../api/dentistApi';
import EmptyState from '../../components/EmptyState';
import FormInput from '../../components/FormInput';
import Loader from '../../components/Loader';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import { validateDentistForm } from '../../components/staff/staffValidators';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useListQuery from '../../hooks/useListQuery';
import useToast from '../../hooks/useToast';
import { WEEKDAYS } from '../../utils/constants';
import { formatTime, formatWorkingDays, fullName, initials } from '../../utils/formatters';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  specialization: 'General Dentistry',
  email: '',
  phone: '',
  bio: '',
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri default
  startTime: '09:00',
  endTime: '17:00',
  isActive: true,
};

// 30-min interval hours between 09:00 and 17:00
const TIME_OPTIONS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function StaffDentists() {
  const { showToast } = useToast();

  const {
    items: dentists,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    refetch,
  } = useListQuery(getDentists, {
    initialFilters: { all: 'true' },
    limit: 10,
  });

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetDentist, setTargetDentist] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const deleteAction = useDeleteAction({
    deleteFn: (d) => deleteDentist(d._id),
    successMessage: 'Dentist record deleted.',
    onDeleted: refetch,
  });

  const openAddModal = () => {
    setModalMode('add');
    setTargetDentist(null);
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setServerError('');
  };

  const openEditModal = (d) => {
    setModalMode('edit');
    setTargetDentist(d);
    setFormValues({
      firstName: d.firstName || '',
      lastName: d.lastName || '',
      specialization: d.specialization || '',
      email: d.email || '',
      phone: d.phone || '',
      bio: d.bio || '',
      workingDays: Array.isArray(d.workingDays) ? d.workingDays : [1, 2, 3, 4, 5],
      startTime: d.startTime || '09:00',
      endTime: d.endTime || '17:00',
      isActive: d.isActive !== false,
    });
    setFormErrors({});
    setServerError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetDentist(null);
  };

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (dayNum) => {
    setFormValues((prev) => {
      const exists = prev.workingDays.includes(dayNum);
      const nextDays = exists
        ? prev.workingDays.filter((d) => d !== dayNum)
        : [...prev.workingDays, dayNum].sort((a, b) => a - b);
      return { ...prev, workingDays: nextDays };
    });
    if (formErrors.workingDays) {
      setFormErrors((prev) => ({ ...prev, workingDays: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === 'edit';
    const clientErrors = validateDentistForm(formValues, { isEdit });

    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    setFormSubmitting(true);
    setServerError('');

    try {
      if (isEdit) {
        await updateDentist(targetDentist._id, formValues);
        showToast({ type: 'success', message: 'Dentist profile updated.' });
      } else {
        await createDentist(formValues);
        showToast({ type: 'success', message: 'Dentist added successfully.' });
      }

      closeModal();
      refetch();
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });
        setFormErrors(backendErrors);
      } else {
        setServerError(err.response?.data?.message || 'Failed to save dentist.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (dentist) => {
    try {
      await updateDentist(dentist._id, { isActive: false });
      showToast({ type: 'success', message: `${fullName(dentist)} was deactivated.` });
      deleteAction.cancel();
      refetch();
    } catch {
      showToast({ type: 'danger', message: 'Failed to deactivate dentist.' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Dentists directory"
        subtitle="Manage clinic dental doctors, schedules, specialties, and active duty status."
        actions={
          <Button variant="primary" onClick={openAddModal}>
            <PersonPlus className="me-2" />
            Add dentist
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="sc-card mb-4 p-3">
        <Row className="g-3 align-items-center">
          <Col md={6}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by dentist name or specialty..."
            />
          </Col>
          <Col md={6} className="d-flex justify-content-md-end">
            <Form.Check
              type="switch"
              id="show-all-dentists"
              label="Include inactive dentists"
              checked={filters.all === 'true'}
              onChange={(e) => setFilter('all', e.target.checked ? 'true' : undefined)}
            />
          </Col>
        </Row>
      </div>

      {/* Dentists table */}
      {loading && dentists.length === 0 ? (
        <Loader label="Loading dentists..." className="my-5" />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : dentists.length === 0 ? (
        <EmptyState
          icon={PersonBadge}
          title="No dentists found"
          message="No dentist records matched your query."
          action={
            <Button variant="primary" size="sm" onClick={openAddModal}>
              Add new dentist
            </Button>
          }
        />
      ) : (
        <div className="sc-table-card">
          <div className="table-responsive">
            <Table hover align="middle" className="sc-table mb-0">
              <thead>
                <tr>
                  <th>Dentist</th>
                  <th>Specialization</th>
                  <th>Contact</th>
                  <th>Working schedule</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dentists.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="sc-avatar" aria-hidden="true">
                          {initials(fullName(d))}
                        </span>
                        <div>
                          <div className="fw-semibold text-body">{fullName(d)}</div>
                          <div className="small text-muted text-truncate" style={{ maxWidth: 220 }}>
                            {d.bio || 'General practice'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">
                        {d.specialization || 'General Dentistry'}
                      </span>
                    </td>
                    <td>
                      <div className="small text-body">{d.email || '—'}</div>
                      <div className="small text-muted font-monospace">{d.phone || '—'}</div>
                    </td>
                    <td>
                      <div className="small fw-semibold">{formatWorkingDays(d.workingDays)}</div>
                      <div className="small text-muted font-monospace">
                        {formatTime(d.startTime)} – {formatTime(d.endTime)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${d.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          variant="light"
                          size="sm"
                          title="Edit dentist profile"
                          onClick={() => openEditModal(d)}
                        >
                          <PencilSquare />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          title="Delete dentist"
                          onClick={() => deleteAction.open(d)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="dentists" />
          </div>
        </div>
      )}

      {/* Add / Edit Dentist Modal */}
      <Modal show={Boolean(modalMode)} onHide={closeModal} size="lg" backdrop="static" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {modalMode === 'edit' ? 'Edit Dentist Profile' : 'Add New Dentist'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {serverError && <Alert variant="danger">{serverError}</Alert>}

            <Row className="g-3 mb-3">
              <Col md={6}>
                <FormInput
                  label="First name"
                  name="firstName"
                  value={formValues.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  error={formErrors.firstName}
                  required
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Last name"
                  name="lastName"
                  value={formValues.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  error={formErrors.lastName}
                  required
                />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <FormInput
                  label="Specialization"
                  name="specialization"
                  value={formValues.specialization}
                  onChange={(e) => handleFieldChange('specialization', e.target.value)}
                  error={formErrors.specialization}
                  required
                  placeholder="e.g. Orthodontics, Endodontics, Pediatrics"
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Email address (optional)"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  error={formErrors.email}
                />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <FormInput
                  label="Phone number (optional)"
                  name="phone"
                  value={formValues.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  error={formErrors.phone}
                  placeholder="e.g. 09171234567"
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Professional bio (optional)"
                  name="bio"
                  value={formValues.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  error={formErrors.bio}
                  placeholder="Years of experience, credentials..."
                />
              </Col>
            </Row>

            {/* Working days checkboxes (Mon–Sat, Sundays excluded) */}
            <div className="mb-3">
              <Form.Label className="fw-semibold">Working days</Form.Label>
              <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded border">
                {WEEKDAYS.filter((w) => w.value !== 0).map((w) => (
                  <Form.Check
                    key={w.value}
                    type="checkbox"
                    id={`day-${w.value}`}
                    label={w.label}
                    checked={formValues.workingDays.includes(w.value)}
                    onChange={() => handleDayToggle(w.value)}
                  />
                ))}
              </div>
              {formErrors.workingDays && (
                <div className="text-danger small mt-1">{formErrors.workingDays}</div>
              )}
            </div>

            {/* Daily Hours */}
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="dentist-start-time">
                  <Form.Label className="fw-semibold">Start time</Form.Label>
                  <Form.Select
                    value={formValues.startTime}
                    onChange={(e) => handleFieldChange('startTime', e.target.value)}
                    isInvalid={Boolean(formErrors.startTime)}
                  >
                    {TIME_OPTIONS.slice(0, -1).map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.startTime}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group controlId="dentist-end-time">
                  <Form.Label className="fw-semibold">End time</Form.Label>
                  <Form.Select
                    value={formValues.endTime}
                    onChange={(e) => handleFieldChange('endTime', e.target.value)}
                    isInvalid={Boolean(formErrors.endTime)}
                  >
                    {TIME_OPTIONS.slice(1).map((t) => (
                      <option key={t} value={t}>
                        {formatTime(t)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {formErrors.endTime}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Check
              type="switch"
              id="dentist-active-switch"
              label="Dentist is active for new bookings"
              checked={formValues.isActive}
              onChange={(e) => handleFieldChange('isActive', e.target.checked)}
              className="mt-3"
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeModal} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Update dentist' : 'Add dentist'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete dentist record?"
        body="Are you sure you want to delete this dentist? If the dentist has upcoming bookings, you may deactivate them instead."
        onDeactivate={handleDeactivate}
      />
    </div>
  );
}
