import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/chat/conversations");
        setConversations(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.other?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-full hover:bg-gray-100"
          >
            <img src="/images/back.svg" alt="Back" className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800 flex-1">Messages</span>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto px-4 pb-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">
              {search ? "No conversations found" : "No messages yet"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/connections")}
                className="mt-3 px-4 py-2 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                Find people to message
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((convo) => {
              const letter = convo.other?.name?.charAt(0).toUpperCase() || "?";
              return (
                <button
                  key={convo.conversationId}
                  onClick={() => navigate(`/chat/${convo.other._id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {convo.other?.profileImage ? (
                      <img
                        src={convo.other.profileImage}
                        alt={convo.other.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white text-base font-semibold">{letter}</span>
                      </div>
                    )}
                    {/* Unread dot */}
                    {convo.unread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${convo.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                        {convo.other?.name}
                      </p>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {timeAgo(convo.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${convo.unread ? "font-medium text-gray-700" : "text-gray-400"}`}>
                      {convo.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}