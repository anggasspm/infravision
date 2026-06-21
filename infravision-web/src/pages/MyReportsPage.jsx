import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import StatusTag from "../components/StatusTag";

const STATUS_LABELS = {
  pending: "Menunggu", verified: "Diverifikasi", assigned: "Ditugaskan",
  in_progress: "Dalam Proses", under_repair: "Sedang Diperbaiki", completed: "Selesai",
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
        const items = res.data.data.items.filter((r) =>
          r.description.toLowerCase().includes(search.toLowerCase())
        );
        setReports(items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  const isEmptyFromStart = reports.length === 0 && !search && !statusFilter;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-[var(--ink)] mb-6">Laporan Saya</h1>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari deskripsi..."
          className="border border-[var(--border)] rounded-md px-3 py-2 text-sm flex-1 min-w-48
                     text-[var(--ink)] placeholder-[var(--ink-soft)] focus:outline-none focus:border-[var(--brand)] transition"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--ink)]
                     focus:outline-none focus:border-[var(--brand)] transition"
        >
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-[var(--ink-soft)] py-16 text-sm">Memuat...</div>
      ) : reports.length === 0 ? (
        isEmptyFromStart ? (
          <div className="text-center py-20">
            <p className="text-[var(--ink-soft)] text-sm mb-4">Kamu belum membuat laporan apapun.</p>
            <Link to="/submit" className="text-sm font-medium text-[var(--brand)] hover:underline">
              Buat laporan pertama →
            </Link>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[var(--ink-soft)] text-sm mb-4">Tidak ada laporan yang cocok dengan pencarian ini.</p>
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); }}
              className="text-sm font-medium text-[var(--brand)] hover:underline"
            >
              Hapus filter
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              to={`/report/${r.id}`}
              className="flex items-center gap-4 bg-white border border-[var(--border)] rounded-lg p-4
                         hover:border-[var(--brand)] transition"
            >
              <img
                src={r.image_url}
                alt=""
                className="w-16 h-16 object-cover rounded-md shrink-0 border border-[var(--border)]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate">{r.description}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {r.category || "—"} · {new Date(r.created_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="shrink-0">
                <StatusTag status={r.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {reports.length > 0 && (
        <div className="flex justify-between items-center mt-6 text-sm text-[var(--ink-soft)]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--brand-soft)] disabled:opacity-40 transition"
          >
            ← Sebelumnya
          </button>
          <span>Halaman {page} · Total {total} laporan</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * PAGE_SIZE >= total}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--brand-soft)] disabled:opacity-40 transition"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}