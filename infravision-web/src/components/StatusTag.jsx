const STATUS_CONFIG = {
  pending:      { label: "Menunggu",          color: "#92400E" },
  verified:     { label: "Diverifikasi",      color: "#1A2E22" },
  assigned:     { label: "Ditugaskan",        color: "#1A2E22" },
  in_progress:  { label: "Dalam Proses",      color: "#0E7490" },
  under_repair: { label: "Sedang Diperbaiki", color: "#0E7490" },
  completed:    { label: "Selesai",           color: "#3F6212" },
};

export default function StatusTag({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#52606D" };
  return (
    <span
      // key={status} memaksa React remount elemen ini saat status berubah,
      // sehingga animasi @keyframes status-update re-trigger setiap kali
      // laporan pindah status (mis. pending -> verified).
      key={status}
      className="inline-flex items-center gap-2 pl-3 text-sm font-medium animate-status-update"
      style={{ borderLeft: `3px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}
