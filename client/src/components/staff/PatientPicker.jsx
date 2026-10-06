import { useId, useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { getPatients } from '../../api/patientApi';
import useDebounce from '../../hooks/useDebounce';
import useFetch from '../../hooks/useFetch';
import { fullName, initials } from '../../utils/formatters';

/**
 * Searchable patient selector for staff booking.
 * Typing searches active patients by name, email or phone (debounced 300 ms);
 * clicking a result selects it. When a patient is selected a summary is shown instead.
 * @param {object} props
 * @param {object|null} props.value selected patient ({ _id, fullName, email, phone })
 * @param {(patient: object|null) => void} props.onChange
 * @param {string} [props.error] validation message
 * @param {boolean} [props.locked] hide the "Change" button (patient preselected)
 */
export default function PatientPicker({ value, onChange, error, locked = false }) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Hooks always run (rules of hooks); when a patient is selected we skip the request.
  const { data, loading, error: loadError } = useFetch(
    () =>
      value
        ? Promise.resolve({ data: [] })
        : getPatients({ search: debouncedQuery || undefined, isActive: true, limit: 5 }),
    [debouncedQuery, Boolean(value)],
  );
  const results = Array.isArray(data) ? data : [];

  if (value) {
    return (
      <div className="mb-3">
        <div className="form-label">Patient</div>
        <div className="sc-picker-selected">
          <span className="sc-avatar" aria-hidden="true">
            {initials(fullName(value))}
          </span>
          <div className="min-w-0 flex-grow-1">
            <div className="fw-semibold text-truncate">{fullName(value)}</div>
            <div className="small text-muted text-truncate">
              {[value.email, value.phone].filter(Boolean).join(' · ')}
            </div>
          </div>
          {!locked && (
            <Button size="sm" variant="light" onClick={() => onChange(null)}>
              Change
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Form.Label htmlFor={inputId}>
        Patient
        <span className="text-danger ms-1" aria-hidden="true">
          *
        </span>
      </Form.Label>
      <InputGroup hasValidation className="sc-search mw-100">
        <InputGroup.Text aria-hidden="true">
          <Search />
        </InputGroup.Text>
        <Form.Control
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone…"
          isInvalid={Boolean(error)}
          aria-invalid={error ? true : undefined}
          aria-required
          aria-describedby={`${inputId}-results`}
          autoComplete="off"
        />
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>

      <div id={`${inputId}-results`} className="sc-picker-results" aria-live="polite">
        {loading && (
          <div className="small text-muted p-2">
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
            Searching patients…
          </div>
        )}
        {!loading && loadError && <div className="small text-danger p-2">{loadError}</div>}
        {!loading && !loadError && results.length === 0 && (
          <div className="small text-muted p-2">No active patients match “{debouncedQuery}”.</div>
        )}
        {!loading && results.length > 0 && (
          <ul className="list-unstyled mb-0" aria-label="Matching patients">
            {results.map((patient) => (
              <li key={patient._id}>
                <button type="button" className="sc-picker-option" onClick={() => onChange(patient)}>
                  <span className="sc-avatar sc-avatar-sm" aria-hidden="true">
                    {initials(fullName(patient))}
                  </span>
                  <span className="min-w-0 text-start">
                    <span className="d-block fw-semibold text-truncate">{fullName(patient)}</span>
                    <span className="d-block small text-muted text-truncate">
                      {[patient.email, patient.phone].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
