import { useState } from 'react';
import { Alert, Button, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { PencilSquare, PlusCircle, Scissors, Trash } from 'react-bootstrap-icons';
import { createService, deleteService, getServices, updateService } from '../../api/serviceApi';
import EmptyState from '../../components/EmptyState';
import FormInput from '../../components/FormInput';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import DeleteConfirmModal from '../../components/staff/DeleteConfirmModal';
import { validateServiceForm } from '../../components/staff/staffValidators';
import useDeleteAction from '../../components/staff/useDeleteAction';
import useListQuery from '../../hooks/useListQuery';
import useToast from '../../hooks/useToast';
import { DENTAL_SERVICE_NAMES, SERVICE_DURATIONS, STANDARD_SERVICES } from '../../utils/constants';
import { formatCurrency, formatDuration } from '../../utils/formatters';

const INITIAL_FORM = {
  name: '',
  description: '',
  durationMinutes: 30,
  price: '',
  isActive: true,
};

export default function StaffServices() {
  const { showToast } = useToast();

  const {
    items: services,
    pagination,
    loading,
    error,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    refetch,
  } = useListQuery(getServices, {
    initialFilters: { all: 'true' },
    limit: 10,
  });

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetService, setTargetService] = useState(null);
  const [formValues, setFormValues] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isCustomServiceName, setIsCustomServiceName] = useState(false);
  const [customServiceNameText, setCustomServiceNameText] = useState('');

  const deleteAction = useDeleteAction({
    deleteFn: (s) => deleteService(s._id),
    successMessage: 'Dental service removed.',
    onDeleted: refetch,
  });

  const openAddModal = () => {
    setModalMode('add');
    setTargetService(null);
    setFormValues(INITIAL_FORM);
    setIsCustomServiceName(false);
    setCustomServiceNameText('');
    setFormErrors({});
    setServerError('');
  };

  const openEditModal = (s) => {
    setModalMode('edit');
    setTargetService(s);
    const isStandard = DENTAL_SERVICE_NAMES.includes(s.name);
    setIsCustomServiceName(!isStandard && Boolean(s.name));
    setCustomServiceNameText(!isStandard ? (s.name || '') : '');
    setFormValues({
      name: s.name || '',
      description: s.description || '',
      durationMinutes: s.durationMinutes || 30,
      price: s.price !== undefined ? String(s.price) : '',
      isActive: s.isActive !== false,
    });
    setFormErrors({});
    setServerError('');
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetService(null);
    setIsCustomServiceName(false);
    setCustomServiceNameText('');
  };

  const handleFieldChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleServiceNameSelect = (e) => {
    const selected = e.target.value;
    if (selected === 'OTHER') {
      setIsCustomServiceName(true);
      handleFieldChange('name', customServiceNameText);
    } else {
      setIsCustomServiceName(false);
      const standardDef = STANDARD_SERVICES.find((s) => s.name === selected);
      setFormValues((prev) => ({
        ...prev,
        name: selected,
        // If adding a new service or fields are empty, prefill with standard recommendations
        description: modalMode === 'add' || !prev.description ? (standardDef?.description || prev.description) : prev.description,
        durationMinutes: modalMode === 'add' || !prev.durationMinutes ? (standardDef?.durationMinutes || 30) : prev.durationMinutes,
        price: modalMode === 'add' || !prev.price ? (standardDef ? String(standardDef.price) : prev.price) : prev.price,
      }));
      if (formErrors.name) {
        setFormErrors((prev) => ({ ...prev, name: '' }));
      }
    }
  };

  const handleCustomServiceNameChange = (e) => {
    const val = e.target.value;
    setCustomServiceNameText(val);
    handleFieldChange('name', val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === 'edit';
    const payloadValues = {
      ...formValues,
      name: formValues.name.trim(),
      description: formValues.description.trim(),
    };
    const clientErrors = validateServiceForm(payloadValues);

    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      return;
    }

    setFormSubmitting(true);
    setServerError('');

    try {
      const payload = {
        ...payloadValues,
        durationMinutes: Number(payloadValues.durationMinutes),
        price: Number(payloadValues.price),
      };

      if (isEdit) {
        await updateService(targetService._id, payload);
        showToast({ type: 'success', message: 'Service updated.' });
      } else {
        await createService(payload);
        showToast({ type: 'success', message: 'New dental service added.' });
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
        setServerError(err.response?.data?.message || 'Failed to save service.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (service) => {
    try {
      await updateService(service._id, { isActive: false });
      showToast({ type: 'success', message: `${service.name} was deactivated.` });
      deleteAction.cancel();
      refetch();
    } catch {
      showToast({ type: 'danger', message: 'Failed to deactivate service.' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Services directory"
        subtitle="Configure clinic procedures, fees, duration, and booking availability."
        actions={
          <Button variant="primary" onClick={openAddModal}>
            <PlusCircle className="me-2" />
            Add service
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
              placeholder="Search services by procedure name..."
            />
          </Col>
          <Col md={6} className="d-flex justify-content-md-end">
            <Form.Check
              type="switch"
              id="show-all-services"
              label="Include inactive services"
              checked={filters.all === 'true'}
              onChange={(e) => setFilter('all', e.target.checked ? 'true' : undefined)}
            />
          </Col>
        </Row>
      </div>

      {/* Services Table */}
      {loading && services.length === 0 ? (
        <TableSkeleton columns={5} rows={6} />
      ) : error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <div>{error}</div>
          <Button variant="outline-danger" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="No services found"
          message="No dental procedures matched your search."
          action={
            <Button variant="primary" size="sm" onClick={openAddModal}>
              Add dental service
            </Button>
          }
        />
      ) : (
        <div className="sc-table-card">
          <div className="table-responsive">
            <Table hover align="middle" className="sc-table mb-0">
              <thead>
                <tr>
                  <th>Procedure</th>
                  <th>Duration</th>
                  <th>Fee (PHP)</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="fw-semibold text-body">{s.name}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: 300 }}>
                        {s.description || 'Standard dental clinic procedure.'}
                      </div>
                    </td>
                    <td>
                      <span className="small font-monospace">{formatDuration(s.durationMinutes)}</span>
                    </td>
                    <td>
                      <strong className="text-primary">{formatCurrency(s.price)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Button
                          variant="light"
                          size="sm"
                          title="Edit service"
                          onClick={() => openEditModal(s)}
                        >
                          <PencilSquare />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger"
                          title="Delete service"
                          onClick={() => deleteAction.open(s)}
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
            <Pagination pagination={pagination} onPageChange={setPage} itemLabel="services" />
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <Modal show={Boolean(modalMode)} onHide={closeModal} backdrop="static" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="h5 fw-bold">
              {modalMode === 'edit' ? 'Edit Service' : 'Add Dental Service'}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {serverError && <Alert variant="danger">{serverError}</Alert>}

            {/* Service Name Dropdown with "Other" option */}
            <Form.Group controlId="service-name-select" className="mb-3">
              <Form.Label className="fw-semibold">
                Service name
                <span className="text-danger ms-1" aria-hidden="true">
                  *
                </span>
              </Form.Label>
              <Form.Select
                value={isCustomServiceName ? 'OTHER' : formValues.name}
                onChange={handleServiceNameSelect}
                isInvalid={!isCustomServiceName && Boolean(formErrors.name)}
              >
                <option value="" disabled>
                  Select a dental service...
                </option>
                {DENTAL_SERVICE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="OTHER">Other (specify custom procedure)...</option>
              </Form.Select>
              {!isCustomServiceName && formErrors.name && (
                <Form.Control.Feedback type="invalid">
                  {formErrors.name}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            {isCustomServiceName && (
              <Form.Group controlId="service-custom-name" className="mb-3">
                <Form.Label className="small fw-semibold text-muted">
                  Specify custom service name
                  <span className="text-danger ms-1" aria-hidden="true">
                    *
                  </span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Night Guard Fitting, Laser Gum Therapy"
                  value={customServiceNameText}
                  onChange={handleCustomServiceNameChange}
                  isInvalid={Boolean(formErrors.name)}
                  maxLength={100}
                  autoFocus
                />
                {formErrors.name && (
                  <Form.Control.Feedback type="invalid">
                    {formErrors.name}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            )}

            <FormInput
              label="Description (optional)"
              name="description"
              as="textarea"
              rows={2}
              value={formValues.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              error={formErrors.description}
              placeholder="Procedure details, patient instructions..."
            />

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="service-duration">
                  <Form.Label className="fw-semibold">Estimated duration</Form.Label>
                  <Form.Select
                    value={formValues.durationMinutes}
                    onChange={(e) => handleFieldChange('durationMinutes', e.target.value)}
                  >
                    {SERVICE_DURATIONS.map((min) => (
                      <option key={min} value={min}>
                        {formatDuration(min)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <FormInput
                  label="Standard fee (PHP)"
                  name="price"
                  type="number"
                  min="0"
                  step="50"
                  value={formValues.price}
                  onChange={(e) => handleFieldChange('price', e.target.value)}
                  error={formErrors.price}
                  required
                  placeholder="e.g. 1500"
                />
              </Col>
            </Row>

            <Form.Check
              type="switch"
              id="service-active-switch"
              label="Service is active for booking"
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
              {formSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Update service' : 'Add service'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        action={deleteAction}
        title="Delete service?"
        body="Are you sure you want to delete this service? If patients have upcoming bookings for this service, you can deactivate it instead."
        onDeactivate={handleDeactivate}
      />
    </div>
  );
}
