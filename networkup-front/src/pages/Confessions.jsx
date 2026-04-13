import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const TAGS = ["Love 💕","Study 📚","Hostel 🏠","Faculty 👨‍🏫","Canteen 🍕","Crush 😍","Funny 😂","Serious 😤","Regret 😔","Random 🎲"];

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff/60000), hrs = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (mins<1) return "just now";
  if (mins<60) return `${mins}m ago`;
  if (hrs<24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

const T = {
  page:     { minHeight:"100vh", background:"#fafaf9", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#1a1a18", fontSize:14 },
  wrap:     { maxWidth:600, margin:"0 auto", padding:"20px 16px 88px" },
  hdr:      { display:"flex", alignItems:"center", gap:12, marginBottom:24 },
  backBtn:  { width:34, height:34, borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", cursor:"pointer", fontSize:17, color:"#6b6860", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  /* tag pill — no border, gray → black on active */
  tag:      (a) => ({ padding:"5px 12px", borderRadius:100, fontSize:11, fontWeight:600, border:"none", cursor:"pointer", background:a?"#1a1a18":"#f0ede8", color:a?"#fff":"#6b6860", transition:"all .13s", whiteSpace:"nowrap", flexShrink:0 }),
  input:    { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e3dc", background:"#fff", fontSize:13, fontFamily:"inherit", color:"#1a1a18", outline:"none", boxSizing:"border-box" },
  textarea: { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e3dc", background:"#fff", fontSize:13, fontFamily:"inherit", color:"#1a1a18", outline:"none", resize:"none", boxSizing:"border-box" },
  btn:      { padding:"9px 16px", borderRadius:10, border:"none", background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  btnFull:  { width:"100%", padding:"11px", borderRadius:11, border:"none", background:"#1a1a18", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  overlay:  { position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.2)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16 },
  modal:    { background:"#fff", borderRadius:"18px 18px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,.1)" },
  closeBtn: { width:28, height:28, borderRadius:7, border:"1px solid #e5e3dc", background:"#f5f4f0", cursor:"pointer", color:"#9b9890", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 },
  /* sort select */
  sortSel:  { padding:"7px 10px", borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", fontSize:11, color:"#6b6860", outline:"none", flexShrink:0, fontFamily:"inherit" },
};

function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position:"fixed", top:16, right:16, zIndex:99, padding:"9px 16px", borderRadius:11, background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,.18)" }}>{toast.msg}</div>;
}

export default function Confessions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [confessions, setConfessions] = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [toast,    setToast]     = useState(null);
  const [showPost, setShowPost]  = useState(false);
  const [filterTag, setFilterTag]= useState("");
  const [sort,     setSort]      = useState("newest");
  const [text,     setText]      = useState("");
  const [selTag,   setSelTag]    = useState("");
  const [posting,  setPosting]   = useState(false);
  const [likedIds, setLikedIds]  = useState(() => { try { return JSON.parse(localStorage.getItem("liked_confessions")||"[]"); } catch { return []; } });

  useEffect(() => { fetchConfessions(); }, [filterTag, sort]);

  const fetchConfessions = async () => {
    try {
      setLoading(true);
      const p = new URLSearchParams();
      if (filterTag) p.append("tag", filterTag);
      p.append("sort", sort);
      const res = await api.get(`/api/confessions?${p}`);
      setConfessions(res.data);
    } catch { flash("Failed to load"); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setToast({ msg }); setTimeout(() => setToast(null), 3000); };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return flash("Write something first");
    if (text.trim().length < 10) return flash("Too short — at least 10 chars");
    if (!user) return flash("Login to post anonymously");
    try {
      setPosting(true);
      const res = await api.post("/api/confessions", { text, tag: selTag });
      setConfessions(p => [res.data,...p]);
      setText(""); setSelTag(""); setShowPost(false); flash("Posted anonymously!");
    } catch (err) { flash(err.response?.data?.message||"Failed"); }
    finally { setPosting(false); }
  };

  const handleLike = async (id) => {
    const liked = likedIds.includes(id);
    setConfessions(p => p.map(c => c._id===id ? {...c, likes: liked?c.likes-1:c.likes+1} : c));
    const next = liked ? likedIds.filter(i=>i!==id) : [...likedIds,id];
    setLikedIds(next); localStorage.setItem("liked_confessions", JSON.stringify(next));
    try { await api.patch(`/api/confessions/${id}/like`); }
    catch { setConfessions(p=>p.map(c=>c._id===id?{...c,likes:liked?c.likes+1:c.likes-1}:c)); setLikedIds(likedIds); localStorage.setItem("liked_confessions",JSON.stringify(likedIds)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await api.delete(`/api/confessions/${id}`); setConfessions(p=>p.filter(c=>c._id!==id)); flash("Deleted"); }
    catch { flash("Failed"); }
  };

  const charLimit = 500;

  return (
    <div style={T.page}>
      <Toast toast={toast} />

      {/* Post Modal */}
      {showPost && (
        <div style={T.overlay} onClick={() => setShowPost(false)}>
          <div style={T.modal} onClick={e => e.stopPropagation()}>
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"#f0ede8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🎭</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>Anonymous</div>
                    <div style={{ fontSize:11, color:"#9b9890" }}>Identity completely hidden</div>
                  </div>
                </div>
                <button style={T.closeBtn} onClick={() => setShowPost(false)}>✕</button>
              </div>

              <form onSubmit={handlePost} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div>
                  <textarea style={{...T.textarea, minHeight:110}} placeholder="Confess something… no one will know 🤫" value={text} onChange={e=>setText(e.target.value.slice(0,charLimit))} rows={5} />
                  <div style={{ textAlign:"right", marginTop:3, fontSize:11, color:text.length>charLimit*.9?"#dc2626":"#9b9890" }}>{text.length}/{charLimit}</div>
                </div>

                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#9b9890", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Tag (optional)</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                    {TAGS.map(t => (
                      <button key={t} type="button" onClick={() => setSelTag(selTag===t?"":t)} style={T.tag(selTag===t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={posting||!text.trim()} style={{...T.btnFull, opacity:posting||!text.trim()?.5:1}}>
                  {posting ? "Posting…" : "Post Anonymously"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div style={T.wrap}>
        {/* Header */}
        <div style={T.hdr}>
          <button style={T.backBtn} onClick={() => navigate("/")}>‹</button>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.3px" }}>Confessions 🎭</div>
            <div style={{ fontSize:11, color:"#9b9890", marginTop:1 }}>Anonymous · no judgement</div>
          </div>
          {user && <button style={T.btn} onClick={() => setShowPost(true)}>+ Confess</button>}
        </div>

        {/* Guest CTA */}
        {!user && (
          <div style={{ background:"#f5f4f0", borderRadius:11, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:16 }}>
            <span style={{ fontSize:12, color:"#6b6860" }}>Login to confess anonymously</span>
            <button onClick={() => navigate("/login")} style={T.btn}>Login →</button>
          </div>
        )}

        {/* Sort + Tag filters */}
        <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
          <select value={sort} onChange={e => setSort(e.target.value)} style={T.sortSel}>
            <option value="newest">Newest</option>
            <option value="popular">Most Liked</option>
          </select>
          {/* "All" tag */}
          <button onClick={() => setFilterTag("")} style={T.tag(!filterTag)}>All</button>
          {TAGS.map(t => (
            <button key={t} onClick={() => setFilterTag(filterTag===t?"":t)} style={T.tag(filterTag===t)}>{t}</button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#9b9890" }}>Loading…</div>
        ) : confessions.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px", background:"#fff", border:"1px solid #e5e3dc", borderRadius:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🤫</div>
            <div style={{ fontWeight:700 }}>No confessions yet</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {confessions.map((c, i) => {
              const liked = likedIds.includes(c._id);
              const isMyPost = c.postedBy === user?._id;
              return (
                <div key={c._id} style={{ background:"#fff", border:"1px solid #e5e3dc", borderRadius:13, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:"#f0ede8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>🎭</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#6b6860" }}>Anonymous #{(i+1).toString().padStart(3,"0")}</div>
                      <div style={{ fontSize:10, color:"#b5b3ac" }}>{timeAgo(c.createdAt)}</div>
                    </div>
                    {c.tag && <span style={{ fontSize:10, padding:"2px 9px", borderRadius:100, background:"#f0ede8", color:"#6b6860", fontWeight:600 }}>{c.tag}</span>}
                    {(user?.role==="admin"||isMyPost) && (
                      <button onClick={() => handleDelete(c._id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#d1d0ca", padding:0 }}>🗑</button>
                    )}
                  </div>

                  <p style={{ fontSize:13, lineHeight:1.65, color:"#2a2a28", marginBottom:12 }}>{c.text}</p>

                  <div style={{ display:"flex", alignItems:"center", paddingTop:10, borderTop:"1px solid #f0ede8" }}>
                    <button onClick={() => handleLike(c._id)} style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:"none", cursor:"pointer", padding:0, color: liked ? "#1a1a18" : "#b5b3ac" }}>
                      <span style={{ fontSize:14 }}>{liked ? "❤️" : "🤍"}</span>
                      <span style={{ fontSize:12, fontWeight:600 }}>{c.likes||0}</span>
                    </button>
                    <span style={{ fontSize:10, color:"#d1d0ca", marginLeft:"auto" }}>🔒 Anonymous</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}