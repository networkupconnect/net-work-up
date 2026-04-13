import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Users", "Products", "Rooms", "Feedback", "Internships", "Personas"];

const ROLE_COLORS = {
  admin: "role-admin",
  seller: "role-seller",
  user: "role-user",
};

const STATUS_COLORS = {
  new: "fb-new",
  "in-review": "fb-review",
  resolved: "fb-resolved",
  dismissed: "fb-dismissed",
};

const ROOM_FACILITIES = [
  "WiFi", "AC", "Cooler", "Geyser", "Attached Bathroom", "Furnished",
  "Parking", "24/7 Water", "Security", "CCTV", "Washing Machine",
  "Kitchen", "Mess", "Gym", "Power Backup",
];

// ─── Tag extraction (mirrors server-side logic) ───────────────────────────────
const TAG_RULES = [
  { tags: ["Web Development", "Frontend"],   keywords: ["react","vue","angular","html","css","javascript","typescript","frontend","web dev","next.js","gatsby","svelte"] },
  { tags: ["Backend"],                        keywords: ["node.js","express","django","flask","spring","backend","api","rest","graphql","php","ruby on rails","laravel"] },
  { tags: ["Full Stack"],                     keywords: ["full stack","fullstack","mern","mean","lamp"] },
  { tags: ["Mobile Development"],             keywords: ["android","ios","flutter","react native","swift","kotlin","mobile app","xamarin"] },
  { tags: ["Machine Learning", "AI"],         keywords: ["machine learning","deep learning","nlp","natural language","neural network","tensorflow","pytorch","llm","generative ai","computer vision","ai/ml","artificial intelligence"] },
  { tags: ["Data Science"],                   keywords: ["data science","data scientist","data analyst","pandas","numpy","jupyter","statistics","r programming","tableau","power bi","excel","data mining"] },
  { tags: ["DevOps", "Cloud"],                keywords: ["devops","docker","kubernetes","aws","azure","gcp","ci/cd","terraform","linux","cloud","infrastructure","ansible","jenkins"] },
  { tags: ["Graphic Design"],                 keywords: ["graphic design","illustrator","photoshop","figma","canva","adobe","brand design","visual design","corel","print design"] },
  { tags: ["UI/UX Design"],                   keywords: ["ui/ux","ui design","ux design","user experience","user interface","wireframe","prototype","interaction design","sketch","invision"] },
  { tags: ["Cybersecurity"],                  keywords: ["cybersecurity","security","penetration testing","ethical hacking","soc","vulnerability","ctf","network security","infosec"] },
  { tags: ["Blockchain"],                     keywords: ["blockchain","web3","solidity","ethereum","smart contract","crypto","nft","defi","dapp"] },
  { tags: ["Marketing"],                      keywords: ["marketing","seo","sem","social media","content marketing","email marketing","growth hacking","ppc","digital marketing","influencer","brand"] },
  { tags: ["Video Editing", "Media"],         keywords: ["video editing","premiere pro","after effects","motion graphics","videography","youtube","content creator","photography","lightroom"] },
  { tags: ["Finance"],                        keywords: ["finance","accounting","fintech","investment","banking","equity research","ca","chartered accountant","financial","audit","taxation"] },
  { tags: ["Business Development", "Sales"],  keywords: ["business development","sales","crm","b2b","lead generation","business analyst","business strategy","account management"] },
  { tags: ["Product Management"],             keywords: ["product manager","product management","roadmap","agile","scrum","jira","product owner","sprint"] },
  { tags: ["Research"],                       keywords: ["research","publication","thesis","academia","lab","scientific","r&d","research analyst"] },
  { tags: ["HR", "Operations"],               keywords: ["human resources","hr","talent acquisition","recruitment","operations","people operations","payroll"] },
  { tags: ["Game Development"],               keywords: ["game dev","unity","unreal","game design","godot"] },
  { tags: ["Embedded Systems", "IoT"],        keywords: ["embedded","iot","arduino","raspberry pi","firmware","rtos","microcontroller","vhdl","fpga"] },
  { tags: ["Python"],                         keywords: ["python"] },
  { tags: ["Java"],                           keywords: ["java"] },
  { tags: ["C++"],                            keywords: ["c++","cpp"] },
  { tags: ["Internship"],                     keywords: ["intern","internship","trainee","apprentice"] },
  { tags: ["Remote"],                         keywords: ["remote","work from home","wfh"] },
];

function extractTags(title = "", description = "") {
  const haystack = `${title} ${description}`.toLowerCase();
  const found = new Set();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some(kw => haystack.includes(kw))) {
      rule.tags.forEach(t => found.add(t));
    }
  }
  return [...found];
}

// ─── Shared Field ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="adm-field">
      <label className="adm-field-label">{label}</label>
      {children}
    </div>
  );
}

// ─── Image Upload Component ───────────────────────────────────────────────────
function ImageUpload({ value, onChange, label = "Image" }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/api/upload/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url || res.data.imageUrl || res.data.secure_url);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target.result);
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="adm-field">
      <label className="adm-field-label">{label}</label>
      <div
        className="img-upload-zone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        {preview ? (
          <div className="img-upload-preview">
            <img src={preview} alt="preview" />
            <div className="img-upload-overlay"><span>Change</span></div>
          </div>
        ) : (
          <div className="img-upload-empty">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>{uploading ? "Uploading…" : "Click or drag to upload"}</span>
          </div>
        )}
        {uploading && <div className="img-upload-spinner" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />
      <input type="text" value={value || ""}
        onChange={(e) => { onChange(e.target.value); setPreview(e.target.value); }}
        placeholder="…or paste image URL" className="adm-input mt-2" style={{ fontSize: 11 }} />
    </div>
  );
}

