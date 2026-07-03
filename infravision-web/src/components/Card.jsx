export default function Card({ children, className = "", animate = false, delay = 0 }) {
  return (
    <div
      style={animate ? { animationDelay: `${delay}ms` } : undefined}
      className={`bg-white border border-[var(--border)] rounded-lg p-5 ${
        animate ? "animate-rise-in" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
