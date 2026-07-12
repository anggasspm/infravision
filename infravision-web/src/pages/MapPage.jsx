import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import MapLegend from "../components/MapLegend";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import SpinnerIcon from "../components/icons/SpinnerIcon";
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
const POLL_INTERVAL_MS = 20000;

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

      // Cincin berdenyut di bawah titik severity "critical" — sinyal visual
      // bahwa peta ini hidup & memantau kondisi terbaru, bukan gambar statis.
      map.addLayer({
        id: "critical-pulse",
        type: "circle",
        source: "reports",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "severity"], "critical"]],
        paint: {
          "circle-radius": 10,
          "circle-color": SEVERITY_CONFIG.critical.color,
          "circle-opacity": 0.35,
        },
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

  // Denyut halus pada cincin critical — dijalankan lewat requestAnimationFrame,
  // bukan setInterval, supaya tetap mulus & otomatis berhenti saat tab tidak aktif.
  useEffect(() => {
    if (!map) return;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      if (map.getLayer("critical-pulse")) {
        const t = ((now - start) % 1800) / 1800;
        const wave = Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0 -> 1 -> 0
        map.setPaintProperty("critical-pulse", "circle-radius", 8 + wave * 10);
        map.setPaintProperty("critical-pulse", "circle-opacity", 0.4 - wave * 0.3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [map]);

  return null;
}

function ToolbarButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-md text-sm font-medium border
                 transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                 active:scale-[0.97]
                 ${
                   active
                     ? "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]"
                     : "bg-white border-[var(--border)] text-[var(--ink)] hover:border-[var(--brand)]"
                 }`}
    >
      {children}
    </button>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ severity: "", status: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

    instance.on("error", (e) => {
      console.error("MapLibre error:", e.error || e);
    });

    instance.on("load", () => {
     // instance.getCanvas().style.filter = MAP_TINT_FILTER;
      instance.resize();
    });

    setMap(instance);

    // Paksa peta resize setiap kali ukuran container-nya benar-benar berubah
    // (misal toolbar wrap ke 2 baris di layar kecil, atau layout flex baru
    // selesai dihitung browser). Ini yang sering hilang saat peta dibungkus
    // flex/grid layout — canvas WebGL tidak auto-resize sendiri.
    const resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      instance.remove();
    };
  }, []);

  // Muat data pertama kali, lalu polling ringan supaya peta terasa "hidup"
  // tanpa harus refresh manual. Logic fetch didefinisikan langsung di dalam
  // effect (bukan lewat useCallback terpisah) + flag `ignore` untuk cleanup,
  // supaya tidak ada setState yang "menyelinap" dari luar effect.
  useEffect(() => {
    let ignore = false;

    const load = async (silent = false) => {
      if (silent) setRefreshing(true);
      try {
        const res = await api.get("/map/reports");
        if (ignore) return;

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
        setLastUpdated(new Date());
      } catch {
        if (!ignore && !silent) setReports([]);
      } finally {
        if (ignore) return;
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    };

    load();
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
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
  const activeFilterCount = [filters.severity, filters.status, filters.category].filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full">
      {/* ============================================
          Toolbar aksi — di bawah navbar, di atas peta.
          Ini yang membuat "menambah laporan" langsung
          terlihat begitu website dibuka, bukan tersembunyi
          di menu.
          ============================================ */}
      <div className="shrink-0 bg-white border-b border-[var(--border)] relative z-20">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--success)" }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "var(--success)" }} />
              </span>
              <span className="text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-widest">Live</span>
            </div>

            <h1 className="font-display text-lg sm:text-xl font-semibold text-[var(--ink)] truncate">
              Peta Laporan
            </h1>

            <span
              key={filtered.length}
              className="hidden sm:inline-flex items-center text-xs font-semibold text-[var(--brand)] bg-[var(--brand-soft)]
                         px-2.5 py-1 rounded-full animate-status-update tabular-nums shrink-0"
            >
              {filtered.length} laporan
            </span>

            {refreshing && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] shrink-0">
                <SpinnerIcon width="12" height="12" /> memperbarui…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ToolbarButton active={panelOpen} onClick={() => setPanelOpen((v) => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {activeFilterCount}
                </span>
              )}
            </ToolbarButton>

            <SecondaryButton onClick={() => navigate("/lacak")} className="!py-2.5">
              Lacak Laporan
            </SecondaryButton>

            {user && (
              <SecondaryButton onClick={() => navigate("/my-reports")} className="!py-2.5 hidden sm:inline-flex">
                Laporan Saya
              </SecondaryButton>
            )}

            <PrimaryButton onClick={() => navigate("/submit")} className="!py-2.5">
              <span className="inline-flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Tambah Laporan
              </span>
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* ============================================
          Area peta
          ============================================ */}
      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--paper)]">
            <div className="flex flex-col items-center gap-3">
              <SpinnerIcon width="22" height="22" className="text-[var(--brand)]" />
              <p className="text-sm text-[var(--ink-soft)]">Memuat laporan di sekitarmu…</p>
            </div>
          </div>
        )}

        <div ref={containerRef} className="absolute inset-0" />
        <ReportsLayer map={map} geojson={reportsToGeoJSON(filtered)} />

        {/* Panel filter — drawer yang muncul dari toolbar, bukan kotak yang
            selalu menutupi peta sejak awal. Peta jadi tampilan utama. */}
        <div
          className={`absolute top-3 left-4 z-10 w-72 max-w-[calc(100%-2rem)] transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out)]
                      ${panelOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
        >
          <div className="rounded-xl bg-white/95 backdrop-blur-md border border-[var(--border)] shadow-[0_8px_28px_rgba(15,23,42,0.14)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="font-display text-sm font-semibold text-[var(--ink)]">Filter Peta</span>
              <button
                onClick={() => setPanelOpen(false)}
                aria-label="Tutup filter"
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-[var(--dur-fast)]"
              >
                ✕
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
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
                {filtered.length} dari {reports.length} laporan ditampilkan
              </p>
            </div>
          </div>
        </div>

        {/* Empty state — kalau belum ada laporan sama sekali, arahkan
            langsung ke aksi "lapor pertama", bukan peta kosong yang membisu. */}
        {!loading && reports.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto max-w-sm text-center bg-white/95 backdrop-blur-md border border-[var(--border)] rounded-xl p-6 shadow-[0_8px_28px_rgba(15,23,42,0.12)] animate-rise-in">
              <p className="font-display text-lg font-semibold text-[var(--ink)] mb-1.5">Belum ada laporan di sini</p>
              <p className="text-sm text-[var(--ink-soft)] mb-4 leading-relaxed">
                Jadilah yang pertama melaporkan jalan rusak di sekitarmu dan bantu InfraVision mulai memetakan wilayahmu.
              </p>
              <PrimaryButton onClick={() => navigate("/submit")}>Buat Laporan Pertama</PrimaryButton>
            </div>
          </div>
        )}

        {/* Legenda + waktu update, pojok kiri bawah */}
        <div className="absolute bottom-5 left-4 z-10 flex flex-col gap-2 items-start">
          <MapLegend counts={counts} />
          {lastUpdated && (
            <span className="text-[11px] text-[var(--ink-soft)] bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
              Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}