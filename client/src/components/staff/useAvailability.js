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
export default function useAvailability({ dentistId, serviceId, serviceIds, date, excludeAppointmentId }) {
  const normalizedServiceIds = Array.isArray(serviceIds) && serviceIds.length > 0
    ? serviceIds
    : (serviceId ? [serviceId] : []);
  const hasService = normalizedServiceIds.length > 0;
  const ready = Boolean(dentistId && hasService && ISO_DATE_RE.test(date || ''));
  const serviceKey = normalizedServiceIds.join(',');

  const { data, response, loading, error, refetch } = useFetch(
    () =>
      ready
        ? getAvailability(dentistId, {
            date,
            ...(normalizedServiceIds.length > 1
              ? { serviceIds: serviceKey }
              : { serviceId: normalizedServiceIds[0] }),
            ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
          })
        : Promise.resolve({ data: null }), // not enough information yet → no request
    [dentistId, serviceKey, date, excludeAppointmentId, ready],
  );

  return {
    ready,
    slots: data?.slots || [],
    durationMinutes: data?.durationMinutes,
    // The API explains empty days (Sunday, day off, inactive dentist) in `message`.
    message: data?.message || response?.message || '',
    loading: ready && loading,
    error,
    reload: refetch,
  };
}
