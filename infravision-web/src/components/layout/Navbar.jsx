import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BellIcon from "../icons/BellIcon";

function LogoMark() {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: "var(--brand)" }}
      aria-hidden="true"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </div>
  );
}

export default function Navbar({ hasUnreadNotifications = false }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-[var(--border)] bg-white relative z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:opacity-80"
        >
          <LogoMark />
          <span className="font-display text-lg font-semibold text-[var(--ink)] leading-none">
            InfraVision
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/my-reports"
                className="hidden sm:inline text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]
                           transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
              >
                Laporan Saya
              </Link>

              <span className="hidden sm:inline-block w-px h-4 bg-[var(--border)]" aria-hidden="true" />

              <Link
                to="/notifications"
                className="text-[var(--ink-soft)] hover:text-[var(--ink)]
                           transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
                aria-label="Notifikasi"
              >
                <BellIcon hasUnread={hasUnreadNotifications} />
              </Link>

              <button
                onClick={logout}
                className="text-sm font-medium text-[var(--ink)] bg-[var(--paper)] border border-[var(--border)]
                           rounded-full px-3.5 py-1.5
                           transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]
                           hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                {user.name?.split(" ")[0]} · Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                to="/lacak"
                className="hidden sm:inline text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]
                           transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
              >
                Lacak Laporan
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-white bg-[var(--brand)] rounded-full px-4 py-1.5
                           transition-[background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                           hover:bg-[#13231A] hover:shadow-[0_2px_8px_rgba(26,46,34,0.25)]"
              >
                Masuk
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}