import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
 
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
      setReport(res.data);
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

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Detail Laporan</h1>

      {/* Foto */}
      <img
        src={report.image_url}
        alt="Foto kerusakan"
        className="w-full rounded-xl object-cover max-h-72 border"
      />

      {/* Info */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${SEVERITY_COLORS[report.severity] || "bg-gray-100 text-gray-600"}`}>
            {report.severity?.toUpperCase() || "—"}
          </span>
          <span className="text-sm text-gray-500">{STATUS_LABELS[report.status] || report.status}</span>
        </div>

        <p className="text-gray-700">{report.description}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
          <div>Kategori: <span className="text-gray-800 font-medium">{report.category || "—"}</span></div>
          <div>AI Confidence: <span className="text-gray-800 font-medium">{report.ai_confidence ? `${(report.ai_confidence * 100).toFixed(1)}%` : "—"}</span></div>
          <div>Priority Score: <span className="text-gray-800 font-medium">{report.priority_score ?? "—"}</span></div>
          <div>Koordinat: <span className="text-gray-800 font-medium">{report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}</span></div>
          <div>Dibuat: <span className="text-gray-800 font-medium">{new Date(report.created_at).toLocaleDateString("id-ID")}</span></div>
          {report.is_duplicate && <div className="col-span-2 text-yellow-600 font-medium">⚠ Laporan ini terdeteksi duplikat</div>}
        </div>
      </div>

      {/* Status Timeline */}
      {report.history?.length > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Riwayat Status</h2>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {report.history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary"></div>
                <p className="text-sm font-medium text-gray-800">
                  {STATUS_LABELS[h.previous_status] || h.previous_status || "—"} → {STATUS_LABELS[h.current_status] || h.current_status}
                </p>
                <p className="text-xs text-gray-400">{new Date(h.updated_at).toLocaleString("id-ID")}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Update Status (admin & maintenance) */}
      {(user?.role === "admin" || user?.role === "maintenance") && (
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {VALID_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={updating || report.status === s}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  report.status === s
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } disabled:opacity-50`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}