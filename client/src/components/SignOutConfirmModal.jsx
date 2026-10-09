import { Modal, Spinner } from 'react-bootstrap';
import { BoxArrowRight, XLg } from 'react-bootstrap-icons';

/**
 * Modern sign-out confirmation modal.
 * Clean, focused dialog to prevent accidental sign-outs.
 *
 * @param {object} props
 * @param {boolean} props.show
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {boolean} [props.loading=false]
 */
export default function SignOutConfirmModal({
  show,
  onConfirm,
  onCancel,
  loading = false,
}) {
  return (
    <Modal
      show={show}
      onHide={loading ? undefined : onCancel}
      centered
      className="sc-signout-modal"
      backdropClassName="sc-signout-backdrop"
      aria-labelledby="signout-modal-title"
      aria-describedby="signout-modal-desc"
    >
      <div className="sc-signout-header-accent" aria-hidden="true" />

      {!loading && (
        <button
          type="button"
          className="sc-signout-close-btn"
          onClick={onCancel}
          aria-label="Close sign out dialog"
        >
          <XLg size={13} aria-hidden="true" />
        </button>
      )}

      <div className="sc-signout-body">
        {/* Hero Exit Badge with pulsating glow */}
        <div className="sc-signout-hero">
          <div className="sc-signout-icon-wrapper" aria-hidden="true">
            <span className="sc-signout-icon-pulse" />
            <div className="sc-signout-icon-badge">
              <BoxArrowRight size={26} />
            </div>
          </div>
          <h2 id="signout-modal-title" className="sc-signout-title">
            Sign Out of SmileCare?
          </h2>
          <p id="signout-modal-desc" className="sc-signout-desc">
            Are you sure you want to sign out of your account? You will need to log in again to access your appointments and records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="sc-signout-actions">
          <button
            type="button"
            className="sc-signout-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Stay Signed In
          </button>
          <button
            type="button"
            className="sc-signout-btn-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" aria-hidden="true" />
                Signing out...
              </>
            ) : (
              <>
                <BoxArrowRight size={17} aria-hidden="true" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
