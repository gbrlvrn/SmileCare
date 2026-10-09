import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Eye, GenderFemale, GenderMale, PencilSquare, PersonPlus, Trash } from 'react-bootstrap-icons';
import { createPatient, deletePatient, getPatients, updatePatient } from '../../api/patientApi';
import EmptyState from '../../components/EmptyState';
import FormInput from '../../components/FormInput';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import SearchBar from '../../components/SearchBar';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import { validatePatientForm } from '../../components/staff/staffValidators';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useListQuery from '../../hooks/useListQuery';
import useToast from '../../hooks/useToast';
import { GENDERS } from '../../utils/constants';
import { formatDate, fullName, initials } from '../../utils/formatters';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  medicalNotes: '',
  password: '',
  isActive: true,
};

export default function StaffPatients() {
  const { showToast } = useToast();

  const {
    items: patients,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    refetch,
  } = useListQuery(getPatients, {
    limit: 10,
  });

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetPatient, setTargetPatient] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const deleteAction = useDeleteAction({
    deleteFn: (p) => deletePatient(p._id),
    successMessage: 'Patient and all associated appointments deleted.',
    onDeleted: refetch,
  });

  const openAddModal = () => {
    setModalMode('add');
    setTargetPatient(null);
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setServerError('');
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setTargetPatient(p);
    setFormValues({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      email: p.email || '',
      phone: p.phone || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
      gender: p.gender || '',
      address: p.address || '',
      medicalNotes: p.medicalNotes || '',
      password: '',
      isActive: p.isActive !== false,
    });
    setFormErrors({});
    setServerError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetPatient(null);
  };

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === 'edit';
    const clientErrors = validatePatientForm(formValues, { isEdit });

    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    setFormSubmitting(true);
    setServerError('');

    try {
      const payload = { ...formValues };
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      if (isEdit) {
        await updatePatient(targetPatient._id, payload);
        showToast({ type: 'success', message: 'Patient profile updated.' });
      } else {
        await createPatient(payload);
        showToast({ type: 'success', message: 'Patient registered successfully.' });
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
        setServerError(err.response?.data?.message || 'Failed to save patient.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Patients directory"
        subtitle="Manage patient records, clinical history, and account statuses."
        actions={
          <Button variant="primary" onClick={openAddModal}>
            <PersonPlus className="me-2" />
            Add patient
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="sc-card mb-4 p-3">
        <Row className="g-3">
          <Col md={6}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, or phone..."
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={filters.isActive !== undefined ? String(filters.isActive) : ''}
              onChange={(e) => setFilter('isActive', e.target.value === '' ? undefined : e.target.value)}
              aria-label="Filter by patient account status"
            >
              <option value="">All patient statuses</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

      {/* Content table */}
      {loading && patients.length === 0 ? (
        <TableSkeleton columns={6} rows={7} hasAvatar={true} />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={PersonPlus}
          title="No patients found"
          message="No patient accounts matched your search or filters."
          action={
            <Button variant="primary" size="sm" onClick={openAddModal}>
              Register a patient
            </Button>
          }
        />
      ) : (
        <div className="sc-table-card">
          <div className="table-responsive">
            <Table hover align="middle" className="sc-table mb-0">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Gender</th>
                  <th>Appointments</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="sc-avatar" aria-hidden="true">
                          {initials(fullName(p))}
                        </span>
                        <div>
                          <Link
                            to={`/staff/patients/${p._id}`}
                            className="fw-semibold text-body text-decoration-none"
                          >
                            {fullName(p)}
                          </Link>
                          {p.medicalNotes && (
                            <div className="small text-danger text-truncate" style={{ maxWidth: 180 }}>
                              ⚠️ {p.medicalNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="small text-body">{p.email}</div>
                      <div className="small text-muted font-monospace">{p.phone || 'No phone'}</div>
                    </td>
                    <td className="small">
                      {p.gender ? (
                        <span className="d-inline-flex align-items-center gap-1 text-capitalize">
                          {p.gender === 'male' && <GenderMale className="text-primary" aria-hidden="true" />}
                          {p.gender === 'female' && <GenderFemale className="text-danger" aria-hidden="true" />}
                          <span>{p.gender === 'prefer_not_to_say' ? 'Prefer not to say' : p.gender}</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {p.appointmentCount || 0} visits
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="small text-muted">{formatDate(p.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          as={Link}
                          to={`/staff/patients/${p._id}`}
                          variant="light"
                          size="sm"
                          title="View patient history"
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          title="Edit patient"
                          onClick={() => openEditModal(p)}
                        >
                          <PencilSquare />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          title="Delete patient"
                          onClick={() => deleteAction.open(p)}
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
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="patients" />
          </div>
        </div>
      )}

      {/* Add / Edit Patient Modal */}
      <Modal show={Boolean(modalMode)} onHide={closeModal} size="lg" backdrop="static" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {modalMode === 'edit' ? 'Edit Patient Record' : 'Register New Patient'}
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
                  label="Email address"
                  name="email"
                  type="email"
                  value={formValues.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  error={formErrors.email}
                  required
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Phone number (PH mobile format)"
                  name="phone"
                  value={formValues.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  error={formErrors.phone}
                  placeholder="e.g. 09171234567"
                />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <FormInput
                  label="Date of birth"
                  name="dateOfBirth"
                  type="date"
                  value={formValues.dateOfBirth}
                  onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                  error={formErrors.dateOfBirth}
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Gender"
                  name="gender"
                  as="select"
                  options={GENDERS}
                  value={formValues.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  error={formErrors.gender}
                  placeholder="Select gender..."
                />
              </Col>
            </Row>

            <FormInput
              label="Address"
              name="address"
              value={formValues.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              error={formErrors.address}
              placeholder="City, Street, Barangay"
            />

            <FormInput
              label="Medical alerts / allergies (optional)"
              name="medicalNotes"
              as="textarea"
              rows={2}
              value={formValues.medicalNotes}
              onChange={(e) => handleFieldChange('medicalNotes', e.target.value)}
              error={formErrors.medicalNotes}
              placeholder="e.g. Penicillin allergy, Hypertension, Diabetic..."
              helpText="Will be highlighted on the patient profile for attending dentists."
            />

            {/* Password input */}
            <div className="mb-3">
              <PasswordInput
                label={modalMode === 'edit' ? 'Reset password (leave blank to keep current)' : 'Password'}
                name="password"
                value={formValues.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                error={formErrors.password}
                required={modalMode === 'add'}
              />
              {formValues.password && <PasswordChecklist password={formValues.password} />}
            </div>

            {modalMode === 'edit' && (
              <Form.Check
                type="switch"
                id="patient-active-switch"
                label="Account active (patient can log in and book)"
                checked={formValues.isActive}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                className="mt-3"
              />
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeModal} disabled={formSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Update patient' : 'Register patient'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Patient Confirmation */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete patient and records?"
        body="This will permanently delete this patient account and ALL of their appointment and treatment history records. This action CANNOT be undone."
      />
    </div>
  );
}
