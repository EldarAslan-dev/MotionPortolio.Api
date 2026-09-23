/**
 * lucide-react intentionally ships no brand/logo marks (Instagram, LinkedIn,
 * Behance, ...) — trademark policy. These are minimal stroke-style glyphs
 * kept visually consistent with lucide's 24x24 / stroke-width look so they
 * drop into the same icon slots.
 */

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7.5" y1="10.5" x2="7.5" y2="16.5" />
      <circle cx="7.5" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.5 16.5v-4a2 2 0 0 1 4 0v4" />
      <line x1="11.5" y1="10.5" x2="11.5" y2="16.5" />
    </svg>
  );
}

export function BehanceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 6h6.2c2.6 0 4 1.2 4 3.1 0 1.4-.8 2.3-1.9 2.7 1.5.4 2.4 1.5 2.4 3.1 0 2.2-1.7 3.5-4.4 3.5H2V6Zm5.7 5c1.1 0 1.8-.6 1.8-1.6 0-1-.7-1.5-1.8-1.5H4.4V11h3.3Zm.3 5.6c1.3 0 2-.6 2-1.7s-.7-1.7-2-1.7H4.4v3.4h3.6ZM14 7.6h5.4v1.5H14V7.6Zm2.6 3.1c2.6 0 4.4 1.7 4.4 4.3 0 .3 0 .5-.1.8h-6.6c.1 1.3 1 2.1 2.3 2.1.9 0 1.6-.4 1.9-1h2.3c-.5 1.7-2.1 2.8-4.2 2.8-2.7 0-4.6-1.9-4.6-4.5 0-2.6 1.9-4.5 4.6-4.5Zm-2 3.6h4c-.1-1.1-.9-1.8-2-1.8-1 0-1.8.7-2 1.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
