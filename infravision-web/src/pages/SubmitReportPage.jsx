import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
 
const CATEGORIES = [
  "Jalan Berlubang",
  "Retak Jalan/Bangunan",
  "Lampu Jalan Rusak",
  "Saluran Air Tersumbat",
  "Trotoar Rusak",
  "Lainnya",
];

const CLOUD_NAME = "ISI_CLOUD_NAME_DARI_ORANG3";
const UPLOAD_PRESET = "ISI_UPLOAD_PRESET_DARI_ORANG3";

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    description: "",
    category: "",
    latitude: null,
    longitude: null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | success | error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const captureGPS = () => {
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setGpsStatus("success");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );
    const json = await res.json();
    if (!json.secure_url) throw new Error("Upload gambar gagal");
    return json.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!imageFile) { setError("Foto wajib diupload"); return; }
    if (!form.latitude) { setError("Lokasi GPS belum diambil"); return; }
    if (!form.description.trim()) { setError("Deskripsi wajib diisi"); return; }

    setLoading(true);
    try {
      const image_url = await uploadToCloudinary(imageFile);
      const res = await api.post("/reports", {
        description: form.description,
        image_url,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      navigate(`/report/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Gagal mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Buat Laporan Baru</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Upload Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto Kerusakan</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 rounded-lg w-full max-h-52 object-cover border"
            />
          )}
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Jelaskan kondisi kerusakan..."
            required
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Pilih Kategori --</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* GPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi GPS</label>
          <button
            type="button"
            onClick={captureGPS}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
          >
            {gpsStatus === "loading" ? "Mengambil lokasi..." : "📍 Ambil Lokasi Sekarang"}
          </button>
          {gpsStatus === "success" && (
            <p className="mt-1 text-xs text-success">
              ✓ {form.latitude?.toFixed(6)}, {form.longitude?.toFixed(6)}
            </p>
          )}
          {gpsStatus === "error" && (
            <p className="mt-1 text-xs text-danger">Gagal mendapatkan lokasi. Aktifkan GPS.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim Laporan"}
        </button>
      </form>
    </div>
  );
}