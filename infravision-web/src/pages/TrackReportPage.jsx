import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../lib/axios";
import InfoIcon from "../components/icons/InfoIcon";
import SpinnerIcon from "../components/icons/SpinnerIcon";
import SeverityTag from "../components/SeverityTag";
import StatusTag from "../components/StatusTag";

const STATUS_ORDER = ["pending", "verified", "assigned", "in_progress", "under_repair", "completed"];

export default function TrackReportPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async (trackingCode) => {
    const clean = trackingCode.trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api.get(`/reports/track/${encodeURIComponent(clean)}`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Kode lacak tidak ditemukan");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    const initial = searchParams.get("code");
    if (initial) lookup(initial);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    lookup(code);
  };

  const currentStepIndex = result ? STATUS_ORDER.indexOf(result.status) : -1;

  return (
    <div className="bg-[var(--paper)] min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-8 animate-rise-in">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Lacak Laporan</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1.5">
            Masukkan kode lacak yang kamu dapat saat mengirim laporan tanpa akun.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8 animate-rise-in" style={{ animationDelay: "40ms" }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="INV-XXXXXX"
            className="flex-1 border border-[var(--border)] rounded-md px-4 py-2.5 text-sm text-[var(--ink)]
                       tracking-wide placeholder-[var(--ink-soft)]
                       transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                       focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-5 py-2.5 rounded-md bg-[var(--brand)] text-white text-sm font-medium shrink-0
                       flex items-center gap-2
                       transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                       hover:bg-[#13231A] active:scale-[0.97]
                       disabled:opacity-40 disabled:active:scale-100"
          >
            {loading && <SpinnerIcon />}
            Cari
          </button>
        </form>

        {error && (
          <div
            key={error}
            className="mb-6 pl-3 py-2 border-l-2 text-sm flex items-start gap-2 animate-status-update"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            <InfoIcon width="14" height="14" className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 animate-rise-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--ink-soft)] uppercase tracking-wide mb-1">Kode Lacak</p>
                <p className="font-display text-lg font-semibold text-[var(--ink)] tracking-wide">
                  {result.tracking_code}
                </p>
              </div>
              {result.severity && <SeverityTag severity={result.severity} />}
            </div>

            <p className="text-sm text-[var(--ink-soft)] mb-5">
              {result.category || "Kategori belum ditentukan"} · dilaporkan{" "}
              {new Date(result.created_at).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>

            {/* Progres status sebagai langkah, bukan cuma label — supaya
                pelapor tanpa akun tetap terasa "diurus", bukan cuma dikasih
                satu kata status yang abstrak. */}
            <div className="space-y-3 mb-5">
              {STATUS_ORDER.map((step, i) => {
                const done = i <= currentStepIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: done ? "var(--brand)" : "var(--border)" }}
                    />
                    <StatusTag status={step} />
                    {i === currentStepIndex && (
                      <span className="text-xs text-[var(--ink-soft)] ml-auto">— saat ini</span>
                    )}
                  </div>
                );
              })}
            </div>

            {result.is_duplicate && (
              <p className="text-xs text-[var(--warning)] pl-3 border-l-2" style={{ borderColor: "var(--warning)" }}>
                Laporan ini terdeteksi mirip dengan laporan lain di lokasi yang sama.
              </p>
            )}
          </div>
        )}

        {searched && !result && !error && !loading && (
          <p className="text-sm text-[var(--ink-soft)]">Tidak ada hasil.</p>
        )}

        <p className="mt-8 text-sm text-center text-[var(--ink-soft)]">
          Belum pernah lapor?{" "}
          <Link to="/submit" className="text-[var(--brand)] font-medium hover:underline">
            Buat laporan baru
          </Link>
        </p>
      </div>
    </div>
  );
}