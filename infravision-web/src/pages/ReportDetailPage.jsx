import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import StatusTag from "../components/StatusTag";
import SeverityTag from "../components/SeverityTag";
import Card from "../components/Card";

const STATUS_LABELS = {
  pending: "Menunggu",
  verified: "Diverifikasi",
  assigned: "Ditugaskan",
  in_progress: "Dalam Proses",
  under_repair: "Sedang Diperbaiki",
  completed: "Selesai",
};

const VALID_STATUSES = ["pending", "verified", "assigned", "in_progress", "under_repair", "completed"];

function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div className="h-4 w-32 skeleton" />
      <div className="w-full h-80 rounded-lg skeleton" />
      <div className="bg-white border border-[var(--border)] rounded-lg p-5 space-y-3">
        <div className="h-4 w-1/2 skeleton" />
        <div className="h-4 w-full skeleton" />
        <div className="h-4 w-3/4 skeleton" />
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data.data);
    } catch {
      setError("Laporan tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/reports/${id}/status`, { status: newStatus });
      await fetchReport();
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error) return <div className="p-8 text-center text-[var(--accent)] text-sm animate-rise-in">{error}</div>;
  if (!report) return <div className="p-8 text-center text-[var(--ink-soft)] text-sm">Laporan tidak ditemukan</div>;

  const categoryLabel = report.category === "Unclassified"
    ? "Belum Terklasifikasi"
    : (report.category || "—");

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div className="animate-rise-in">
        <Link
          to="/map"
          className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
        >
          ← Kembali ke peta
        </Link>
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)] mt-2">Detail Laporan</h1>
      </div>

      <img
        src={report.image_url}
        alt="Foto kerusakan"
        className="w-full rounded-lg object-cover max-h-80 border border-[var(--border)] animate-rise-in"
        style={{ animationDelay: "40ms" }}
      />

      <Card className="space-y-4" animate delay={80}>
        <div className="flex items-center justify-between">
          <StatusTag status={report.status} />
          <SeverityTag severity={report.severity} />
        </div>

        <p className="text-[var(--ink)] leading-relaxed">{report.description}</p>

        <dl className="grid grid-cols-2 gap-y-3 text-sm pt-4 border-t border-[var(--border)]">
          <div>
            <dt className="text-[var(--ink-soft)] text-xs uppercase tracking-wide mb-0.5">Kategori</dt>
            <dd className="text-[var(--ink)] font-medium">{categoryLabel}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)] text-xs uppercase tracking-wide mb-0.5">Keyakinan AI</dt>
            <dd className="text-[var(--ink)] font-medium">
              {report.ai_confidence ? `${(report.ai_confidence * 100).toFixed(0)}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)] text-xs uppercase tracking-wide mb-0.5">Skor Prioritas</dt>
            <dd className="text-[var(--ink)] font-medium">{report.priority_score ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)] text-xs uppercase tracking-wide mb-0.5">Dilaporkan</dt>
            <dd className="text-[var(--ink)] font-medium">{new Date(report.created_at).toLocaleDateString("id-ID")}</dd>
          </div>
        </dl>

        {report.is_duplicate && (
          <p className="text-sm pl-3 border-l-2" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
            Laporan ini kemungkinan duplikat dari laporan lain di lokasi yang sama
          </p>
        )}
      </Card>

      {report.history?.length > 0 && (
        <Card animate delay={120}>
          <h2 className="font-display font-semibold text-[var(--ink)] mb-4">Riwayat Status</h2>
          <ol className="space-y-4">
            {report.history.map((h, i) => (
              <li
                key={h.id}
                style={{ animationDelay: `${140 + i * 40}ms` }}
                className="pl-4 border-l-2 border-[var(--border)] animate-rise-in"
              >
                <p className="text-sm font-medium text-[var(--ink)]">
                  {STATUS_LABELS[h.previous_status] || "Dibuat"} → {STATUS_LABELS[h.current_status]}
                </p>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  {new Date(h.updated_at).toLocaleString("id-ID")}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {(user?.role === "admin" || user?.role === "maintenance") && (
        <Card animate delay={160}>
          <h2 className="font-display font-semibold text-[var(--ink)] mb-4">Ubah Status</h2>
          <div className="flex flex-wrap gap-2">
            {VALID_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={updating || report.status === s}
                className={`px-3 py-1.5 text-sm rounded-md border
                            transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                            active:scale-[0.96] active:duration-[var(--dur-instant)]
                            disabled:opacity-40 disabled:active:scale-100 ${
                              report.status === s
                                ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                                : "bg-white text-[var(--ink)] border-[var(--border)] hover:bg-[var(--brand-soft)]"
                            }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
