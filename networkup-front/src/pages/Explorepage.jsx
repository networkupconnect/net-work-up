import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EXPLORE_LINKS = [
  { name: "Attendance",  path: "/attendance",  icon: "📋",  desc: "Bunk Safe" },
  
  { name: "Rooms",        path: "/rooms",       icon: "🏠", desc: "Find PGs & roommates" },
  { name: "Internships",  path: "/Internships", icon: "💼", desc: "Browse opportunities"  },
  { name: "Chat",         path: "/messages",    icon: "💬", desc: "Message classmates"    },
  { name: "Confessions",  path: "/confessions", icon: "🤫", desc: "Anonymous board"       },
  { name: "Course", path: "/course",   icon: "📚", desc: "Explore courses"   },
  { name: "PYQS & Notes", path: "/resources",   icon: "📚", desc: "Study resources",      authType: "profile" },
  { name: "Assignments",  path: "/assignments", icon: "📝", desc: "Track deadlines",       authType: "profile" },
  { name: "Feedback",     path: "/feedback",    icon: "📣", desc: "Share thoughts",        authType: "login"   },
  { name: "Seller Dashboard", path: "/seller",  icon: "🛒", desc: "Manage your shop",     role: ["seller", "admin"] },
  { name: "Admin Dashboard",  path: "/admin",   icon: "⚙️", desc: "Platform controls",   role: ["admin"] },

];

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const visible = EXPLORE_LINKS.filter(link => {
    if (link.role) return user && link.role.includes(user.role);
    return true;
  });

  const [toast, setToast] = React.useState(null);

  const handleClick = (link) => {
    if (link.authType === "login" && !user) {
      setToast("🔐 Please login first to access this feature");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (link.authType === "profile") {
      if (!user) {
        setToast(" Please setup your profile first — add Branch, Year & Section");
        setTimeout(() => setToast(null), 3000);
        return;
      }
      if (!user.branch || !user.year || !user.section) {
        setToast(" Please setup your profile first — add Branch, Year & Section");
        setTimeout(() => setToast(null), 3000);
        return;
      }
    }
    navigate(link.path);
  };

  return (
    <div className="min-h-full bg-white px-4 pt-6 pb-24 sm:pb-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 max-w-xs text-center">
          {toast}
        </div>
      )}

      <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-5 px-1">
        Explore
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((link) => (
          <button
            key={link.name}
            onClick={() => handleClick(link)}
            className="group flex flex-col items-start gap-2 bg-gray-100 hover:bg-gray-200 rounded-2xl p-4 text-left transition-colors duration-150 active:scale-95"
          >
            <span className="text-2xl leading-none">{link.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {link.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">
                {link.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}