import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TYPES = [
  { key: "bug",        label: "🐛 Bug Report",      color: "bg-red-500/20 text-red-400 border-red-500/30",     active: "bg-red-500 text-white" },
  { key: "feature",    label: "✨ Feature Request",  color: "bg-violet-500/20 text-violet-400 border-violet-500/30", active: "bg-violet-500 text-white" },
  { key: "suggestion", label: "💡 Suggestion",       color: "bg-amber-500/20 text-amber-400 border-amber-500/30",  active: "bg-amber-500 text-white" },
  { key: "other",      label: "📝 Other",            color: "bg-zinc-700/50 text-zinc-400 border-zinc-700",     active: "bg-zinc-600 text-white" },
];

export default function Feedback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType]         = useState("bug");
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both fields"); return;
    }
    try {
      setLoading(true);
      await api.post("/api/feedback", { type, title, description });
      setSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally { setLoading(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-4">Login Required</h2>
        <button onClick={() => navigate("/login")} className="w-full bg-violet-500 text-white py-3 rounded-xl font-bold">Login →</button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
          🎉
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Thanks!</h2>
        <p className="text-zinc-400 text-sm mb-6">Your feedback has been sent to the admin. We appreciate you helping make NetworkUp better!</p>
        <div className="flex gap-3">
          <button onClick={() => { setSubmitted(false); setTitle(""); setDesc(""); setType("bug"); }}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-sm transition-all">
            Send More
          </button>
          <button onClick={() => navigate("/")}
            className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-3 rounded-xl font-bold text-sm transition-all">
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 bg-zinc-800 hover:bg-violet-500 text-white rounded-xl flex items-center justify-center font-bold text-lg transition-all flex-shrink-0">
            ‹
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Feedback</h1>
            <p className="text-zinc-500 text-xs">Help us improve NetworkUp</p>
          </div>
        </div>

        {/* Hero */}
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a0d2e 0%, #0d1a2e 100%)", border: "1px solid #3b1f6a" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", transform: "translate(30%,-30%)" }} />
          <p className="text-4xl mb-3">💬</p>
          <h2 className="text-white font-black text-lg mb-1">We're listening</h2>
          <p className="text-zinc-400 text-sm">Found a bug? Have an idea? We want to hear it. Your feedback goes directly to the admin.</p>
        </div>

        {/* Type selector */}
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3 font-semibold">Type of Feedback</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                type === t.key ? t.active + " border-transparent" : t.color
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-semibold">Title</p>
            <input
              placeholder={
                type === "bug" ? "e.g. Timetable not loading on Android..."
                : type === "feature" ? "e.g. Dark mode for resources page..."
                : type === "suggestion" ? "e.g. Add a study group feature..."
                : "e.g. Question about the app..."
              }
              value={title}
              onChange={e => { setTitle(e.target.value); setError(""); }}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-semibold">Details</p>
            <textarea
              placeholder={
                type === "bug"
                  ? "Describe what happened, what you expected, and steps to reproduce..."
                  : type === "feature"
                  ? "Describe the feature and why it would be useful..."
                  : "Share your thoughts in detail..."
              }
              rows={5}
              value={description}
              onChange={e => { setDesc(e.target.value); setError(""); }}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 resize-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white py-4 rounded-xl font-black text-sm transition-all active:scale-[0.98]">
            {loading ? "Sending..." : "Send Feedback 🚀"}
          </button>
        </form>

        {/* From */}
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0">
            {user.name?.charAt(0)}
          </div>
          <div>
            <p className="text-zinc-400 text-xs">Submitting as</p>
            <p className="text-white text-sm font-semibold">{user.name}</p>
          </div>
          <span className="ml-auto text-zinc-600 text-xs">Anonymous option coming soon</span>
        </div>

      </div>
    </div>
  );
}