import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Selamat datang, {user?.name} 👋
      </h1>
      <p className="text-gray-500 mb-8">
        Laporkan kerusakan infrastruktur di sekitarmu agar segera ditangani.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/submit"
          className="block p-6 bg-primary text-white rounded-xl hover:bg-blue-600"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-semibold">Buat Laporan</div>
          <div className="text-sm opacity-80 mt-1">Laporkan kerusakan baru</div>
        </Link>

        <Link
          to="/map"
          className="block p-6 bg-white border rounded-xl hover:shadow"
        >
          <div className="text-2xl mb-2">🗺️</div>
          <div className="font-semibold text-gray-800">Lihat Peta</div>
          <div className="text-sm text-gray-500 mt-1">Sebaran kerusakan di daerahmu</div>
        </Link>

        <Link
          to="/my-reports"
          className="block p-6 bg-white border rounded-xl hover:shadow"
        >
          <div className="text-2xl mb-2">📁</div>
          <div className="font-semibold text-gray-800">Laporan Saya</div>
          <div className="text-sm text-gray-500 mt-1">Pantau status laporanmu</div>
        </Link>
      </div>
    </div>
  );
}