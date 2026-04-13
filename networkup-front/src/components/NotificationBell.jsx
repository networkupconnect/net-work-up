import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
      setUnread(res.data.filter(n => !n.read).length);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications(p => p.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const handleClick = async (n) => {
    try { await api.patch(`/api/notifications/${n._id}/read`); } catch {}
    setNotifications(p => p.map(x => x._id === n._id ? { ...x, read: true } : x));
    setUnread(p => Math.max(0, p - 1));
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(p => p.filter(n => n._id !== id));
    } catch {}
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button onClick={() => { setOpen(p => !p); if (!open) markAllRead(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-800">Notifications</p>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all border-b border-gray-50 ${
                    !n.read ? "bg-blue-50" : ""
                  }`}>
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {n.type === "order" ? "🛒" : n.type === "message" ? "💬" : "📢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button onClick={(e) => deleteNotification(e, n._id)}
                    className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0 mt-1">✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}