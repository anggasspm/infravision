export default function BellIcon({ hasUnread = false, className = "", ...props }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${hasUnread ? "animate-bell-ring" : ""} ${className}`}
      {...props}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      {hasUnread && <circle cx="18" cy="6" r="3.5" fill="var(--accent)" stroke="none" />}
    </svg>
  );
}
