const SEVERITY_CONFIG = {
  low:      { label: "Rendah",  color: "#52606D" },
  medium:   { label: "Sedang",  color: "#92400E" },
  high:     { label: "Tinggi",  color: "#C2410C" },
  critical: { label: "Kritis",  color: "#9F1239" },
};

export default function SeverityTag({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || { label: "—", color: "#52606D" };
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
      style={{ color: cfg.color, background: `${cfg.color}14` }}
    >
      {cfg.label}
    </span>
  );
}