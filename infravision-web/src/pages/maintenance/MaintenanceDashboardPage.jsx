import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/axios";

const STATUS_LABELS = {
  assigned: "Ditugaskan", in_progress: "Dalam Proses",
  under_repair: "Sedang Diperbaiki", completed: "Selesai",
};
const NEXT_STATUS = {
  assigned: "in_progress", in_progress: "under_repair", under_repair: "completed",
};

function TaskCardSkeleton() {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-5">
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-lg shrink-0 skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 skeleton" />
          <div className="h-3 w-2/3 skeleton" />
          <div className="h-3 w-1/2 skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceDashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    api.get("/reports?status=assigned&page_size=100")
      .then((res) => setReports(res.data.data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    await api.put(`/reports/${id}/status`, { status: newStatus });
    fetchReports();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl font-semibold text-[var(--ink)] mb-6 animate-rise-in">
        Dashboard Maintenance
      </h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center text-[var(--ink-soft)] text-sm py-16 animate-rise-in">
          Tidak ada tugas aktif
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r, i) => (
            <div
              key={r.id}
              style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
              className="bg-white border border-[var(--border)] rounded-lg p-5 animate-rise-in
                         transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]
                         hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
            >
              <div className="flex gap-4">
                <img
                  src={r.image_url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg shrink-0 border border-[var(--border)]"
                />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-[var(--ink)]">{r.category || "—"}</p>
                  <p className="text-sm text-[var(--ink-soft)] line-clamp-2">{r.description}</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    Status: <span className="font-medium text-[var(--ink)]">{STATUS_LABELS[r.status] || r.status}</span>
                    {" · "}Severity: <span className="font-medium capitalize">{r.severity}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                <Link
                  to={`/report/${r.id}`}
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-md text-[var(--ink)]
                             transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--brand-soft)]"
                >
                  Lihat Detail
                </Link>
                {NEXT_STATUS[r.status] && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, NEXT_STATUS[r.status])}
                    className="px-3 py-1.5 text-sm bg-[var(--brand)] text-white rounded-md
                               transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                               hover:bg-[#13231A] active:scale-[0.96]"
                  >
                    Tandai: {STATUS_LABELS[NEXT_STATUS[r.status]]}
                  </button>
                )}
                {r.status === "under_repair" && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, "completed")}
                    className="px-3 py-1.5 text-sm text-white rounded-md
                               transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                               active:scale-[0.96]"
                    style={{ background: "var(--success)" }}
                  >
                    ✓ Selesai
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
