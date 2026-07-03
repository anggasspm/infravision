export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-md bg-[var(--brand)] text-white text-sm font-medium
                 transition-[transform,background-color,box-shadow]
                 duration-[var(--dur-fast)] ease-[var(--ease-out)]
                 hover:bg-[#13231A] hover:shadow-[0_2px_8px_rgba(26,46,34,0.25)]
                 active:scale-[0.97] active:duration-[var(--dur-instant)]
                 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100
                 disabled:hover:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2.5 rounded-md border border-[var(--border)] bg-white text-[var(--ink)] text-sm font-medium
                 transition-[transform,background-color,border-color]
                 duration-[var(--dur-fast)] ease-[var(--ease-out)]
                 hover:bg-[var(--brand-soft)] hover:border-[var(--brand)]
                 active:scale-[0.97] active:duration-[var(--dur-instant)]
                 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 ${className}`}
    >
      {children}
    </button>
  );
}
