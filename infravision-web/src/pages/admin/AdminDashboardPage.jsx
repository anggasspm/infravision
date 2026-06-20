import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer
} from "recharts";
import api from "../../lib/axios";

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6", "#6b7280"];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/reports?status=pending&page_size=20"),
    ]).then(([summaryRes, reportsRes]) => {
      setSummary(summaryRes.data.data);
      setPendingReports(reportsRes.data.data.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id) => {
    await api.post(`/admin/verify/${id}`);
    setPendingReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Memuat dashboard...</div>;
  if (!summary) return null;

  const categoryData = summary.category_distribution || [];
  const severityData = Object.entries(summary.severity_distribution || {}).map(
    ([name, value]) => ({ name, value })
  );
  const trendData = summary.daily_trend || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Laporan", value: summary.total_reports, color: "bg-blue-50 text-blue-700" },
          { label: "Pending", value: summary.status_distribution?.pending || 0, color: "bg-yellow-50 text-yellow-700" },
          { label: "Selesai", value: summary.status_distribution?.completed || 0, color: "bg-green-50 text-green-700" },
          {
            label: "Rata-rata Respons",
            value: summary.avg_response_time_hours
              ? `${summary.avg_response_time_hours.toFixed(1)} jam`
              : "—",
            color: "bg-purple-50 text-purple-700"
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-5 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Distribusi Kategori</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Distribusi Severity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-xl p-5 sm:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Trend 7 Hari Terakhir</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Pending */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Laporan Pending ({pendingReports.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Kategori","Severity","Prioritas","Tanggal","Aksi"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingReports.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{r.category || "Unclassified"}</td>
                  <td className="px-4 py-3 capitalize">{r.severity || "—"}</td>
                  <td className="px-4 py-3">{r.priority_score ?? "—"}</td>
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleVerify(r.id)}
                      className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-blue-600"
                    >
                      Verifikasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}