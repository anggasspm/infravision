import { useEffect, useState } from "react";
import api from "../lib/axios";

function NotificationSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-white space-y-2">
      <div className="h-4 w-4/5 skeleton" />
      <div className="h-3 w-1/4 skeleton" />
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      // Cek apakah balikan API adalah array murni, atau object yang punya properti 'items'
      const data = res.data.data?.items || [];
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
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6 animate-rise-in">
        <h1 className="font-display text-2xl font-semibold text-[var(--ink)] flex items-center gap-2">
          Notifikasi
          {unreadCount > 0 && (
            <span
              key={unreadCount}
              className="text-xs font-semibold bg-[var(--brand)] text-white rounded-full px-2 py-0.5 animate-status-update"
            >
              {unreadCount}
            </span>
          )}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-[var(--ink-soft)] text-sm py-16 animate-rise-in">
          Belum ada notifikasi
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className={`p-4 rounded-lg border cursor-pointer animate-rise-in
                          transition-[background-color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-out)]
                          hover:-translate-y-0.5 ${
                            n.is_read
                              ? "bg-white border-[var(--border)] text-[var(--ink-soft)]"
                              : "bg-[var(--brand-soft)] border-[var(--brand)]/30"
                          }`}
            >
              <p className={`text-sm ${n.is_read ? "" : "font-medium text-[var(--ink)]"}`}>
                {n.message}
              </p>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {new Date(n.created_at).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
