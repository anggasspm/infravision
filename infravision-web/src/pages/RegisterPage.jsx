import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import InfoIcon from "../components/icons/InfoIcon";

const FIELDS = [
  { label: "Nama Lengkap", key: "name", type: "text", placeholder: "Nama kamu" },
  { label: "Email", key: "email", type: "email", placeholder: "email@contoh.com" },
  { label: "Password", key: "password", type: "password", placeholder: "Min. 6 karakter" },
  { label: "Konfirmasi Password", key: "confirm", type: "password", placeholder: "Ulangi password" },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Password dan konfirmasi password tidak sama");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      const { access_token, refresh_token, user } = res.data.data;
      login(user, { access_token, refresh_token });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8 animate-rise-in">
          <div className="w-12 h-12 bg-[var(--brand)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Daftar Akun</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Mulai laporkan kerusakan di sekitarmu</p>
        </div>

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
            {FIELDS.map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-[var(--border)] rounded-md px-4 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-soft)]
                             transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                             focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-soft)]"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand)] text-white py-2.5 rounded-md text-sm font-medium mt-2
                         transition-[transform,background-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
                         hover:bg-[#13231A] hover:shadow-[0_2px_8px_rgba(26,46,34,0.25)]
                         active:scale-[0.98] active:duration-[var(--dur-instant)]
                         disabled:opacity-40 disabled:active:scale-100"
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-sm text-center text-[var(--ink-soft)] animate-rise-in" style={{ animationDelay: "120ms" }}>
          Sudah punya akun?{" "}
          <Link to="/login" className="text-[var(--brand)] font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
