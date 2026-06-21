import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

const CLOUD_NAME    = "djzh35nga";
const UPLOAD_PRESET = "infravision_uploads";

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [gpsStatus, setGpsStatus]     = useState("idle");
  const [coords, setCoords]           = useState({ latitude: null, longitude: null });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

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
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
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
    if (!imageFile)          { setError("Foto wajib diupload"); return; }
    if (!coords.latitude)    { setError("Lokasi GPS belum diambil"); return; }
    if (!description.trim()) { setError("Deskripsi wajib diisi"); return; }

    setLoading(true);
    try {
      const image_url = await uploadToCloudinary(imageFile);
      const res = await api.post("/reports", {
        description,
        image_url,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      navigate(`/report/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || "Gagal mengirim laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--paper)] min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Buat Laporan Baru</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1.5">
            Foto akan dianalisis otomatis untuk menentukan kategori dan prioritas.
          </p>
        </div>

        {error && (
          <div className="mb-6 pl-3 py-2 border-l-2 text-sm flex items-start gap-2" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Upload Foto */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-3">
              Foto Kerusakan
              <span className="text-[var(--accent)] ml-1">*</span>
            </label>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-52 object-cover rounded-md border border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--accent)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[var(--border)] rounded-md cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--ink-soft)] mb-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-sm text-[var(--ink-soft)]">Klik untuk pilih foto</p>
                <p className="text-xs text-[var(--ink-soft)] mt-1 opacity-70">JPG, PNG hingga 10MB</p>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Deskripsi */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-3">
              Deskripsi
              <span className="text-[var(--accent)] ml-1">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-[var(--border)] rounded-md px-4 py-3 text-sm text-[var(--ink)] placeholder-[var(--ink-soft)] focus:outline-none focus:border-[var(--brand)] transition resize-none"
              placeholder="Jelaskan kondisi kerusakan yang kamu temukan..."
              required
            />
          </div>

          {/* GPS */}
          <div className="bg-white rounded-lg border border-[var(--border)] p-5">
            <label className="block text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide mb-3">
              Lokasi
              <span className="text-[var(--accent)] ml-1">*</span>
            </label>
            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsStatus === "loading"}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors border ${
                gpsStatus === "success"
                  ? "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/5"
                  : "border-[var(--border)] text-[var(--ink)] bg-white hover:bg-[var(--brand-soft)]"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {gpsStatus === "loading" && "Mengambil lokasi..."}
              {gpsStatus === "success" && `${coords.latitude?.toFixed(5)}, ${coords.longitude?.toFixed(5)}`}
              {gpsStatus === "idle"    && "Ambil Lokasi Sekarang"}
              {gpsStatus === "error"   && "Coba Lagi"}
            </button>
            {gpsStatus === "error" && (
              <p className="mt-2 text-xs text-[var(--accent)]">Gagal mengambil lokasi. Pastikan GPS aktif.</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand)] hover:bg-[#13231A] text-white py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <line x1="12" y1="2" x2="12" y2="6"/>
                  <line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="2" y1="12" x2="6" y2="12"/>
                  <line x1="18" y1="12" x2="22" y2="12"/>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                </svg>
                Mengirim laporan...
              </>
            ) : "Kirim Laporan"}
          </button>
        </form>
      </div>
    </div>
  );
}