import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor(diff / 3600000);
  if (hrs < 1)  return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function normaliseJob(j) {
  return {
    id:          j._id || j.externalId || Math.random().toString(36).slice(2),
    title:       j.title       || "Untitled",
    company:     j.company     || "Unknown",
    location:    j.location    || "",
    type:        j.type        || "",
    url:         j.url         || "#",
    postedAt:    j.postedAt    || j.fetchedAt || "",
    description: j.description || "",
    logo:        j.logo        || "",
    remote:      !!j.remote,
    source:      j.source      || "",
    tags:        Array.isArray(j.tags) ? j.tags : [],
  };
}

/* ─── India filter ──────────────────────────────────────────────────────── */
const INDIA_REGEX =
  /india|mumbai|delhi|bangalore|bengaluru|hyderabad|pune|chennai|kolkata|noida|gurgaon|gurugram|ahmedabad|jaipur|surat|kochi|trivandrum|chandigarh|bhopal|lucknow|indore|nagpur/i;

function isIndia(job) {
  return INDIA_REGEX.test(job.location);
}

/* ─── Skill / tag filter options (popular among students) ──────────────── */
const SKILL_TAGS = [
  "All",
  "Web Development",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "Full Stack",
  "Mobile Development",
  "Graphic Design",
  "Marketing",
  "DevOps",
  "Python",
  "Java",
  "C++",
  "Finance",
  "Video Editing",
  "Blockchain",
  "Cybersecurity",
  "Product Management",
  "Research",
  "HR",
];

