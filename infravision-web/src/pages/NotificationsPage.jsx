import { useEffect, useState } from "react";
import api from "../lib/axios";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
        const res = await api.get("/notifications");
        // Cek apakah balikan API adalah array murni, atau object yang punya properti 'items'
        const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        setNotifications(data);
    } catch {
        setNotifications([]);
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch {}
  };

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n) => !n.is_read).length 
    : 0;

  if (loading) return <div className="p-8 text-center text-gray-400">Memuat notifikasi...</div>;

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Notifikasi {unreadCount > 0 && <span className="text-sm bg-primary text-white rounded-full px-2 py-0.5 ml-1">{unreadCount}</span>}
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-400 py-10">Belum ada notifikasi</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                n.is_read ? "bg-white text-gray-500" : "bg-blue-50 border-blue-200"
              }`}
            >
              <p className={`text-sm ${n.is_read ? "" : "font-medium text-gray-800"}`}>
                {n.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}