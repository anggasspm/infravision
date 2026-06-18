import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-primary">
        InfraVision
      </Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <Link to="/map" className="text-sm text-gray-600 hover:text-primary">
              Peta
            </Link>
            <Link to="/submit" className="text-sm text-gray-600 hover:text-primary">
              Laporkan
            </Link>
            <Link to="/my-reports" className="text-sm text-gray-600 hover:text-primary">
              Laporan Saya
            </Link>
            {user.role === "admin" && (
              <Link to="/admin/dashboard" className="text-sm text-gray-600 hover:text-primary">
                Dashboard Admin
              </Link>
            )}
            {user.role === "maintenance" && (
              <Link to="/maintenance" className="text-sm text-gray-600 hover:text-primary">
                Dashboard Tugas
              </Link>
            )}

            {/* Notifikasi & Avatar */}
            <Link to="/notifications" className="relative text-gray-600">
              🔔
            </Link>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-sm font-medium text-gray-700"
              >
                {user.name} ▾
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}