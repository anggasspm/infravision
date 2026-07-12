import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import api from "../lib/axios";
import MapLegend from "../components/MapLegend";
import {
  FREE_MAP_STYLE_URL,
  MAP_TINT_FILTER,
  SEVERITY_CONFIG,
  STATUS_LABELS,
  CATEGORIES,
  STATUSES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  reportsToGeoJSON,
  reportPopupHTML,
} from "../lib/mapStyle";

const SEVERITIES = Object.keys(SEVERITY_CONFIG);

// Layer laporan ter-cluster: MapLibre melakukan clustering di GPU lewat
// sumber GeoJSON (`cluster: true`), jadi kita tidak butuh leaflet.markercluster
// lagi — hasilnya lebih ringan untuk ribuan titik sekaligus.
function ReportsLayer({ map, geojson, onReady }) {
  useEffect(() => {
    if (!map) return;

    const setup = () => {
      if (map.getSource("reports")) {
        map.getSource("reports").setData(geojson);
        return;
      }

      map.addSource("reports", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterRadius: 46,
        clusterMaxZoom: 15,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "reports",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#1A2E22",
          "circle-opacity": 0.88,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 26],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "reports",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "reports",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match", ["get", "severity"],
            "critical", SEVERITY_CONFIG.critical.color,
            "high", SEVERITY_CONFIG.high.color,
            "medium", SEVERITY_CONFIG.medium.color,
            SEVERITY_CONFIG.low.color,
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Klik cluster -> zoom masuk ke area itu
      map.on("click", "clusters", (e) => {
        const feature = e.features[0];
        const clusterId = feature.properties.cluster_id;
        map.getSource("reports").getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
      });

      // Klik titik tunggal -> popup detail laporan
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features[0];
        new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(reportPopupHTML(feature.properties))
          .addTo(map);
      });

      ["clusters", "unclustered-point"].forEach((id) => {
        map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
      });

      onReady?.();
    };

    if (map.isStyleLoaded()) setup();
    else map.once("load", setup);
  }, [map, geojson, onReady]);

  return null;
}

export default function MapPage() {
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ severity: "", status: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);

  // Init peta sekali saja
  useEffect(() => {
    if (!containerRef.current) return;
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: FREE_MAP_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    instance.getCanvas().style.filter = MAP_TINT_FILTER;
    setMap(instance);
    return () => instance.remove();
  }, []);

  useEffect(() => {
    api.get("/map/reports")
      .then((res) => {
        const features = res.data.data?.features || [];
        const items = features.map((f) => ({
          id: f.properties.id,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
          category: f.properties.category,
          severity: f.properties.severity,
          status: f.properties.status,
          priority_score: f.properties.priority_score,
          is_duplicate: f.properties.is_duplicate,
        }));
        setReports(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => {
    if (filters.severity && r.severity !== filters.severity) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.category && r.category !== filters.category) return false;
    return true;
  });

  const counts = filtered.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {});

  const hasActiveFilters = filters.severity || filters.status || filters.category;

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {loading && <div className="absolute inset-0 skeleton rounded-none z-10" />}

      <div ref={containerRef} className="absolute inset-0" />
      <ReportsLayer map={map} geojson={reportsToGeoJSON(filtered)} />

      {/* Panel filter mengambang di atas peta, bukan sidebar kaku yang makan tinggi layar */}
      <div className="absolute top-4 left-4 z-10 w-64 animate-rise-in">
        <div className="rounded-xl bg-white/90 backdrop-blur-md border border-[var(--border)] shadow-[0_8px_28px_rgba(15,23,42,0.12)] overflow-hidden">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-display text-sm font-semibold text-[var(--ink)]">Filter</span>
            <span
              className={`text-[var(--ink-soft)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)] ${
                panelOpen ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>

          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)] ${
              panelOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-4 pb-4 space-y-4">
              {[
                { label: "Tingkat Keparahan", key: "severity", options: SEVERITIES },
                { label: "Status", key: "status", options: STATUSES },
                { label: "Kategori", key: "category", options: CATEGORIES },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 uppercase tracking-wide">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border-b border-[var(--border)] bg-transparent pb-1.5 text-sm text-[var(--ink)]
                              transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]
                              focus:border-[var(--brand)] outline-none"
                  >
                    <option value="">Semua</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {key === "status" ? STATUS_LABELS[o] : o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div
                className={`overflow-hidden transition-[max-height,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)] ${
                  hasActiveFilters ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <button
                  onClick={() => setFilters({ severity: "", status: "", category: "" })}
                  className="text-xs text-[var(--brand)] hover:underline"
                >
                  Hapus semua filter
                </button>
              </div>

              <p
                key={filtered.length}
                className="text-xs text-[var(--ink-soft)] pt-3 border-t border-[var(--border)] animate-status-update"
              >
                {filtered.length} laporan ditampilkan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda mengambang, pojok kiri bawah */}
      <div className="absolute bottom-5 left-4 z-10">
        <MapLegend counts={counts} />
      </div>
    </div>
  );
}