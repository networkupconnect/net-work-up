import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

// ─── Branch normalization ─────────────────────────────────────────────────────
// Maps old short-codes / alternate spellings → canonical names from new onboarding.
const BRANCH_ALIAS = {
  // Mechanical
  "ME": "Mechanical Engg",
  "Mech": "Mechanical Engg",
  "Mechanical": "Mechanical Engg",
  "Mechanical Engineering": "Mechanical Engg",
  // Civil
  "CE": "Civil Engg",
  "Civil": "Civil Engg",
  "Civil Engineering": "Civil Engg",
  // Electrical
  "EE": "Electrical Engg",
  "Electrical": "Electrical Engg",
  "Electrical Engineering": "Electrical Engg",
  // ECE
  "ECE": "Electronics & Communication Engg",
  "E&C": "Electronics & Communication Engg",
  "Electronics": "Electronics & Communication Engg",
  "Electronics and Communication": "Electronics & Communication Engg",
  "Electronics & Communication Engineering": "Electronics & Communication Engg",
  // CS / CSE
  "CSE": "Computer Engg",
  "CS": "Computer Engg",
  "Computer Science": "Computer Engg",
  "Computer Science Engineering": "Computer Engg",
  "Computer Science and Engineering": "Computer Engg",
  // IT
  "IT": "Information Technology",
  "Info Tech": "Information Technology",
  // VLSI
  "VLSI": "Electronics (VLSI) SF",
  // Data Science
  "DS": "CS (Data Sciences) SF",
  // Robotics / AI
  "Robotics": "Robotics & AI SF",
  "AI": "Robotics & AI SF",
  // Electrical & Computer
  "E&CE": "Electrical & Computer Engg SF",
  // Applications
  "MCA": "Computer Applications",
  "BCA": "Computer Applications",
};

const normalizeBranch = (branch) => {
  if (!branch) return null;
  const t = branch.trim();
  return BRANCH_ALIAS[t] ?? t;
};

// Short display labels for pills and section headers
const BRANCH_SHORT = {
  "Mechanical Engg":                    "ME",
  "Civil Engg":                         "CE",
  "Civil Engg (Construction Tech) SF":  "CE (CT)",
  "Electrical Engg":                    "EE",
  "Electrical & Computer Engg SF":      "E&CE",
  "Electronics & Communication Engg":   "ECE",
  "Electronics (VLSI) SF":              "VLSI",
  "Computer Engg":                      "CSE",
  "CS (Data Sciences) SF":              "CS-DS",
  "Robotics & AI SF":                   "RAI",
  "Information Technology":             "IT",
  "Computer Applications":              "CA",
  "Computer Science":                   "CS",
  "Data Science":                       "DS",
};
const shortBranch = (canonical) => BRANCH_SHORT[canonical] ?? canonical;

