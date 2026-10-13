import { Modal, Spinner } from 'react-bootstrap';
import { XLg } from 'react-bootstrap-icons';

/**
 * Confirmation dialog for destructive or important actions.
 * Unified with the modern confirmation modal design language.
 *
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
    <Modal
      show={show}
      onHide={loading ? undefined : onCancel}
      centered
      className="sc-signout-modal sc-confirm-modal"
      backdropClassName="sc-signout-backdrop"
      aria-labelledby="confirm-modal-title"
    >
      <div className="sc-signout-header-accent" aria-hidden="true" />

      {!loading && (
        <button
          type="button"
          className="sc-signout-close-btn"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
        >
          <XLg size={13} aria-hidden="true" />
        </button>
      )}

      <div className="sc-signout-body">
        <h2 id="confirm-modal-title" className="sc-signout-title text-start mb-2">
          {title}
        </h2>

        {body && <div className="sc-signout-desc text-start mb-3">{body}</div>}

        {children}

        <div className="sc-signout-actions mt-4">
          <button
            type="button"
            className="sc-signout-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={
              variant === 'danger'
                ? 'sc-signout-btn-confirm'
                : 'btn btn-primary rounded-3 px-3 py-2 fw-semibold'
            }
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading && <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