// ─── Room Modal ───────────────────────────────────────────────────────────────
function RoomModal({ room, onClose, onSave }) {
  const [form, setForm] = useState(
    room ?? {
      title: "", description: "", type: "room", rent: "",
      location: "", contactName: "", contactPhone: "",
      facilities: [], isAvailable: true, images: [],
    }
  );
  const [saving, setSaving] = useState(false);

  const toggle = (f) =>
    setForm((p) => ({
      ...p,
      facilities: p.facilities.includes(f)
        ? p.facilities.filter((x) => x !== f)
        : [...p.facilities, f],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>{room?._id ? "Edit Room" : "Add Room"}</h2>
          <button onClick={onClose} className="adm-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="adm-modal-body">
          <div className="adm-grid-2">
            <Field label="Title *">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="adm-input" placeholder="e.g. 2BHK near campus" />
            </Field>
            <Field label="Type *">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="adm-select">
                <option value="room">Room</option>
                <option value="roommate">Roommate</option>
              </select>
            </Field>
            <Field label="Rent / month (₹) *">
              <input required type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} className="adm-input" placeholder="5000" />
            </Field>
            <Field label="Location *">
              <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="adm-input" placeholder="Area, City" />
            </Field>
            <Field label="Contact Name">
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="adm-input" />
            </Field>
            <Field label="Contact Phone">
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="adm-input" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="adm-textarea" />
          </Field>
          <ImageUpload label="Room Photo" value={form.images?.[0] || ""}
            onChange={(url) => setForm({ ...form, images: [url] })} />
          <Field label="Facilities">
            <div className="chip-grid">
              {ROOM_FACILITIES.map((f) => (
                <button key={f} type="button" onClick={() => toggle(f)}
                  className={`facility-chip ${form.facilities.includes(f) ? "active" : ""}`}>
                  {f}
                </button>
              ))}
            </div>
          </Field>
          <label className="adm-checkbox-row">
            <input type="checkbox" checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            <span>Mark as Available</span>
          </label>
          <div className="adm-modal-actions">
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? "Saving…" : room?._id ? "Save Changes" : "Create Room"}
            </button>
            <button type="button" onClick={onClose} className="adm-btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "",
    condition: "new", image: "", stock: 1,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Add Product</h2>
          <button onClick={onClose} className="adm-modal-close">✕</button>
        </div>
        <form onSubmit={submit} className="adm-modal-body">
          <div className="adm-grid-2">
            <Field label="Title *">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="adm-input" placeholder="Product name" />
            </Field>
            <Field label="Price (₹) *">
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="adm-input" placeholder="299" />
            </Field>
            <Field label="Category">
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="adm-input" placeholder="Books, Electronics…" />
            </Field>
            <Field label="Condition">
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="adm-select">
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </Field>
            <Field label="Stock">
              <input type="number" min={1} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="adm-input" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="adm-textarea" />
          </Field>
          <ImageUpload label="Product Image" value={form.image}
            onChange={(url) => setForm({ ...form, image: url })} />
          <div className="adm-modal-actions">
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? "Adding…" : "Add Product"}
            </button>
            <button type="button" onClick={onClose} className="adm-btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Internship Import Modal ──────────────────────────────────────────────────
function InternshipImportModal({ onClose, onSuccess, showToast }) {
  const [jsonText, setJsonText]     = useState("");
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const fileRef                     = useRef(null);

  // Normalise one LinkedIn-scraped job object → our schema (with auto-extracted tags)
  function normaliseLinkedIn(j, index) {
    const loc      = j["Location"] || j.location || "";
    const isRemote = loc.toLowerCase().includes("remote") ||
                     (j["Employment type"] || "").toLowerCase().includes("remote");
    const empRaw   = (j["Employment type"] || j.type || "").toLowerCase();
    const type     =
      empRaw.includes("intern")   ? "Internship" :
      empRaw.includes("part")     ? "Part-time"  :
      empRaw.includes("contract") ? "Contract"   :
      empRaw.includes("full")     ? "Full-time"  :
      j["Employment type"] || j.type || "";

    const postLink   = j["Post Link"] || j.url || j.job_url || "";
    const cleanLink  = postLink.split("?")[0];
    const externalId = `li_${cleanLink.split("/").filter(Boolean).pop() || `import-${Date.now()}-${index}`}`;
    const title      = j["Title"]   || j.title   || "";
    const description = ((j["Description"] || j.description || "").replace(/Show more\s*$/, "").trim()).slice(0, 1000);

    return {
      externalId,
      title,
      company:     j["Company"]     || j.company      || j.organization || "",
      location:    loc,
      type,
      url:         cleanLink        || j.apply_url     || "",
      description,
      logo:        j["Logo"]        || j.logo          || j.company_logo || "",
      remote:      isRemote,
      source:      "LinkedIn",
      tags:        extractTags(title, description),   // ← auto-extracted role/skill tags
      postedAt:    null,
      fetchedAt:   new Date().toISOString(),
    };
  }

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setJsonText(e.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError("");
    setResult(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch {
      setError("Invalid JSON — please check the format and try again.");
      return;
    }

    if (!Array.isArray(parsed)) {
      setError("JSON must be an array of job objects.");
      return;
    }

    if (parsed.length === 0) {
      setError("Array is empty — nothing to import.");
      return;
    }

    const docs = parsed.map((j, i) => normaliseLinkedIn(j, i));

    setImporting(true);
    try {
      const res = await api.post("/api/admin/internships/import", { jobs: docs });
      setResult(res.data);
      showToast(`Imported ${res.data.inserted + res.data.updated} internships`);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const previewCount = (() => {
    try { const p = JSON.parse(jsonText.trim()); return Array.isArray(p) ? p.length : 0; } catch { return 0; }
  })();

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Import Internships (JSON)</h2>
          <button onClick={onClose} className="adm-modal-close">✕</button>
        </div>
        <div className="adm-modal-body">

          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "12px 14px", fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text)", display: "block", marginBottom: 4 }}>Supported formats:</strong>
            LinkedIn scraper JSON (fields: Title, Company, Location, Post Link, Description, Logo, Employment type)<br />
            OR any array with fields: title, company, location, url, description, logo, type<br />
            <span style={{ color: "var(--green)", fontWeight: 600 }}>✦ Role tags are auto-extracted from title &amp; description</span>
          </div>

          <Field label="Upload JSON File">
            <div
              style={{ border: "1.5px dashed var(--border-2)", borderRadius: "var(--r-lg)", padding: "20px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            >
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                {jsonText
                  ? <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ File loaded — {jsonText.length.toLocaleString()} chars</span>
                  : "Click or drag a .json file here"}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])} />
          </Field>

          <Field label="Or Paste JSON directly">
            <textarea
              className="adm-textarea"
              rows={8}
              placeholder={'[\n  { "Title": "Software Intern", "Company": "Google", "Location": "Bengaluru, India", ... },\n  ...\n]'}
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setResult(null); setError(""); }}
              style={{ fontFamily: "var(--mono)", fontSize: 11 }}
            />
          </Field>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 12, color: "var(--red)" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "var(--r-md)", padding: "12px 14px", fontSize: 13 }}>
              <strong style={{ color: "var(--green)" }}>✓ Import complete</strong>
              <div style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 12, color: "var(--text-2)" }}>
                <span>Inserted: <strong>{result.inserted}</strong></span>
                <span>Updated: <strong>{result.updated}</strong></span>
                <span>Total: <strong>{result.total}</strong></span>
              </div>
            </div>
          )}

          <div className="adm-modal-actions">
            <button onClick={handleImport} disabled={importing || !jsonText.trim()} className="adm-btn-primary">
              {importing ? "Importing…" : previewCount > 0 ? `Import ${previewCount} jobs` : "Import"}
            </button>
            <button onClick={onClose} className="adm-btn-ghost">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value ?? "—"}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ total, page, setPage, limit = 15 }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="adm-pagination">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="adm-page-btn">← Prev</button>
      <span className="adm-page-info">{page} / {totalPages}</span>
      <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="adm-page-btn">Next →</button>
    </div>
  );
}

