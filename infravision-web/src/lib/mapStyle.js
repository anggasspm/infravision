
export const FREE_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export const MAP_TINT_FILTER =
  "sepia(0.22) saturate(1.15) hue-rotate(-6deg) brightness(1.03) contrast(0.96)";

export const SEVERITY_CONFIG = {
  low:      { label: "Rendah", color: "#52606D" },
  medium:   { label: "Sedang", color: "#92400E" },
  high:     { label: "Tinggi", color: "#C2410C" },
  critical: { label: "Kritis", color: "#9F1239" },
};

export const STATUS_LABELS = {
  pending:      "Menunggu",
  verified:     "Diverifikasi",
  assigned:     "Ditugaskan",
  in_progress:  "Dalam Proses",
  under_repair: "Sedang Diperbaiki",
  completed:    "Selesai",
};

export const CATEGORIES = ["Road Damage", "Pothole", "Unclassified"];
export const STATUSES = Object.keys(STATUS_LABELS);

export const DEFAULT_CENTER = [106.8, -6.2]; // [lng, lat] — MapLibre pakai urutan ini
export const DEFAULT_ZOOM = 12;

// Ubah daftar report (format internal InfraVision) jadi FeatureCollection GeoJSON
// yang siap dipakai sebagai source clustering MapLibre.
export function reportsToGeoJSON(reports) {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
      properties: {
        id: r.id,
        category: r.category || "Tidak diketahui",
        severity: r.severity || "low",
        status: r.status || "pending",
        priority_score: r.priority_score ?? null,
        is_duplicate: !!r.is_duplicate,
      },
    })),
  };
}

// Markup popup satu laporan, disenadakan dengan Card/SeverityTag/StatusTag
// tanpa perlu render React di dalam popup MapLibre (yang berjalan di luar DOM React).
export function reportPopupHTML(props) {
  const sev = SEVERITY_CONFIG[props.severity] || SEVERITY_CONFIG.low;
  const statusLabel = STATUS_LABELS[props.status] || props.status;
  return `
    <div style="font-family:'Inter',-apple-system,sans-serif;min-width:190px;padding:2px">
      <p style="margin:0 0 6px;font-weight:600;font-size:13.5px;color:#0F172A">${props.category}</p>
      <span style="display:inline-block;font-size:10.5px;font-weight:600;text-transform:uppercase;
                   letter-spacing:.04em;padding:2px 7px;border-radius:5px;
                   color:${sev.color};background:${sev.color}14;margin-bottom:6px">
        ${sev.label}
      </span>
      <p style="margin:2px 0 8px;font-size:12.5px;color:#52606D;border-left:2px solid ${sev.color};padding-left:7px">
        ${statusLabel}
      </p>
      <a href="/report/${props.id}"
         style="font-size:12.5px;font-weight:500;color:#1A2E22;text-decoration:none">
        Lihat detail laporan &rarr;
      </a>
    </div>
  `;
}