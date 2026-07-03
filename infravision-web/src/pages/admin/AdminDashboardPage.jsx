import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer
} from "recharts";
import api from "../../lib/axios";

// Palet selaras dengan token InfraVision (brand hijau + accent oranye)
// alih-alih warna generik Tailwind (blue/red/purple) yang tidak match tema.
const COLORS = ["#1A2E22", "#C2410C", "#0E7490", "#92400E", "#3F6212", "#9F1239"];

const SUMMARY_CARDS_CONFIG = [
  { key: "total_reports", label: "Total Laporan", color: "var(--ink)" },
  { key: "pending", label: "Pending", color: "var(--warning)" },
  { key: "completed", label: "Selesai", color: "var(--success)" },
  { key: "avg_response", label: "Rata-rata Respons", color: "var(--brand)" },
];

function CardSkeleton() {
  return (
    <div className="rounded-lg p-5 bg-white border border-[var(--border)] space-y-2">
      <div className="h-7 w-16 skeleton" />
      <div className="h-3 w-24 skeleton" />
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="h-8 w-56 skeleton" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }
  if (!summary) return null;

  const categoryData = summary.category_distribution || [];
  const severityData = Object.entries(summary.severity_distribution || {}).map(
    ([name, value]) => ({ name, value })
  );
  const trendData = summary.daily_trend || [];

  const cards = [
    { label: "Total Laporan", value: summary.total_reports },
    { label: "Pending", value: summary.status_distribution?.pending || 0 },
    { label: "Selesai", value: summary.status_distribution?.completed || 0 },
    {
      label: "Rata-rata Respons",
      value: summary.avg_response_time_hours
        ? `${summary.avg_response_time_hours.toFixed(1)} jam`
        : "—",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <h1 className="font-display text-2xl font-semibold text-[var(--ink)] animate-rise-in">
        Dashboard Admin
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(({ label, value }, i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * 50}ms` }}
            className="rounded-lg p-5 bg-white border border-[var(--border)] animate-rise-in
                       transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5"
          >
            <p className="text-2xl font-semibold text-[var(--ink)]">{value}</p>
            <p className="text-sm mt-1 text-[var(--ink-soft)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-[var(--border)] rounded-lg p-5 animate-rise-in" style={{ animationDelay: "200ms" }}>
          <h2 className="font-medium text-[var(--ink)] mb-3">Distribusi Kategori</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} animationDuration={500} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-5 animate-rise-in" style={{ animationDelay: "240ms" }}>
          <h2 className="font-medium text-[var(--ink)] mb-3">Distribusi Severity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
                animationDuration={500}
                animationEasing="ease-out"
              >
                {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-lg p-5 sm:col-span-2 animate-rise-in" style={{ animationDelay: "280ms" }}>
          <h2 className="font-medium text-[var(--ink)] mb-3">Trend 7 Hari Terakhir</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} animationDuration={600} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Pending */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden animate-rise-in" style={{ animationDelay: "320ms" }}>
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-medium text-[var(--ink)]">Laporan Pending ({pendingReports.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--paper)]">
              <tr>
                {["Kategori", "Severity", "Prioritas", "Tanggal", "Aksi"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[var(--ink-soft)] font-medium text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingReports.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--border)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--paper)]"
                >
                  <td className="px-4 py-3 text-[var(--ink)]">{r.category || "Unclassified"}</td>
                  <td className="px-4 py-3 capitalize text-[var(--ink)]">{r.severity || "—"}</td>
                  <td className="px-4 py-3 text-[var(--ink)]">{r.priority_score ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--ink-soft)]">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleVerify(r.id)}
                      className="px-3 py-1 bg-[var(--brand)] text-white text-xs rounded-md
                                 transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                                 hover:bg-[#13231A] active:scale-[0.95]"
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
