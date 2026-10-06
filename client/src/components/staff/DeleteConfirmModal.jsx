import { Alert, Button } from 'react-bootstrap';
import ConfirmModal from '../ConfirmModal';

/**
 * Delete confirmation dialog driven by `useDeleteAction()`.
 * When the API refuses with 400 (e.g. "has upcoming appointments") and
 * `onDeactivate` is given, a "Deactivate instead" button is offered.
 * @param {object} props
 * @param {ReturnType<import('./useDeleteAction').default>} props.action state from useDeleteAction
 * @param {string} props.title
 * @param {React.ReactNode} props.body
 * @param {string} [props.confirmText='Delete']
 * @param {(item: object) => void} [props.onDeactivate]
 */
export default function DeleteConfirmModal({ action, title, body, confirmText = 'Delete', onDeactivate }) {
  const { show, target, error, loading, confirm, cancel } = action;
  const canDeactivate = error?.status === 400 && onDeactivate && target?.isActive !== false;

  return (
    <ConfirmModal
      show={show}
      title={title}
      body={body}
      confirmText={confirmText}
      onConfirm={confirm}
      onCancel={cancel}
      loading={loading}
      confirmDisabled={error?.status === 400}
    >
      {error && (
        <Alert variant={error.status === 400 ? 'warning' : 'danger'} className="small mt-3 mb-0">
          <p className="mb-0">{error.message}</p>
          {canDeactivate && (
            <>
              <p className="mb-2 mt-1">You can deactivate it instead so it can no longer be booked.</p>
              <Button size="sm" variant="warning" onClick={() => onDeactivate(target)}>
                Deactivate instead
              </Button>
            </>
          )}
        </Alert>
      )}
    </ConfirmModal>
  );
}
