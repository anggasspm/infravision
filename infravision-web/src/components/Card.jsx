export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-[var(--border)] rounded-lg p-5 ${className}`}>
      {children}
    </div>
  );
}