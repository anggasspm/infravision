import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/map", label: "Peta" },
  { to: "/submit", label: "Laporkan" },
  { to: "/my-reports", label: "Laporan Saya" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-semibold text-[var(--brand)]">
          InfraVision
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 text-sm rounded-md transition ${
                  active
                    ? "text-[var(--brand)] font-medium bg-[var(--brand-soft)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/notifications" className="text-[var(--ink-soft)] hover:text-[var(--ink)]" aria-label="Notifikasi">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </Link>
          {user && (
            <button onClick={logout} className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
              {user.name?.split(" ")[0]} · Keluar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}