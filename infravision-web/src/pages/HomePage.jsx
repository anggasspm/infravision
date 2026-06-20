import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_ITEMS = [
  {
    to: "/submit",
    label: "Buat Laporan",
    description: "Laporkan kerusakan infrastruktur yang kamu temukan",
    accent: "bg-primary",
    iconBg: "bg-blue-600",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    ),
    primary: true,
  },
  {
    to: "/map",
    label: "Lihat Peta",
    description: "Sebaran laporan kerusakan di sekitar lokasimu",
    accent: "bg-slate-800",
    iconBg: "bg-slate-700",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    accent: "bg-slate-800",
    iconBg: "bg-slate-700",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Selamat pagi" : hour < 17 ? "Selamat siang" : "Selamat malam";

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-500 font-medium">Sistem aktif</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-base max-w-md">
            Bantu perbaiki infrastruktur kotamu dengan melaporkan kerusakan yang kamu temukan.
          </p>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Menu Utama
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MENU_ITEMS.map(({ to, label, description, iconBg, icon, primary }) => (
            <Link
              key={to}
              to={to}
              className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                primary
                  ? "bg-primary text-white shadow-md shadow-blue-200"
                  : "bg-white border border-slate-200 text-slate-900 hover:border-slate-300"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                {icon}
              </div>
              <p className={`font-semibold text-base mb-1 ${primary ? "text-white" : "text-slate-900"}`}>
                {label}
              </p>
              <p className={`text-sm leading-relaxed ${primary ? "text-blue-100" : "text-slate-500"}`}>
                {description}
              </p>
              <div className={`absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity ${primary ? "text-blue-200" : "text-slate-400"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Info section */}
        <div className="mt-10 rounded-2xl bg-blue-50 border border-blue-100 p-6 flex gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Cara kerja InfraVision</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Foto yang kamu unggah akan dianalisis otomatis oleh AI untuk menentukan kategori kerusakan, tingkat keparahan, dan prioritas penanganan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}