import { Clock } from 'react-bootstrap-icons';
import { formatTime } from '../utils/formatters';
import EmptyState from './EmptyState';
import Loader from './Loader';

/**
 * Grid of time-slot buttons grouped into Morning / Afternoon.
 * Unavailable slots are shown but disabled.
 * @param {object} props
 * @param {{ startTime: string, endTime: string, available: boolean }[]} props.slots from GET /dentists/:id/availability
 * @param {string} [props.value] selected startTime, e.g. '10:30'
 * @param {(startTime: string) => void} props.onChange
 * @param {boolean} [props.loading=false]
 * @param {string} [props.emptyMessage] shown when there are no slots (e.g. the API `message`)
 * @param {string} [props.error] validation message shown under the grid
 */
export default function TimeSlotPicker({
  slots = [],
  value,
  onChange,
  loading = false,
  emptyMessage = 'No time slots are available on this date. Please choose another day.',
  error,
}) {
  if (loading) return <Loader label="Loading available times…" />;

  if (!slots.length) {
    return <EmptyState icon={Clock} title="No available times" message={emptyMessage} className="py-4" />;
  }

  const availableCount = slots.filter((s) => s.available).length;
  const groups = [
    { title: 'Morning', items: slots.filter((s) => s.startTime < '12:00') },
    { title: 'Afternoon', items: slots.filter((s) => s.startTime >= '12:00') },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="sc-slot-picker">
      <p className="small text-muted mb-3" aria-live="polite">
        {availableCount} of {slots.length} time slots available
      </p>

      {groups.map((group) => (
        <div key={group.title} className="mb-3">
          <div className="sc-slot-group-title" id={`slots-${group.title}`}>
            {group.title}
          </div>
          <div className="sc-slot-grid" role="radiogroup" aria-labelledby={`slots-${group.title}`}>
            {group.items.map((slot) => {
              const selected = slot.startTime === value;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`sc-slot ${selected ? 'is-selected' : ''}`}
                  disabled={!slot.available}
                  onClick={() => onChange(slot.startTime)}
                  title={slot.available ? undefined : 'Not available'}
                >
                  {formatTime(slot.startTime)}
                  {!slot.available && <span className="visually-hidden"> (unavailable)</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && (
        <div className="invalid-feedback d-block" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
