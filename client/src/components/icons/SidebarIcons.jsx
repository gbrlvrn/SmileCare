/**
 * Custom high-fidelity sidebar navigation icons matching user specification.
 * Each icon supports `size`, `color`, and standard SVG attributes.
 */

// 1. Dashboard Bento Icon (Image 4)
export function DashboardIcon({ size = 18, color = 'currentColor', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Top-left: tall rectangle */}
      <rect x="3" y="3" width="7" height="10.5" rx="2.2" />
      {/* Bottom-left: short wide rectangle */}
      <rect x="3" y="16" width="7" height="5" rx="2" />
      {/* Top-right: short wide rectangle */}
      <rect x="14" y="3" width="7" height="5" rx="2" />
      {/* Bottom-right: tall rectangle */}
      <rect x="14" y="10.5" width="7" height="10.5" rx="2.2" />
    </svg>
  );
}

// 2. Book Appointment / Calendar Plus Icon (Image 1)
export function CalendarPlusIcon({ size = 18, color = 'currentColor', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Top hanging loops/pegs */}
      <path d="M7 2v3.5" />
      <path d="M17 2v3.5" />
      {/* Calendar body (opens at bottom-right for badge) */}
      <path d="M21 11.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7" />
      {/* Header divider */}
      <path d="M3 9h18" />
      {/* Plus badge */}
      <circle cx="17.5" cy="17.5" r="4.5" />
      <path d="M17.5 15v5" />
      <path d="M15 17.5h5" />
    </svg>
  );
}

// 3. My Appointments / Calendar Check Icon (Image 3)
export function CalendarCheckIcon({ size = 18, color = 'currentColor', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Top hanging loops/pegs */}
      <path d="M7 2v3.5" />
      <path d="M17 2v3.5" />
      {/* Calendar body (opens at bottom-right for badge) */}
      <path d="M21 11.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7" />
      {/* Header divider */}
      <path d="M3 9h18" />
      {/* Check badge */}
      <circle cx="17.5" cy="17.5" r="4.5" />
      <path d="M15.5 17.5l1.5 1.5 3-3" />
    </svg>
  );
}

// 4. Treatment History / Timer Clock Icon (Image 2)
export function TreatmentHistoryIcon({ size = 18, color = 'currentColor', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Circular arc with arrow at top right */}
      <path d="M12 3a9 9 0 1 0 9 9c0-2.4-.9-4.6-2.5-6.2" />
      <path d="M17.5 4.5l3.5 1.3-1.3 3.5" />
      {/* Clock hands */}
      <path d="M12 7.5v4.8" />
      <path d="M12 12.3l-3.3 3.3" />
    </svg>
  );
}

// 5. Profile User Icon (Image 5)
export function ProfileIcon({ size = 18, color = 'currentColor', className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Outer circular frame (open at bottom) */}
      <path d="M3.8 17.5a9.5 9.5 0 1 1 16.4 0" />
      {/* Head circle */}
      <circle cx="12" cy="9.2" r="3.2" />
      {/* Shoulders / body contour */}
      <path d="M4.5 19c0-3.3 3.2-5 7.5-5s7.5 1.7 7.5 5" />
    </svg>
  );
}
