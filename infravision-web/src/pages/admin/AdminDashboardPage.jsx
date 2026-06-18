import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "../../lib/axios";

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6", "#6b7280"];

export default function AdminDashboardPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports?page_size=500")
      .then((res) => setReports(res.data.items || []))
      .finally(() => setLoading(false));
  }, []);

  const total = reports.length;
  const aktif = reports.filter((r) => ["pending","in_progress","assigned","verified"].includes(r.status)).length;
  const selesai = reports.filter((r) => r.status === "completed").length;
  const pending = reports.filter((r) => r.status === "pending");

  // Data untuk chart
  const categoryCount = reports.reduce((acc, r) => {
    acc[r.category || "Lainnya"] = (acc[r.category || "Lainnya"] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  const severityCount = reports.reduce((acc, r) => {
    acc[r.severity || "unknown"] = (acc[r.severity || "unknown"] || 0) + 1;
    return acc;
  }, {});
  const severityData = Object.entries(severityCount).map(([name, value]) => ({ name, value }));

  const handleVerify = async (id) => {
    await api.put(`/reports/${id}/status`, { status: "verified" });
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "verified" } : r));
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Memuat dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Admin</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Laporan", value: total, color: "bg-blue-50 text-blue-700" },
          { label: "Laporan Aktif", value: aktif, color: "bg-yellow-50 text-yellow-700" },
          { label: "Selesai", value: selesai, color: "bg-green-50 text-green-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-5 ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
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
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
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
      </div>

      {/* Tabel Pending */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Laporan Pending ({pending.length})</h2>
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
              {pending.slice(0, 20).map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{r.category || "—"}</td>
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