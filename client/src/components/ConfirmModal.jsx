import { Button, Modal, Spinner } from 'react-bootstrap';

/**
 * Confirmation dialog for destructive or important actions.
 * @param {object} props
 * @param {boolean} props.show
 * @param {string} [props.title='Are you sure?']
 * @param {React.ReactNode} [props.body] message text
 * @param {React.ReactNode} [props.children] extra content under the body (e.g. a "reason" textarea)
 * @param {string} [props.confirmText='Confirm']
 * @param {string} [props.cancelText='Cancel']
 * @param {string} [props.variant='danger'] Bootstrap variant of the confirm button
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel also called when the modal is closed with Esc / ×
 * @param {boolean} [props.loading=false] shows a spinner and disables the buttons
 * @param {boolean} [props.confirmDisabled=false]
 */
export default function ConfirmModal({
  show,
  title = 'Are you sure?',
  body,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
}) {
  return (
    <Modal show={show} onHide={loading ? undefined : onCancel} centered aria-labelledby="confirm-modal-title">
      <Modal.Header closeButton={!loading}>
        <Modal.Title id="confirm-modal-title" as="h2" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {body && <div className="text-muted">{body}</div>}
        {children}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading || confirmDisabled}>
          {loading && <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
