import { formatDate } from '../../utils/formatters';
import './patient.css';

/**
 * Shows the treatment record of a completed appointment as a definition list.
 * Empty optional fields (notes, prescription, follow-up) are skipped.
 * @param {object} props
 * @param {{ diagnosis: string, procedure: string, notes?: string, prescription?: string, followUpDate?: string|null }} props.treatment
 */
export default function TreatmentDetails({ treatment }) {
  if (!treatment) return null;
  const { diagnosis, procedure, notes, prescription, followUpDate } = treatment;

  return (
    <dl className="sc-detail-list">
      <div>
        <dt>Diagnosis</dt>
        <dd className="sc-text-block">{diagnosis || '—'}</dd>
      </div>
      <div>
        <dt>Procedure</dt>
        <dd className="sc-text-block">{procedure || '—'}</dd>
      </div>
      {notes && (
        <div className="is-wide">
          <dt>Dentist&apos;s notes</dt>
          <dd className="sc-text-block">{notes}</dd>
        </div>
      )}
      {prescription && (
        <div className="is-wide">
          <dt>Prescription</dt>
          <dd className="sc-text-block">{prescription}</dd>
        </div>
      )}
      {followUpDate && (
        <div>
          <dt>Follow-up date</dt>
          <dd>{formatDate(followUpDate, { weekday: 'short' })}</dd>
        </div>
      )}
    </dl>
  );
}
