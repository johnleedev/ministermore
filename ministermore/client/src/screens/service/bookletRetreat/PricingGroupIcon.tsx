export type PricingGroupIconType = 'group-heart' | 'group' | 'group-cross' | 'group-large';

export default function PricingGroupIcon({ type }: { type: PricingGroupIconType }) {
  if (type === 'group-heart') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M24 10c-2.2-3.2-6.4-3.8-9.2-1.2-2.8 2.6-2.9 7-0.3 9.8L24 28.5l9.5-9.9c2.6-2.8 2.5-7.2-0.3-9.8-2.8-2.6-7-2-9.2 1.2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="15" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="33" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="33" cy="30" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === 'group-cross') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M24 8v8M20 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="30" r="3.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="33" r="3.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="32" cy="30" r="3.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (type === 'group-large') {
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden>
        <path d="M24 7v8M20 11h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="29" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="32" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="28" cy="32" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="36" cy="29" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="16" cy="30" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="33" r="3.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="30" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
