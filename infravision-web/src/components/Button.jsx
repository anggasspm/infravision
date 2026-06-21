export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2.5 rounded-md bg-[var(--brand)] text-white text-sm font-medium
                 hover:bg-[#13231A] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-4 py-2.5 rounded-md border border-[var(--border)] bg-white text-[var(--ink)] text-sm font-medium
                 hover:bg-[var(--brand-soft)] active:scale-[0.98] transition disabled:opacity-40 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}