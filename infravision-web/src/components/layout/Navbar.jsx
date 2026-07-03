import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BellIcon from "../icons/BellIcon";

const NAV_ITEMS = [
  { to: "/map", label: "Peta" },
  { to: "/submit", label: "Laporkan" },
  { to: "/my-reports", label: "Laporan Saya" },
];

export default function Navbar({ hasUnreadNotifications = false }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-[var(--brand)]
                     transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:opacity-70"
        >
          InfraVision
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3 py-2 text-sm rounded-md
                            transition-colors duration-[var(--dur-base)] ease-[var(--ease-in-out)]
                            ${
                              active
                                ? "text-[var(--brand)] font-medium"
                                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                            }`}
              >
                {item.label}
                {/* Sliding underline: transform scale jauh lebih murah secara
                    performa daripada animasi width, dan terasa lebih premium
                    daripada background block on/off */}
                <span
                  className={`absolute left-3 right-3 -bottom-[1px] h-[2px] rounded-full bg-[var(--brand)]
                              origin-left transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]
                              ${active ? "scale-x-100" : "scale-x-0"}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="text-[var(--ink-soft)] hover:text-[var(--ink)]
                       transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
            aria-label="Notifikasi"
          >
            <BellIcon hasUnread={hasUnreadNotifications} />
          </Link>
          {user && (
            <button
              onClick={logout}
              className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]
                         transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
            >
              {user.name?.split(" ")[0]} · Keluar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
