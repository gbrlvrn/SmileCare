import { getAvailability } from '../../api/dentistApi';
import useFetch from '../../hooks/useFetch';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Loads the free time slots of a dentist for a service on a date.
 * Nothing is requested until dentist, service and date are all chosen.
 *
 * @example
 * const availability = useAvailability({ dentistId, serviceId, date, excludeAppointmentId });
 * <TimeSlotPicker slots={availability.slots} loading={availability.loading} />
 *
 * @param {{ dentistId?: string, serviceId?: string, date?: string, excludeAppointmentId?: string }} params
 *   `excludeAppointmentId` lets a reschedule ignore the appointment's own slot.
 * @returns {{ ready: boolean, slots: object[], message: string, loading: boolean, error: string, reload: () => void }}
 */
export default function useAvailability({ dentistId, serviceId, date, excludeAppointmentId }) {
  const ready = Boolean(dentistId && serviceId && ISO_DATE_RE.test(date || ''));

  const { data, response, loading, error, refetch } = useFetch(
    () =>
      ready
        ? getAvailability(dentistId, {
            date,
            serviceId,
            ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
          })
        : Promise.resolve({ data: null }), // not enough information yet → no request
    [dentistId, serviceId, date, excludeAppointmentId, ready],
  );

  return {
    ready,
    slots: data?.slots || [],
    // The API explains empty days (Sunday, day off, inactive dentist) in `message`.
    message: data?.message || response?.message || '',
    loading: ready && loading,
    error,
    reload: refetch,
  };
}
