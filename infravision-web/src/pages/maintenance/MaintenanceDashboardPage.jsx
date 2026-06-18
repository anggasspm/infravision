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

export default function MaintenanceDashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    api.get("/reports?status=assigned&page_size=100")
      .then((res) => setReports(res.data.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    await api.put(`/reports/${id}/status`, { status: newStatus });
    fetchReports();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Memuat tugas...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Maintenance</h1>

      {reports.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Tidak ada tugas aktif</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-5">
              <div className="flex gap-4">
                <img
                  src={r.image_url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-gray-800">{r.category || "—"}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-gray-400">
                    Status: <span className="font-medium text-gray-700">{STATUS_LABELS[r.status] || r.status}</span>
                    {" · "}Severity: <span className="font-medium capitalize">{r.severity}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                <Link
                  to={`/report/${r.id}`}
                  className="px-3 py-1 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Lihat Detail
                </Link>
                {NEXT_STATUS[r.status] && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, NEXT_STATUS[r.status])}
                    className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-blue-600"
                  >
                    Tandai: {STATUS_LABELS[NEXT_STATUS[r.status]]}
                  </button>
                )}
                {r.status === "under_repair" && (
                  <button
                    onClick={() => handleUpdateStatus(r.id, "completed")}
                    className="px-3 py-1 text-sm bg-success text-white rounded-lg hover:bg-green-600"
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