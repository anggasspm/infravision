import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import ArrowRightIcon from "../components/icons/ArrowRightIcon";
import InfoIcon from "../components/icons/InfoIcon";
import MapLegend from "../components/MapLegend";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import {
  FREE_MAP_STYLE_URL,
  MAP_TINT_FILTER,
  SEVERITY_CONFIG,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  reportsToGeoJSON,
} from "../lib/mapStyle";

const MENU_ITEMS = [
  {
    to: "/submit",
    label: "Buat Laporan",
    description: "Laporkan kerusakan infrastruktur yang kamu temukan",
    primary: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    ),
  },
  {
    to: "/map",
    label: "Lihat Peta",
    description: "Sebaran laporan kerusakan di sekitar lokasimu",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    to: "/my-reports",
    label: "Laporan Saya",
    description: "Pantau status semua laporan yang pernah kamu kirim",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];


function HomeMapHero({ reports }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: FREE_MAP_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      scrollZoom: false,
      cooperativeGestures: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.getCanvas().style.filter = MAP_TINT_FILTER;

    map.on("click", () => map.scrollZoom.enable());
    map.on("mouseleave", () => map.scrollZoom.disable());

    map.on("load", () => {
      map.addSource("home-reports", { type: "geojson", data: reportsToGeoJSON(reports) });
      map.addLayer({
        id: "home-reports-glow",
        type: "circle",
        source: "home-reports",
        paint: {
          "circle-radius": 14,
          "circle-color": [
            "match", ["get", "severity"],
            "critical", SEVERITY_CONFIG.critical.color,
            "high", SEVERITY_CONFIG.high.color,
            "medium", SEVERITY_CONFIG.medium.color,
            SEVERITY_CONFIG.low.color,
          ],
          "circle-opacity": 0.18,
        },
      });
      map.addLayer({
        id: "home-reports-dot",
        type: "circle",
        source: "home-reports",
        paint: {
          "circle-radius": 5,
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
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update titik kalau data reports datang setelah peta sudah siap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyData = () => {
      const source = map.getSource("home-reports");
      if (source) source.setData(reportsToGeoJSON(reports));
    };
    if (map.isStyleLoaded()) applyData();
    else map.once("load", applyData);
  }, [reports]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";

  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("/map/reports")
      .then((res) => {
        const features = res.data.data?.features || [];
        setReports(
          features.map((f) => ({
            id: f.properties.id,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
            severity: f.properties.severity,
            status: f.properties.status,
          }))
        );
      })
      .catch(() => setReports([]));
  }, []);

  const counts = reports.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-[var(--paper)] min-h-screen">
      {/* Hero: peta hidup sebagai tampilan pertama, bukan teks statis */}
      <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden border-b border-[var(--border)] animate-rise-in">
        <HomeMapHero reports={reports} />

        {/* Vignette halus di tepi supaya kartu overlay tetap terbaca di atas peta apapun warnanya */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0) 28%, rgba(15,23,42,0) 72%, rgba(15,23,42,0.10) 100%)",
          }}
        />

        {/* Kartu kaca berisi sapaan + aksi utama, mengambang di atas peta */}
        <div className="pointer-events-none absolute inset-0 flex items-start">
          <div className="max-w-4xl w-full mx-auto px-6 pt-8 sm:pt-10">
            <div
              className="pointer-events-auto max-w-md rounded-xl bg-white/85 backdrop-blur-md
                         border border-white/60 shadow-[0_12px_32px_rgba(15,23,42,0.14)] p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-xs text-[var(--ink-soft)] font-medium uppercase tracking-wide">
                  Peta langsung &middot; {reports.length} laporan
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] mb-2">
                {greeting}, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-[var(--ink-soft)] text-sm sm:text-base leading-relaxed mb-5">
                Ini yang sedang terjadi di sekitar kotamu. Bantu perbaiki infrastruktur dengan
                melaporkan kerusakan yang kamu temukan.
              </p>
              <div className="flex flex-wrap gap-2">
                <PrimaryButton onClick={() => navigate("/submit")}>Buat Laporan</PrimaryButton>
                <SecondaryButton onClick={() => navigate("/map")}>Buka Peta Penuh</SecondaryButton>
              </div>
            </div>
          </div>
        </div>

        {/* Legenda mengambang, pojok kanan bawah peta */}
        <div className="absolute right-5 bottom-5 hidden sm:block">
          <MapLegend counts={counts} />
        </div>
      </div>

      {/* Menu Cards */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-widest mb-5">
          Menu Utama
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MENU_ITEMS.map(({ to, label, description, icon, primary }, i) => (
            <Link
              key={to}
              to={to}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`group relative overflow-hidden rounded-lg p-6 animate-rise-in
                          transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)]
                          hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${
                            primary
                              ? "bg-[var(--brand)] text-white"
                              : "bg-white border border-[var(--border)] text-[var(--ink)] hover:border-[var(--brand)]"
                          }`}
            >
              <div
                className="w-11 h-11 rounded-md flex items-center justify-center mb-4
                           transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]
                           group-hover:scale-105"
                style={{ background: primary ? "rgba(255,255,255,0.15)" : "var(--brand)" }}
              >
                {icon}
              </div>
              <p className={`font-medium text-base mb-1 ${primary ? "text-white" : "text-[var(--ink)]"}`}>
                {label}
              </p>
              <p className={`text-sm leading-relaxed ${primary ? "text-white/80" : "text-[var(--ink-soft)]"}`}>
                {description}
              </p>
              <div
                className={`absolute bottom-5 right-5 opacity-0 -translate-x-1
                            group-hover:opacity-100 group-hover:translate-x-0
                            transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-out)]
                            ${primary ? "text-white/70" : "text-[var(--ink-soft)]"}`}
              >
                <ArrowRightIcon />
              </div>
            </Link>
          ))}
        </div>

        {/* Info section */}
        <div
          className="mt-10 rounded-lg p-6 flex gap-4 animate-rise-in"
          style={{ background: "var(--brand-soft)", border: "1px solid var(--border)", animationDelay: "240ms" }}
        >
          <div className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "var(--brand)", color: "white" }}>
            <InfoIcon className="text-white" width="18" height="18" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--ink)] mb-1">Cara kerja InfraVision</p>
            <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
              Foto yang kamu unggah akan dianalisis otomatis oleh AI untuk menentukan kategori kerusakan, tingkat keparahan, dan prioritas penanganan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}