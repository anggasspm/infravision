import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import StatusTag from "../components/StatusTag";
import SeverityTag from "../components/SeverityTag";
import Card from "../components/Card";
import { Link } from "react-router-dom";
 
const SEVERITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  pending: "Menunggu",
  verified: "Diverifikasi",
  assigned: "Ditugaskan",
  in_progress: "Dalam Proses",
  under_repair: "Sedang Diperbaiki",
  completed: "Selesai",
};

const VALID_STATUSES = ["pending", "verified", "assigned", "in_progress", "under_repair", "completed"];

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

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!report) return <div className="p-8 text-center text-gray-500">Laporan tidak ditemukan</div>;

  const categoryLabel = report.category === "Unclassified"
    ? "Belum Terklasifikasi"
    : (report.category || "—");

  const categoryStyle = report.category === "Unclassified"
    ? "bg-gray-100 text-gray-500"
    : "bg-blue-100 text-blue-700";

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
      <div>
        <Link to="/map" className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">← Kembali ke peta</Link>
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)] mt-2">Detail Laporan</h1>
      </div>

      <img
        src={report.image_url}
        alt="Foto kerusakan"
        className="w-full rounded-lg object-cover max-h-80 border border-[var(--border)]"
      />

      <Card className="space-y-4">
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
        <Card>
          <h2 className="font-display font-semibold text-[var(--ink)] mb-4">Riwayat Status</h2>
          <ol className="space-y-4">
            {report.history.map((h) => (
              <li key={h.id} className="pl-4 border-l-2 border-[var(--border)]">
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
        <Card>
          <h2 className="font-display font-semibold text-[var(--ink)] mb-4">Ubah Status</h2>
          <div className="flex flex-wrap gap-2">
            {VALID_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={updating || report.status === s}
                className={`px-3 py-1.5 text-sm rounded-md border transition ${
                  report.status === s
                    ? "bg-[var(--brand)] text-white border-[var(--brand)]"
                    : "bg-white text-[var(--ink)] border-[var(--border)] hover:bg-[var(--brand-soft)]"
                } disabled:opacity-40`}
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