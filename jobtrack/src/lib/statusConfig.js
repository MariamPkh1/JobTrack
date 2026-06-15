// The five lifecycle stages allowed by the DB CHECK constraint on
// applications.status. Keep this in sync with the backend enum — any other
// value is rejected by Postgres at insert/update time.
export const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

// Low-saturation background + high-saturation text chips (per design spec).
export const STATUS_BADGE = {
  Applied: 'bg-primary/10 text-primary',
  Interview: 'bg-secondary/10 text-secondary',
  Offer: 'bg-tertiary/10 text-tertiary',
  Rejected: 'bg-error/10 text-error',
  Withdrawn: 'bg-surface-container-high text-on-surface-variant',
};

// Dot colors for legends / list rows.
export const STATUS_DOT = {
  Applied: '#0058be',
  Interview: '#006c49',
  Offer: '#924700',
  Rejected: '#ba1a1a',
  Withdrawn: '#727785',
};
