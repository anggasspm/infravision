import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import InfoIcon from "../components/icons/InfoIcon";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.includes("@")) { setError("Format email tidak valid"); return; }
    if (form.password.length < 6) { setError("Password minimal 6 karakter"); return; }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      const { access_token, refresh_token, user } = res.data.data;
      login(user, { access_token, refresh_token });
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "maintenance") navigate("/maintenance");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8 animate-rise-in">
          <div className="w-12 h-12 bg-[var(--brand)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Masuk ke InfraVision</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Selamat datang kembali</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-[var(--border)] p-6 animate-rise-in" style={{ animationDelay: "60ms" }}>
          {error && (
            <div
              key={error}
              className="mb-5 pl-3 py-2 border-l-2 text-sm flex items-center gap-2 animate-status-update"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              <InfoIcon width="14" height="14" className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-[var(--border)] rounded-md px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-soft)]
                           transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                           focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
                placeholder="email@contoh.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-[var(--border)] rounded-md px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-soft)] pr-10
                             transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                             focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]
                             transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]"
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] text-white py-2.5 rounded-md text-sm font-medium mt-2
                         transition-[transform,background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                         hover:bg-[#13231A] hover:shadow-[0_2px_8px_rgba(26,46,34,0.25)]
                         active:scale-[0.98] active:duration-[var(--dur-instant)]
                         disabled:opacity-40 disabled:active:scale-100"
            >
              {loading ? "Memuat..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-center text-[var(--ink-soft)] animate-rise-in" style={{ animationDelay: "120ms" }}>
          Belum punya akun?{" "}
          <Link to="/register" className="text-[var(--brand)] font-medium hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
