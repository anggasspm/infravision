export const TILE_LAYER_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_LAYER_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

// Leaflet pakai urutan [lat, lng] — beda dari MapLibre yang pakai [lng, lat]
export const DEFAULT_CENTER_LATLNG = [-6.2, 106.8];
export const DEFAULT_ZOOM = 12;

// Markup popup satu laporan, disenadakan dengan Card/SeverityTag/StatusTag
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