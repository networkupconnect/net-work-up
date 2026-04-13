import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function getInitialStatus(currentUser, profile) {
  if (!currentUser || !profile) return "none";
  const pid = profile._id?.toString();
  if ((currentUser.connections || []).map(String).includes(pid)) return "connected";
  if ((currentUser.sentRequests || []).map(String).includes(pid)) return "requested";
  if ((currentUser.pendingRequests || []).map(String).includes(pid)) return "pending";
  return "none";
}

function ConnectButton({ status, loading, onSend, onCancel, onAccept, onDecline, onRemove }) {
  if (status === "none")
    return <button onClick={onSend} disabled={loading} className="connect-btn primary">{loading ? <span className="btn-spinner" /> : "Connect"}</button>;
  if (status === "requested")
    return <button onClick={onCancel} disabled={loading} className="connect-btn ghost">{loading ? <span className="btn-spinner" /> : <>Pending <span className="dot-pulse" /></>}</button>;
  if (status === "pending")
    return (
      <div className="btn-pair">
        <button onClick={onAccept} disabled={loading} className="connect-btn primary">{loading ? <span className="btn-spinner" /> : "Accept"}</button>
        <button onClick={onDecline} disabled={loading} className="connect-btn ghost">Decline</button>
      </div>
    );
  if (status === "connected")
    return <button onClick={onRemove} disabled={loading} className="connect-btn connected">{loading ? <span className="btn-spinner" /> : <>Connected <span className="check-icon">✓</span></>}</button>;
  return null;
}

function StatItem({ count, label }) {
  return (
    <div className="stat-item">
      <span className="stat-count">{count}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ChipList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <div className="chip-section">
      <p className="chip-title">{title}</p>
      <div className="chip-row">{items.map((item, i) => <span key={i} className="chip">{item}</span>)}</div>
    </div>
  );
}

function ProjectCard({ project }) {
  const coverImg = project.coverImages?.[0] || project.coverImage;
  const tags = project.tags?.length ? project.tags : (project.techStack || []);
  return (
    <div className="project-card">
      {coverImg && <div className="project-cover"><img src={coverImg} alt={project.title} /></div>}
      <div className="project-body">
        <div className="project-header">
          <div>
            <h3 className="project-title">{project.title}</h3>
            {project.tagline && <p className="project-tagline">{project.tagline}</p>}
          </div>
          {project.status && (
            <span className={`project-badge badge-${project.status}`}>
              {project.status === "in-progress" ? "In Progress" : project.status === "completed" ? "Completed" : "Idea"}
            </span>
          )}
        </div>
        {project.description && <p className="project-desc">{project.description}</p>}
        {tags.length > 0 && <div className="tag-row">{tags.map((t, i) => <span key={i} className="tag-chip">{t}</span>)}</div>}
        {project.coverImages?.length > 1 && (
          <div className="cover-grid">
            {project.coverImages.slice(1).map((img, i) => <img key={i} src={img} alt="" className="cover-grid-img" />)}
          </div>
        )}
        {(project.liveUrl || project.repoUrl || project.ytUrl) && (
          <div className="project-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="proj-link">Live ↗</a>}
            {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="proj-link muted">Repo ↗</a>}
            {project.ytUrl && <a href={project.ytUrl} target="_blank" rel="noreferrer" className="proj-link muted">▶ Video</a>}
          </div>
        )}
      </div>
    </div>
  );
}