/* ─── Share helper ──────────────────────────────────────────────────────── */
async function shareJob(job) {
  const pageUrl = `https://networkup.in/internships?id=${job.id}`;
  const eligibility = job.tags?.filter(
    t => !["Remote", "Internship"].includes(t)
  ).slice(0, 3).join(", ") || null;

  const text =
    `🚀 *${job.title}* at *${job.company}*\n` +
    `📍 ${job.location || "India"}  •  ${job.type || "Internship"}\n` +
    (eligibility ? `🎯 Skills: ${eligibility}\n` : "") +
    (job.description ? `\n${job.description.slice(0, 180).trim()}…\n` : "") +
    `\n👉 Apply & view more: ${pageUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `${job.title} at ${job.company}`, text, url: pageUrl });
      return;
    } catch (err) {
      if (err.name === "AbortError") return; // user cancelled
    }
  }
  // Fallback — copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "error";
  }
}

/* ─── Job Card ──────────────────────────────────────────────────────────── */
function JobCard({ job }) {
  const [expanded,     setExpanded]     = useState(false);
  const [shareStatus,  setShareStatus]  = useState(null); // null | "copied" | "shared"

  const hasUrl  = job.url && job.url !== "#";
  const openJob = (e) => { e.stopPropagation(); hasUrl && window.open(job.url, "_blank", "noopener,noreferrer"); };
  const toggleExp = () => setExpanded(p => !p);

  const displayType = (() => {
    const t = job.type || "";
    if (t.toLowerCase().includes("internship")) return "Internship";
    if (t.toLowerCase().includes("full"))       return "Full-time";
    if (t.toLowerCase().includes("part"))       return "Part-time";
    if (t.toLowerCase().includes("contract"))   return "Contract";
    if (t.toLowerCase().includes("remote"))     return "Remote";
    return t.split(/[,&]/)[0].trim() || "Internship";
  })();

  const cleanDesc = (job.description || "").replace(/<[^>]+>/g, "").trim();

  // Show at most 5 skill-style tags (exclude generic ones)
  const displayTags = (job.tags || [])
    .filter(t => !["Remote", "Internship"].includes(t))
    .slice(0, 5);

  const handleShare = async (e) => {
    e.stopPropagation();
    const result = await shareJob(job);
    if (result === "copied") {
      setShareStatus("copied");
      setTimeout(() => setShareStatus(null), 2200);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e3dc",
        borderRadius: 13,
        overflow: "hidden",
        transition: "box-shadow .15s",
      }}
      onClick={toggleExp}
    >
      <div style={{ padding: "14px 16px", cursor: "pointer" }}>

        {/* ── Top row: logo + title + meta ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            border: "1px solid #e5e3dc", background: "#f5f4f0",
            flexShrink: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {job.logo ? (
              <img
                src={job.logo} alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <span style={{
              fontSize: 14, fontWeight: 800, color: "#6b6860",
              display: job.logo ? "none" : "flex",
            }}>
              {job.company?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 2 }}>
              {job.title}
            </div>
            <div style={{ fontSize: 12, color: "#6b6860", fontWeight: 600 }}>{job.company}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 100,
              fontWeight: 700, background: "#f0ede8", color: "#6b6860", whiteSpace: "nowrap",
            }}>
              {job.source || "Jobs"}
            </span>
            {job.postedAt && (
              <span style={{ fontSize: 10, color: "#b5b3ac", whiteSpace: "nowrap" }}>
                {timeAgo(job.postedAt)}
              </span>
            )}
          </div>
        </div>

        {/* ── Location + type row ── */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {job.location && (
            <span style={tagStyle(false)}>📍 {job.location}</span>
          )}
          {displayType && (
            <span style={tagStyle(true)}>{displayType}</span>
          )}
        </div>

        {/* ── Skill tags ── */}
        {displayTags.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {displayTags.map(tag => (
              <span key={tag} style={skillTagStyle}>{tag}</span>
            ))}
          </div>
        )}

        {/* ── Description ── */}
        {cleanDesc && (
          <div style={{
            fontSize: 12, color: "#6b6860", lineHeight: 1.65, marginBottom: 10,
            ...(!expanded
              ? { overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }
              : {}),
          }}>
            {cleanDesc}
          </div>
        )}

        {/* ── Bottom row: expand + share + apply ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#b5b3ac" }}>
            {cleanDesc ? (expanded ? "▲ Show less" : "▼ Read more") : ""}
          </span>

          <div style={{ display: "flex", gap: 7, flexShrink: 0, alignItems: "center" }}>
            {/* Share button */}
            <button
              onClick={handleShare}
              title="Share this listing"
              style={{
                padding: "6px 11px",
                borderRadius: 9,
                border: "1px solid #e5e3dc",
                background: shareStatus === "copied" ? "#e8f5e9" : "#f5f4f0",
                color: shareStatus === "copied" ? "#2e7d32" : "#6b6860",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
                whiteSpace: "nowrap",
              }}
            >
              {shareStatus === "copied" ? "✓ Copied!" : "⎋ Share"}
            </button>

            {!hasUrl && (
              <span style={{ fontSize: 11, color: "#b5b3ac", alignSelf: "center" }}>No link</span>
            )}
            {hasUrl && (
              <button
                onClick={openJob}
                style={{
                  padding: "6px 16px", borderRadius: 9, border: "none",
                  background: "#1a1a18", color: "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Apply ↗
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Tag style helpers ── */
function tagStyle(dark) {
  return {
    fontSize: 10, padding: "2px 8px", borderRadius: 100, fontWeight: 600,
    background: dark ? "#1a1a18" : "#f0ede8",
    color:       dark ? "#fff"   : "#6b6860",
  };
}

const skillTagStyle = {
  fontSize: 10,
  padding: "2px 8px",
  borderRadius: 100,
  fontWeight: 600,
  background: "#edf4ff",
  color: "#3b6fd4",
  border: "1px solid #c7dcff",
};

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function Internships() {
  const navigate = useNavigate();

  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [activeTag,   setActiveTag]   = useState("All");
  const [fetchedAt,   setFetchedAt]   = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchJobs = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (forceRefresh) params.append("refresh", "1");
      const res = await api.get(`/api/internships?${params}`);
      setJobs((res.data.data || []).map(normaliseJob));
      setFetchedAt(res.data.fetchedAt);
      if (res.data.rateLimited)
        setError("Rate limit reached — showing cached data. Try again in a few minutes.");
    } catch (err) {
      setError("Could not load listings. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* ── Client-side filter: India-only + tag + search ── */
  const filtered = jobs.filter(j => {
    // 1. India only — must match INDIA_REGEX
    if (!isIndia(j)) return false;

    // 2. Skill/domain tag filter
    const matchTag =
      activeTag === "All" ||
      (j.tags || []).some(t => t.toLowerCase().includes(activeTag.toLowerCase()));

    // 3. Search filter
    const matchSearch =
      !search.trim() ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());

    return matchTag && matchSearch;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  // Derive which SKILL_TAGS actually have results (so we can show counts or hide empties)
  const indiaJobs = jobs.filter(isIndia);
  const tagCounts = Object.fromEntries(
    SKILL_TAGS.map(t => [
      t,
      t === "All"
        ? indiaJobs.length
        : indiaJobs.filter(j => (j.tags || []).some(tag => tag.toLowerCase().includes(t.toLowerCase()))).length,
    ])
  );

  /* ── Styles ── */
  const S = {
    page:    { minHeight: "100vh", background: "#fafaf9", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#1a1a18", fontSize: 14 },
    wrap:    { maxWidth: 600, margin: "0 auto", padding: "20px 16px 88px" },
    hdr:     { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
    backBtn: { width: 34, height: 34, borderRadius: 9, border: "1px solid #e5e3dc", background: "#fff", cursor: "pointer", fontSize: 17, color: "#6b6860", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    btn:     { padding: "8px 14px", borderRadius: 10, border: "none", background: "#1a1a18", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    input:   { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e5e3dc", background: "#fff", fontSize: 13, fontFamily: "inherit", color: "#1a1a18", outline: "none", boxSizing: "border-box" },
    pill:    (active) => ({
      padding: "5px 13px", borderRadius: 100, fontSize: 11, fontWeight: 600,
      border: active ? "none" : "1px solid #e5e3dc",
      cursor: "pointer",
      background: active ? "#1a1a18" : "#fff",
      color:       active ? "#fff"   : "#6b6860",
      transition: "all .13s",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }),
  };

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* ── Header ── */}
        <div style={S.hdr}>
          <button style={S.backBtn} onClick={() => navigate("/")}>‹</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.3px" }}>
              Internships & Jobs
            </div>
            <div style={{ fontSize: 11, color: "#9b9890", marginTop: 1 }}>
              {fetchedAt
                ? `Updated ${timeAgo(fetchedAt)} · ${indiaJobs.length} India listings`
                : "India listings"}
            </div>
          </div>
          <button style={S.btn} onClick={() => fetchJobs(true)} title="Refresh listings">↻</button>
        </div>

        {/* ── India badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff7ed", border: "1px solid #fcd9a0",
          borderRadius: 10, padding: "6px 12px", marginBottom: 14, fontSize: 12, fontWeight: 600, color: "#92400e",
        }}>
          🇮🇳 Showing India-based listings only
        </div>

        {/* ── Search ── */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            style={S.input}
            placeholder="Search by role, company or city…"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              if (!e.target.value.trim()) setSearch("");
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); }}
              style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #e5e3dc", background: "#f5f4f0", color: "#9b9890", fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
            >
              Clear
            </button>
          )}
        </form>

        {/* ── Skill / domain tag filters ── */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9b9890", marginBottom: 7, letterSpacing: ".3px", textTransform: "uppercase" }}>
            Filter by field
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 10 }}>
            {SKILL_TAGS.filter(t => tagCounts[t] > 0 || t === "All").map(t => (
              <button
                key={t}
                style={S.pill(activeTag === t)}
                onClick={() => setActiveTag(t)}
              >
                {t}{tagCounts[t] > 0 && activeTag !== t ? ` (${tagCounts[t]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, border: "2.5px solid #e5e3dc", borderTopColor: "#1a1a18", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 12, color: "#9b9890" }}>Fetching listings…</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px", background: "#fff", border: "1px solid #e5e3dc", borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load</div>
            <div style={{ fontSize: 12, color: "#9b9890", marginBottom: 16 }}>{error}</div>
            <button style={S.btn} onClick={() => fetchJobs(true)}>Try again</button>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", background: "#fff", border: "1px solid #e5e3dc", borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>No results</div>
            <div style={{ fontSize: 12, color: "#9b9890", marginBottom: 16 }}>
              {search ? `Nothing matching "${search}"` : `No listings for "${activeTag}"`}
            </div>
            <button
              style={{ ...S.btn, background: "#f0ede8", color: "#1a1a18" }}
              onClick={() => { setSearch(""); setSearchInput(""); setActiveTag("All"); }}
            >
              Clear filters
            </button>
          </div>

        ) : (
          <>
            <div style={{ fontSize: 11, color: "#9b9890", marginBottom: 10 }}>
              {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
              {activeTag !== "All" && ` · ${activeTag}`}
              {search && ` · "${search}"`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </>
        )}

      </div>
    </div>
  );
}