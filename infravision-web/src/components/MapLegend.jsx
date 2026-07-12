import { SEVERITY_CONFIG } from "../lib/mapStyle";

export default function MapLegend({ counts, className = "" }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-full bg-white/90 backdrop-blur-sm
                  border border-[var(--border)] px-4 py-2 shadow-[0_4px_16px_rgba(15,23,42,0.08)] ${className}`}
    >
      {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: cfg.color }}
          />
          <span className="text-xs font-medium text-[var(--ink-soft)] tabular-nums">
            {counts?.[key] ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}