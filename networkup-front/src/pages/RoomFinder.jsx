import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const PRESET_FACILITIES = [
  "WiFi", "AC", "Cooler", "Geyser", "Attached Bathroom",
  "Furnished", "Parking", "24/7 Water", "Security", "CCTV",
  "Washing Machine", "Kitchen", "Mess", "Gym", "Power Backup",
];

const EMPTY_FORM = {
  title: "", description: "", rent: "", location: "",
  contactName: "", contactPhone: "",
  facilities: [], customFacility: "", customFacilities: [],
};

const EMPTY_FILTERS = { maxRent: "", minRent: "", facilities: [] };

/* ─── tiny helpers ────────────────────────────────────────────────────────── */
function FacilityChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? "chip-active" : "chip-idle"}`}
    >
      {label}
    </button>
  );
}

function Avatar({ name = "", src }) {
  return src ? (
    <img src={src} alt={name} className="w-6 h-6 rounded-full object-cover ring-1 ring-black/8" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-black/8 flex items-center justify-center text-[10px] font-bold text-black/50">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */
export default function RoomFinder() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("room");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lightbox, setLightbox] = useState(null); // image URL

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState([]);

  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  /* ── fetch ────────────────────────────────────────────────────────────── */
  const fetchListings = useCallback(async (f = filters, tab = activeTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: tab });
      if (f.minRent) params.append("minRent", f.minRent);
      if (f.maxRent) params.append("maxRent", f.maxRent);
      if (f.facilities.length) params.append("facilities", f.facilities.join(","));
      const res = await api.get(`/api/rooms?${params}`);
      const raw = res.data;
      setListings(Array.isArray(raw) ? raw : (raw.rooms ?? []));
    } catch {
      showToast("Failed to load listings", "error");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []); // intentionally empty — we pass args explicitly

  // tab change: reset filters & fetch fresh
  useEffect(() => {
    setShowPost(false);
    setShowFilters(false);
    fetchListings(EMPTY_FILTERS, activeTab);
    setFilters(EMPTY_FILTERS);
  }, [activeTab]);

  /* ── toast ────────────────────────────────────────────────────────────── */
  const showToast = (msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  /* ── facility toggles ─────────────────────────────────────────────────── */
  const toggleFormFacility = (f) =>
    setForm((p) => ({
      ...p,
      facilities: p.facilities.includes(f) ? p.facilities.filter((x) => x !== f) : [...p.facilities, f],
    }));

  const toggleFilterFacility = (f) =>
    setFilters((p) => ({
      ...p,
      facilities: p.facilities.includes(f) ? p.facilities.filter((x) => x !== f) : [...p.facilities, f],
    }));

  const addCustomFacility = () => {
    const val = form.customFacility.trim();
    if (!val) return;
    setForm((p) => ({ ...p, customFacilities: [...p.customFacilities, val], customFacility: "" }));
  };

  /* ── images ───────────────────────────────────────────────────────────── */
  const handleImageSelect = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
    previews.forEach((u) => URL.revokeObjectURL(u)); // clean up old blobs
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  /* ── submit post ──────────────────────────────────────────────────────── */
  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.rent || !form.location.trim())
      return showToast("Title, rent and location are required", "error");

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("type", activeTab);
    fd.append("rent", form.rent);
    fd.append("location", form.location.trim());
    fd.append("contactName", form.contactName.trim());
    fd.append("contactPhone", form.contactPhone.trim());
    form.facilities.forEach((f) => fd.append("facilities", f));
    form.customFacilities.forEach((f) => fd.append("facilities", f)); // merge custom into facilities
    files.forEach((f) => fd.append("images", f));

    try {
      setUploading(true);
      const res = await api.post("/api/rooms", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setListings((p) => [res.data, ...p]);
      setShowPost(false);
      setForm(EMPTY_FORM);
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setFiles([]);
      showToast("Posted successfully!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to post", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ── delete ───────────────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      setListings((p) => p.filter((r) => r._id !== id));
      showToast("Deleted");
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  /* ── derived ──────────────────────────────────────────────────────────── */
  const canPost = user && (activeTab === "roommate" || user?.role === "admin");
  const hasActiveFilters = filters.facilities.length > 0 || filters.minRent || filters.maxRent;

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; }
        body { background: #fff; }

        .rf-root {
          font-family: 'Instrument Sans', sans-serif;
          min-height: 100vh;
          background: #fff;
          color: #111;
        }

        /* underline tab */
        .tab-btn {
        
          position: relative;
          padding: 12px 4px;
          font-size: 13px;
          font-weight: 600;
          color: #999;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.18s;
          flex: 1;                  
          text-align: center;       
        }
        .tab-btn::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #111;
          transform: scaleX(0);
          transition: transform 0.2s cubic-bezier(.4,0,.2,1);
        }
        .tab-btn.active { color: #111; }
        .tab-btn.active::after { transform: scaleX(1); }

        /* chips */
        .chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 11px;
          border-radius: 100px;
          font-size: 11px; font-weight: 600;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
          user-select: none;
        }
        .chip:active { transform: scale(0.95); }
        .chip-idle  { background: #f5f5f5; color: #666; border-color: #f5f5f5; }
        .chip-idle:hover  { background: #ebebeb; color: #111; }
        .chip-active { background: #111; color: #fff; border-color: #111; }

        /* listing card entry animation */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter {
          animation: fadeUp 0.28s ease both;
        }
        .card-enter:nth-child(1) { animation-delay: 0ms; }
        .card-enter:nth-child(2) { animation-delay: 40ms; }
        .card-enter:nth-child(3) { animation-delay: 80ms; }
        .card-enter:nth-child(4) { animation-delay: 120ms; }
        .card-enter:nth-child(n+5) { animation-delay: 160ms; }

        /* form slide-down */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-down { animation: slideDown 0.2s ease both; }

        /* toast */
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast { animation: toastIn 0.2s ease both; }

        /* input focus ring */
        .rf-input {
          width: 100%;
          background: #fafafa;
          border: 1.5px solid #ebebeb;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 13px;
          font-family: 'Instrument Sans', sans-serif;
          color: #111;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .rf-input:focus { border-color: #111; background: #fff; }
        .rf-input::placeholder { color: #bbb; }

        /* spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 20px; height: 20px;
          border: 2px solid #e5e5e5;
          border-top-color: #111;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* image hover */
        .img-thumb {
          transition: transform 0.18s, opacity 0.18s;
          cursor: pointer;
        }
        .img-thumb:hover { transform: scale(1.03); opacity: 0.92; }

        /* btn hover */
        .btn-black {
          background: #111; color: #fff;
          border: none; cursor: pointer;
          border-radius: 10px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          transition: background 0.15s, transform 0.1s;
        }
        .btn-black:hover { background: #333; }
        .btn-black:active { transform: scale(0.98); }
        .btn-black:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-ghost {
          background: #f5f5f5; color: #555;
          border: none; cursor: pointer;
          border-radius: 10px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          transition: background 0.15s;
        }
        .btn-ghost:hover { background: #ebebeb; color: #111; }

        /* divider */
        .divider { height: 1px; background: #f0f0f0; }

        /* lightbox */
        .lightbox {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.88);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          cursor: zoom-out;
        }
        .lightbox img {
          max-width: 100%; max-height: 100%;
          border-radius: 12px;
          object-fit: contain;
        }
      `}</style>

      <div className="rf-root">
        {/* Lightbox */}
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="preview" />
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className="toast"
            style={{
              position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
              zIndex: 90,
              background: toast.type === "error" ? "#111" : "#111",
              color: "#fff",
              fontSize: 12, fontWeight: 600,
              padding: "9px 18px",
              borderRadius: 100,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <span style={{ fontSize: 13 }}>{toast.type === "error" ? "✕" : "✓"}</span>
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 20px 80px" }}>

          {/* ── Header ── */}
          <div style={{ padding: "20px 0 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  width: 34, height: 34, borderRadius: 9, border: "1.5px solid #ebebeb",
                  background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                <svg width="14" height="14" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>Room Finder</p>
                <p style={{ fontSize: 11, color: "#aaa", margin: "1px 0 0", fontWeight: 500 }}>Find rooms &amp; roommates near campus</p>
              </div>
            </div>

            {canPost && (
              <button
                className="btn-black"
                style={{ padding: "8px 16px" }}
                onClick={() => { if (!user) return navigate("/login"); setShowPost((p) => !p); }}
              >
                {showPost ? "Cancel" : "+ Post"}
              </button>
            )}
          </div>

          {/* ── Underline Tabs ── */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1.5px solid #f0f0f0", marginTop: 20 }}>
            <button className={`tab-btn ${activeTab === "room" ? "active" : ""}`} onClick={() => setActiveTab("room")}>
              Rooms
            </button>
            <button className={`tab-btn ${activeTab === "roommate" ? "active" : ""}`} onClick={() => setActiveTab("roommate")}>
              Roommates
            </button>
          </div>

          {/* ── Filter row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 4 }}>
            <button
              className={`chip ${hasActiveFilters ? "chip-active" : "chip-idle"}`}
              onClick={() => setShowFilters((p) => !p)}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M7 12h10M10.5 19.5h3" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span style={{ background: "#fff3", borderRadius: 100, padding: "0 5px", fontSize: 10 }}>
                  {filters.facilities.length + (filters.minRent ? 1 : 0) + (filters.maxRent ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button className="chip chip-idle" onClick={() => { setFilters(EMPTY_FILTERS); fetchListings(EMPTY_FILTERS, activeTab); setShowFilters(false); }}>
                Clear
              </button>
            )}

            <span style={{ marginLeft: "auto", fontSize: 11, color: "#bbb", fontWeight: 500 }}>
              {loading ? "…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* ── Filter Panel ── */}
          {showFilters && (
            <div className="slide-down" style={{ background: "#fafafa", border: "1.5px solid #ebebeb", borderRadius: 14, padding: 16, marginTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Filters</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, display: "block", marginBottom: 4 }}>Min ₹</label>
                  <input className="rf-input" type="number" placeholder="2000" value={filters.minRent}
                    onChange={(e) => setFilters((p) => ({ ...p, minRent: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, display: "block", marginBottom: 4 }}>Max ₹</label>
                  <input className="rf-input" type="number" placeholder="8000" value={filters.maxRent}
                    onChange={(e) => setFilters((p) => ({ ...p, maxRent: e.target.value }))} />
                </div>
              </div>
              <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, display: "block", marginBottom: 8 }}>Facilities</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {PRESET_FACILITIES.map((f) => (
                  <FacilityChip key={f} label={f} active={filters.facilities.includes(f)} onClick={() => toggleFilterFacility(f)} />
                ))}
              </div>
              <button className="btn-black" style={{ width: "100%", padding: "10px" }}
                onClick={() => { fetchListings(filters, activeTab); setShowFilters(false); }}>
                Apply
              </button>
            </div>
          )}

          {/* ── Post Form ── */}
          {showPost && canPost && (
            <div className="slide-down" style={{ background: "#fafafa", border: "1.5px solid #ebebeb", borderRadius: 14, padding: 20, marginTop: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 14 }}>
                New {activeTab === "room" ? "Room Listing" : "Roommate Post"}
              </p>
              <form onSubmit={handlePost} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="rf-input" placeholder="Title *" required value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                <textarea className="rf-input" placeholder="Description" rows={2} value={form.description}
                  style={{ resize: "none" }}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 12, fontWeight: 600 }}>₹</span>
                    <input className="rf-input" type="number" placeholder="Rent/month *" required value={form.rent} style={{ paddingLeft: 24 }}
                      onChange={(e) => setForm((p) => ({ ...p, rent: e.target.value }))} />
                  </div>
                  <input className="rf-input" placeholder="Location *" required value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input className="rf-input" placeholder="Contact name" value={form.contactName}
                    onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} />
                  <input className="rf-input" placeholder="Phone number" value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} />
                </div>

                {/* Facilities */}
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, display: "block", marginBottom: 8 }}>Facilities</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {PRESET_FACILITIES.map((f) => (
                      <FacilityChip key={f} label={f} active={form.facilities.includes(f)} onClick={() => toggleFormFacility(f)} />
                    ))}
                  </div>
                </div>

                {/* Custom facility */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="rf-input" placeholder="Add custom facility…" value={form.customFacility}
                    onChange={(e) => setForm((p) => ({ ...p, customFacility: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomFacility(); } }} />
                  <button type="button" className="btn-ghost" style={{ padding: "10px 14px", whiteSpace: "nowrap" }} onClick={addCustomFacility}>
                    + Add
                  </button>
                </div>
                {form.customFacilities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.customFacilities.map((f, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0f0f0", color: "#555", borderRadius: 100, fontSize: 11, fontWeight: 600, padding: "5px 11px" }}>
                        {f}
                        <button type="button" onClick={() => setForm((p) => ({ ...p, customFacilities: p.customFacilities.filter((_, j) => j !== i) }))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Image upload */}
                <div>
                  <label style={{ fontSize: 11, color: "#aaa", fontWeight: 600, display: "block", marginBottom: 8 }}>Photos (up to 5)</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {previews.map((src, idx) => (
                      <div key={idx} style={{ position: "relative" }}>
                        <img src={src} alt="" className="img-thumb"
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1.5px solid #ebebeb" }} />
                        <button type="button"
                          onClick={() => removeImage(idx)}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            width: 18, height: 18, borderRadius: "50%",
                            background: "#111", color: "#fff", border: "none",
                            fontSize: 10, cursor: "pointer", fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>×</button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <label style={{
                        width: 64, height: 64, borderRadius: 10,
                        border: "1.5px dashed #ddd", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "#ccc", transition: "border-color 0.15s",
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "#aaa"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "#ddd"}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" style={{ display: "none" }} onChange={handleImageSelect} />
                      </label>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button type="submit" className="btn-black" style={{ flex: 1, padding: 12 }} disabled={uploading}>
                    {uploading ? "Posting…" : "Post Listing"}
                  </button>
                  <button type="button" className="btn-ghost" style={{ padding: "12px 20px" }} onClick={() => setShowPost(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Listings ── */}
          <div style={{ marginTop: 16 }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
                <div className="spinner" />
                <p style={{ fontSize: 12, color: "#ccc", margin: 0 }}>Loading…</p>
              </div>
            ) : listings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ fontSize: 28, margin: "0 0 10px" }}>{activeTab === "room" ? "🏠" : "👥"}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>No {activeTab === "room" ? "rooms" : "roommates"} yet</p>
                <p style={{ fontSize: 12, color: "#bbb", margin: "4px 0 0" }}>{canPost ? "Be the first to post!" : "Check back later"}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {listings.map((listing, idx) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    user={user}
                    onDelete={handleDelete}
                    onImageClick={setLightbox}
                    idx={idx}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Listing Card ────────────────────────────────────────────────────────── */
function ListingCard({ listing, user, onDelete, onImageClick, idx }) {
  const allFacilities = listing.facilities || [];

  return (
    <div
      className="card-enter"
      style={{
        background: "#fff",
        border: "1.5px solid #ebebeb",
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.18s, box-shadow 0.18s",
        animationDelay: `${Math.min(idx * 40, 160)}ms`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#d5d5d5"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ebebeb"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Images */}
      {listing.images?.length > 0 && (
        <div style={{ display: "flex", gap: 3, padding: "10px 10px 0", overflowX: "auto" }}>
          {listing.images.map((img, i) => (
            <img key={i} src={img} alt="" className="img-thumb"
              onClick={() => onImageClick(img)}
              style={{ width: 100, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid #f0f0f0" }} />
          ))}
        </div>
      )}

      <div style={{ padding: "14px 16px" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>{listing.title}</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                background: listing.isAvailable ? "#f0faf5" : "#fff0f0",
                color: listing.isAvailable ? "#1a9e6a" : "#d03030",
                border: `1px solid ${listing.isAvailable ? "#c6eed9" : "#f5c0c0"}`,
              }}>
                {listing.isAvailable ? "Available" : "Taken"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#aaa", margin: "3px 0 0", fontWeight: 500 }}>📍 {listing.location}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>₹{listing.rent.toLocaleString()}</p>
            <p style={{ fontSize: 10, color: "#bbb", margin: "1px 0 0" }}>/month</p>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p style={{
            fontSize: 12, color: "#777", margin: "10px 0 0", lineHeight: 1.55,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
          }}>
            {listing.description}
          </p>
        )}

        {/* Facilities */}
        {allFacilities.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {allFacilities.map((f, i) => (
              <span key={i} style={{ background: "#f5f5f5", color: "#666", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 100 }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f5f5f5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Avatar name={listing.postedBy?.name || "?"} src={listing.postedBy?.profileImage} />
            <span style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>{listing.postedBy?.name || "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {listing.contactPhone && (
              <a href={`tel:${listing.contactPhone}`} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 600, color: "#1a9e6a",
                background: "#f0faf5", border: "1px solid #c6eed9",
                padding: "5px 11px", borderRadius: 8, textDecoration: "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#ddf5ea"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f0faf5"}
              >
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Call
              </a>
            )}
            {(user?._id === listing.postedBy?._id?.toString() || user?._id === String(listing.postedBy?._id) || user?.role === "admin") && (
              <button
                onClick={() => onDelete(listing._id)}
                style={{
                  fontSize: 11, fontWeight: 600, color: "#cc3333",
                  background: "#fff5f5", border: "1px solid #fad4d4",
                  padding: "5px 11px", borderRadius: 8, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#ffe8e8"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff5f5"}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}