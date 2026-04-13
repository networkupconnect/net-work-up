import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/* ─── Predeclared subjects ──────────────────────────────────────────────── */
const BASE_SUBJECTS = [
  "Maths","Physics","Chemistry","Biology",
  "CS","DBMS","OS","Networks","DSA",
  "Electronics","English","Economics",
];
const CUSTOM_KEY = "res_custom_subjects";
function loadCustom() { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)||"[]"); } catch { return []; } }
function saveCustom(arr) { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(arr)); } catch {} }

/* ─── Shared styles ─────────────────────────────────────────────────────── */
const inp = {
  width:"100%", padding:"9px 12px", borderRadius:10,
  border:"1px solid #e5e3dc", background:"#fff",
  fontSize:13, fontFamily:"inherit", color:"#1a1a18",
  outline:"none", boxSizing:"border-box",
};
const lbl = {
  fontSize:10, fontWeight:700, color:"#9b9890",
  textTransform:"uppercase", letterSpacing:".05em",
  display:"block", marginBottom:7,
};
const pill = (active) => ({
  padding:"5px 12px", borderRadius:100, fontSize:12, fontWeight:600,
  border:"none", cursor:"pointer", transition:"all .13s",
  background: active ? "#1a1a18" : "#f0ede8",
  color:       active ? "#fff"    : "#6b6860",
  flexShrink:0, whiteSpace:"nowrap",
});

