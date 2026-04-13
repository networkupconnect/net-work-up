import { useEffect, useCallback, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { COURSE_BRANCHES, MAX_YEARS, HAS_SECTION } from "./OnboardingFlow.jsx";

// ─── Chip Helpers ─────────────────────────────────────────────────────────────
function Chip({ label, onRemove, editing }) {
  return (
    <span className="chip">
      {label}
      {editing && (
        <button type="button" onClick={onRemove} className="chip-remove">×</button>
      )}
    </span>
  );
}

function ChipInput({ placeholder, onAdd }) {
  const [val, setVal] = useState("");
  const submit = () => {
    const t = val.trim();
    if (!t) return;
    onAdd(t);
    setVal("");
  };
  return (
    <div className="chip-input-wrap">
      <input value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), submit())}
        placeholder={placeholder} className="chip-input" />
      <button type="button" onClick={submit} className="chip-add-btn">+</button>
    </div>
  );
}

function ChipSection({ title, items = [], field, editing, onChange }) {
  const add = (v) => onChange(field, [...items, v]);
  const remove = (i) => onChange(field, items.filter((_, idx) => idx !== i));
  if (!editing && items.length === 0) return null;
  return (
    <div className="chip-section">
      <p className="chip-title">{title}</p>
      <div className="chip-row">
        {items.map((item, i) => (
          <Chip key={i} label={item} onRemove={() => remove(i)} editing={editing} />
        ))}
        {editing && <ChipInput placeholder={`Add ${title.toLowerCase()}…`} onAdd={add} />}
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onDelete }) {
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
          <div className="project-header-right">
            {project.status && (
              <span className={`project-badge badge-${project.status}`}>
                {project.status === "in-progress" ? "In Progress" : project.status === "completed" ? "Completed" : "Idea"}
              </span>
            )}
            <button onClick={() => onDelete(project._id)} className="delete-btn">Delete</button>
          </div>
        </div>
        {project.description && <p className="project-desc">{project.description}</p>}
        {tags.length > 0 && (
          <div className="tag-row">{tags.map((t, i) => <span key={i} className="tag-chip">{t}</span>)}</div>
        )}
        {project.coverImages?.length > 1 && (
          <div className="cover-grid">
            {project.coverImages.slice(1).map((img, i) => <img key={i} src={img} alt="" className="cover-grid-img" />)}
          </div>
        )}
        {(project.liveUrl || project.repoUrl || project.ytUrl) && (
          <div className="project-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="proj-link">Live ↗</a>}
            {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="proj-link muted">Repo ↗</a>}
            {project.ytUrl && <a href={project.ytUrl} target="_blank" rel="noreferrer" className="proj-link yt">▶ Video</a>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Publish Project Form ─────────────────────────────────────────────────────
function PublishProjectForm({ onPublished, onCancel }) {
  const [form, setForm] = useState({
    title: "", tagline: "", description: "", tags: [],
    liveUrl: "", repoUrl: "", ytUrl: "", status: "in-progress",
  });
  const [coverFiles, setCoverFiles] = useState([]);
  const [coverPreviews, setCoverPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleChipChange = (field, arr) => setForm(prev => ({ ...prev, [field]: arr }));

  const handleCoverSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 3 - coverFiles.length).filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    setCoverFiles(prev => [...prev, ...toAdd]);
    setCoverPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeCover = (idx) => {
    URL.revokeObjectURL(coverPreviews[idx]);
    setCoverFiles(prev => prev.filter((_, i) => i !== idx));
    setCoverPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("tagline", form.tagline);
      fd.append("description", form.description);
      fd.append("liveUrl", form.liveUrl);
      fd.append("repoUrl", form.repoUrl);
      fd.append("ytUrl", form.ytUrl);
      fd.append("status", form.status);
      fd.append("tags", JSON.stringify(form.tags));
      coverFiles.forEach(f => fd.append("coverImages", f));
      const res = await api.post("/api/projects", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onPublished(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish");
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="publish-form">
      <div className="form-header">
        <h3 className="form-title">Publish Project</h3>
        <button type="button" onClick={onCancel} className="form-close">✕</button>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="field-group"><label className="field-label">Title *</label>
        <input name="title" value={form.title} onChange={handleChange} placeholder="My awesome project" className="field-input" /></div>
      <div className="field-group"><label className="field-label">Tagline</label>
        <input name="tagline" value={form.tagline} onChange={handleChange} placeholder="One-liner about the project" className="field-input" /></div>
      <div className="field-group"><label className="field-label">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What does this project do?" className="field-textarea" /></div>
      <div className="field-group"><label className="field-label">Live URL <span className="field-hint">(For Technical Project)</span></label>
        <input name="liveUrl" value={form.liveUrl} onChange={handleChange} placeholder="https://myproject.vercel.app" className="field-input" /></div>
      <div className="field-group"><label className="field-label">GitHub / Repo <span className="field-hint">(For Technical Project)</span></label>
        <input name="repoUrl" value={form.repoUrl} onChange={handleChange} placeholder="https://github.com/…" className="field-input" /></div>
      <div className="field-group"><label className="field-label">YouTube Video Link</label>
        <input name="ytUrl" value={form.ytUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=…" className="field-input" /></div>
      <div className="field-group">
        <label className="field-label">Cover Images <span className="field-hint">(up to 3)</span></label>
        <div className="cover-upload-zone">
          {coverPreviews.map((p, i) => (
            <div key={i} className="cover-thumb">
              <img src={p} alt="" />
              <button type="button" onClick={() => removeCover(i)} className="cover-remove">✕</button>
            </div>
          ))}
          {coverFiles.length < 3 && (
            <label className="cover-add">
              <span style={{ fontSize: 20, color: "var(--text-muted)" }}>+</span>
              <input type="file" accept="image/*" multiple onChange={handleCoverSelect} style={{ display: "none" }} />
            </label>
          )}
        </div>
        <p className="field-hint" style={{ marginTop: 4 }}>JPG, PNG, WEBP · Max 5 MB each</p>
      </div>
      <ChipSection title="Tags" items={form.tags} field="tags" editing onChange={handleChipChange} />
      <div className="field-group"><label className="field-label">Status</label>
        <select name="status" value={form.status} onChange={handleChange} className="field-select">
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="idea">Idea / Concept</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <><span className="btn-spinner" /> Publishing…</> : "Publish Project"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

// ─── Target / Progress components (unchanged) ─────────────────────────────────
function ProgressForm({ onSubmit, onCancel, isCompletion }) {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [saving, setSaving] = useState(false);
  const canSubmit = text.trim() || link.trim() || imgFile;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("text", text); fd.append("link", link);
    fd.append("isCompletion", isCompletion.toString());
    if (imgFile) fd.append("image", imgFile);
    await onSubmit(fd);
    setSaving(false);
  };

  return (
    <div className="pg-form">
      <p className="pg-form-label">{isCompletion ? "Mark as Complete" : "Add Update"}</p>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={isCompletion ? "Describe your completion…" : "What did you do?"} rows={2} className="field-textarea pg-field" />
      <input value={link} onChange={e => setLink(e.target.value)} placeholder="Link — YouTube / GitHub / Live" className="field-input pg-field" />
      {imgPrev ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <img src={imgPrev} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
          <button type="button" onClick={() => { setImgFile(null); setImgPrev(null); }} className="delete-btn" style={{ fontSize: 11, padding: "3px 8px" }}>Remove</button>
        </div>
      ) : (
        <label className="pg-img-btn">+ Image
          <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPrev(URL.createObjectURL(f)); } }} style={{ display: "none" }} />
        </label>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button type="button" onClick={submit} disabled={saving || !canSubmit} className="btn-primary" style={{ height: 32, fontSize: 12, padding: "0 16px" }}>
          {saving ? <span className="btn-spinner" /> : "Publish"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ height: 32, fontSize: 12, padding: "0 12px" }}>Cancel</button>
      </div>
    </div>
  );
}

function TargetCard({ target, onDelete, onAddProgress, onDeleteProgress }) {
  const [open, setOpen] = useState(false);
  const [formType, setFormType] = useState(null);
  const prog = target.progress || [];
  const openForm = (type) => { setFormType(type); setOpen(true); };
  const closeForm = () => setFormType(null);
  const handleSubmit = async (fd) => { await onAddProgress(target._id, fd); closeForm(); };

  return (
    <div className="target-card">
      <div className="tc-top">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {target.isCompleted ? <span className="tc-dot done" /> : <span className="tc-dot active" />}
            <p className="target-title">{target.title}</p>
          </div>
          <p className="target-meta" style={{ paddingLeft: 14 }}>
            {prog.length} update{prog.length !== 1 ? "s" : ""} · {target.isCompleted ? "Completed" : "In Progress"}
          </p>
        </div>
        <button onClick={() => onDelete(target._id)} className="delete-btn">Delete</button>
      </div>
      {(prog.length > 0 || formType) && (
        <button className="tc-toggle" onClick={() => { setOpen(o => !o); if (open) closeForm(); }}>
          {open ? "▲ hide" : `▼ ${prog.length} update${prog.length !== 1 ? "s" : ""}`}
        </button>
      )}
      {open && (
        <div className="tc-timeline">
          {formType && (
            <div className="tc-tl-row">
              <div className="tc-tl-dot form-dot" />
              <div style={{ flex: 1 }}>
                <ProgressForm onSubmit={handleSubmit} onCancel={closeForm} isCompletion={formType === "complete"} />
              </div>
            </div>
          )}
          {[...prog].reverse().map(p => (
            <div key={p._id} className="tc-tl-row">
              <div className={`tc-tl-dot ${p.isCompletion ? "done-dot" : ""}`} />
              <div className="tc-tl-body">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    {p.isCompletion && <span className="pg-complete-tag">✓ Completion</span>}
                    {p.text && <p className="pg-text">{p.text}</p>}
                    {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="pg-link">{p.link}</a>}
                    {p.image && <img src={p.image} alt="" className="pg-thumb" />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span className="pg-date">{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <button onClick={() => onDeleteProgress(target._id, p._id)} className="delete-btn" style={{ fontSize: 10, padding: "2px 5px" }}>×</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!target.isCompleted && (
        <div className="tc-actions">
          <button className="tc-act-btn" onClick={() => openForm("update")}>+ Add Progress</button>
          <button className="tc-act-btn finish" onClick={() => openForm("complete")}>Mark Complete</button>
        </div>
      )}
    </div>
  );
}

function StatItem({ count, label }) {
  return (
    <div className="stat-item">
      <span className="stat-count">{count}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", username: "", description: "",
    course: "", branch: "", year: "", section: "",   // ✅ course added
    skills: [], interests: [], goals: [],
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [newTargetTitle, setNewTargetTitle] = useState("");
  const [creatingTarget, setCreatingTarget] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [modalImage, setModalImage] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Dynamic branch list based on selected course ──
  const editBranches = COURSE_BRANCHES[form.course] || [];
  const editMaxYear = MAX_YEARS[form.course] || 4;
  const editShowSection = HAS_SECTION.includes(form.course);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/user/me");
        const d = res.data;
        setForm({
          name: d.name || "", username: d.username || "", description: d.description || "",
          course: d.course || "",                         // ✅ load course
          branch: d.branch || "", year: d.year || "", section: d.section || "",
          skills: d.skills || [], interests: d.interests || [], goals: d.goals || [],
        });
        if (d.profileImage) setImagePreview(d.profileImage);
        try {
          const pr = await api.get(`/api/feed/user/${d._id}/posts`);
          setPosts(Array.isArray(pr.data) ? pr.data : []);
        } catch { setPosts([]); }
      } catch (e) { console.error(e); }
      finally { setPostsLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== "projects" || !user?._id) return;
    const load = async () => {
      setProjectsLoading(true);
      try {
        const res = await api.get(`/api/projects/user/${user._id}`);
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch { setProjects([]); }
      finally { setProjectsLoading(false); }
    };
    load();
  }, [activeTab, user?._id]);

  useEffect(() => {
    if (activeTab !== "progress" || !user?._id) return;
    const load = async () => {
      setTargetsLoading(true);
      try {
        const res = await api.get(`/api/targets/user/${user._id}`);
        setTargets(Array.isArray(res.data) ? res.data : []);
      } catch { setTargets([]); }
      finally { setTargetsLoading(false); }
    };
    load();
  }, [activeTab, user?._id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    // When course changes, reset branch so stale value isn't submitted
    if (name === "course") {
      setForm(prev => ({ ...prev, course: value, branch: "", section: "" }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleChipChange = useCallback((field, arr) => {
    setForm(prev => ({ ...prev, [field]: arr }));
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      showToast("JPG, PNG, GIF or WEBP only", "error"); return;
    }
    if (file.size > 5 * 1024 * 1024) { showToast("Max 5 MB", "error"); return; }
    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return;
    const fd = new FormData();
    fd.append("profileImage", profileImage);
    setUploading(true);
    try {
      const res = await api.put("/api/user/me/profile-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      updateUser(res.data);
      setImagePreview(res.data.profileImage);
      setProfileImage(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed", "error");
    } finally { setUploading(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      if (profileImage) await uploadProfileImage();
      const res = await api.put("/api/user/me", form);
      updateUser(res.data);
      showToast("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      showToast(err?.response?.data?.message || "Update failed", "error");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(user?.profileImage || null);
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.delete(`/api/feed/post/${id}`); setPosts(p => p.filter(x => x._id !== id)); showToast("Post deleted"); }
    catch { showToast("Delete failed", "error"); }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try { await api.delete(`/api/projects/${id}`); setProjects(p => p.filter(x => x._id !== id)); showToast("Project deleted"); }
    catch { showToast("Delete failed", "error"); }
  };

  const handleCreateTarget = async () => {
    if (!newTargetTitle.trim()) return;
    setCreatingTarget(true);
    try {
      const res = await api.post("/api/targets", { title: newTargetTitle.trim() });
      setTargets(prev => [res.data, ...prev]);
      setNewTargetTitle(""); setShowTargetForm(false); showToast("Target added");
    } catch { showToast("Failed to add target", "error"); }
    finally { setCreatingTarget(false); }
  };

  const handleDeleteTarget = async (id) => {
    if (!window.confirm("Delete this target?")) return;
    try { await api.delete(`/api/targets/${id}`); setTargets(prev => prev.filter(t => t._id !== id)); showToast("Target deleted"); }
    catch { showToast("Delete failed", "error"); }
  };

  const handleAddProgress = async (targetId, formData) => {
    try {
      const res = await api.post(`/api/targets/${targetId}/progress`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setTargets(prev => prev.map(t => t._id === targetId ? res.data : t));
      showToast("Progress added");
    } catch { showToast("Failed to add progress", "error"); }
  };

  const handleDeleteProgress = async (targetId, progressId) => {
    try {
      const res = await api.delete(`/api/targets/${targetId}/progress/${progressId}`);
      setTargets(prev => prev.map(t => t._id === targetId ? res.data : t));
      showToast("Deleted");
    } catch { showToast("Delete failed", "error"); }
  };

  const TABS = [
    { id: "posts", label: "Posts", count: posts.length },
    { id: "projects", label: "Projects", count: projects.length },
    { id: "progress", label: "Progress", count: targets.length },
    ...(user?.role === "seller" ? [{ id: "products", label: "Products" }] : []),
  ];

  const avatarLetter = form.name?.charAt(0).toUpperCase() || "?";
  const connectionsCount = user?.connections?.length ?? 0;

  // Build meta line: Course · Branch · Year · Section
  const metaParts = [
    form.course,
    form.branch,
    form.year && `Year ${form.year}`,
    form.section && `Sec ${form.section}`,
  ].filter(Boolean);

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
          --shadow-sm:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
          --shadow-md:0 4px 12px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.04);
        }
        .p-wrap{font-family:var(--font);background:var(--bg);min-height:100vh;color:var(--text-primary)}
        .loader-ring{display:inline-block;width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .btn-spinner{display:inline-block;width:12px;height:12px;border:1.5px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:4px}
        .p-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100;padding:10px 18px;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:var(--font);box-shadow:var(--shadow-md);white-space:nowrap}
        .p-toast.success{background:var(--text-primary);color:#fff}
        .p-toast.error{background:var(--red);color:#fff}
        .p-modal{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:50;display:flex;align-items:center;justify-content:center}
        .p-modal img{max-width:88vw;max-height:88vh;border-radius:var(--radius-lg);object-fit:contain}
        .p-modal-close{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.12);border:none;color:rgba(255,255,255,0.8);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center}
        .p-topbar{position:sticky;top:0;z-index:40;background:rgba(249,249,248,0.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
        .p-topbar-inner{max-width:600px;margin:0 auto;padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between}
        .p-back-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);cursor:pointer;color:var(--text-primary);font-size:16px}
        .p-topbar-handle{font-size:13px;font-weight:500;color:var(--text-secondary);font-family:var(--font-mono);letter-spacing:-0.01em}
        .p-settings-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);color:var(--text-secondary);text-decoration:none}
        .p-content{max-width:600px;margin:0 auto;padding:32px 20px 80px}
        .profile-header{margin-bottom:32px}
        .avatar-stats-row{display:flex;align-items:flex-start;gap:24px}
        .avatar-wrap{flex-shrink:0;position:relative}
        .avatar-img{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--border);cursor:pointer}
        .avatar-fallback{width:80px;height:80px;border-radius:50%;background:var(--text-primary);display:flex;align-items:center;justify-content:center}
        .avatar-fallback span{color:#fff;font-size:28px;font-weight:500}
        .avatar-edit-btn{position:absolute;bottom:0;right:0;width:26px;height:26px;background:var(--text-primary);border:2px solid var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#fff}
        .avatar-new-badge{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-size:9px;font-weight:600;padding:1px 6px;border-radius:var(--radius-full);white-space:nowrap;border:1.5px solid var(--bg)}
        .stats-col{flex:1;display:flex;flex-direction:column;gap:12px}
        .stats-row{display:flex;align-items:center}
        .stat-item{flex:1;text-align:center}
        .stat-count{display:block;font-size:18px;font-weight:600;color:var(--text-primary);line-height:1.1;letter-spacing:-0.02em}
        .stat-label{display:block;font-size:11px;color:var(--text-muted);margin-top:2px;letter-spacing:0.02em}
        .stat-divider{width:1px;height:32px;background:var(--border);flex-shrink:0}
        .edit-btn-row{display:flex;gap:8px}
        .btn-edit-profile{flex:1;height:34px;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:var(--font);cursor:pointer;background:transparent;color:var(--text-secondary);border:1px solid var(--border-strong);letter-spacing:-0.01em}
        .profile-info{margin-top:16px}
        .profile-name{font-size:17px;font-weight:600;color:var(--text-primary);letter-spacing:-0.02em;line-height:1.2}
        .profile-handle{font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-top:2px}
        .profile-bio{font-size:14px;color:var(--text-secondary);margin-top:8px;line-height:1.55}
        .profile-meta{font-size:12px;color:var(--text-muted);margin-top:6px}
        .chip-section{margin-top:16px}
        .chip-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px}
        .chip-row{display:flex;flex-wrap:wrap;gap:6px}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:var(--radius-full);font-size:12px;background:var(--surface);color:var(--text-secondary);border:1px solid var(--border)}
        .chip-remove{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;line-height:1;padding:0}
        .chip-input-wrap{display:inline-flex;align-items:center;border:1px dashed var(--border-strong);border-radius:var(--radius-full);padding:4px 10px;gap:4px}
        .chip-input{font-size:12px;outline:none;background:transparent;width:80px;color:var(--text-primary);font-family:var(--font)}
        .chip-input::placeholder{color:var(--text-muted)}
        .chip-add-btn{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:16px;line-height:1;padding:0}
        .tabs-bar{display:flex;border-bottom:1px solid var(--border);margin-bottom:24px}
        .tab-btn{padding:10px 14px;font-size:13px;font-weight:500;color:var(--text-muted);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:var(--font);letter-spacing:-0.01em;display:flex;align-items:center;gap:6px}
        .tab-btn.active{color:var(--text-primary);border-bottom-color:var(--text-primary)}
        .tab-count{font-size:11px;background:var(--border);color:var(--text-muted);padding:1px 6px;border-radius:var(--radius-full);font-weight:500}
        .tab-btn.active .tab-count{background:var(--text-primary);color:#fff}
        .empty-state{padding:64px 0;text-align:center}
        .empty-icon{font-size:32px;margin-bottom:12px;opacity:0.3}
        .empty-text{font-size:14px;color:var(--text-muted)}
        .posts-list{display:flex;flex-direction:column;gap:16px}
        .post-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .post-header{padding:14px 16px;display:flex;align-items:center;justify-content:space-between}
        .post-header-left{display:flex;align-items:center;gap:10px}
        .post-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;cursor:pointer;border:1px solid var(--border)}
        .post-avatar-fallback{width:32px;height:32px;border-radius:50%;background:var(--text-primary);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .post-avatar-fallback span{color:#fff;font-size:12px;font-weight:500}
        .post-name{font-size:13px;font-weight:600;color:var(--text-primary)}
        .post-date{font-size:11px;color:var(--text-muted);margin-top:1px}
        .delete-btn{font-size:12px;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:var(--radius-sm);font-family:var(--font)}
        .delete-btn:hover{color:var(--red);background:#fef2f2}
        .post-img{width:100%;object-fit:cover;display:block;cursor:pointer}
        .post-caption{padding:12px 16px;font-size:13px;color:var(--text-primary);line-height:1.5}
        .post-caption .author{font-weight:600}
        .post-footer{padding:10px 16px 14px;display:flex;gap:16px;border-top:1px solid var(--border)}
        .post-stat{font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px}
        .edit-form{margin-bottom:32px}
        .edit-form-header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)}
        .edit-avatar-wrap{position:relative;flex-shrink:0}
        .edit-avatar-img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid var(--border)}
        .edit-avatar-fallback{width:72px;height:72px;border-radius:50%;background:var(--text-primary);display:flex;align-items:center;justify-content:center}
        .edit-avatar-fallback span{color:#fff;font-size:24px;font-weight:500}
        .edit-form-heading{font-size:16px;font-weight:600;color:var(--text-primary);letter-spacing:-0.02em}
        .edit-form-sub{font-size:13px;color:var(--text-muted);margin-top:2px}
        .field-group{display:flex;flex-direction:column;gap:6px}
        .field-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)}
        .field-hint{font-size:10px;color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0}
        .field-input{width:100%;padding:10px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);color:var(--text-primary);font-family:var(--font);outline:none;box-sizing:border-box}
        .field-input:focus{border-color:var(--border-strong)}
        .field-textarea{width:100%;padding:10px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);color:var(--text-primary);font-family:var(--font);resize:vertical;outline:none;box-sizing:border-box}
        .field-textarea:focus{border-color:var(--border-strong)}
        .field-select{width:100%;padding:10px 12px;font-size:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);color:var(--text-primary);font-family:var(--font);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .fields-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .fields-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .btn-primary{height:42px;padding:0 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-md);font-size:14px;font-weight:500;font-family:var(--font);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
        .btn-primary:hover:not(:disabled){background:var(--accent-hover)}
        .btn-primary:disabled{opacity:.5;cursor:not-allowed}
        .btn-ghost{height:42px;padding:0 16px;background:transparent;color:var(--text-secondary);border:1px solid var(--border-strong);border-radius:var(--radius-md);font-size:14px;font-weight:500;font-family:var(--font);cursor:pointer}
        .btn-ghost:hover{background:var(--border);color:var(--text-primary)}
        .save-cancel-row{display:flex;gap:10px;padding-top:8px}
        .save-cancel-row .btn-primary{flex:1}
        .projects-list{display:flex;flex-direction:column;gap:16px}
        .publish-btn{width:100%;margin-bottom:16px;padding:12px;border:1.5px dashed var(--border-strong);border-radius:var(--radius-lg);background:transparent;font-size:13px;font-weight:500;color:var(--text-secondary);font-family:var(--font);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
        .publish-btn:hover{border-color:var(--accent);color:var(--text-primary);background:var(--surface)}
        .project-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .project-cover{height:160px;overflow:hidden}
        .project-cover img{width:100%;height:100%;object-fit:cover}
        .project-body{padding:16px}
        .project-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}
        .project-header-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .project-title{font-size:14px;font-weight:600;color:var(--text-primary);letter-spacing:-0.01em}
        .project-tagline{font-size:12px;color:var(--text-muted);margin-top:2px}
        .project-desc{font-size:13px;color:var(--text-secondary);line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .project-badge{font-size:10px;font-weight:500;padding:3px 10px;border-radius:var(--radius-full);white-space:nowrap;font-family:var(--font-mono)}
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
        .proj-link.muted,.proj-link.yt{color:var(--text-secondary)}
        .publish-form{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:16px;margin-bottom:20px}
        .form-header{display:flex;align-items:center;justify-content:space-between}
        .form-title{font-size:15px;font-weight:600;color:var(--text-primary);letter-spacing:-0.02em}
        .form-close{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:18px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%}
        .form-error{padding:10px 12px;background:#fef2f2;color:var(--red);font-size:13px;border-radius:var(--radius-sm);border:1px solid #fecaca}
        .form-actions{display:flex;gap:10px;padding-top:4px}
        .form-actions .btn-primary{flex:1}
        .cover-upload-zone{display:flex;gap:8px;flex-wrap:wrap}
        .cover-thumb{position:relative;width:80px;height:80px;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);flex-shrink:0}
        .cover-thumb img{width:100%;height:100%;object-fit:cover;display:block}
        .cover-remove{position:absolute;top:3px;right:3px;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:16px;height:16px;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center}
        .cover-add{width:80px;height:80px;border:1.5px dashed var(--border-strong);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;background:var(--surface);flex-shrink:0}
        .target-list{display:flex;flex-direction:column;gap:10px}
        .target-form-bar{display:flex;gap:8px;margin-bottom:14px}
        .target-form-bar .field-input{flex:1}
        .target-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden}
        .tc-top{padding:14px 16px;display:flex;align-items:flex-start;gap:8px}
        .target-title{font-size:13px;font-weight:600;color:var(--text-primary);line-height:1.3}
        .target-meta{font-size:11px;color:var(--text-muted);margin-top:3px}
        .tc-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
        .tc-dot.done{background:var(--green)}
        .tc-dot.active{background:var(--border-strong)}
        .tc-toggle{width:100%;padding:7px 16px;font-size:11px;color:var(--text-muted);background:var(--bg);border:none;border-top:1px solid var(--border);cursor:pointer;text-align:left;font-family:var(--font)}
        .tc-timeline{padding:10px 16px 4px;border-top:1px solid var(--border);background:var(--bg);display:flex;flex-direction:column;gap:0}
        .tc-tl-row{display:flex;gap:12px;padding-bottom:12px;position:relative}
        .tc-tl-row::before{content:"";position:absolute;left:6px;top:16px;bottom:0;width:1px;background:var(--border)}
        .tc-tl-row:last-child::before{display:none}
        .tc-tl-dot{width:13px;height:13px;border-radius:50%;border:2px solid var(--border);background:var(--surface);flex-shrink:0;margin-top:2px;position:relative;z-index:1}
        .tc-tl-dot.done-dot{border-color:var(--green);background:#f0fdf4}
        .tc-tl-dot.form-dot{border-color:var(--border-strong);background:var(--text-primary)}
        .tc-tl-body{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px}
        .pg-complete-tag{font-size:10px;font-weight:600;color:var(--green);font-family:var(--font-mono);letter-spacing:0.04em;display:block;margin-bottom:3px}
        .pg-text{font-size:13px;color:var(--text-primary);line-height:1.45}
        .pg-link{font-size:11px;color:var(--blue);text-decoration:none;word-break:break-all;display:block;margin-top:3px}
        .pg-thumb{max-width:110px;max-height:80px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border);display:block;margin-top:6px}
        .pg-date{font-size:10px;color:var(--text-muted);white-space:nowrap}
        .pg-form{display:flex;flex-direction:column;gap:8px}
        .pg-form-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted)}
        .pg-field{font-size:13px}
        .pg-img-btn{display:inline-flex;align-items:center;font-size:11px;color:var(--text-secondary);cursor:pointer;border:1px dashed var(--border-strong);border-radius:var(--radius-full);padding:3px 11px;width:fit-content}
        .tc-actions{padding:9px 16px;border-top:1px solid var(--border);display:flex;gap:8px}
        .tc-act-btn{font-size:12px;font-weight:500;padding:5px 14px;border-radius:var(--radius-full);cursor:pointer;font-family:var(--font);border:1px solid var(--border-strong);background:transparent;color:var(--text-secondary)}
        .tc-act-btn.finish{border-color:var(--green);color:var(--green)}
      `}</style>

      <div className="p-wrap">
        {modalImage && (
          <div className="p-modal" onClick={() => setModalImage(null)}>
            <img src={modalImage} alt="Enlarged" onClick={e => e.stopPropagation()} />
            <button className="p-modal-close" onClick={() => setModalImage(null)}>✕</button>
          </div>
        )}
        {toast && <div className={`p-toast ${toast.type}`}>{toast.msg}</div>}

        <div className="p-topbar">
          <div className="p-topbar-inner">
            <button className="p-back-btn" onClick={() => navigate(-1)}>←</button>
            <span className="p-topbar-handle">{form.username ? `@${form.username}` : "Profile"}</span>
            <NavLink to="/setting" className="p-settings-btn" title="Settings">⚙</NavLink>
          </div>
        </div>

        <div className="p-content">

          {/* ── View Mode ── */}
          {!isEditing && (
            <div className="profile-header">
              <div className="avatar-stats-row">
                <div className="avatar-wrap">
                  {imagePreview
                    ? <img src={imagePreview} alt="Profile" className="avatar-img" onClick={() => setModalImage(imagePreview)} />
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
                  <div className="edit-btn-row">
                    <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>Edit Profile</button>
                  </div>
                </div>
              </div>
              <div className="profile-info">
                <h1 className="profile-name">{form.name || "Your Name"}</h1>
                {form.username && <p className="profile-handle">@{form.username}</p>}
                {form.description && <p className="profile-bio">{form.description}</p>}
                {/* ✅ Shows course · branch · year · section */}
                {metaParts.length > 0 && <p className="profile-meta">{metaParts.join(" · ")}</p>}
              </div>
              <ChipSection title="Skills" items={form.skills} field="skills" editing={false} onChange={handleChipChange} />
              <ChipSection title="Interests" items={form.interests} field="interests" editing={false} onChange={handleChipChange} />
              <ChipSection title="Goals" items={form.goals} field="goals" editing={false} onChange={handleChipChange} />
            </div>
          )}

          {/* ── Edit Mode ── */}
          {isEditing && (
            <form onSubmit={saveProfile} className="edit-form">
              <div className="edit-form-header">
                <div className="edit-avatar-wrap">
                  {imagePreview
                    ? <img src={imagePreview} alt="Profile" className="edit-avatar-img" />
                    : <div className="edit-avatar-fallback"><span>{avatarLetter}</span></div>}
                  <label className="avatar-edit-btn" title="Change photo">
                    ✎<input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                  </label>
                  {profileImage && <span className="avatar-new-badge">New</span>}
                </div>
                <div>
                  <p className="edit-form-heading">Edit Profile</p>
                  <p className="edit-form-sub">Update your info and save</p>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="field-input" placeholder="Your full name" />
              </div>
              <div className="field-group">
                <label className="field-label">Username</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} className="field-input" placeholder="yourhandle" />
              </div>
              <div className="field-group">
                <label className="field-label">Bio</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="field-textarea" placeholder="A short bio…" />
              </div>

              {/* ✅ Course dropdown — dynamic */}
              <div className="field-group">
                <label className="field-label">Course</label>
                <select name="course" value={form.course} onChange={handleChange} className="field-select">
                  <option value="">Select course</option>
                  {Object.keys(COURSE_BRANCHES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* ✅ Branch — options driven by selected course */}
              {form.course && (
                <div className="fields-grid-2">
                  <div className="field-group">
                    <label className="field-label">Branch / Dept</label>
                    <select name="branch" value={form.branch} onChange={handleChange} className="field-select">
                      <option value="">Select</option>
                      {editBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Year</label>
                    <select name="year" value={form.year} onChange={handleChange} className="field-select">
                      <option value="">–</option>
                      {Array.from({ length: editMaxYear }, (_, i) => i + 1).map(y =>
                        <option key={y} value={y}>Year {y}</option>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* ✅ Section — only for BTech */}
              {editShowSection && (
                <div className="field-group">
                  <label className="field-label">Section</label>
                  <select name="section" value={form.section} onChange={handleChange} className="field-select">
                    <option value="">–</option>
                    {"ABCDEFGH".split("").map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}

              <ChipSection title="Skills" items={form.skills} field="skills" editing onChange={handleChipChange} />
              <ChipSection title="Interests" items={form.interests} field="interests" editing onChange={handleChipChange} />
              <ChipSection title="Goals" items={form.goals} field="goals" editing onChange={handleChipChange} />

              <div className="save-cancel-row">
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? <><span className="btn-spinner" />Saving…</> : "Save Changes"}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-ghost">Cancel</button>
              </div>
            </form>
          )}

          {/* ── Tabs ── */}
          <div className="tabs-bar">
            {TABS.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
                {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === "posts" && (
            postsLoading ? <div className="empty-state"><span className="loader-ring" /></div>
              : posts.length === 0 ? <div className="empty-state"><div className="empty-icon">◻</div><p className="empty-text">No posts yet</p></div>
                : <div className="posts-list">
                  {posts.map(post => (
                    <div key={post._id} className="post-card">
                      <div className="post-header">
                        <div className="post-header-left">
                          {imagePreview
                            ? <img src={imagePreview} alt={form.name} className="post-avatar" onClick={() => setModalImage(imagePreview)} />
                            : <div className="post-avatar-fallback"><span>{avatarLetter}</span></div>}
                          <div>
                            <p className="post-name">{form.name}</p>
                            <p className="post-date">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeletePost(post._id)} className="delete-btn">Delete</button>
                      </div>
                      {post.image && <img src={post.image} alt={post.caption || "post"} className="post-img" onClick={() => setModalImage(post.image)} />}
                      {post.caption && <p className="post-caption"><span className="author">{form.name}</span>{" "}{post.caption}</p>}
                      <div className="post-footer">
                        <span className="post-stat">♡ {(post.likes || []).length}</span>
                        <span className="post-stat">◯ {(post.comments || []).length}</span>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {activeTab === "projects" && (
            <div>
              {!showPublishForm && <button className="publish-btn" onClick={() => setShowPublishForm(true)}><span style={{ fontSize: 16 }}>+</span> Publish a Project</button>}
              {showPublishForm && (
                <PublishProjectForm
                  onPublished={(project) => { setProjects(p => [project, ...p]); setShowPublishForm(false); showToast("Project published!"); }}
                  onCancel={() => setShowPublishForm(false)}
                />
              )}
              {projectsLoading ? <div className="empty-state"><span className="loader-ring" /></div>
                : projects.length === 0 && !showPublishForm ? <div className="empty-state"><div className="empty-icon">⬡</div><p className="empty-text">No projects yet</p></div>
                  : <div className="projects-list">{projects.map(p => <ProjectCard key={p._id} project={p} onDelete={handleDeleteProject} />)}</div>}
            </div>
          )}

          {activeTab === "progress" && (
            <div>
              {showTargetForm ? (
                <div className="target-form-bar" style={{ marginBottom: 16 }}>
                  <input value={newTargetTitle} onChange={e => setNewTargetTitle(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateTarget()}
                    placeholder="Write your target…" className="field-input" autoFocus />
                  <button onClick={handleCreateTarget} disabled={creatingTarget || !newTargetTitle.trim()}
                    className="btn-primary" style={{ height: 42, padding: "0 16px", fontSize: 13, flexShrink: 0 }}>
                    {creatingTarget ? "…" : "Publish"}
                  </button>
                  <button onClick={() => { setShowTargetForm(false); setNewTargetTitle(""); }}
                    className="btn-ghost" style={{ height: 42, padding: "0 12px", fontSize: 13, flexShrink: 0 }}>Cancel</button>
                </div>
              ) : (
                <button className="publish-btn" onClick={() => setShowTargetForm(true)} style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>+</span> Add Target &amp; Track Progress
                </button>
              )}
              {targetsLoading ? <div className="empty-state"><span className="loader-ring" /></div>
                : targets.length === 0 ? <div className="empty-state"><div className="empty-icon">◎</div><p className="empty-text">No targets yet</p></div>
                  : <div className="target-list">
                    {targets.map(t => (
                      <TargetCard key={t._id} target={t} onDelete={handleDeleteTarget}
                        onAddProgress={handleAddProgress} onDeleteProgress={handleDeleteProgress} />
                    ))}
                  </div>}
            </div>
          )}

          {activeTab === "products" && (
            <div className="empty-state"><div className="empty-icon">◈</div><p className="empty-text">No products listed yet</p></div>
          )}
        </div>
      </div>
    </>
  );
}