// ─── Table Loading Skeleton ───────────────────────────────────────────────────
function TableSkeleton({ cols = 5 }) {
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="adm-tr" style={{ animationDelay: `${i * 50}ms` }}>
              {[...Array(cols)].map((_, j) => (
                <td key={j} className="adm-td">
                  <div className="skeleton-line" style={{ width: j === 0 ? "60%" : j === cols - 1 ? "40%" : "80%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Branch Student Card ──────────────────────────────────────────────────────
function BranchStudentRow({ u }) {
  return (
    <div className="branch-student-row">
      <div className="user-cell">
        {u.profileImage
          ? <img src={u.profileImage} alt="" className="user-avatar" />
          : <div className="user-avatar-fallback">{u.name?.[0]?.toUpperCase() || "?"}</div>}
        <div>
          <p className="user-name">{u.name || "—"}</p>
          {u.username && <p className="user-handle">@{u.username}</p>}
        </div>
      </div>
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{u.email}</span>
      {u.phone
        ? <span className="phone-badge">📞 {u.phone}</span>
        : <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span>}
      <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
        {u.year ? `Year ${u.year}` : "—"}{u.section ? ` · ${u.section}` : ""}
      </span>
      <span className={`badge ${ROLE_COLORS[u.role] || "role-user"}`}>{u.role}</span>
    </div>
  );
}

// ─── Branch Section ───────────────────────────────────────────────────────────
function BranchSection({ branch, course, students }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="branch-section">
      <div className="branch-section-header" onClick={() => setOpen(o => !o)}>
        <div className="branch-section-left">
          <span className="branch-section-name">{branch}</span>
          {course && <span className="branch-section-course">{course}</span>}
        </div>
        <div className="branch-section-right">
          <span className="branch-section-count">{students.length} student{students.length !== 1 ? "s" : ""}</span>
          <span className="branch-section-toggle">{open ? "↑" : "↓"}</span>
        </div>
      </div>
      {open && (
        <div className="branch-student-list">
          {students.map(u => <BranchStudentRow key={u._id} u={u} />)}
        </div>
      )}
    </div>
  );
}

// ─── Persona Card ─────────────────────────────────────────────────────────────
function PersonaCard({ persona, rank }) {
  const [expanded, setExpanded] = useState(false);
  const rankColors = ["#f59e0b", "#94a3b8", "#cd7c3a"];
  const rankLabels = ["Gold", "Silver", "Bronze"];

  return (
    <div className={`persona-card ${expanded ? "expanded" : ""}`}>
      <div className="persona-header" onClick={() => setExpanded(!expanded)}>
        <div className="persona-rank" style={{ background: rank < 3 ? rankColors[rank] : "#e2e8f0", color: rank < 3 ? "#fff" : "#64748b" }}>
          {rank < 3 ? rankLabels[rank] : `#${rank + 1}`}
        </div>
        <div className="persona-info">
          <h3 className="persona-name">{persona.name}</h3>
          <p className="persona-meta">{persona.count} member{persona.count !== 1 ? "s" : ""} · {persona.topSkills.slice(0, 2).join(", ")}</p>
        </div>
        <div className="persona-expand">{expanded ? "↑" : "↓"}</div>
      </div>
      {expanded && (
        <div className="persona-body">
          <div className="persona-section">
            <p className="persona-section-title">Top Skills</p>
            <div className="persona-chips">
              {persona.topSkills.map((s, i) => <span key={i} className="persona-chip skill">{s}</span>)}
            </div>
          </div>
          <div className="persona-section">
            <p className="persona-section-title">Common Interests</p>
            <div className="persona-chips">
              {persona.topInterests.map((s, i) => <span key={i} className="persona-chip interest">{s}</span>)}
            </div>
          </div>
          <div className="persona-section">
            <p className="persona-section-title">Shared Goals</p>
            <div className="persona-chips">
              {persona.topGoals.map((s, i) => <span key={i} className="persona-chip goal">{s}</span>)}
            </div>
          </div>
          <div className="persona-members">
            <p className="persona-section-title">Members</p>
            <div className="persona-member-list">
              {persona.members.slice(0, 8).map((m) => (
                <div key={m._id} className="persona-member">
                  {m.profileImage
                    ? <img src={m.profileImage} alt={m.name} className="persona-avatar" />
                    : <div className="persona-avatar-fallback">{m.name?.[0]?.toUpperCase()}</div>}
                  <div>
                    <p className="persona-member-name">{m.name}</p>
                    <p className="persona-member-meta">{m.branch ? `${m.branch} · Y${m.year}` : m.email}</p>
                  </div>
                </div>
              ))}
              {persona.members.length > 8 && (
                <p className="persona-member-more">+{persona.members.length - 8} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);

  // Users
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userView, setUserView] = useState("table");

  const [allUsersForBranch, setAllUsersForBranch] = useState([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchCourseFilter, setBranchCourseFilter] = useState("All");
  const [branchLoading, setBranchLoading] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Rooms
  const [rooms, setRooms] = useState([]);
  const [roomTotal, setRoomTotal] = useState(0);
  const [roomPage, setRoomPage] = useState(1);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomTypeFilter, setRoomTypeFilter] = useState("");
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomModal, setRoomModal] = useState(null);

  // Feedback
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  // Internships
  const [internships, setInternships]           = useState([]);
  const [internshipTotal, setInternshipTotal]   = useState(0);
  const [internshipPage, setInternshipPage]     = useState(1);
  const [internshipSearch, setInternshipSearch] = useState("");
  const [internshipSource, setInternshipSource] = useState("");
  const [internshipLoading, setInternshipLoading] = useState(false);
  const [showImportModal, setShowImportModal]   = useState(false);

  // Personas
  const [allUsers, setAllUsers] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaFilter, setPersonaFilter] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshStats = () =>
    api.get("/api/admin/stats").then((r) => setStats(r.data)).catch(() => { });

  useEffect(() => { refreshStats(); }, []);

  // ── Users ──
  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const params = new URLSearchParams({ page: userPage, limit: 15 });
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter) params.set("role", userRoleFilter);
      const r = await api.get(`/api/admin/users?${params}`);
      setUsers(r.data.users);
      setUserTotal(r.data.total);
    } catch { showToast("Failed to fetch users", "error"); }
    finally { setUserLoading(false); }
  }, [userPage, userSearch, userRoleFilter]);

  useEffect(() => { if (activeTab === "Users") fetchUsers(); }, [activeTab, fetchUsers]);

  const fetchAllUsersForBranch = useCallback(async () => {
    if (allUsersForBranch.length > 0) return;
    setBranchLoading(true);
    try {
      const r = await api.get("/api/admin/users?limit=1000&page=1");
      setAllUsersForBranch(r.data.users ?? []);
    } catch { showToast("Failed to load branch data", "error"); }
    finally { setBranchLoading(false); }
  }, [allUsersForBranch.length]);

  useEffect(() => {
    if (activeTab === "Users" && userView === "branch") fetchAllUsersForBranch();
  }, [activeTab, userView, fetchAllUsersForBranch]);

  const branchGrouped = (() => {
    const q = branchSearch.toLowerCase();
    const src = allUsersForBranch.filter(u => {
      const matchCourse = branchCourseFilter === "All" || u.course === branchCourseFilter;
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
      return matchCourse && matchSearch;
    });
    const map = {};
    src.forEach(u => {
      const course = u.course || "Uncategorised";
      const branch = u.branch || "No Branch";
      const key    = `${course}|||${branch}`;
      if (!map[key]) map[key] = { course, branch, students: [] };
      map[key].students.push(u);
    });
    return Object.values(map).sort((a, b) => {
      const cc = a.course.localeCompare(b.course);
      return cc !== 0 ? cc : a.branch.localeCompare(b.branch);
    });
  })();

  const branchCourses = ["All", ...Array.from(new Set(allUsersForBranch.map(u => u.course).filter(Boolean))).sort()];

  // ── Products ──
  const fetchProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const params = new URLSearchParams({ page: productPage, limit: 15 });
      if (productSearch) params.set("search", productSearch);
      const r = await api.get(`/api/admin/products?${params}`);
      setProducts(r.data.products);
      setProductTotal(r.data.total);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setProductLoading(false); }
  }, [productPage, productSearch]);

  useEffect(() => { if (activeTab === "Products") fetchProducts(); }, [activeTab, fetchProducts]);

  // ── Rooms ──
  const fetchRooms = useCallback(async () => {
    setRoomLoading(true);
    try {
      const params = new URLSearchParams({ page: roomPage, limit: 15 });
      if (roomSearch) params.set("search", roomSearch);
      if (roomTypeFilter) params.set("type", roomTypeFilter);
      const r = await api.get(`/api/admin/rooms?${params}`);
      setRooms(r.data.rooms ?? []);
      setRoomTotal(r.data.total ?? 0);
    } catch { showToast("Failed to fetch rooms", "error"); }
    finally { setRoomLoading(false); }
  }, [roomPage, roomSearch, roomTypeFilter]);

  useEffect(() => { if (activeTab === "Rooms") fetchRooms(); }, [activeTab, fetchRooms]);

  // ── Feedback ──
  const fetchFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const params = new URLSearchParams({ page: feedbackPage, limit: 15 });
      if (feedbackSearch) params.set("search", feedbackSearch);
      if (feedbackStatusFilter) params.set("status", feedbackStatusFilter);
      const r = await api.get(`/api/admin/feedback?${params}`);
      setFeedbacks(r.data.feedbacks ?? []);
      setFeedbackTotal(r.data.total ?? 0);
      setNewFeedbackCount(r.data.newCount ?? 0);
    } catch { showToast("Failed to fetch feedback", "error"); }
    finally { setFeedbackLoading(false); }
  }, [feedbackPage, feedbackSearch, feedbackStatusFilter]);

  useEffect(() => { if (activeTab === "Feedback") fetchFeedback(); }, [activeTab, fetchFeedback]);

  // ── Internships ──
  const fetchInternships = useCallback(async () => {
    setInternshipLoading(true);
    try {
      const params = new URLSearchParams({ page: internshipPage, limit: 20 });
      if (internshipSearch) params.set("search", internshipSearch);
      if (internshipSource) params.set("source", internshipSource);
      const r = await api.get(`/api/admin/internships?${params}`);
      setInternships(r.data.internships ?? []);
      setInternshipTotal(r.data.total ?? 0);
    } catch { showToast("Failed to fetch internships", "error"); }
    finally { setInternshipLoading(false); }
  }, [internshipPage, internshipSearch, internshipSource]);

  useEffect(() => { if (activeTab === "Internships") fetchInternships(); }, [activeTab, fetchInternships]);

  const deleteInternship = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/internships/${id}`);
      showToast("Deleted");
      fetchInternships();
    } catch { showToast("Failed to delete", "error"); }
  };

  const deleteAllBySource = async (source) => {
    if (!window.confirm(`Delete ALL listings from source "${source}"? This cannot be undone.`)) return;
    try {
      const r = await api.delete(`/api/admin/internships/source/${encodeURIComponent(source)}`);
      showToast(`Deleted ${r.data.deleted} listings`);
      fetchInternships();
    } catch { showToast("Failed", "error"); }
  };

  // ── Personas ──
  useEffect(() => {
    if (activeTab !== "Personas") return;
    const load = async () => {
      setPersonaLoading(true);
      try {
        const r = await api.get("/api/admin/users?limit=500&page=1");
        const users = r.data.users ?? [];
        setAllUsers(users);
        setPersonas(buildPersonas(users));
      } catch { showToast("Failed to load persona data", "error"); }
      finally { setPersonaLoading(false); }
    };
    load();
  }, [activeTab]);

  function buildPersonas(users) {
    const freq = (arr) => {
      const map = {};
      arr.forEach((item) => { map[item] = (map[item] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };
    const clusters = {};
    users.forEach((u) => {
      const skills = u.skills || [];
      const interests = u.interests || [];
      const goals = u.goals || [];
      if (skills.length === 0 && interests.length === 0 && goals.length === 0) {
        const key = "Explorer";
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(u);
        return;
      }
      const tags = [...skills, ...interests];
      const personaMap = {
        "Machine Learning": ["ML", "AI", "Deep Learning", "Data Science", "Neural Networks", "Python"],
        "Web Developer": ["React", "Node.js", "HTML", "CSS", "JavaScript", "Frontend", "Backend", "Full Stack"],
        "Designer": ["UI/UX", "Design", "Figma", "Graphic Design", "Canva", "Creative"],
        "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "Cloud", "CI/CD", "Linux", "DevOps"],
        "Mobile Developer": ["Flutter", "React Native", "iOS", "Android", "Mobile"],
        "Data Analyst": ["Data Analysis", "SQL", "Excel", "Tableau", "Power BI", "Statistics"],
        "Entrepreneur": ["Startup", "Business", "Marketing", "Sales", "Entrepreneurship"],
        "Researcher": ["Research", "Academia", "Publication", "Science", "Physics", "Chemistry"],
        "Gamer": ["Gaming", "Game Dev", "Unity", "Unreal"],
        "Open Source": ["Open Source", "GitHub", "Contribution", "Community"],
      };
      let assigned = false;
      for (const [personaName, keywords] of Object.entries(personaMap)) {
        if (tags.some((t) => keywords.some((k) => t.toLowerCase().includes(k.toLowerCase())))) {
          if (!clusters[personaName]) clusters[personaName] = [];
          clusters[personaName].push(u);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        const key = tags[0] || "Other";
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(u);
      }
    });
    return Object.entries(clusters)
      .filter(([, members]) => members.length > 0)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, members]) => {
        const topSkills    = freq(members.flatMap((u) => u.skills    || [])).slice(0, 6).map(([k]) => k);
        const topInterests = freq(members.flatMap((u) => u.interests || [])).slice(0, 6).map(([k]) => k);
        const topGoals     = freq(members.flatMap((u) => u.goals     || [])).slice(0, 6).map(([k]) => k);
        return { name, count: members.length, members, topSkills, topInterests, topGoals };
      });
  }

  // ── Actions ──
  const changeUserRole = async (userId, role) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role });
      showToast("Role updated");
      fetchUsers(); refreshStats();
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      showToast("User deleted");
      fetchUsers(); refreshStats();
      setAllUsersForBranch([]);
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const deleteProduct = async (productId, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/products/${productId}`);
      showToast("Product deleted");
      fetchProducts(); refreshStats();
    } catch { showToast("Failed", "error"); }
  };

  const addProduct = async (form) => {
    try {
      await api.post("/api/admin/products", form);
      showToast("Product added");
      setShowProductModal(false);
      fetchProducts(); refreshStats();
    } catch (e) { showToast(e.response?.data?.message || "Failed to add product", "error"); }
  };

  const saveRoom = async (form) => {
    try {
      if (form._id) {
        await api.put(`/api/admin/rooms/${form._id}`, form);
        showToast("Room updated");
      } else {
        await api.post("/api/admin/rooms", form);
        showToast("Room created");
      }
      setRoomModal(null);
      fetchRooms(); refreshStats();
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const toggleRoomAvailability = async (id) => {
    try {
      const r = await api.patch(`/api/admin/rooms/${id}/availability`);
      showToast(r.data.message);
      fetchRooms();
    } catch { showToast("Failed", "error"); }
  };

  const deleteRoom = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/api/admin/rooms/${id}`);
      showToast("Room deleted");
      fetchRooms(); refreshStats();
    } catch { showToast("Failed", "error"); }
  };

  const updateFeedbackStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/feedback/${id}/status`, { status });
      showToast("Status updated");
      fetchFeedback();
    } catch { showToast("Failed", "error"); }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/api/admin/feedback/${id}`);
      showToast("Deleted");
      fetchFeedback(); refreshStats();
    } catch { showToast("Failed", "error"); }
  };

  const filteredPersonas = personas.filter((p) =>
    !personaFilter || p.name.toLowerCase().includes(personaFilter.toLowerCase())
  );

  const internshipSources = [...new Set(internships.map(i => i.source).filter(Boolean))];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

        :root {
          --bg: #f8f8f7; --surface: #ffffff; --surface-2: #f4f4f3;
          --border: #e5e5e3; --border-2: #d4d4d1;
          --text: #111110; --text-2: #6b6b67; --text-3: #a8a8a3;
          --accent: #111110; --accent-hover: #2a2a28;
          --red: #dc2626; --green: #16a34a; --amber: #d97706; --blue: #2563eb;
          --font: 'Geist', system-ui, sans-serif; --mono: 'Geist Mono', monospace;
          --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-xl: 18px; --r-2xl: 24px;
          --shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .adm-wrap { font-family: var(--font); background: var(--bg); min-height: 100vh; color: var(--text); -webkit-font-smoothing: antialiased; }
        .adm-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 30; }
        .adm-header-left { display: flex; align-items: center; gap: 12px; }
        .adm-logo { font-size: 15px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
        .adm-logo-dot { color: var(--text-3); }
        .adm-header-sub { font-size: 12px; color: var(--text-3); font-family: var(--mono); }
        .adm-header-divider { width: 1px; height: 20px; background: var(--border); }
        .adm-badge-admin { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-family: var(--mono); }
        .adm-tabs { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 24px; display: flex; gap: 0; overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; }
        .adm-tabs::-webkit-scrollbar { display: none; }
        .adm-tab { padding: 14px 16px; font-size: 13px; font-weight: 500; color: var(--text-3); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; white-space: nowrap; transition: color 0.15s; font-family: var(--font); position: relative; }
        .adm-tab.active { color: var(--text); border-bottom-color: var(--text); }
        .adm-tab:hover:not(.active) { color: var(--text-2); }
        .adm-tab-badge { position: absolute; top: 8px; right: 4px; min-width: 16px; height: 16px; background: #dc2626; color: #fff; font-size: 9px; font-weight: 700; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
        .adm-content { max-width: 1200px; margin: 0 auto; padding: 28px 24px 60px; }
        .adm-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 100; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 500; font-family: var(--font); box-shadow: var(--shadow-md); animation: toast-in 0.2s ease; white-space: nowrap; }
        .adm-toast.success { background: var(--text); color: #fff; }
        .adm-toast.error { background: var(--red); color: #fff; }
        @keyframes toast-in { from { opacity: 0; transform: translateX(-50%) translateY(6px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .adm-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .adm-modal { background: var(--surface); border-radius: var(--r-xl); box-shadow: var(--shadow-lg); width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; animation: modal-in 0.2s ease; }
        @keyframes modal-in { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .adm-modal-header { padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .adm-modal-header h2 { font-size: 15px; font-weight: 600; letter-spacing: -0.02em; }
        .adm-modal-close { background: none; border: none; cursor: pointer; color: var(--text-3); font-size: 18px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.15s; }
        .adm-modal-close:hover { background: var(--surface-2); color: var(--text); }
        .adm-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .adm-modal-actions { display: flex; gap: 10px; padding-top: 4px; }
        .adm-modal-actions .adm-btn-primary { flex: 1; }
        .adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .adm-field { display: flex; flex-direction: column; gap: 5px; }
        .adm-field-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-family: var(--mono); }
        .adm-input { width: 100%; padding: 9px 11px; font-size: 13px; font-family: var(--font); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text); outline: none; transition: border-color 0.15s; }
        .adm-input:focus { border-color: var(--border-2); }
        .adm-textarea { width: 100%; padding: 9px 11px; font-size: 13px; font-family: var(--font); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text); outline: none; resize: vertical; }
        .adm-select { width: 100%; padding: 9px 11px; font-size: 13px; font-family: var(--font); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text); outline: none; cursor: pointer; }
        .adm-checkbox-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--text-2); }
        .img-upload-zone { border: 1.5px dashed var(--border-2); border-radius: var(--r-lg); height: 120px; cursor: pointer; overflow: hidden; position: relative; transition: border-color 0.15s, background 0.15s; }
        .img-upload-zone:hover { border-color: var(--accent); background: var(--surface-2); }
        .img-upload-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--text-3); font-size: 12px; }
        .img-upload-preview { width: 100%; height: 100%; }
        .img-upload-preview img { width: 100%; height: 100%; object-fit: cover; }
        .img-upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
        .img-upload-zone:hover .img-upload-overlay { opacity: 1; }
        .img-upload-overlay span { color: #fff; font-size: 12px; font-weight: 500; }
        .img-upload-spinner { position: absolute; inset: 0; background: rgba(255,255,255,0.7); }
        .chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .facility-chip { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); cursor: pointer; transition: all 0.15s; font-family: var(--font); }
        .facility-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .adm-btn-primary { height: 38px; padding: 0 16px; background: var(--accent); color: #fff; border: none; border-radius: var(--r-md); font-size: 13px; font-weight: 500; font-family: var(--font); cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
        .adm-btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
        .adm-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .adm-btn-ghost { height: 38px; padding: 0 14px; background: transparent; color: var(--text-2); border: 1px solid var(--border-2); border-radius: var(--r-md); font-size: 13px; font-weight: 500; font-family: var(--font); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
        .adm-btn-ghost:hover { background: var(--surface-2); color: var(--text); }
        .adm-btn-sm { height: 28px; padding: 0 10px; font-size: 11px; font-weight: 500; font-family: var(--font); border-radius: var(--r-sm); cursor: pointer; transition: all 0.15s; white-space: nowrap; border: none; }
        .adm-btn-sm.danger { background: #fef2f2; color: var(--red); }
        .adm-btn-sm.danger:hover { background: #fee2e2; }
        .adm-btn-sm.secondary { background: var(--surface-2); color: var(--text-2); border: 1px solid var(--border); }
        .adm-btn-sm.secondary:hover { background: var(--border); color: var(--text); }
        .adm-btn-sm.amber { background: #fffbeb; color: var(--amber); }
        .adm-btn-sm.amber:hover { background: #fef3c7; }
        .view-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
        .view-toggle-btn { height: 36px; padding: 0 14px; font-size: 12px; font-weight: 500; font-family: var(--font); cursor: pointer; border: none; background: transparent; color: var(--text-3); transition: all 0.15s; }
        .view-toggle-btn.active { background: var(--accent); color: #fff; }
        .view-toggle-btn:not(.active):hover { background: var(--surface-2); color: var(--text-2); }
        .adm-section-header { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
        .adm-section-title { font-size: 17px; font-weight: 600; letter-spacing: -0.02em; flex: 1; }
        .adm-section-count { font-size: 13px; font-weight: 400; color: var(--text-3); margin-left: 4px; font-family: var(--mono); }
        .adm-search { height: 36px; padding: 0 12px; font-size: 13px; font-family: var(--font); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text); outline: none; width: 220px; transition: border-color 0.15s; }
        .adm-search:focus { border-color: var(--border-2); }
        .adm-filter { height: 36px; padding: 0 10px; font-size: 13px; font-family: var(--font); border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text); outline: none; cursor: pointer; }
        .adm-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow); }
        .adm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .adm-thead tr { background: var(--surface-2); }
        .adm-th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-3); font-family: var(--mono); white-space: nowrap; }
        .adm-th.right { text-align: right; }
        .adm-tbody .adm-tr { border-top: 1px solid var(--border); transition: background 0.1s; }
        .adm-tbody .adm-tr:hover { background: var(--surface-2); }
        .adm-td { padding: 12px 14px; vertical-align: middle; }
        .adm-td.right { text-align: right; }
        .adm-empty-row td { padding: 48px; text-align: center; color: var(--text-3); font-size: 13px; }
        .user-cell { display: flex; align-items: center; gap: 10px; }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .user-avatar-fallback { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 600; flex-shrink: 0; }
        .user-name { font-size: 13px; font-weight: 500; color: var(--text); }
        .user-handle { font-size: 11px; color: var(--text-3); font-family: var(--mono); margin-top: 1px; }
        .phone-badge { font-size: 11px; color: var(--text-2); font-family: var(--mono); background: var(--surface-2); border: 1px solid var(--border); padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
        .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; font-family: var(--mono); border: 1px solid; white-space: nowrap; }
        .role-admin { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .role-seller { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .role-user { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
        .fb-new { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .fb-review { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .fb-resolved { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .fb-dismissed { background: var(--surface-2); color: var(--text-3); border-color: var(--border); }
        .badge-available { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .badge-taken { background: var(--surface-2); color: var(--text-3); border-color: var(--border); }
        .badge-room { background: #faf5ff; color: #7c3aed; border-color: #ddd6fe; }
        .badge-roommate { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
        .action-group { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .branch-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow); margin-bottom: 10px; animation: fade-in 0.25s ease both; }
        .branch-section-header { padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.1s; background: var(--surface-2); border-bottom: 1px solid var(--border); }
        .branch-section-header:hover { background: #ececea; }
        .branch-section-left { display: flex; align-items: center; gap: 10px; }
        .branch-section-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: var(--text); }
        .branch-section-course { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); font-family: var(--mono); background: var(--surface); border: 1px solid var(--border); padding: 2px 8px; border-radius: 99px; }
        .branch-section-right { display: flex; align-items: center; gap: 10px; }
        .branch-section-count { font-size: 12px; color: var(--text-3); font-family: var(--mono); }
        .branch-section-toggle { font-size: 13px; color: var(--text-3); }
        .branch-student-list { display: flex; flex-direction: column; }
        .branch-student-row { display: grid; grid-template-columns: 2fr 2fr 1.5fr 1fr auto; align-items: center; gap: 12px; padding: 11px 18px; border-bottom: 1px solid var(--border); font-size: 12px; transition: background 0.1s; }
        .branch-student-row:last-child { border-bottom: none; }
        .branch-student-row:hover { background: var(--surface-2); }
        .branch-filter-strip { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .branch-course-pill { padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1.5px solid var(--border); background: var(--surface); color: var(--text-3); cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: var(--font); }
        .branch-course-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .branch-course-pill:hover:not(.active) { border-color: var(--border-2); color: var(--text-2); }
        .branch-filter-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-family: var(--mono); margin-right: 2px; flex-shrink: 0; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .skeleton-line { height: 12px; border-radius: 4px; background: linear-gradient(90deg, #f0f0ee 25%, #e6e6e3 50%, #f0f0ee 75%); background-size: 600px 100%; animation: shimmer 1.4s ease-in-out infinite; }
        .adm-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; }
        .adm-page-btn { height: 32px; padding: 0 12px; font-size: 12px; font-family: var(--font); font-weight: 500; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); color: var(--text-2); cursor: pointer; transition: all 0.15s; }
        .adm-page-btn:hover:not(:disabled) { background: var(--surface-2); color: var(--text); }
        .adm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .adm-page-info { font-size: 12px; color: var(--text-3); font-family: var(--mono); padding: 0 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow); animation: fade-in 0.3s ease both; }
        .stat-icon { font-size: 24px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--surface-2); border-radius: var(--r-lg); flex-shrink: 0; }
        .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-family: var(--mono); }
        .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); line-height: 1.1; margin-top: 2px; }
        .stat-sub { font-size: 11px; color: var(--text-3); margin-top: 2px; }
        .quick-actions { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 20px; box-shadow: var(--shadow); }
        .quick-actions h3 { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-family: var(--mono); margin-bottom: 12px; }
        .quick-actions-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .feedback-list { display: flex; flex-direction: column; gap: 10px; }
        .feedback-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 16px; box-shadow: var(--shadow); animation: fade-in 0.2s ease both; }
        .feedback-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .feedback-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
        .feedback-title { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .feedback-desc { font-size: 13px; color: var(--text-2); line-height: 1.55; }
        .feedback-right { text-align: right; flex-shrink: 0; }
        .feedback-author { font-size: 12px; font-weight: 500; color: var(--text-2); }
        .feedback-date { font-size: 11px; color: var(--text-3); font-family: var(--mono); margin-top: 2px; }
        .feedback-actions { display: flex; align-items: center; gap: 6px; padding-top: 12px; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .feedback-status-label { font-size: 11px; color: var(--text-3); margin-right: 4px; }
        .status-chip { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); cursor: pointer; transition: all 0.15s; font-family: var(--mono); }
        .status-chip.selected { background: var(--accent); color: #fff; border-color: var(--accent); }
        .persona-overview { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .persona-overview-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 14px; text-align: center; animation: fade-in 0.3s ease both; }
        .persona-overview-num { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; color: var(--text); }
        .persona-overview-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--mono); margin-top: 3px; }
        .persona-list { display: flex; flex-direction: column; gap: 10px; }
        .persona-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow); animation: fade-in 0.3s ease both; }
        .persona-header { padding: 16px 18px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.1s; }
        .persona-header:hover { background: var(--surface-2); }
        .persona-rank { font-size: 10px; font-weight: 700; font-family: var(--mono); letter-spacing: 0.05em; padding: 3px 10px; border-radius: 999px; flex-shrink: 0; }
        .persona-info { flex: 1; }
        .persona-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .persona-meta { font-size: 12px; color: var(--text-3); margin-top: 2px; }
        .persona-expand { font-size: 14px; color: var(--text-3); }
        .persona-body { padding: 16px 18px 18px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 14px; }
        .persona-section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-3); font-family: var(--mono); margin-bottom: 8px; }
        .persona-chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .persona-chip { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid; }
        .persona-chip.skill { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .persona-chip.interest { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .persona-chip.goal { background: #faf5ff; color: #7c3aed; border-color: #ddd6fe; }
        .persona-member-list { display: flex; flex-direction: column; gap: 8px; }
        .persona-member { display: flex; align-items: center; gap: 10px; }
        .persona-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .persona-avatar-fallback { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .persona-member-name { font-size: 13px; font-weight: 500; }
        .persona-member-meta { font-size: 11px; color: var(--text-3); font-family: var(--mono); margin-top: 1px; }
        .persona-member-more { font-size: 12px; color: var(--text-3); padding: 4px 0; }
        .prod-img { width: 38px; height: 38px; border-radius: var(--r-sm); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
        .prod-img-fallback { width: 38px; height: 38px; border-radius: var(--r-sm); background: var(--surface-2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .mt-2 { margin-top: 8px; }
        .intern-tag { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: 600; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-family: var(--mono); white-space: nowrap; }
        .intern-tags-cell { display: flex; flex-wrap: wrap; gap: 3px; max-width: 200px; }
        .badge-google { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .badge-linkedin { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
        .badge-remotive { background: #faf5ff; color: #7c3aed; border-color: #ddd6fe; }
        .badge-himalayas { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .badge-other { background: var(--surface-2); color: var(--text-2); border-color: var(--border); }
        .source-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; }
        .source-pill { display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); cursor: pointer; transition: all 0.15s; }
        .source-pill:hover { background: var(--surface-2); }
        .source-pill.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .source-pill-del { background: none; border: none; cursor: pointer; color: currentColor; opacity: 0.6; font-size: 12px; padding: 0; margin-left: 2px; }
        .source-pill-del:hover { opacity: 1; }
        @media (max-width: 640px) {
          .adm-content { padding: 16px 12px 60px; }
          .adm-section-header { flex-direction: column; align-items: stretch; }
          .adm-search { width: 100%; }
          .adm-grid-2 { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .adm-table-wrap { overflow-x: auto; }
          .adm-table { min-width: 700px; }
          .branch-student-row { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
      `}</style>

      <div className="adm-wrap">

        {roomModal !== null && (
          <RoomModal room={roomModal?._id ? roomModal : null} onClose={() => setRoomModal(null)} onSave={saveRoom} />
        )}
        {showProductModal && (
          <ProductModal onClose={() => setShowProductModal(false)} onSave={addProduct} />
        )}
        {showImportModal && (
          <InternshipImportModal
            onClose={() => setShowImportModal(false)}
            onSuccess={fetchInternships}
            showToast={showToast}
          />
        )}

        {toast && <div className={`adm-toast ${toast.type}`}>{toast.msg}</div>}

        <header className="adm-header">
          <div className="adm-header-left">
            <span className="adm-logo">Campusly<span className="adm-logo-dot">.</span></span>
            <div className="adm-header-divider" />
            <span className="adm-header-sub">{user?.name}</span>
          </div>
          <span className="adm-badge-admin">Admin</span>
        </header>

        <nav className="adm-tabs">
          {TABS.map((tab) => (
            <button key={tab} className={`adm-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
              {tab === "Feedback" && newFeedbackCount > 0 && (
                <span className="adm-tab-badge">{newFeedbackCount > 9 ? "9+" : newFeedbackCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="adm-content">

          {/* ── OVERVIEW ── */}
          {activeTab === "Overview" && (
            <div>
              <div className="stats-grid">
                <StatCard label="Total Users"    value={stats?.totalUsers}    icon="👥" />
                <StatCard label="Sellers"        value={stats?.totalSellers}  icon="🛍️" />
                <StatCard label="Admins"         value={stats?.totalAdmins}   icon="🔑" />
                <StatCard label="Products"       value={stats?.totalProducts} icon="📦" />
                <StatCard label="Rooms Listed"   value={stats?.totalRooms}    icon="🏠" />
                <StatCard label="Available"      value={stats?.availableRooms} icon="✅" sub="rooms" />
                <StatCard label="Feedback"       value={stats?.totalFeedbacks} icon="📬" />
                <StatCard label="New Feedback"   value={stats?.newFeedbacks}  icon="🔔" />
                <StatCard label="Internships"    value={stats?.totalInternships} icon="💼" />
              </div>
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="quick-actions-row">
                  {["Users", "Products", "Rooms", "Feedback", "Internships", "Personas"].map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)} className="adm-btn-ghost" style={{ height: 34, fontSize: 12 }}>
                      {t} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === "Users" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">
                  Users <span className="adm-section-count">({userView === "table" ? userTotal : allUsersForBranch.length})</span>
                </h2>
                <div className="view-toggle">
                  <button className={`view-toggle-btn ${userView === "table" ? "active" : ""}`} onClick={() => setUserView("table")}>Table</button>
                  <button className={`view-toggle-btn ${userView === "branch" ? "active" : ""}`} onClick={() => setUserView("branch")}>By Branch</button>
                </div>
                {userView === "table" ? (
                  <>
                    <input type="text" placeholder="Search name, email…" value={userSearch}
                      onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} className="adm-search" />
                    <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }} className="adm-filter">
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </>
                ) : (
                  <input type="text" placeholder="Search students…" value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)} className="adm-search" />
                )}
              </div>

              {userView === "table" && (
                <>
                  {userLoading ? <TableSkeleton cols={6} /> : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead className="adm-thead"><tr>
                          <th className="adm-th">User</th><th className="adm-th">Email</th>
                          <th className="adm-th">Phone</th><th className="adm-th">Role</th>
                          <th className="adm-th">Joined</th><th className="adm-th right">Actions</th>
                        </tr></thead>
                        <tbody className="adm-tbody">
                          {users.length === 0 && <tr className="adm-empty-row"><td colSpan={6}>No users found</td></tr>}
                          {users.map((u) => (
                            <tr key={u._id} className="adm-tr">
                              <td className="adm-td">
                                <div className="user-cell">
                                  {u.profileImage ? <img src={u.profileImage} alt="" className="user-avatar" /> : <div className="user-avatar-fallback">{u.name?.[0]?.toUpperCase() || "?"}</div>}
                                  <div><p className="user-name">{u.name || "—"}</p>{u.username && <p className="user-handle">@{u.username}</p>}</div>
                                </div>
                              </td>
                              <td className="adm-td" style={{ color: "var(--text-2)", fontSize: 12, fontFamily: "var(--mono)" }}>{u.email}</td>
                              <td className="adm-td">{u.phone ? <span className="phone-badge">📞 {u.phone}</span> : <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>}</td>
                              <td className="adm-td"><span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                              <td className="adm-td" style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                              <td className="adm-td right">
                                {u._id !== user?._id ? (
                                  <div className="action-group">
                                    <select value={u.role} onChange={(e) => changeUserRole(u._id, e.target.value)} className="adm-filter" style={{ height: 28, fontSize: 11, padding: "0 8px" }}>
                                      <option value="user">user</option><option value="seller">seller</option><option value="admin">admin</option>
                                    </select>
                                    <button onClick={() => deleteUser(u._id, u.name)} className="adm-btn-sm danger">Delete</button>
                                  </div>
                                ) : <span style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>You</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination total={userTotal} page={userPage} setPage={setUserPage} />
                </>
              )}

              {userView === "branch" && (
                <>
                  {branchCourses.length > 1 && (
                    <div className="branch-filter-strip">
                      <span className="branch-filter-label">Course:</span>
                      {branchCourses.map(c => (
                        <button key={c} className={`branch-course-pill ${branchCourseFilter === c ? "active" : ""}`} onClick={() => setBranchCourseFilter(c)}>{c}</button>
                      ))}
                    </div>
                  )}
                  {branchLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 16 }}>
                          <div className="skeleton-line" style={{ width: "30%", marginBottom: 8 }} />
                          <div className="skeleton-line" style={{ width: "60%" }} />
                        </div>
                      ))}
                    </div>
                  ) : branchGrouped.length === 0 ? (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No students found</div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14, fontFamily: "var(--mono)" }}>
                        {branchGrouped.reduce((s, g) => s + g.students.length, 0)} students across {branchGrouped.length} branch{branchGrouped.length !== 1 ? "es" : ""}
                      </p>
                      {branchGrouped.map(({ course, branch, students }) => (
                        <BranchSection key={`${course}|||${branch}`} course={course} branch={branch} students={students} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === "Products" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Products <span className="adm-section-count">({productTotal})</span></h2>
                <input type="text" placeholder="Search products…" value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }} className="adm-search" />
                <button onClick={() => setShowProductModal(true)} className="adm-btn-primary" style={{ height: 36, fontSize: 12 }}>+ Add Product</button>
              </div>
              {productLoading ? <TableSkeleton cols={5} /> : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead className="adm-thead"><tr>
                      <th className="adm-th">Product</th><th className="adm-th">Seller</th>
                      <th className="adm-th">Price</th><th className="adm-th">Listed</th><th className="adm-th right">Actions</th>
                    </tr></thead>
                    <tbody className="adm-tbody">
                      {products.length === 0 && <tr className="adm-empty-row"><td colSpan={5}>No products found</td></tr>}
                      {products.map((p) => (
                        <tr key={p._id} className="adm-tr">
                          <td className="adm-td">
                            <div className="user-cell">
                              {p.image ? <img src={p.image} alt={p.title} className="prod-img" onError={(e) => e.target.style.display="none"} /> : <div className="prod-img-fallback">📦</div>}
                              <span style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                            </div>
                          </td>
                          <td className="adm-td"><p style={{ fontSize: 13, fontWeight: 500 }}>{p.sellerId?.name || "Admin"}</p>{p.sellerId?.email && <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{p.sellerId.email}</p>}</td>
                          <td className="adm-td" style={{ fontWeight: 600, fontFamily: "var(--mono)" }}>₹{p.price}</td>
                          <td className="adm-td" style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="adm-td right"><button onClick={() => deleteProduct(p._id, p.title)} className="adm-btn-sm danger">Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination total={productTotal} page={productPage} setPage={setProductPage} />
            </div>
          )}

          {/* ── ROOMS ── */}
          {activeTab === "Rooms" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">Rooms <span className="adm-section-count">({roomTotal})</span></h2>
                <input type="text" placeholder="Search title, location…" value={roomSearch} onChange={(e) => { setRoomSearch(e.target.value); setRoomPage(1); }} className="adm-search" />
                <select value={roomTypeFilter} onChange={(e) => { setRoomTypeFilter(e.target.value); setRoomPage(1); }} className="adm-filter">
                  <option value="">All Types</option><option value="room">Room</option><option value="roommate">Roommate</option>
                </select>
                <button onClick={() => setRoomModal({})} className="adm-btn-primary" style={{ height: 36, fontSize: 12 }}>+ Add Room</button>
              </div>
              {roomLoading ? <TableSkeleton cols={7} /> : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead className="adm-thead"><tr>
                      <th className="adm-th">Room</th><th className="adm-th">Type</th><th className="adm-th">Rent</th>
                      <th className="adm-th">Location</th><th className="adm-th">By</th><th className="adm-th">Status</th><th className="adm-th right">Actions</th>
                    </tr></thead>
                    <tbody className="adm-tbody">
                      {rooms.length === 0 && <tr className="adm-empty-row"><td colSpan={7}>No rooms found</td></tr>}
                      {rooms.map((r) => (
                        <tr key={r._id} className="adm-tr">
                          <td className="adm-td">
                            <div className="user-cell">
                              {r.images?.[0] ? <img src={r.images[0]} alt={r.title} className="prod-img" /> : <div className="prod-img-fallback">🏠</div>}
                              <span style={{ fontWeight: 500, fontSize: 13, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                            </div>
                          </td>
                          <td className="adm-td"><span className={`badge ${r.type === "room" ? "badge-room" : "badge-roommate"}`}>{r.type}</span></td>
                          <td className="adm-td" style={{ fontWeight: 600, fontFamily: "var(--mono)", fontSize: 13 }}>₹{r.rent?.toLocaleString()}</td>
                          <td className="adm-td" style={{ color: "var(--text-2)", fontSize: 12, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {r.location}</td>
                          <td className="adm-td" style={{ color: "var(--text-3)", fontSize: 12 }}>{r.postedBy?.name || "—"}</td>
                          <td className="adm-td"><span className={`badge ${r.isAvailable ? "badge-available" : "badge-taken"}`}>{r.isAvailable ? "Available" : "Taken"}</span></td>
                          <td className="adm-td right">
                            <div className="action-group">
                              <button onClick={() => setRoomModal(r)} className="adm-btn-sm secondary">Edit</button>
                              <button onClick={() => toggleRoomAvailability(r._id)} className="adm-btn-sm amber">{r.isAvailable ? "Mark Taken" : "Mark Free"}</button>
                              <button onClick={() => deleteRoom(r._id, r.title)} className="adm-btn-sm danger">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination total={roomTotal} page={roomPage} setPage={setRoomPage} />
            </div>
          )}

          {/* ── FEEDBACK ── */}
          {activeTab === "Feedback" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">
                  Feedback <span className="adm-section-count">({feedbackTotal})</span>
                  {newFeedbackCount > 0 && <span className="badge fb-new" style={{ marginLeft: 8 }}>{newFeedbackCount} new</span>}
                </h2>
                <input type="text" placeholder="Search feedback…" value={feedbackSearch} onChange={(e) => { setFeedbackSearch(e.target.value); setFeedbackPage(1); }} className="adm-search" />
                <select value={feedbackStatusFilter} onChange={(e) => { setFeedbackStatusFilter(e.target.value); setFeedbackPage(1); }} className="adm-filter">
                  <option value="">All</option><option value="new">New</option><option value="in-review">In Review</option>
                  <option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
                </select>
              </div>
              {feedbackLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div className="skeleton-line" style={{ width: "30%" }} /><div className="skeleton-line" style={{ width: "70%" }} /><div className="skeleton-line" style={{ width: "50%" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="feedback-list">
                  {feedbacks.length === 0 && <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No feedback found</div>}
                  {feedbacks.map((fb, i) => (
                    <div key={fb._id} className="feedback-card" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="feedback-top">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="feedback-meta">
                            <span className={`badge ${STATUS_COLORS[fb.status]}`}>{fb.status}</span>
                            <span className="badge role-user">{fb.type}</span>
                          </div>
                          <p className="feedback-title">{fb.title}</p>
                          <p className="feedback-desc" style={{ marginTop: 4 }}>{fb.description}</p>
                        </div>
                        <div className="feedback-right">
                          <p className="feedback-author">{fb.userId?.name || "Unknown"}</p>
                          <p className="feedback-date">{new Date(fb.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="feedback-actions">
                        <span className="feedback-status-label">Status:</span>
                        {["new", "in-review", "resolved", "dismissed"].map((s) => (
                          <button key={s} onClick={() => updateFeedbackStatus(fb._id, s)} className={`status-chip ${fb.status === s ? "selected" : ""}`}>{s}</button>
                        ))}
                        <div style={{ flex: 1 }} />
                        <button onClick={() => deleteFeedback(fb._id)} className="adm-btn-sm danger">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Pagination total={feedbackTotal} page={feedbackPage} setPage={setFeedbackPage} />
            </div>
          )}

          {/* ── INTERNSHIPS ── */}
          {activeTab === "Internships" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">
                  Internships <span className="adm-section-count">({internshipTotal})</span>
                </h2>
                <input type="text" placeholder="Search title, company…"
                  value={internshipSearch}
                  onChange={(e) => { setInternshipSearch(e.target.value); setInternshipPage(1); }}
                  className="adm-search" />
                <select value={internshipSource} onChange={(e) => { setInternshipSource(e.target.value); setInternshipPage(1); }} className="adm-filter">
                  <option value="">All Sources</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Google Jobs">Google Jobs</option>
                  <option value="Remotive">Remotive</option>
                  <option value="Himalayas">Himalayas</option>
                  <option value="RemoteOK">RemoteOK</option>
                  <option value="Jobicy">Jobicy</option>
                </select>
                <button onClick={() => setShowImportModal(true)} className="adm-btn-primary" style={{ height: 36, fontSize: 12 }}>
                  ↑ Import JSON
                </button>
              </div>

              {internshipSources.length > 0 && (
                <div className="source-strip">
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", fontFamily: "var(--mono)", marginRight: 4 }}>Sources:</span>
                  {internshipSources.map(src => (
                    <span key={src} className="source-pill">
                      {src}
                      <button className="source-pill-del" title={`Delete all ${src} listings`}
                        onClick={() => deleteAllBySource(src)}>✕</button>
                    </span>
                  ))}
                </div>
              )}

              {internshipLoading ? <TableSkeleton cols={7} /> : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead className="adm-thead">
                      <tr>
                        <th className="adm-th">Job</th>
                        <th className="adm-th">Company</th>
                        <th className="adm-th">Location</th>
                        <th className="adm-th">Tags</th>
                        <th className="adm-th">Type</th>
                        <th className="adm-th">Source</th>
                        <th className="adm-th right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="adm-tbody">
                      {internships.length === 0 && (
                        <tr className="adm-empty-row">
                          <td colSpan={7}>
                            No internships yet — click <strong>↑ Import JSON</strong> to add scraped data
                          </td>
                        </tr>
                      )}
                      {internships.map((j) => {
                        const srcClass = {
                          "Google Jobs": "badge-google",
                          "LinkedIn":    "badge-linkedin",
                          "Remotive":    "badge-remotive",
                          "Himalayas":   "badge-himalayas",
                        }[j.source] || "badge-other";

                        return (
                          <tr key={j._id} className="adm-tr">
                            <td className="adm-td">
                              <div className="user-cell">
                                {j.logo
                                  ? <img src={j.logo} alt="" className="prod-img" style={{ borderRadius: 8 }} onError={(e) => e.target.style.display="none"} />
                                  : <div className="prod-img-fallback" style={{ borderRadius: 8 }}>💼</div>}
                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {j.title}
                                </span>
                              </div>
                            </td>
                            <td className="adm-td" style={{ fontSize: 13, fontWeight: 500 }}>{j.company || "—"}</td>
                            <td className="adm-td" style={{ color: "var(--text-2)", fontSize: 12, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {j.location || "—"}
                            </td>
                            {/* ── Tags column ── */}
                            <td className="adm-td">
                              <div className="intern-tags-cell">
                                {(j.tags || []).slice(0, 3).map(tag => (
                                  <span key={tag} className="intern-tag">{tag}</span>
                                ))}
                                {(j.tags || []).length > 3 && (
                                  <span className="intern-tag" style={{ background: "var(--surface-2)", color: "var(--text-3)", borderColor: "var(--border)" }}>
                                    +{j.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="adm-td">
                              <span className="badge badge-other">{j.type || "—"}</span>
                            </td>
                            <td className="adm-td">
                              <span className={`badge ${srcClass}`}>{j.source || "—"}</span>
                            </td>
                            <td className="adm-td right">
                              <div className="action-group">
                                {j.url && (
                                  <a href={j.url} target="_blank" rel="noopener noreferrer">
                                    <button className="adm-btn-sm secondary">View ↗</button>
                                  </a>
                                )}
                                <button onClick={() => deleteInternship(j._id, j.title)} className="adm-btn-sm danger">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination total={internshipTotal} page={internshipPage} setPage={setInternshipPage} limit={20} />
            </div>
          )}

          {/* ── PERSONAS ── */}
          {activeTab === "Personas" && (
            <div>
              <div className="adm-section-header">
                <h2 className="adm-section-title">
                  User Personas <span className="adm-section-count">({personas.length} groups · {allUsers.length} users)</span>
                </h2>
                <input type="text" placeholder="Filter persona…" value={personaFilter} onChange={(e) => setPersonaFilter(e.target.value)} className="adm-search" />
              </div>

              {personaLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
                      <div className="skeleton-line" style={{ width: 60, height: 22, borderRadius: 999 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: "40%", marginBottom: 6 }} />
                        <div className="skeleton-line" style={{ width: "25%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="persona-overview">
                    <div className="persona-overview-card"><p className="persona-overview-num">{allUsers.filter(u => (u.skills || []).length > 0).length}</p><p className="persona-overview-label">Have Skills</p></div>
                    <div className="persona-overview-card"><p className="persona-overview-num">{allUsers.filter(u => (u.interests || []).length > 0).length}</p><p className="persona-overview-label">Have Interests</p></div>
                    <div className="persona-overview-card"><p className="persona-overview-num">{allUsers.filter(u => (u.goals || []).length > 0).length}</p><p className="persona-overview-label">Have Goals</p></div>
                    <div className="persona-overview-card"><p className="persona-overview-num">{personas.length}</p><p className="persona-overview-label">Clusters</p></div>
                    <div className="persona-overview-card"><p className="persona-overview-num">{filteredPersonas[0]?.count || 0}</p><p className="persona-overview-label">Largest Group</p></div>
                  </div>
                  {filteredPersonas.length === 0 && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                      No personas found — users need to fill in skills, interests, or goals.
                    </div>
                  )}
                  <div className="persona-list">
                    {filteredPersonas.map((persona, i) => (
                      <PersonaCard key={persona.name} persona={persona} rank={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}