/* ─── ResourceForm — shared between Add and Edit modals ─────────────────── */
function ResourceForm({
  initial,       // null for new, resource object for edit
  activeTab,
  allSubjects,
  onSave,        // async fn(payload) → throws on error
  onClose,
  showToast,
  onNewSubject,
  saving,
  mode,          // "add" | "edit"
}) {
  /* Parse existing unit string back into counter + topic */
  function parseUnit(str) {
    if (!str || str === "General") return { num: 1, topic: "" };
    const m = str.match(/^Module\s+(\d+)(?:\s+—\s+(.+))?$/i);
    if (m) return { num: parseInt(m[1], 10)||1, topic: m[2]||"" };
    return { num: 1, topic: str };
  }

  const parsed = parseUnit(initial?.unit);

  const [title,       setTitle]       = useState(initial?.title       || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [lectureLink, setLectureLink] = useState(initial?.lectureLink || "");
  const [notesLink,   setNotesLink]   = useState(initial?.notesLink   || "");
  const [unit,        setUnit]        = useState(parsed.num);
  const [topic,       setTopic]       = useState(parsed.topic);

  /* Subject state */
  const initSubj = initial?.subject || "";
  const isBaseOrExtra = allSubjects.some(s => s.toLowerCase() === initSubj.toLowerCase());
  const [subject,    setSubject]    = useState(isBaseOrExtra ? initSubj : "");
  const [isOther,    setIsOther]    = useState(!!initSubj && !isBaseOrExtra);
  const [customSubj, setCustomSubj] = useState(isBaseOrExtra ? "" : initSubj);

  const finalSubject = isOther ? customSubj.trim() : subject;
  const tabLabel = { notes:"Note", pyq:"PYQ", assignment:"Assignment" }[activeTab] || "Resource";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim())    return showToast("Title is required");
    if (!finalSubject)    return showToast("Select or enter a subject");
    if (!lectureLink.trim() && !notesLink.trim()) return showToast("Add at least one link");

    if (isOther && customSubj.trim()) onNewSubject(customSubj.trim());

    const unitStr = topic.trim()
      ? `Module ${unit} — ${topic.trim()}`
      : `Module ${unit}`;

    await onSave({
      title:       title.trim(),
      description: description.trim(),
      subject:     finalSubject,
      unit:        unitStr,
      lectureLink: lectureLink.trim(),
      notesLink:   notesLink.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Title */}
      <div>
        <label style={lbl}>Title *</label>
        <input style={inp} placeholder="e.g. Fourier Series full lecture" value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>

      {/* Subject */}
      <div>
        <label style={lbl}>Subject *</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {allSubjects.map(s => (
            <button key={s} type="button" style={pill(!isOther && subject.toLowerCase()===s.toLowerCase())}
              onClick={() => { setSubject(s); setIsOther(false); }}>
              {s}
            </button>
          ))}
          <button type="button"
            style={{ ...pill(isOther), border: isOther ? "none" : "1.5px dashed #c5c2b8" }}
            onClick={() => { setIsOther(true); setSubject(""); }}>
            + Other
          </button>
        </div>
        {isOther && (
          <div style={{ marginTop:8 }}>
            <input style={{ ...inp, borderColor: customSubj.trim() ? "#1a1a18" : "#e5e3dc" }}
              placeholder="Type subject name…" value={customSubj}
              onChange={e=>setCustomSubj(e.target.value)} autoFocus />
            <div style={{ fontSize:10, color:"#9b9890", marginTop:3 }}>Will be added to the subject list</div>
          </div>
        )}
      </div>

      {/* Module counter + optional topic */}
      <div>
        <label style={lbl}>Unit / Module</label>
        <div style={{ display:"flex", alignItems:"center", gap:0, background:"#f5f4f0", borderRadius:10, padding:"3px", width:"fit-content" }}>
          <button type="button" onClick={() => setUnit(u=>Math.max(1,u-1))} disabled={unit<=1}
            style={{ width:34, height:34, borderRadius:8, border:"none", background:unit<=1?"transparent":"#fff", cursor:unit<=1?"not-allowed":"pointer", fontSize:18, fontWeight:700, color:unit<=1?"#ccc":"#1a1a18", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:unit<=1?"none":"0 1px 3px rgba(0,0,0,.08)", transition:"all .12s" }}>
            −
          </button>
          <span style={{ minWidth:56, textAlign:"center", fontSize:14, fontWeight:700, fontFamily:"monospace", color:"#1a1a18" }}>
            {unit}
          </span>
          <button type="button" onClick={() => setUnit(u=>u+1)}
            style={{ width:34, height:34, borderRadius:8, border:"none", background:"#fff", cursor:"pointer", fontSize:18, fontWeight:700, color:"#1a1a18", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 3px rgba(0,0,0,.08)", transition:"all .12s" }}>
            +
          </button>
        </div>
        <div style={{ marginTop:8 }}>
          <input style={{ ...inp, fontSize:12 }}
            placeholder="Topic (optional) — e.g. Laplace Transforms, Recursion…"
            value={topic} onChange={e=>setTopic(e.target.value)} />
        </div>
        <div style={{ marginTop:5, fontSize:11, color:"#9b9890" }}>
          Saved as: <strong style={{ color:"#1a1a18" }}>
            {topic.trim() ? `Unit ${unit} — ${topic.trim()}` : `Unit ${unit}`}
          </strong>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop:"1px solid #f0ede8" }} />

      {/* Lecture link */}
      <div>
        <label style={lbl}>Lecture Link</label>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#9b9890", pointerEvents:"none" }}>▶</span>
          <input style={{...inp, paddingLeft:28}} placeholder="YouTube video or playlist URL"
            value={lectureLink} onChange={e=>setLectureLink(e.target.value)} type="url" />
        </div>
        <div style={{ fontSize:10, color:"#b5b3ac", marginTop:3 }}>YouTube video or playlist</div>
      </div>

      {/* Notes link */}
      <div>
        <label style={lbl}>Notes Link</label>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#9b9890", pointerEvents:"none" }}>↗</span>
          <input style={{...inp, paddingLeft:28}} placeholder="Google Drive, PDF link…"
            value={notesLink} onChange={e=>setNotesLink(e.target.value)} type="url" />
        </div>
        <div style={{ fontSize:10, color:"#b5b3ac", marginTop:3 }}>Google Drive, any public URL</div>
      </div>

      {/* Description */}
      <div>
        <label style={lbl}>Description</label>
        <textarea style={{...inp, resize:"none", minHeight:50, fontSize:12}}
          placeholder="Optional — any extra context"
          value={description} onChange={e=>setDescription(e.target.value)} rows={2} />
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8, paddingTop:2 }}>
        <button type="submit" disabled={saving}
          style={{ flex:1, padding:"11px", borderRadius:11, border:"none", background:"#1a1a18", color:"#fff", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", opacity:saving?.6:1, fontFamily:"inherit" }}>
          {saving ? "Saving…" : mode==="edit" ? "Save Changes" : `Add ${tabLabel}`}
        </button>
        <button type="button" onClick={onClose}
          style={{ padding:"11px 16px", borderRadius:11, border:"1px solid #e5e3dc", background:"#f5f4f0", color:"#6b6860", fontSize:13, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Add Modal ─────────────────────────────────────────────────────────── */
function AddModal({ activeTab, onClose, onSuccess, showToast, extraSubjects, onNewSubject }) {
  const [saving, setSaving] = useState(false);
  const allSubjects = [...BASE_SUBJECTS, ...extraSubjects];

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      await api.post("/api/resources", { ...payload, type: activeTab });
      onSuccess();
      onClose();
      showToast("Saved!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <ModalShell title={`Add ${({ notes:"Note", pyq:"PYQ", assignment:"Assignment" }[activeTab]||"Resource")}`} onClose={onClose}>
      <ResourceForm
        initial={null}
        activeTab={activeTab}
        allSubjects={allSubjects}
        onSave={handleSave}
        onClose={onClose}
        showToast={showToast}
        onNewSubject={onNewSubject}
        saving={saving}
        mode="add"
      />
    </ModalShell>
  );
}

/* ─── Edit Modal ─────────────────────────────────────────────────────────── */
function EditModal({ resource, activeTab, onClose, onSuccess, showToast, extraSubjects, onNewSubject }) {
  const [saving, setSaving] = useState(false);

  // Always include this resource's existing subject in the pill list
  // so it shows pre-selected even if it's not in base or custom lists yet
  const resourceSubject = resource?.subject || "";
  const baseAndExtra = [...BASE_SUBJECTS, ...extraSubjects];
  const alreadyKnown = baseAndExtra.some(s => s.toLowerCase() === resourceSubject.toLowerCase());
  const allSubjects  = alreadyKnown ? baseAndExtra : [...baseAndExtra, resourceSubject].filter(Boolean);

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      await api.patch(`/api/resources/${resource._id}`, payload);
      onSuccess();
      onClose();
      showToast("Updated!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <ModalShell title="Edit Resource" onClose={onClose}>
      <ResourceForm
        initial={resource}
        activeTab={activeTab}
        allSubjects={allSubjects}
        onSave={handleSave}
        onClose={onClose}
        showToast={showToast}
        onNewSubject={onNewSubject}
        saving={saving}
        mode="edit"
      />
    </ModalShell>
  );
}

/* ─── Modal shell ───────────────────────────────────────────────────────── */
function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.2)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16 }}
         onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:"18px 18px 0 0", width:"100%", maxWidth:520, maxHeight:"93vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,.1)" }}
           onClick={e=>e.stopPropagation()}>
        <div style={{ padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ fontSize:15, fontWeight:800 }}>{title}</div>
            <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, border:"1px solid #e5e3dc", background:"#f5f4f0", cursor:"pointer", color:"#9b9890", fontSize:13 }}>✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Resource Card ─────────────────────────────────────────────────────── */
