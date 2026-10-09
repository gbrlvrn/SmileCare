import { getAvailability } from '../../api/dentistApi';
import useFetch from '../../hooks/useFetch';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Loads the time slots of a dentist for one date and service
 * (GET /dentists/:id/availability). Re-fetches automatically whenever
 * the dentist, service, date or excluded appointment changes.
 * Nothing is requested until dentist, service and a valid date are all set.
 *
 * @example
 * const availability = useAvailability({ dentistId, serviceId, date });
 * <TimeSlotPicker slots={availability.slots} loading={availability.loading} />
 *
 * @param {{ dentistId?: string, serviceId?: string, date?: string, excludeAppointmentId?: string }} params
 * @returns {{
 *   slots: { startTime: string, endTime: string, available: boolean }[],
 *   message: string,   // e.g. "The clinic is closed on Sundays" (when slots is empty)
 *   loading: boolean, error: string, ready: boolean, refetch: () => void
 * }}
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
        : Promise.resolve({ data: { slots: [] } }), // nothing to load yet
    [dentistId, serviceKey, date, excludeAppointmentId, ready],
  );

  return {
    slots: Array.isArray(data?.slots) ? data.slots : [],
    durationMinutes: data?.durationMinutes,
    message: data?.message || response?.message || '',
    loading: ready && loading,
    error: ready ? error : '',
    ready,
    refetch,
  };
}
