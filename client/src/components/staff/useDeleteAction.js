import { useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import useToast from '../../hooks/useToast';

/**
 * State for a "Delete …?" confirmation dialog.
 *
 * @example
 * const remover = useDeleteAction(deleteService, {
 *   successMessage: (s) => `${s.name} was deleted.`,
 *   onDeleted: list.refetch,
 * });
 * <Button onClick={() => remover.ask(service)}>Delete</Button>
 * <DeleteConfirmModal action={remover} title="Delete service?" />
 *
 * @param {(id: string) => Promise<any>} deleteFn API function, e.g. `deletePatient`
 * @param {{ successMessage?: string | ((item: object) => string), onDeleted?: (item: object) => void }} [options]
 * @returns {{ target: object|null, show: boolean, ask, cancel, confirm, loading: boolean, error: { status, message } | null }}
 */
export default function useDeleteAction(deleteFn, { successMessage = 'Deleted successfully.', onDeleted } = {}) {
  const { showToast } = useToast();
  // `target` stays set while the dialog fades out, so its text does not flicker.
  const [target, setTarget] = useState(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Opens the dialog for `item`. */
  const ask = (item) => {
    setTarget(item);
    setError(null);
    setShow(true);
  };

  const cancel = () => {
    if (!loading) setShow(false);
  };

  const confirm = async () => {
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      await deleteFn(target._id);
      const message = typeof successMessage === 'function' ? successMessage(target) : successMessage;
      showToast({ type: 'success', message });
      setShow(false);
      onDeleted?.(target);
    } catch (err) {
      // e.g. 400 "has upcoming appointments" — shown inside the dialog
      setError({ status: err.response?.status ?? null, message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return { target, show, ask, cancel, confirm, loading, error };
}