function TargetCard({ target }) {
  const [open, setOpen] = useState(false);
  const prog = target.progress || [];
  return (
    <div className="target-card">
      <div className="tc-top">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`tc-dot ${target.isCompleted ? "done" : "active"}`} />
            <p className="target-title">{target.title}</p>
          </div>
          <p className="target-meta" style={{ paddingLeft: 14 }}>
            {prog.length} update{prog.length !== 1 ? "s" : ""} · {target.isCompleted ? "Completed" : "In Progress"}
          </p>
        </div>
      </div>
      {prog.length > 0 && (
        <button className="tc-toggle" onClick={() => setOpen(o => !o)}>
          {open ? "▲ hide" : `▼ ${prog.length} update${prog.length !== 1 ? "s" : ""}`}
        </button>
      )}
      {open && (
        <div className="tc-timeline">
          {[...prog].reverse().map(p => (
            <div key={p._id} className="tc-tl-row">
              <div className={`tc-tl-dot ${p.isCompletion ? "done-dot" : ""}`} />
              <div className="tc-tl-body">
                {p.isCompletion && <span className="pg-complete-tag">✓ Completion</span>}
                {p.text && <p className="pg-text">{p.text}</p>}
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="pg-link">{p.link}</a>}
                {p.image && <img src={p.image} alt="" className="pg-thumb" />}
                <span className="pg-date" style={{ display: "block", marginTop: 5 }}>
                  {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [modalImage, setModalImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [connStatus, setConnStatus] = useState("none");
  const [connLoading, setConnLoading] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser._id === userId) navigate("/profile", { replace: true });
  }, [userId, currentUser, navigate]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/api/user/${userId}`),
          api.get(`/api/feed/user/${userId}/posts`),
        ]);
        setProfile(profileRes.data);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        setConnStatus(getInitialStatus(currentUser, profileRes.data));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [userId, currentUser]);

  useEffect(() => {
    if (activeTab !== "projects" || !userId) return;
    const load = async () => {
      setProjectsLoading(true);
      try {
        const res = await api.get(`/api/projects/user/${userId}`);
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch { setProjects([]); }
      finally { setProjectsLoading(false); }
    };
    load();
  }, [activeTab, userId]);

  useEffect(() => {
    if (activeTab !== "progress" || !userId) return;
    const load = async () => {
      setTargetsLoading(true);
      try {
        const res = await api.get(`/api/targets/user/${userId}`);
        setTargets(Array.isArray(res.data) ? res.data : []);
      } catch { setTargets([]); }
      finally { setTargetsLoading(false); }
    };
    load();
  }, [activeTab, userId]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const withLoad = async (fn) => {
    try { setConnLoading(true); await fn(); }
    catch { showToast("Action failed", "error"); }
    finally { setConnLoading(false); }
  };

  const handleSend    = () => withLoad(async () => { const res = await api.post(`/api/connections/request/${userId}`); setConnStatus(res.data.status === "connected" ? "connected" : "requested"); });
  const handleCancel  = () => withLoad(async () => { await api.delete(`/api/connections/cancel/${userId}`); setConnStatus("none"); });
  const handleAccept  = () => withLoad(async () => { await api.post(`/api/connections/accept/${userId}`); setConnStatus("connected"); });
  const handleDecline = () => withLoad(async () => { await api.post(`/api/connections/decline/${userId}`); setConnStatus("none"); });
  const handleRemove  = () => withLoad(async () => { await api.delete(`/api/connections/remove/${userId}`); setConnStatus("none"); });

  if (loading) return <div className="up-loading"><span className="loader-ring" /></div>;
  if (!profile) return <div className="up-loading"><p className="up-notfound">User not found</p></div>;

  const avatarLetter = profile.name?.charAt(0).toUpperCase() || "?";
  const connectionsCount = profile.connections?.length ?? 0;

  // ✅ Same meta logic as Profile.jsx — course · branch · year · section
  const metaParts = [
    profile.course,
    profile.branch,
    profile.year && `Year ${profile.year}`,
    profile.section && `Sec ${profile.section}`,
  ].filter(Boolean);

  const TABS = [
    { id: "posts",    label: "Posts",    count: posts.length },
    { id: "projects", label: "Projects", count: projects.length },
    { id: "progress", label: "Progress", count: targets.length },
    ...(profile.role === "seller" ? [{ id: "products", label: "Products" }] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#f9f9f8;--surface:#fff;--border:#e8e8e6;--border-strong:#d0d0cc;
          --text-primary:#111110;--text-secondary:#6b6b67;--text-muted:#a0a09c;
          --accent:#111110;--accent-hover:#333330;--blue:#2563eb;--green:#16a34a;--red:#dc2626;
          --radius-sm:8px;--radius-md:12px;--radius-lg:16px;--radius-full:999px;
          --font:'DM Sans',sans-serif;--font-mono:'DM Mono',monospace;
          --shadow-md:0 4px 12px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04);
        }
        .up-wrap{font-family:var(--font);background:var(--bg);min-height:100vh;color:var(--text-primary)}
        .up-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);font-family:var(--font)}
        .loader-ring{display:inline-block;width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .btn-spinner{width:12px;height:12px;border:1.5px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
        .up-notfound{color:var(--text-muted);font-size:14px;font-family:var(--font)}
        .up-topbar{position:sticky;top:0;z-index:40;background:rgba(249,249,248,0.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
        .up-topbar-inner{max-width:600px;margin:0 auto;padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between}
        .up-back-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--text-primary);font-size:16px}
        .up-topbar-handle{font-size:13px;font-weight:500;color:var(--text-secondary);font-family:var(--font-mono);letter-spacing:-0.01em}
        .up-topbar-spacer{width:32px}
        .up-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100;padding:10px 18px;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:var(--font);box-shadow:var(--shadow-md);white-space:nowrap}
        .up-toast.success{background:var(--text-primary);color:#fff}
        .up-toast.error{background:var(--red);color:#fff}
        .up-modal{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:50;display:flex;align-items:center;justify-content:center}
        .up-modal img{max-width:88vw;max-height:88vh;border-radius:var(--radius-lg);object-fit:contain}
        .up-modal-close{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.12);border:none;color:rgba(255,255,255,0.8);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
        .up-content{max-width:600px;margin:0 auto;padding:32px 20px 80px}
        .profile-header{margin-bottom:32px}
        .avatar-stats-row{display:flex;align-items:flex-start;gap:24px}
        .avatar-wrap{flex-shrink:0}
        .avatar-img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border);cursor:pointer}
        .avatar-fallback{width:80px;height:80px;border-radius:50%;background:var(--text-primary);display:flex;align-items:center;justify-content:center}
        .avatar-fallback span{color:#fff;font-size:28px;font-weight:500;font-family:var(--font)}
        .stats-col{flex:1;display:flex;flex-direction:column;gap:16px}
        .stats-row{display:flex;align-items:center}
        .stat-item{flex:1;text-align:center}
        .stat-count{display:block;font-size:18px;font-weight:600;color:var(--text-primary);line-height:1.1;letter-spacing:-0.02em}
        .stat-label{display:block;font-size:11px;color:var(--text-muted);margin-top:2px;letter-spacing:0.02em}
        .stat-divider{width:1px;height:32px;background:var(--border);flex-shrink:0}
        .action-row{display:flex;gap:8px}
        .connect-btn{flex:1;height:34px;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;border:none;letter-spacing:-0.01em}
        .connect-btn:disabled{opacity:.5;cursor:not-allowed}
        .connect-btn.primary{background:var(--accent);color:#fff}
        .connect-btn.primary:hover:not(:disabled){background:var(--accent-hover)}
        .connect-btn.ghost{background:transparent;color:var(--text-secondary);border:1px solid var(--border-strong)}
        .connect-btn.ghost:hover:not(:disabled){background:#fef2f2;color:var(--red);border-color:#fca5a5}
        .connect-btn.connected{background:#f0fdf4;color:var(--green);border:1px solid #bbf7d0}
        .connect-btn.connected:hover:not(:disabled){background:#fef2f2;color:var(--red);border-color:#fca5a5}
        .btn-pair{flex:1;display:flex;gap:8px}
        .btn-pair .connect-btn{flex:1}
        .msg-btn{flex:1;height:34px;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;background:transparent;color:var(--text-secondary);border:1px solid var(--border-strong);letter-spacing:-0.01em}
        .msg-btn:hover{background:var(--border);color:var(--text-primary)}
        .dot-pulse{display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;animation:pulse 1.5s ease infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .check-icon{font-size:11px}
        .profile-info{margin-top:16px}
        .profile-name{font-size:17px;font-weight:600;color:var(--text-primary);letter-spacing:-0.02em;line-height:1.2}
        .profile-handle{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-top:2px}
        .profile-bio{font-size:14px;color:var(--text-secondary);margin-top:8px;line-height:1.55}
        .profile-meta{font-size:12px;color:var(--text-muted);margin-top:6px}
        .chip-section{margin-top:16px}
        .chip-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px}
        .chip-row{display:flex;flex-wrap:wrap;gap:6px}
        .chip{display:inline-flex;align-items:center;padding:4px 12px;border-radius:var(--radius-full);font-size:12px;background:var(--surface);color:var(--text-secondary);border:1px solid var(--border)}
        .tabs-bar{display:flex;border-bottom:1px solid var(--border);margin-bottom:24px}
        .tab-btn{padding:10px 14px;font-size:13px;font-weight:500;color:var(--text-muted);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:var(--font);letter-spacing:-0.01em;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:var(--text-primary);border-bottom-color:var(--text-primary)}
        .tab-count{font-size:11px;background:var(--border);color:var(--text-muted);padding:1px 6px;border-radius:var(--radius-full);font-weight:500}
        .tab-btn.active .tab-count{background:var(--text-primary);color:#fff}
        .empty-state{padding:64px 0;text-align:center}
        .empty-icon{font-size:32px;margin-bottom:12px;opacity:.3}
        .empty-text{font-size:14px;color:var(--text-muted)}
        .posts-list{display:flex;flex-direction:column;gap:16px}
        .post-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .post-header{padding:14px 16px;display:flex;align-items:center;gap:10px}
        .post-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;cursor:pointer;border:1px solid var(--border)}
        .post-avatar-fallback{width:32px;height:32px;border-radius:50%;background:var(--text-primary);display:flex;align-items:center;justify-content:center}
        .post-avatar-fallback span{color:#fff;font-size:12px;font-weight:500}
        .post-name{font-size:13px;font-weight:600;color:var(--text-primary)}
        .post-date{font-size:11px;color:var(--text-muted);margin-top:1px}
        .post-img{width:100%;object-fit:cover;display:block;cursor:pointer}
        .post-caption{padding:12px 16px;font-size:13px;color:var(--text-primary);line-height:1.5}
        .post-caption .author{font-weight:600}
        .post-footer{padding:10px 16px 14px;display:flex;gap:16px;border-top:1px solid var(--border)}
        .post-stat{font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px}
        .projects-list{display:flex;flex-direction:column;gap:16px}
        .project-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .project-cover{height:160px;overflow:hidden}
        .project-cover img{width:100%;height:100%;object-fit:cover}
        .project-body{padding:16px}
        .project-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}
        .project-title{font-size:14px;font-weight:600;color:var(--text-primary);letter-spacing:-0.01em}
        .project-tagline{font-size:12px;color:var(--text-muted);margin-top:2px}
        .project-desc{font-size:13px;color:var(--text-secondary);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .project-badge{font-size:10px;font-weight:500;padding:3px 10px;border-radius:var(--radius-full);white-space:nowrap;flex-shrink:0;font-family:var(--font-mono)}
        .badge-completed{background:#f0fdf4;color:var(--green)}
        .badge-in-progress{background:#fffbeb;color:#b45309}
        .badge-idea{background:var(--border);color:var(--text-muted)}
        .tag-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
        .tag-chip{font-size:11px;padding:2px 8px;border-radius:var(--radius-full);background:var(--bg);border:1px solid var(--border);color:var(--text-muted);font-family:var(--font-mono)}
        .cover-grid{display:flex;gap:6px;margin-top:8px}
        .cover-grid-img{width:72px;height:56px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border)}
        .project-links{display:flex;gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
        .proj-link{font-size:12px;font-weight:500;color:var(--blue);text-decoration:none}
        .proj-link:hover{opacity:.7}
        .proj-link.muted{color:var(--text-secondary)}
        .target-list{display:flex;flex-direction:column;gap:10px}
        .target-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .tc-top{padding:14px 16px;display:flex;align-items:flex-start;gap:8px}
        .target-title{font-size:13px;font-weight:600;color:var(--text-primary);line-height:1.3}
        .target-meta{font-size:11px;color:var(--text-muted);margin-top:3px}
        .tc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px;display:inline-block}
        .tc-dot.done{background:var(--green)}
        .tc-dot.active{background:var(--border-strong)}
        .tc-toggle{width:100%;padding:7px 16px;font-size:11px;color:var(--text-muted);background:var(--bg);border:none;border-top:1px solid var(--border);cursor:pointer;text-align:left;font-family:var(--font)}
        .tc-timeline{padding:10px 16px 4px;border-top:1px solid var(--border);background:var(--bg);display:flex;flex-direction:column;gap:0}
        .tc-tl-row{display:flex;gap:12px;padding-bottom:12px;position:relative}
        .tc-tl-row::before{content:"";position:absolute;left:6px;top:16px;bottom:0;width:1px;background:var(--border)}
        .tc-tl-row:last-child::before{display:none}
        .tc-tl-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--border);background:var(--surface);flex-shrink:0;margin-top:2px;position:relative;z-index:1}
        .tc-tl-dot.done-dot{border-color:var(--green);background:#f0fdf4}
        .tc-tl-body{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px}
        .pg-complete-tag{font-size:10px;font-weight:600;color:var(--green);font-family:var(--font-mono);letter-spacing:0.04em;display:block;margin-bottom:3px}
        .pg-text{font-size:13px;color:var(--text-primary);line-height:1.45}
        .pg-link{font-size:11px;color:var(--blue);text-decoration:none;word-break:break-all;display:block;margin-top:3px}
        .pg-thumb{max-width:110px;max-height:80px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border);display:block;margin-top:6px}
        .pg-date{font-size:10px;color:var(--text-muted)}
      `}</style>

      <div className="up-wrap">
        {modalImage && (
          <div className="up-modal" onClick={() => setModalImage(null)}>
            <img src={modalImage} alt="Enlarged" onClick={e => e.stopPropagation()} />
            <button className="up-modal-close" onClick={() => setModalImage(null)}>✕</button>
          </div>
        )}
        {toast && <div className={`up-toast ${toast.type}`}>{toast.msg}</div>}

        <div className="up-topbar">
          <div className="up-topbar-inner">
            <button className="up-back-btn" onClick={() => navigate(-1)}>←</button>
            <span className="up-topbar-handle">{profile.username ? `@${profile.username}` : profile.name}</span>
            <div className="up-topbar-spacer" />
          </div>
        </div>

        <div className="up-content">
          <div className="profile-header">
            <div className="avatar-stats-row">
              <div className="avatar-wrap">
                {profile.profileImage
                  ? <img src={profile.profileImage} alt={profile.name} className="avatar-img" onClick={() => setModalImage(profile.profileImage)} />
                  : <div className="avatar-fallback"><span>{avatarLetter}</span></div>}
              </div>
              <div className="stats-col">
                <div className="stats-row">
                  <StatItem count={posts.length} label="Posts" />
                  <div className="stat-divider" />
                  <StatItem count={connectionsCount} label="Connections" />
                  <div className="stat-divider" />
                  <StatItem count={projects.length} label="Projects" />
                </div>
                <div className="action-row">
                  <ConnectButton status={connStatus} loading={connLoading}
                    onSend={handleSend} onCancel={handleCancel}
                    onAccept={handleAccept} onDecline={handleDecline} onRemove={handleRemove} />
                  <button className="msg-btn" onClick={() => navigate(`/chat/${userId}`)}>Message</button>
                </div>
              </div>
            </div>

            <div className="profile-info">
              <h1 className="profile-name">{profile.name}</h1>
              {profile.username && <p className="profile-handle">@{profile.username}</p>}
              {profile.description && <p className="profile-bio">{profile.description}</p>}
              {/* ✅ Shows course · branch · year · section — matches Profile.jsx */}
              {metaParts.length > 0 && <p className="profile-meta">{metaParts.join(" · ")}</p>}
            </div>

            <ChipList title="Skills" items={profile.skills} />
            <ChipList title="Interests" items={profile.interests} />
            <ChipList title="Goals" items={profile.goals} />
          </div>

          <div className="tabs-bar">
            {TABS.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
                {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            posts.length === 0
              ? <div className="empty-state"><div className="empty-icon">◻</div><p className="empty-text">No posts yet</p></div>
              : <div className="posts-list">
                  {posts.map(post => (
                    <div key={post._id} className="post-card">
                      <div className="post-header">
                        {profile.profileImage
                          ? <img src={profile.profileImage} alt={profile.name} className="post-avatar" onClick={() => setModalImage(profile.profileImage)} />
                          : <div className="post-avatar-fallback"><span>{avatarLetter}</span></div>}
                        <div>
                          <p className="post-name">{profile.name}</p>
                          <p className="post-date">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                      </div>
                      {post.image && <img src={post.image} alt={post.caption || "post"} className="post-img" onClick={() => setModalImage(post.image)} />}
                      {post.caption && <p className="post-caption"><span className="author">{profile.name}</span>{" "}{post.caption}</p>}
                      <div className="post-footer">
                        <span className="post-stat">♡ {(post.likes || []).length}</span>
                        <span className="post-stat">◯ {(post.comments || []).length}</span>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {activeTab === "projects" && (
            projectsLoading
              ? <div className="empty-state"><span className="loader-ring" /></div>
              : projects.length === 0
                ? <div className="empty-state"><div className="empty-icon">⬡</div><p className="empty-text">No projects yet</p></div>
                : <div className="projects-list">{projects.map(p => <ProjectCard key={p._id} project={p} />)}</div>
          )}

          {activeTab === "progress" && (
            targetsLoading
              ? <div className="empty-state"><span className="loader-ring" /></div>
              : targets.length === 0
                ? <div className="empty-state"><div className="empty-icon">◎</div><p className="empty-text">No targets yet</p></div>
                : <div className="target-list">{targets.map(t => <TargetCard key={t._id} target={t} />)}</div>
          )}

          {activeTab === "products" && profile.role === "seller" && (
            <div className="empty-state"><div className="empty-icon">◈</div><p className="empty-text">No products listed yet</p></div>
          )}
        </div>
      </div>
    </>
  );
}