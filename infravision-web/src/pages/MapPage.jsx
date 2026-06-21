import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet.markercluster";
import api from "../lib/axios";

const SEVERITY_COLORS = { low: "green", medium: "orange", high: "darkorange", critical: "red" };

const CATEGORIES = ["Road Damage", "Pothole", "Unclassified"];

const STATUSES = ["pending","verified","assigned","in_progress","under_repair","completed"];

function MarkersLayer({ reports, navigate }) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup();

    reports.forEach((r) => {
      const color = SEVERITY_COLORS[r.severity] || "gray";
      const icon = L.circleMarker([r.latitude, r.longitude], {
        radius: 8, color, fillColor: color, fillOpacity: 0.8, weight: 1,
      });
      icon.bindPopup(`
        <div style="min-width:160px">
          <b>${r.category || "Tidak diketahui"}</b><br/>
          Severity: <span style="color:${color}">${r.severity || "—"}</span><br/>
          Status: ${r.status}<br/>
          <a href="/report/${r.id}" style="color:#3b82f6">Lihat Detail →</a>
        </div>
      `);
      cluster.addLayer(icon);
    });

    map.addLayer(cluster);
    return () => map.removeLayer(cluster);
  }, [reports, map, navigate]);

  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ severity: "", status: "", category: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/map/reports")
      .then((res) => {
        // GeoJSON: { type: "FeatureCollection", features: [...] }
        const features = res.data.data?.features || [];
        // Konversi GeoJSON feature ke format yang dipakai marker
        const items = features.map((f) => ({
          id: f.properties.id,
          latitude: f.geometry.coordinates[1],   // GeoJSON: [lng, lat]
          longitude: f.geometry.coordinates[0],
          category: f.properties.category,
          severity: f.properties.severity,
          status: f.properties.status,
          priority_score: f.properties.priority_score,
          is_duplicate: f.properties.is_duplicate,
        }));
        setReports(items);
        setFiltered(items);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = reports;
    if (filters.severity) data = data.filter((r) => r.severity === filters.severity);
    if (filters.status) data = data.filter((r) => r.status === filters.status);
    if (filters.category) data = data.filter((r) => r.category === filters.category);
    setFiltered(data);
  }, [filters, reports]);

  return (
    <div className="flex h-screen">
      {/* Filter Panel */}
      <div className="w-60 bg-white border-r border-[var(--border)] p-5 space-y-5 overflow-y-auto shrink-0">
        <h2 className="font-display text-base font-semibold text-[var(--ink)]">Filter</h2>

        {[
          { label: "Tingkat Keparahan", key: "severity", options: ["low","medium","high","critical"] },
          { label: "Status", key: "status", options: STATUSES },
          { label: "Kategori", key: "category", options: ["Road Damage", "Pothole", "Unclassified"] },
        ].map(({ label, key, options }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 uppercase tracking-wide">
              {label}
            </label>
            <select
              value={filters[key]}
              onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
              className="w-full border-b border-[var(--border)] bg-transparent pb-1.5 text-sm text-[var(--ink)]
                        focus:border-[var(--brand)] outline-none transition"
            >
              <option value="">Semua</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}

        {(filters.severity || filters.status || filters.category) && (
          <button
            onClick={() => setFilters({ severity: "", status: "", category: "" })}
            className="text-xs text-[var(--brand)] hover:underline"
          >
            Hapus semua filter
          </button>
        )}

        <p className="text-xs text-[var(--ink-soft)] pt-3 border-t border-[var(--border)]">
          {filtered.length} laporan ditampilkan
        </p>
      </div>

      {/* Map */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">Memuat peta...</div>
        ) : (
          <MapContainer
            center={[-6.2, 106.8]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <MarkersLayer reports={filtered} navigate={navigate} />
          </MapContainer>
        )}
      </div>
    </div>
  );
}