import { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { PencilSquare, PersonPlus, ShieldLock, Trash } from 'react-bootstrap-icons';
import { createStaff, deleteStaff, getStaff, updateStaff } from '../../api/staffApi';
import EmptyState from '../../components/EmptyState';
import FormInput from '../../components/FormInput';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import SearchBar from '../../components/SearchBar';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import { validateStaffForm } from '../../components/staff/staffValidators';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useAuth from '../../hooks/useAuth';
import useListQuery from '../../hooks/useListQuery';
import useToast from '../../hooks/useToast';
import { formatDate, fullName, initials } from '../../utils/formatters';
import {
  passwordPolicy,
  validateEmail,
  validateName,
  validateOptionalPhone,
} from '../../utils/validators';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  isActive: true,
};

export default function StaffAccounts() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const {
    items: staffMembers,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    refetch,
  } = useListQuery(getStaff, {
    limit: 10,
  });

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetStaff, setTargetStaff] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const deleteAction = useDeleteAction({
    deleteFn: (s) => deleteStaff(s._id),
    successMessage: 'Staff account removed.',
    onDeleted: refetch,
  });

  const openAddModal = () => {
    setModalMode('add');
    setTargetStaff(null);
    setFormValues(INITIAL_FORM);
    setFormErrors({});
    setServerError('');
  };

  const openEditModal = (s) => {
    setModalMode('edit');
    setTargetStaff(s);
    setFormValues({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      isActive: s.isActive !== false,
    });
    setFormErrors({});
    setServerError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetStaff(null);
  };

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFirstNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 30);
    handleFieldChange('firstName', lettersOnly);
    if (formErrors.firstName) {
      setFormErrors((prev) => ({ ...prev, firstName: validateName(lettersOnly, 'First name', 30) }));
    }
  };

  const handleFirstNameBlur = () => {
    setFormErrors((prev) => ({
      ...prev,
      firstName: validateName(formValues.firstName, 'First name', 30),
    }));
  };

  const handleLastNameChange = (e) => {
    const lettersOnly = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 30);
    handleFieldChange('lastName', lettersOnly);
    if (formErrors.lastName) {
      setFormErrors((prev) => ({ ...prev, lastName: validateName(lettersOnly, 'Last name', 30) }));
    }
  };

  const handleLastNameBlur = () => {
    setFormErrors((prev) => ({
      ...prev,
      lastName: validateName(formValues.lastName, 'Last name', 30),
    }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    handleFieldChange('email', val);
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handleEmailBlur = () => {
    setFormErrors((prev) => ({
      ...prev,
      email: validateEmail(formValues.email),
    }));
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    handleFieldChange('phone', digitsOnly);
    if (formErrors.phone) {
      setFormErrors((prev) => ({
        ...prev,
        phone: validateOptionalPhone(digitsOnly, 'Phone number'),
      }));
    }
  };

  const handlePhoneBlur = () => {
    setFormErrors((prev) => ({
      ...prev,
      phone: validateOptionalPhone(formValues.phone, 'Phone number'),
    }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    handleFieldChange('password', val);
    if (formErrors.password) {
      setFormErrors((prev) => ({
        ...prev,
        password: modalMode === 'edit' && !val ? '' : passwordPolicy(val),
      }));
    }
  };

  const handlePasswordBlur = () => {
    setFormErrors((prev) => ({
      ...prev,
      password: modalMode === 'edit' && !formValues.password ? '' : passwordPolicy(formValues.password),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === 'edit';
    const payloadValues = {
      ...formValues,
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
    };
    const clientErrors = validateStaffForm(payloadValues, { isEdit });

    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    setFormSubmitting(true);
    setServerError('');

    try {
      const payload = { ...payloadValues };
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      if (isEdit) {
        await updateStaff(targetStaff._id, payload);
        showToast({ type: 'success', message: 'Staff member account updated.' });
      } else {
        await createStaff(payload);
        showToast({ type: 'success', message: 'New staff account created.' });
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
      } else if (err.response?.data?.message?.toLowerCase().includes('email')) {
        setFormErrors((prev) => ({ ...prev, email: err.response.data.message }));
      } else {
        setServerError(err.response?.data?.message || 'Failed to save staff account.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff accounts"
        subtitle="Manage clinic administrative and reception personnel with access to the dashboard."
        actions={
          <Button variant="primary" onClick={openAddModal}>
            <PersonPlus className="me-2" />
            Add staff member
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
              placeholder="Search staff by name or email..."
            />
          </Col>
        </Row>
      </div>

      {/* Staff Table */}
      {loading && staffMembers.length === 0 ? (
        <TableSkeleton columns={5} rows={6} hasAvatar={true} />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : staffMembers.length === 0 ? (
        <EmptyState
          icon={ShieldLock}
          title="No staff members found"
          message="No staff accounts matched your query."
          action={
            <Button variant="primary" size="sm" onClick={openAddModal}>
              Create staff account
            </Button>
          }
        />
      ) : (
        <div className="sc-table-card">
          <div className="table-responsive">
            <Table hover align="middle" className="sc-table mb-0">
              <thead>
                <tr>
                  <th>Staff member</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((s) => {
                  const isSelf = s._id === currentUser?._id;
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="sc-avatar" aria-hidden="true">
                            {initials(fullName(s))}
                          </span>
                          <div>
                            <div className="fw-semibold text-body">
                              {fullName(s)} {isSelf && <span className="badge bg-primary-subtle text-primary ms-1">You</span>}
                            </div>
                            <div className="small text-muted">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="small font-monospace">{s.phone || 'No phone'}</span>
                      </td>
                      <td>
                        <span className="badge bg-info-subtle text-info">Clinic Staff</span>
                      </td>
                      <td>
                        <span className={`badge ${s.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="small text-muted">{formatDate(s.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button
                            variant="light"
                            size="sm"
                            title="Edit account"
                            onClick={() => openEditModal(s)}
                          >
                            <PencilSquare />
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            className="text-danger"
                            title={isSelf ? 'You cannot delete your own account' : 'Delete staff account'}
                            disabled={isSelf}
                            onClick={() => deleteAction.open(s)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <div className="p-3 border-top">
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="staff members" />
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal show={Boolean(modalMode)} onHide={closeModal} backdrop="static" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {modalMode === 'edit' ? 'Edit Staff Account' : 'Add Staff Member'}
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
                  onChange={handleFirstNameChange}
                  onBlur={handleFirstNameBlur}
                  error={formErrors.firstName}
                  maxLength={30}
                  required
                  placeholder="e.g. Maria"
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Last name"
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleLastNameChange}
                  onBlur={handleLastNameBlur}
                  error={formErrors.lastName}
                  maxLength={30}
                  required
                  placeholder="e.g. Santos"
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
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={formErrors.email}
                  maxLength={100}
                  required
                  placeholder="e.g. staff.maria@smilecare.com"
                />
              </Col>
              <Col md={6}>
                <FormInput
                  label="Phone number (optional)"
                  name="phone"
                  value={formValues.phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  error={formErrors.phone}
                  maxLength={11}
                  placeholder="e.g. 09171234567"
                  helpText="Philippine mobile format (starts with 09, 11 digits)"
                />
              </Col>
            </Row>

            <div className="mb-3">
              <PasswordInput
                label={modalMode === 'edit' ? 'Reset password (leave blank to keep current)' : 'Password'}
                name="password"
                value={formValues.password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                error={formErrors.password}
                required={modalMode === 'add'}
                placeholder={modalMode === 'edit' ? 'Enter new password to reset...' : 'Create a strong password'}
              />
              {formValues.password && <PasswordChecklist password={formValues.password} />}
            </div>

            {modalMode === 'edit' && targetStaff?._id !== currentUser?._id && (
              <Form.Check
                type="switch"
                id="staff-active-switch"
                label="Staff account active"
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
              {formSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Update account' : 'Create account'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete staff account?"
        body="This will permanently delete this staff user account. They will no longer be able to log in to the system."
      />
    </div>
  );
}