// ─── StudentCard — compact 3-col card with connect action ─────────────────────
function StudentCard({ student, currentUser, onConnect, onCancel }) {
  const navigate = useNavigate();
  const [acting, setActing] = useState(false);

  const getRelation = () => {
    if (!currentUser) return null;
    const id = student._id.toString();
    if ((currentUser.connections     || []).map(String).includes(id)) return "connected";
    if ((currentUser.sentRequests    || []).map(String).includes(id)) return "requested";
    if ((currentUser.pendingRequests || []).map(String).includes(id)) return "pending";
    return null;
  };

  const relation = getRelation();
  const letter   = student.name?.charAt(0).toUpperCase() || "?";

  const handleConnect = async (e) => {
    e.stopPropagation();
    if (acting || relation) return;
    setActing(true);
    try { await onConnect(student._id); }
    catch { /* ignore */ }
    finally { setActing(false); }
  };

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (acting) return;
    setActing(true);
    try { await onCancel(student._id); }
    catch { /* ignore */ }
    finally { setActing(false); }
  };

  return (
    <div
      onClick={() => navigate(`/user/${student._id}`)}
      className="sc-card"
    >
      {/* Avatar */}
      <div className="sc-avatar-wrap">
        {student.profileImage
          ? <img src={student.profileImage} alt={student.username} className="sc-avatar-img" />
          : <div className="sc-avatar-fallback">{letter}</div>}
        {relation === "pending" && <span className="sc-ping" />}
      </div>

      {/* Username only */}
      <p className="sc-handle sc-handle-solo">
        {student.username ? `@${student.username}` : student.name}
      </p>

      {/* Action button */}
      {relation === "connected" ? (
        <span className="sc-btn sc-btn-connected">connected</span>
      ) : relation === "requested" ? (
        <button onClick={handleCancel} disabled={acting} className="sc-btn sc-btn-requested">
          {acting ? "…" : "sent"}
        </button>
      ) : relation === "pending" ? (
        <span className="sc-btn sc-btn-pending">respond</span>
      ) : (
        <button onClick={handleConnect} disabled={acting} className="sc-btn sc-btn-connect">
          {acting ? "…" : "connect"}
        </button>
      )}
    </div>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
function RequestCard({ requester, onAccept, onDecline }) {
  const navigate = useNavigate();
  const [acting, setActing] = useState(null);
  const letter = requester.name?.charAt(0).toUpperCase() || "?";

  const handle = async (type, fn) => {
    try { setActing(type); await fn(); }
    catch (err) { console.error(err); setActing(null); }
  };

  return (
    <div className="rc-card">
      <div className="rc-avatar-wrap" onClick={() => navigate(`/user/${requester._id}`)}>
        {requester.profileImage
          ? <img src={requester.profileImage} alt={requester.name} className="rc-avatar-img" />
          : <div className="rc-avatar-fallback">{letter}</div>}
      </div>

      <div className="rc-info" onClick={() => navigate(`/user/${requester._id}`)}>
        <p className="rc-name">{requester.name}</p>
        {requester.username && <p className="rc-handle">@{requester.username}</p>}
        <div className="rc-tags">
          {requester.course  && <span className="sc-tag sc-tag-course">{requester.course}</span>}
          {requester.branch  && <span className="sc-tag sc-tag-branch">{requester.branch}</span>}
          {requester.year    && <span className="sc-tag sc-tag-year">Y{requester.year}</span>}
        </div>
      </div>

      <div className="rc-actions">
        <button onClick={() => handle("accept", onAccept)} disabled={!!acting} className="rc-btn-accept">
          {acting === "accept" ? "…" : "Accept"}
        </button>
        <button onClick={() => handle("decline", onDecline)} disabled={!!acting} className="rc-btn-decline">
          {acting === "decline" ? "…" : "Decline"}
        </button>
      </div>
    </div>
  );
}

// ─── MyConnectionCard ─────────────────────────────────────────────────────────
function MyConnectionCard({ connection, onRemove }) {
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  const letter = connection.name?.charAt(0).toUpperCase() || "?";

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Remove ${connection.name}?`)) return;
    try {
      setRemoving(true);
      await api.delete(`/api/connections/remove/${connection._id}`);
      onRemove(connection._id);
    } catch { setRemoving(false); }
  };

  return (
    <div onClick={() => navigate(`/user/${connection._id}`)} className="sc-card sc-card-connected">
      <button onClick={handleRemove} disabled={removing} className="mc-remove">
        {removing ? "…" : "×"}
      </button>

      <div className="sc-avatar-wrap">
        {connection.profileImage
          ? <img src={connection.profileImage} alt={connection.name} className="sc-avatar-img sc-avatar-img--blue" />
          : <div className="sc-avatar-fallback">{letter}</div>}
      </div>

      <p className="sc-handle sc-handle-solo">
        {connection.username ? `@${connection.username}` : connection.name}
      </p>

      <span className="sc-btn sc-btn-connected">connected</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Connections() {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const [tab, setTab] = useState("browse");

  const [students,        setStudents]        = useState([]);
  const [requests,        setRequests]        = useState([]);
  const [myConnections,   setMyConnections]   = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [connsLoading,    setConnsLoading]    = useState(true);

  const [search,         setSearch]         = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState("All");

  // ── fetch all students ───────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/user/all")
      .then(res => setStudents((Array.isArray(res.data) ? res.data : []).filter(u => u._id !== currentUser?._id)))
      .catch(console.error)
      .finally(() => setStudentsLoading(false));
  }, [currentUser?._id]);

  useEffect(() => {
    api.get("/api/connections/requests")
      .then(res => setRequests(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setRequestsLoading(false));
  }, []);

  useEffect(() => {
    api.get("/api/connections")
      .then(res => setMyConnections(Array.isArray(res.data) ? res.data : []))
      .catch(console.error)
      .finally(() => setConnsLoading(false));
  }, []);

  // ── derived ──────────────────────────────────────────────────────────────
  // Courses: include old students that have no course set (show as "Other")
  const courses = useMemo(() => {
    const c = new Set(students.map(s => s.course || "Other").filter(Boolean));
    return ["All", ...Array.from(c).sort()];
  }, [students]);

  // Branches: normalize old codes → canonical names so "ME" and "Mechanical Engg" merge
  const branches = useMemo(() => {
    const src = selectedCourse === "All"
      ? students
      : students.filter(s => (s.course || "Other") === selectedCourse);
    const b = new Set(src.map(s => normalizeBranch(s.branch)).filter(Boolean));
    return ["All", ...Array.from(b).sort()];
  }, [students, selectedCourse]);

  // reset branch when course changes
  useEffect(() => { setSelectedBranch("All"); }, [selectedCourse]);

  const filtered = useMemo(() => students.filter(s => {
    const matchCourse = selectedCourse === "All" || (s.course || "Other") === selectedCourse;
    const matchBranch = selectedBranch === "All" || normalizeBranch(s.branch) === selectedBranch;
    const q           = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.username?.toLowerCase().includes(q);
    return matchCourse && matchBranch && matchSearch;
  }), [students, selectedCourse, selectedBranch, search]);

  // Group by normalized branch so old+new students appear together
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      const key = normalizeBranch(s.branch) || "Other";
      (map[key] = map[key] || []).push(s);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const pendingCount = requests.length;

  // ── actions ──────────────────────────────────────────────────────────────
  const handleConnect = async (targetId) => {
    await api.post(`/api/connections/request/${targetId}`);
    // Optimistically update currentUser's sentRequests via refreshUser if available
    if (typeof refreshUser === "function") await refreshUser();
  };

  const handleCancel = async (targetId) => {
    await api.delete(`/api/connections/cancel/${targetId}`);
    if (typeof refreshUser === "function") await refreshUser();
  };

  const handleAccept = async (requesterId) => {
    await api.post(`/api/connections/accept/${requesterId}`);
    setRequests(prev => prev.filter(r => r._id !== requesterId));
    api.get("/api/connections").then(res => setMyConnections(Array.isArray(res.data) ? res.data : []));
    if (typeof refreshUser === "function") await refreshUser();
  };

  const handleDecline = async (requesterId) => {
    await api.post(`/api/connections/decline/${requesterId}`);
    setRequests(prev => prev.filter(r => r._id !== requesterId));
  };

  const TABS = [
    { id: "browse",   label: "Browse" },
    { id: "requests", label: "Requests", badge: pendingCount },
    { id: "mine",     label: `Mine (${myConnections.length})` },
  ];

  return (
    <>
      <style>{`
        /* ── Card grid ── */
        .sc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        @media (min-width: 480px) {
          .sc-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
        }
        @media (min-width: 640px) {
          .sc-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
        }

        /* ── Student card ── */
        .sc-card {
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 14px;
          padding: 12px 8px 10px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 4px;
          transition: border-color 0.15s, box-shadow 0.15s;
          position: relative;
        }
        .sc-card:hover { border-color: #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .sc-card:active { transform: scale(0.98); }
        .sc-card-connected { border-color: #e8f0ff; }

        /* ── Avatar ── */
        .sc-avatar-wrap { position: relative; margin-bottom: 2px; }
        .sc-avatar-img {
          width: 44px; height: 44px;
          border-radius: 50%;
          object-fit: cover;
          ring: 2px solid #f0f0f0;
        }
        .sc-avatar-img--blue { box-shadow: 0 0 0 2px #dbeafe; }
        .sc-avatar-fallback {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: #111;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 16px; font-weight: 600;
        }
        .sc-ping {
          position: absolute; top: 0; right: 0;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #f59e0b;
          border: 2px solid #fff;
        }

        /* ── Text ── */
        .sc-handle {
          font-size: 10px; color: #bbb;
          max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
          width: 100%; margin-top: -1px;
        }
        .sc-handle-solo {
          font-size: 10.5px; font-weight: 500;
          color: #888; letter-spacing: 0.01em;
          max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
          width: 100%; margin-top: 1px;
        }

        /* ── Action buttons ── */
        .sc-btn {
          margin-top: 5px;
          font-size: 9.5px; font-weight: 500;
          padding: 3px 9px;
          border-radius: 99px;
          border: 1px solid #e8e8e8;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: all 0.15s;
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 52px;
          background: transparent;
        }
        .sc-btn-connect {
          color: #444; border-color: #d4d4d4;
        }
        .sc-btn-connect:hover:not(:disabled) { background: #111; color: #fff; border-color: #111; }
        .sc-btn-connect:disabled { opacity: 0.4; cursor: not-allowed; }
        .sc-btn-connected {
          color: #aaa; border-color: #ebebeb;
          cursor: default; background: transparent;
        }
        .sc-btn-requested {
          color: #bbb; border-color: #ebebeb;
          cursor: pointer;
        }
        .sc-btn-requested:hover:not(:disabled) { color: #ef4444; border-color: #fca5a5; background: #fff5f5; }
        .sc-btn-requested:disabled { opacity: 0.5; }
        .sc-btn-pending {
          color: #e6a817; border-color: #fde68a;
          cursor: default; background: transparent;
        }

        /* ── Remove button on mine card ── */
        .mc-remove {
          position: absolute; top: 6px; right: 6px;
          width: 18px; height: 18px;
          background: none; border: none;
          color: #ccc; font-size: 14px; line-height: 1;
          cursor: pointer; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.15s, color 0.15s;
        }
        .sc-card:hover .mc-remove { opacity: 1; }
        .mc-remove:hover { color: #ef4444; }

        /* ── Request card ── */
        .rc-card {
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex; align-items: center; gap: 10px;
        }
        .rc-avatar-img {
          width: 40px; height: 40px; border-radius: 50%; object-fit: cover;
          border: 1.5px solid #f0f0f0; flex-shrink: 0; cursor: pointer;
        }
        .rc-avatar-fallback {
          width: 40px; height: 40px; border-radius: 50%;
          background: #111; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .rc-info { flex: 1; min-width: 0; cursor: pointer; }
        .rc-name { font-size: 13px; font-weight: 600; color: #111; }
        .rc-handle { font-size: 11px; color: #aaa; }
        .rc-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
        .rc-actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }
        .rc-btn-accept {
          font-size: 11px; font-weight: 600;
          padding: 5px 12px; border-radius: 99px;
          background: #111; color: #fff; border: none;
          cursor: pointer; min-width: 64px;
          transition: background 0.15s;
        }
        .rc-btn-accept:hover:not(:disabled) { background: #333; }
        .rc-btn-accept:disabled { opacity: 0.5; }
        .rc-btn-decline {
          font-size: 11px; font-weight: 600;
          padding: 5px 12px; border-radius: 99px;
          background: #f5f5f5; color: #666;
          border: 1px solid #e5e5e5;
          cursor: pointer; min-width: 64px;
          transition: background 0.15s;
        }
        .rc-btn-decline:hover:not(:disabled) { background: #eee; }
        .rc-btn-decline:disabled { opacity: 0.5; }

        /* ── Filter pills ── */
        .filter-pills {
          display: flex; gap: 6px;
          overflow-x: auto; padding-bottom: 2px;
          scrollbar-width: none;
        }
        .filter-pills::-webkit-scrollbar { display: none; }
        .filter-pill {
          flex-shrink: 0;
          padding: 4px 11px;
          border-radius: 99px;
          font-size: 11px; font-weight: 600;
          border: 1.5px solid #e5e5e5;
          background: #fff; color: #555;
          cursor: pointer; transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-pill.active { background: #111; color: #fff; border-color: #111; }
        .filter-pill:hover:not(.active) { border-color: #ccc; }

        /* ── Branch section header ── */
        .branch-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 8px;
        }
        .branch-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #bbb; flex-shrink: 0;
        }
        .branch-line { flex: 1; height: 1px; background: #f0f0f0; }
        .branch-count { font-size: 9px; color: #ccc; flex-shrink: 0; }

        /* ── Filter section labels ── */
        .filter-section {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 14px;
        }
        .filter-label {
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #bbb;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
            <button onClick={() => navigate("/")} className="p-1.5 rounded-full hover:bg-gray-100">
              <img src="/images/back.svg" alt="Back" className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-800">Connections</span>
          </div>

          {/* ── Tabs ── */}
          <div className="max-w-2xl mx-auto px-4 pb-0 flex border-t border-gray-100">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-400 hover:text-gray-600"}`}>
                {t.label}
                {t.badge > 0 && (
                  <span className="absolute top-2 ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-3 py-4">

          {/* ══════════════ BROWSE TAB ══════════════ */}
          {tab === "browse" && (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input type="text" placeholder="Search by name or username…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-gray-400" />
              </div>

              {/* Course filter */}
              {courses.length > 1 && (
                <div className="filter-section">
                  <span className="filter-label">Course</span>
                  <div className="filter-pills">
                    {courses.map(c => (
                      <button key={c} onClick={() => setSelectedCourse(c)}
                        className={`filter-pill ${selectedCourse === c ? "active" : ""}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Branch filter */}
              {branches.length > 1 && (
                <div className="filter-section">
                  <span className="filter-label">Branch</span>
                  <div className="filter-pills">
                    {branches.map(b => (
                      <button key={b} onClick={() => setSelectedBranch(b)}
                        className={`filter-pill ${selectedBranch === b ? "active" : ""}`}>
                        {shortBranch(b)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {studentsLoading
                ? <p className="py-16 text-center text-sm text-gray-400">Loading students…</p>
                : grouped.length === 0
                ? <p className="py-16 text-center text-sm text-gray-400">No students found</p>
                : <div className="space-y-5">
                    {grouped.map(([branch, list]) => (
                      <div key={branch}>
                        <div className="branch-header">
                          <span className="branch-label">{shortBranch(branch)}</span>
                          <div className="branch-line" />
                          <span className="branch-count">{list.length}</span>
                        </div>
                        <div className="sc-grid">
                          {list.map(student => (
                            <StudentCard
                              key={student._id}
                              student={student}
                              currentUser={currentUser}
                              onConnect={handleConnect}
                              onCancel={handleCancel}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>}
            </>
          )}

          {/* ══════════════ REQUESTS TAB ══════════════ */}
          {tab === "requests" && (
            requestsLoading
              ? <p className="py-16 text-center text-sm text-gray-400">Loading…</p>
              : requests.length === 0
              ? <div className="py-16 text-center">
                  <p className="text-2xl mb-2">👋</p>
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              : <div className="space-y-2">
                  {requests.map(requester => (
                    <RequestCard
                      key={requester._id}
                      requester={requester}
                      onAccept={() => handleAccept(requester._id)}
                      onDecline={() => handleDecline(requester._id)}
                    />
                  ))}
                </div>
          )}

          {/* ══════════════ MY CONNECTIONS TAB ══════════════ */}
          {tab === "mine" && (
            connsLoading
              ? <p className="py-16 text-center text-sm text-gray-400">Loading…</p>
              : myConnections.length === 0
              ? <div className="py-16 text-center">
                  <p className="text-2xl mb-2">🤝</p>
                  <p className="text-sm font-medium text-gray-500">No connections yet</p>
                  <p className="text-xs text-gray-400 mt-1">Browse students and connect with your peers</p>
                  <button onClick={() => setTab("browse")}
                    className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                    Browse Students
                  </button>
                </div>
              : <>
                  <p className="text-xs text-gray-400 mb-3">{myConnections.length} connection{myConnections.length !== 1 ? "s" : ""}</p>
                  <div className="sc-grid">
                    {myConnections.map(conn => (
                      <MyConnectionCard
                        key={conn._id}
                        connection={conn}
                        onRemove={id => setMyConnections(prev => prev.filter(c => c._id !== id))}
                      />
                    ))}
                  </div>
                </>
          )}
        </div>
      </div>
    </>
  );
}