function ResourceCard({ resource, user, onDelete, onEdit }) {
  const hasLecture = !!resource.lectureLink;
  const hasNotes   = !!resource.notesLink;
  const isOwner    = user?._id === resource.uploadedBy?._id?.toString();
  const isAdmin    = user?.role === "admin";
  const canDelete  = isOwner || isAdmin;

  const openLink = (url) => url && window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div style={{ background:"#fff", border:"1px solid #e5e3dc", borderRadius:13, padding:"13px 15px" }}>

      {/* Title row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:7 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, lineHeight:1.4 }}>{resource.title}</div>
          {resource.description && (
            <div style={{ fontSize:11, color:"#9b9890", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {resource.description}
            </div>
          )}
        </div>

        {/* Action buttons — top-right */}
        <div style={{ display:"flex", gap:6, flexShrink:0, alignItems:"center" }}>
          {/* Edit — visible to everyone */}
          <button onClick={() => onEdit(resource)}
            style={{ padding:"3px 10px", borderRadius:7, border:"1px solid #e5e3dc", background:"#f5f4f0", color:"#6b6860", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Edit
          </button>
          {/* Delete — owner or admin only */}
          {canDelete && (
            <button onClick={() => onDelete(resource._id)}
              style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#d1d0ca", padding:0 }}>
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"#1a1a18", color:"#fff", fontWeight:700 }}>
          {resource.subject}
        </span>
        {resource.unit && resource.unit !== "General" && (
          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"#f0ede8", color:"#6b6860", fontWeight:600 }}>
            {resource.unit}
          </span>
        )}
      </div>

      {/* Link buttons */}
      {(hasLecture || hasNotes) && (
        <div style={{ display:"flex", gap:7 }}>
          {hasLecture && (
            <button onClick={() => openLink(resource.lectureLink)}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 12px", borderRadius:9, border:"1px solid #e5e3dc", background:"#fafaf9", cursor:"pointer", fontSize:12, fontWeight:600, color:"#1a1a18", fontFamily:"inherit" }}>
              <span style={{ fontSize:12 }}>▶</span> Lecture
            </button>
          )}
          {hasNotes && (
            <button onClick={() => openLink(resource.notesLink)}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"8px 12px", borderRadius:9, border:"1px solid #e5e3dc", background:"#fafaf9", cursor:"pointer", fontSize:12, fontWeight:600, color:"#1a1a18", fontFamily:"inherit" }}>
              <span style={{ fontSize:12 }}>↗</span> Notes
            </button>
          )}
        </div>
      )}

    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function Resources() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resources,     setResources]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("notes");
  const [activeSubject, setActiveSubject] = useState("all");
  const [showAdd,       setShowAdd]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);   // resource being edited
  const [toast,         setToast]         = useState(null);
  const [customSubjects, setCustomSubjects] = useState(() => loadCustom());

  useEffect(() => { fetchResources(); }, [activeTab]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setActiveSubject("all");
      const res = await api.get(`/api/resources/all?type=${activeTab}`);
      setResources(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/api/resources/${id}`);
      setResources(r => r.filter(x => x._id !== id));
      showToast("Deleted");
    } catch { showToast("Failed to delete"); }
  };

  const handleNewSubject = (name) => {
    const all = [...BASE_SUBJECTS, ...customSubjects];
    if (all.map(s => s.toLowerCase()).includes(name.toLowerCase())) return;
    const updated = [...customSubjects, name];
    setCustomSubjects(updated);
    saveCustom(updated);
  };

  /* Subject deduplication */
  const dbSubjects   = Array.from(new Set(resources.map(r => r.subject).filter(Boolean)));
  const knownLower   = new Set([...BASE_SUBJECTS, ...customSubjects].map(s => s.toLowerCase()));
  const dbOnly       = dbSubjects.filter(s => !knownLower.has(s.toLowerCase()));
  const extraSubjects = [...customSubjects, ...dbOnly];

  const allKnown    = [...BASE_SUBJECTS, ...extraSubjects];
  const tagSubjects = ["all", ...Array.from(new Set(
    dbSubjects.map(s => allKnown.find(k => k.toLowerCase() === s.toLowerCase()) || s)
  ))];

  const filtered = activeSubject === "all"
    ? resources
    : resources.filter(r => r.subject?.toLowerCase() === activeSubject.toLowerCase());

  const TABS = [
    { id:"notes",      label:"Notes"       },
    { id:"pyq",        label:"PYQs"        },
    { id:"assignment", label:"Assignments" },
  ];

  const S = {
    page:    { minHeight:"100vh", background:"#fafaf9", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#1a1a18", fontSize:14 },
    wrap:    { maxWidth:600, margin:"0 auto", padding:"20px 16px 88px" },
    hdr:     { display:"flex", alignItems:"center", gap:12, marginBottom:22 },
    backBtn: { width:34, height:34, borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", cursor:"pointer", fontSize:17, color:"#6b6860", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
    btn:     { padding:"8px 14px", borderRadius:10, border:"none", background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
    tabBar:  { display:"flex", borderBottom:"1.5px solid #e5e3dc", marginBottom:14 },
    tab:     (a) => ({ padding:"8px 0", marginRight:22, fontSize:13, fontWeight:700, border:"none", background:"transparent", cursor:"pointer", color:a?"#1a1a18":"#9b9890", borderBottom:a?"2px solid #1a1a18":"2px solid transparent", marginBottom:"-1.5px", transition:"color .13s" }),
    ptag:    (a) => ({ padding:"5px 12px", borderRadius:100, fontSize:11, fontWeight:600, border:"none", cursor:"pointer", background:a?"#1a1a18":"#f0ede8", color:a?"#fff":"#6b6860", transition:"all .13s", whiteSpace:"nowrap", flexShrink:0 }),
  };

  const modalProps = { activeTab, showToast, extraSubjects, onNewSubject: handleNewSubject, onSuccess: fetchResources };

  return (
    <div style={S.page}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:99, padding:"9px 16px", borderRadius:11, background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,.18)" }}>
          {toast}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddModal {...modalProps} onClose={() => setShowAdd(false)} />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EditModal {...modalProps} resource={editTarget} onClose={() => setEditTarget(null)} />
      )}

      <div style={S.wrap}>

        {/* Header */}
        <div style={S.hdr}>
          <button style={S.backBtn} onClick={() => navigate("/")}>‹</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.3px" }}>Resources</div>
            <div style={{ fontSize:11, color:"#9b9890", marginTop:1 }}>Notes · PYQs · Assignments</div>
          </div>
          <button style={S.btn} onClick={() => setShowAdd(true)}>+ Add</button>
        </div>

        {/* Underline Tabs */}
        <div style={S.tabBar}>
          {TABS.map(t => (
            <button key={t.id} style={S.tab(activeTab===t.id)} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Subject Tag Filters */}
        {tagSubjects.length > 1 && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:14 }}>
            {tagSubjects.map(s => (
              <button key={s} style={S.ptag(activeSubject===s)} onClick={() => setActiveSubject(s)}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#9b9890" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px", background:"#fff", border:"1px solid #e5e3dc", borderRadius:14 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
            <div style={{ fontWeight:700, marginBottom:4 }}>Nothing here yet</div>
            <div style={{ fontSize:12, color:"#9b9890", marginBottom:16 }}>Be the first to add</div>
            <button style={S.btn} onClick={() => setShowAdd(true)}>+ Add</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(resource => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                user={user}
                onDelete={handleDelete}
                onEdit={setEditTarget}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}