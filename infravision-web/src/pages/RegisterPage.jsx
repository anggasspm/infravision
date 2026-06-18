import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";

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
      const { access_token, refresh_token, user } = res.data;
      login(user, { access_token, refresh_token });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Daftar Akun</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nama Lengkap", key: "name", type: "text", placeholder: "Nama kamu" },
            { label: "Email", key: "email", type: "email", placeholder: "email@contoh.com" },
            { label: "Password", key: "password", type: "password", placeholder: "Min. 6 karakter" },
            { label: "Konfirmasi Password", key: "confirm", type: "password", placeholder: "Ulangi password" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={placeholder}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-primary font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}