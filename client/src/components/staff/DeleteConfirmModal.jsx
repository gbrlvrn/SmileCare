import { Modal, Spinner } from 'react-bootstrap';
import { Trash3, XLg, ExclamationTriangleFill } from 'react-bootstrap-icons';

/**
 * Modern delete confirmation dialog matching the Sign Out confirmation UI.
 * Used across all staff pages for deleting records (appointments, services, dentists, patients, staff).
 * Driven by `useDeleteAction()`.
 *
 * When the API refuses with 400 (e.g. "has upcoming appointments") and
 * `onDeactivate` is given, a "Deactivate instead" option is offered.
 *
 * @param {object} props
 * @param {ReturnType<import('./useDeleteAction').default>} props.action state from useDeleteAction
 * @param {string} props.title
 * @param {React.ReactNode} props.body
 * @param {string} [props.confirmText='Delete']
 * @param {string} [props.cancelText='Cancel']
 * @param {(item: object) => void} [props.onDeactivate]
 */
export default function DeleteConfirmModal({
  action,
  title = 'Are you sure?',
  body,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onDeactivate,
}) {
  const { show, target, error, loading, confirm, cancel } = action || {};
  const canDeactivate = error?.status === 400 && onDeactivate && target?.isActive !== false;

  return (
    <Modal
      show={Boolean(show)}
      onHide={loading ? undefined : cancel}
      centered
      className="sc-signout-modal sc-delete-modal"
      backdropClassName="sc-signout-backdrop"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-desc"
    >
      <div className="sc-signout-header-accent" aria-hidden="true" />

      {!loading && (
        <button
          type="button"
          className="sc-signout-close-btn"
          onClick={cancel}
          aria-label="Close delete dialog"
        >
          <XLg size={13} aria-hidden="true" />
        </button>
      )}

      <div className="sc-signout-body">
        {/* Hero Trash Badge with pulsating glow matching SignOutConfirmModal */}
        <div className="sc-signout-hero">
          <div className="sc-signout-icon-wrapper" aria-hidden="true">
            <span className="sc-signout-icon-pulse" />
            <div className="sc-signout-icon-badge">
              <Trash3 size={24} />
            </div>
          </div>
          <h2 id="delete-modal-title" className="sc-signout-title">
            {title}
          </h2>
          {body && (
            <div id="delete-modal-desc" className="sc-signout-desc">
              {body}
            </div>
          )}
        </div>

        {/* Error message / Deactivation option if API returned conflict (400) or error */}
        {error && (
          <div
            className={`sc-delete-alert ${
              error.status === 400 ? 'sc-delete-alert-warning' : 'sc-delete-alert-danger'
            } mb-3`}
          >
            <div className="d-flex align-items-start gap-2">
              <ExclamationTriangleFill
                size={16}
                className={`mt-1 flex-shrink-0 ${
                  error.status === 400 ? 'text-warning' : 'text-danger'
                }`}
              />
              <div className="flex-grow-1">
                <p className="mb-0 fw-semibold">{error.message}</p>
                {canDeactivate && (
                  <div className="mt-2 pt-2 border-top border-warning-subtle">
                    <p className="mb-2 small text-muted">
                      You can deactivate this item instead so it can no longer be booked.
                    </p>
                    <button
                      type="button"
                      className="sc-delete-btn-deactivate"
                      onClick={() => onDeactivate(target)}
                      disabled={loading}
                    >
                      Deactivate instead
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sc-signout-actions">
          <button
            type="button"
            className="sc-signout-btn-cancel"
            onClick={cancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="sc-signout-btn-confirm"
            onClick={confirm}
            disabled={loading || error?.status === 400}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" aria-hidden="true" />
                Deleting...
              </>
            ) : (
              <>
                <Trash3 size={16} aria-hidden="true" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
