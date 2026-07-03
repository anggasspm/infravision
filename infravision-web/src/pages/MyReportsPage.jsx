import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import StatusTag from "../components/StatusTag";

const STATUS_LABELS = {
  pending: "Menunggu", verified: "Diverifikasi", assigned: "Ditugaskan",
  in_progress: "Dalam Proses", under_repair: "Sedang Diperbaiki", completed: "Selesai",
};

function ReportRowSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white border border-[var(--border)] rounded-lg p-4">
      <div className="w-16 h-16 rounded-md shrink-0 skeleton" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/4 skeleton" />
        <div className="h-3 w-1/3 skeleton" />
      </div>
      <div className="w-20 h-4 skeleton" />
    </div>
  );
}

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
      <h1 className="font-display text-2xl font-semibold text-[var(--ink)] mb-6 animate-rise-in">
        Laporan Saya
      </h1>

      <div className="flex gap-3 mb-5 flex-wrap animate-rise-in" style={{ animationDelay: "40ms" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari deskripsi..."
          className="border border-[var(--border)] rounded-md px-3 py-2 text-sm flex-1 min-w-48
                     text-[var(--ink)] placeholder-[var(--ink-soft)]
                     transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                     focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--ink)]
                     transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                     focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
        >
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <ReportRowSkeleton key={i} />)}
        </div>
      ) : reports.length === 0 ? (
        isEmptyFromStart ? (
          <div className="text-center py-20 animate-rise-in">
            <p className="text-[var(--ink-soft)] text-sm mb-4">Kamu belum membuat laporan apapun.</p>
            <Link to="/submit" className="text-sm font-medium text-[var(--brand)] hover:underline">
              Buat laporan pertama →
            </Link>
          </div>
        ) : (
          <div className="text-center py-20 animate-rise-in">
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
          {reports.map((r, i) => (
            <Link
              key={r.id}
              to={`/report/${r.id}`}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="flex items-center gap-4 bg-white border border-[var(--border)] rounded-lg p-4 animate-rise-in
                         transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]
                         hover:border-[var(--brand)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
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
            className="px-3 py-1.5 border border-[var(--border)] rounded-md
                       transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                       hover:bg-[var(--brand-soft)] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            ← Sebelumnya
          </button>
          <span>Halaman {page} · Total {total} laporan</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * PAGE_SIZE >= total}
            className="px-3 py-1.5 border border-[var(--border)] rounded-md
                       transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                       hover:bg-[var(--brand-soft)] active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}
