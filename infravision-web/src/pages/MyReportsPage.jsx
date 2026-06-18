import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";

const STATUS_LABELS = {
  pending: "Menunggu", verified: "Diverifikasi", assigned: "Ditugaskan",
  in_progress: "Dalam Proses", under_repair: "Sedang Diperbaiki", completed: "Selesai",
};
const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-600", verified: "bg-blue-100 text-blue-700",
  assigned: "bg-purple-100 text-purple-700", in_progress: "bg-yellow-100 text-yellow-700",
  under_repair: "bg-orange-100 text-orange-700", completed: "bg-green-100 text-green-700",
};

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
    if (statusFilter) params.append("status", statusFilter);
    api.get(`/reports?${params}`)
      .then((res) => {
        // filter by search di frontend
        const items = res.data.items.filter((r) =>
          r.description.toLowerCase().includes(search.toLowerCase())
        );
        setReports(items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Laporan Saya</h1>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari deskripsi..."
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-10">Memuat...</div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Belum ada laporan</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              to={`/report/${r.id}`}
              className="flex items-center gap-4 bg-white border rounded-xl p-4 hover:shadow transition"
            >
              <img
                src={r.image_url}
                alt=""
                className="w-16 h-16 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.category || "—"} · {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${STATUS_COLORS[r.status] || "bg-gray-100"}`}>
                {STATUS_LABELS[r.status] || r.status}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          ← Sebelumnya
        </button>
        <span>Halaman {page} · Total {total} laporan</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * PAGE_SIZE >= total}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}