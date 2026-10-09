import { Lock } from 'react-bootstrap-icons';

/**
 * Visual countdown timer displayed in place of login fields during security lockout.
 *
 * @param {{
 *   seconds: number,
 *   totalSeconds?: number,
 *   message?: string,
 * }} props
 */
export default function LockoutTimer({ seconds, totalSeconds = 60, message }) {
  const safeTotal = Math.max(1, totalSeconds);
  const safeSec = Math.max(0, seconds);

  // Circular ring math: radius 50 in 120x120 viewBox
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  const strokeDashoffset = circumference * (1 - safeSec / safeTotal);

  const formattedTime =
    safeSec >= 60
      ? `${Math.floor(safeSec / 60)}:${String(safeSec % 60).padStart(2, '0')}`
      : `0:${String(safeSec).padStart(2, '0')}`;

  return (
    <div className="sc-lockout-card my-2" role="alert" aria-live="polite">
      <h3 className="h5 fw-bold text-dark mb-1">Account Temporarily Locked</h3>
      <p className="text-muted small mb-2 px-2">
        {message || 'Too many failed login attempts. For security, login is suspended.'}
      </p>

      {/* SVG Circular Countdown Ring */}
      <div className="sc-lockout-ring-container" aria-label={`Time remaining: ${safeSec} seconds`}>
        <svg className="sc-lockout-svg" viewBox="0 0 120 120" width="120" height="120">
          <circle
            className="sc-lockout-bg-circle"
            cx="60"
            cy="60"
            r={radius}
          />
          <circle
            className="sc-lockout-progress-circle"
            cx="60"
            cy="60"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="sc-lockout-ring-center">
          <span className="sc-lockout-seconds">{formattedTime}</span>
          <span className="sc-lockout-label">Remaining</span>
        </div>
      </div>

      {/* Reassurance footer */}
      <div className="sc-lockout-hint mt-2">
        <Lock size={13} className="text-warning flex-shrink-0" aria-hidden="true" />
        <span>Login fields will automatically reappear when the timer hits zero.</span>
      </div>
    </div>
  );
}
