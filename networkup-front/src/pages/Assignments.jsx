import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const SUBJECTS = [
  "Mathematics","Physics","Chemistry","Biology",
  "Computer Science","English","History","Economics",
  "Electronics","Mechanical","Civil","Other"
];

function timeLeft(deadline) {
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { text:"Expired", color:"#dc2626", urgent:true };
  const days = Math.floor(diff/86400000);
  const hrs  = Math.floor((diff%86400000)/3600000);
  if (days > 0) return { text:`${days}d ${hrs}h left`, color:days<=1?"#d97706":"#16a34a", urgent:days<=1 };
  return { text:`${hrs}h left`, color:"#dc2626", urgent:true };
}

/* status chips — monochrome */
const STATUS_BG = { open:"#f0ede8", assigned:"#f0ede8", completed:"#f0ede8", cancelled:"#f0ede8" };
const STATUS_COLOR = { open:"#1a1a18", assigned:"#1a1a18", completed:"#9b9890", cancelled:"#9b9890" };

const T = {
  page:     { minHeight:"100vh", background:"#fafaf9", fontFamily:"'DM Sans',system-ui,sans-serif", color:"#1a1a18", fontSize:14 },
  wrap:     { maxWidth:600, margin:"0 auto", padding:"20px 16px 88px" },
  hdr:      { display:"flex", alignItems:"center", gap:12, marginBottom:24 },
  backBtn:  { width:34, height:34, borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", cursor:"pointer", fontSize:17, color:"#6b6860", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  /* underline tab bar */
  tabBar:   { display:"flex", borderBottom:"1.5px solid #e5e3dc", marginBottom:18 },
  tab:      (a) => ({ padding:"8px 0", marginRight:22, fontSize:13, fontWeight:700, border:"none", background:"transparent", cursor:"pointer", color:a?"#1a1a18":"#9b9890", borderBottom:a?"2px solid #1a1a18":"2px solid transparent", marginBottom:"-1.5px", transition:"color .13s" }),
  /* tag pill — no border */
  tag:      (a) => ({ padding:"5px 12px", borderRadius:100, fontSize:11, fontWeight:600, border:"none", cursor:"pointer", background:a?"#1a1a18":"#f0ede8", color:a?"#fff":"#6b6860", transition:"all .13s", whiteSpace:"nowrap", flexShrink:0 }),
  input:    { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e3dc", background:"#fff", fontSize:13, fontFamily:"inherit", color:"#1a1a18", outline:"none", boxSizing:"border-box" },
  select:   { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e3dc", background:"#fff", fontSize:12, fontFamily:"inherit", color:"#6b6860", outline:"none" },
  textarea: { width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e5e3dc", background:"#fff", fontSize:13, fontFamily:"inherit", color:"#1a1a18", outline:"none", resize:"none", boxSizing:"border-box" },
  btn:      { padding:"9px 16px", borderRadius:10, border:"none", background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  btnFull:  { width:"100%", padding:"11px", borderRadius:11, border:"none", background:"#1a1a18", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" },
  btnDanger:{ width:"100%", padding:"11px", borderRadius:11, border:"1px solid #e5e3dc", background:"#fff", color:"#dc2626", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" },
  overlay:  { position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.2)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:16 },
  modal:    { background:"#fff", borderRadius:"18px 18px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,.1)" },
  closeBtn: { width:28, height:28, borderRadius:7, border:"1px solid #e5e3dc", background:"#f5f4f0", cursor:"pointer", color:"#9b9890", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 },
  chip:     { fontSize:10, padding:"2px 8px", borderRadius:100, fontWeight:700, background:"#f0ede8", color:"#1a1a18" },
  chipGray: { fontSize:10, padding:"2px 8px", borderRadius:100, fontWeight:600, background:"#f0ede8", color:"#9b9890" },
};

function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position:"fixed", top:16, right:16, zIndex:99, padding:"9px 16px", borderRadius:11, background:"#1a1a18", color:"#fff", fontSize:12, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,.18)" }}>{toast.msg}</div>;
}

export default function Assignments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab,        setTab]       = useState("browse");
  const [assignments,setAssignments]=useState([]);
  const [loading,    setLoading]   = useState(true);
  const [toast,      setToast]     = useState(null);
  const [showPost,   setShowPost]  = useState(false);
  const [selected,   setSelected]  = useState(null);
  const [uploading,  setUploading] = useState(false);
  const [files,      setFiles]     = useState([]);
  const [filterSubject,setFilterSubject]=useState("");
  const [filterSort, setFilterSort]= useState("newest");
  const [form, setForm] = useState({ title:"", description:"", subject:"", budget:"", deadline:"", tags:"" });
  const [bidAmount,  setBidAmount] = useState("");
  const [bidMessage, setBidMessage]= useState("");
  const [bidding,    setBidding]   = useState(false);

  useEffect(() => { fetchData(); }, [tab, filterSubject, filterSort]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = tab==="my-posts" ? "/api/assignments/my-posts"
              : tab==="my-work"  ? "/api/assignments/my-work"
              : `/api/assignments?status=open&sort=${filterSort}${filterSubject?`&subject=${filterSubject}`:""}`;
      const res = await api.get(url);
      setAssignments(res.data);
    } catch { flash("Failed to load"); }
    finally { setLoading(false); }
  };

  const flash = (msg) => { setToast({ msg }); setTimeout(() => setToast(null), 3000); };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title||!form.subject||!form.budget||!form.deadline) return flash("Fill all required fields");
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if(k!=="tags") fd.append(k,v); });
    if (form.tags) fd.append("tags", form.tags);
    files.forEach(f => fd.append("attachments",f));
    try {
      setUploading(true);
      const res = await api.post("/api/assignments", fd, { headers:{ "Content-Type":"multipart/form-data" } });
      setAssignments(p=>[res.data,...p]); setShowPost(false);
      setForm({ title:"",description:"",subject:"",budget:"",deadline:"",tags:"" }); setFiles([]);
      flash("Assignment posted!");
    } catch (err) { flash(err.response?.data?.message||"Failed"); }
    finally { setUploading(false); }
  };

  const handleBid = async () => {
    if (!bidAmount) return flash("Enter bid amount");
    try {
      setBidding(true);
      const res = await api.post(`/api/assignments/${selected._id}/bid`, { amount:Number(bidAmount), message:bidMessage });
      setBidAmount(""); setBidMessage(""); flash("Bid placed!"); setSelected(null);
      setAssignments(prev=>prev.map(a=>a._id===res.data._id?res.data:a));
    } catch (err) { flash(err.response?.data?.message||"Failed"); }
    finally { setBidding(false); }
  };

  const handleAccept = async (assignmentId, userId) => {
    try { await api.post(`/api/assignments/${assignmentId}/accept/${userId}`); flash("Bid accepted!"); setSelected(null); fetchData(); }
    catch { flash("Failed"); }
  };

  const handleComplete = async (id) => {
    try { await api.patch(`/api/assignments/${id}/complete`); flash("Marked as completed!"); setSelected(null); fetchData(); }
    catch { flash("Failed"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try { await api.delete(`/api/assignments/${id}`); setAssignments(p=>p.filter(a=>a._id!==id)); flash("Deleted"); }
    catch { flash("Failed"); }
  };

  const openDetail = async (a) => {
    try { const res = await api.get(`/api/assignments/${a._id}`); setSelected(res.data); }
    catch { setSelected(a); }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const rawExt = url.split(".").pop().split("?")[0].toLowerCase();
      const ext = ["png","jpg","jpeg","webp","gif"].includes(rawExt) ? rawExt : "pdf";
      const fixedBlob = ext==="pdf" ? new Blob([blob],{type:"application/pdf"}) : blob;
      const blobUrl = window.URL.createObjectURL(fixedBlob);
      const a = document.createElement("a");
      a.href=blobUrl; a.download=filename; document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch { flash("Download failed"); }
  };

  const myBid  = selected?.bids?.find(b=>b.userId?._id===user?._id||b.userId===user?._id);
  const isOwner= selected?.postedBy?._id===user?._id||selected?.postedBy===user?._id;

  if (!user) return (
    <div style={{...T.page, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{ background:"#fff", border:"1px solid #e5e3dc", borderRadius:18, padding:36, textAlign:"center", maxWidth:300 }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Login Required</div>
        <button onClick={() => navigate("/login")} style={T.btnFull}>Login →</button>
      </div>
    </div>
  );

  return (
    <div style={T.page}>
      <Toast toast={toast} />

      {/* Detail Modal */}
      {selected && (
        <div style={T.overlay} onClick={() => setSelected(null)}>
          <div style={T.modal} onClick={e => e.stopPropagation()}>
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:7 }}>
                    <span style={{ ...T.chip, background: selected.status==="completed"||selected.status==="cancelled" ? "#f0ede8":"#f0ede8", color: selected.status==="completed"||selected.status==="cancelled" ? "#9b9890":"#1a1a18" }}>{selected.status}</span>
                    <span style={T.chipGray}>{selected.subject}</span>
                  </div>
                  <div style={{ fontSize:17, fontWeight:800 }}>{selected.title}</div>
                </div>
                <button style={T.closeBtn} onClick={() => setSelected(null)}>✕</button>
              </div>

              <p style={{ fontSize:13, color:"#6b6860", lineHeight:1.65, marginBottom:14 }}>{selected.description}</p>

              {selected.tags?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
                  {selected.tags.map((t,i) => <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"#f0ede8", color:"#6b6860" }}>#{t}</span>)}
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                <div style={{ background:"#f5f4f0", borderRadius:11, padding:"12px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, fontFamily:"monospace", lineHeight:1 }}>₹{selected.budget}</div>
                  <div style={{ fontSize:10, color:"#9b9890", marginTop:2 }}>Budget</div>
                </div>
                <div style={{ background:"#f5f4f0", borderRadius:11, padding:"12px 8px", textAlign:"center" }}>
                  {(() => { const t=timeLeft(selected.deadline); return <><div style={{ fontSize:11, fontWeight:800, color:t.color }}>{t.text}</div><div style={{ fontSize:10, color:"#9b9890", marginTop:2 }}>Deadline</div></>; })()}
                </div>
                <div style={{ background:"#f5f4f0", borderRadius:11, padding:"12px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, lineHeight:1 }}>{selected.bids?.length||0}</div>
                  <div style={{ fontSize:10, color:"#9b9890", marginTop:2 }}>Bids</div>
                </div>
              </div>

              {selected.attachments?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#9b9890", textTransform:"uppercase", letterSpacing:".05em", marginBottom:7 }}>Attachments</div>
                  <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                    {selected.attachments.map((url,i) => {
                      const rawExt = url.split(".").pop().split("?")[0].toLowerCase();
                      const ext = ["png","jpg","jpeg","webp","gif"].includes(rawExt)?rawExt:"pdf";
                      return <button key={i} onClick={() => handleDownload(url,`attachment_${i+1}.${ext}`)} style={{ padding:"6px 12px", borderRadius:8, border:"none", background:"#f0ede8", color:"#1a1a18", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>📎 File {i+1} (.{ext})</button>;
                    })}
                  </div>
                </div>
              )}

              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #f0ede8" }}>
                {selected.postedBy?.profileImage
                  ? <img src={selected.postedBy.profileImage} alt="" style={{ width:26,height:26,borderRadius:"50%",objectFit:"cover" }}/>
                  : <div style={{ width:26,height:26,borderRadius:"50%",background:"#e5e3dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>{selected.postedBy?.name?.charAt(0)}</div>
                }
                <span style={{ fontSize:12, color:"#9b9890" }}>by <strong style={{ color:"#1a1a18" }}>{selected.postedBy?.name}</strong></span>
              </div>

              {/* Bids — owner view */}
              {isOwner && selected.bids?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#9b9890", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 }}>Bids ({selected.bids.length})</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {selected.bids.map((bid,i) => (
                      <div key={i} style={{ background:"#f5f4f0", borderRadius:11, padding:"11px 13px", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28,height:28,borderRadius:"50%",background:"#e5e3dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>{bid.userId?.name?.charAt(0)||"?"}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{bid.userId?.name}</div>
                          {bid.message && <div style={{ fontSize:11, color:"#9b9890", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bid.message}</div>}
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontSize:14, fontWeight:800, fontFamily:"monospace" }}>₹{bid.amount}</div>
                          {selected.status==="open" && (
                            <button onClick={() => handleAccept(selected._id, bid.userId?._id)} style={{ marginTop:4, padding:"3px 10px", borderRadius:7, border:"none", background:"#1a1a18", color:"#fff", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                              Accept
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && selected.status==="assigned" && (
                <button style={{...T.btnFull, marginBottom:8}} onClick={() => handleComplete(selected._id)}>Mark as Completed</button>
              )}

              {/* Bid form */}
              {!isOwner && selected.status==="open" && (
                <div style={{ background:"#f5f4f0", borderRadius:13, padding:"14px" }}>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>{myBid?`Your bid: ₹${myBid.amount} — Update`:"Place a Bid"}</div>
                  <div style={{ position:"relative", marginBottom:8 }}>
                    <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#9b9890", fontSize:13 }}>₹</span>
                    <input type="number" placeholder="Your price" value={bidAmount} onChange={e=>setBidAmount(e.target.value)} style={{...T.input, paddingLeft:22}} />
                  </div>
                  <textarea placeholder="Why should they pick you? (optional)" rows={2} value={bidMessage} onChange={e=>setBidMessage(e.target.value)} style={{...T.textarea, marginBottom:10}} />
                  <button onClick={handleBid} disabled={bidding} style={{...T.btnFull, opacity:bidding?.6:1}}>
                    {bidding?"Placing…":myBid?"Update Bid":"Place Bid"}
                  </button>
                </div>
              )}

              {selected.status==="assigned" && selected.assignedTo && (
                <div style={{ background:"#f5f4f0", borderRadius:11, padding:"12px 14px", display:"flex", alignItems:"center", gap:10, marginTop:10 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:"#e5e3dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>{selected.assignedTo?.name?.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"#9b9890", textTransform:"uppercase" }}>Assigned to</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{selected.assignedTo?.name} · ₹{selected.acceptedBid}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showPost && (
        <div style={T.overlay} onClick={() => setShowPost(false)}>
          <div style={T.modal} onClick={e => e.stopPropagation()}>
            <div style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:15, fontWeight:800 }}>Post Assignment</div>
                <button style={T.closeBtn} onClick={() => setShowPost(false)}>✕</button>
              </div>
              <form onSubmit={handlePost} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <input style={T.input} placeholder="Title *" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                <textarea style={{...T.textarea,minHeight:78}} placeholder="Describe the assignment *" rows={3} required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                <select style={T.select} required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                  <option value="">Select Subject *</option>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#9b9890",fontSize:13 }}>₹</span>
                    <input style={{...T.input,paddingLeft:22}} type="number" placeholder="Budget *" required value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} />
                  </div>
                  <div>
                    <input style={T.input} type="datetime-local" required value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
                    <div style={{ fontSize:10,color:"#9b9890",marginTop:3 }}>Deadline *</div>
                  </div>
                </div>
                <input style={T.input} placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
                <label style={{ cursor:"pointer" }}>
                  <div style={{ border:"1.5px dashed #e5e3dc", borderRadius:10, padding:"12px", textAlign:"center", background:"#fafaf9" }}>
                    {files.length>0
                      ? <span style={{ fontSize:12, color:"#1a1a18", fontWeight:600 }}>📎 {files.length} file(s) selected</span>
                      : <span style={{ fontSize:12, color:"#9b9890" }}>📎 Attach files (optional)</span>}
                  </div>
                  <input type="file" multiple accept="image/*,.pdf" onChange={e=>setFiles(Array.from(e.target.files||[]))} style={{ display:"none" }} />
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  <button type="submit" disabled={uploading} style={{...T.btnFull, opacity:uploading?.6:1}}>{uploading?"Posting…":"Post Assignment"}</button>
                  <button type="button" onClick={() => setShowPost(false)} style={{ padding:"11px 16px", borderRadius:11, border:"1px solid #e5e3dc", background:"#f5f4f0", color:"#6b6860", fontSize:13, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>Cancel</button>
                </div>
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
            <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.3px" }}>Assignments</div>
            <div style={{ fontSize:11, color:"#9b9890", marginTop:1 }}>Post tasks, earn by helping others</div>
          </div>
          <button style={T.btn} onClick={() => setShowPost(true)}>+ Post</button>
        </div>

        {/* Underline tabs */}
        <div style={T.tabBar}>
          {[{key:"browse",l:"Browse"},{key:"my-posts",l:"My Posts"},{key:"my-work",l:"My Work"}].map(t=>(
            <button key={t.key} style={T.tab(tab===t.key)} onClick={() => setTab(t.key)}>{t.l}</button>
          ))}
        </div>

        {/* Filters */}
        {tab==="browse" && (
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
            <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", fontSize:11, color:"#6b6860", outline:"none", flexShrink:0, fontFamily:"inherit" }}>
              <option value="">All Subjects</option>
              {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterSort} onChange={e=>setFilterSort(e.target.value)} style={{ padding:"7px 10px", borderRadius:9, border:"1px solid #e5e3dc", background:"#fff", fontSize:11, color:"#6b6860", outline:"none", flexShrink:0, fontFamily:"inherit" }}>
              <option value="newest">Newest</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
              <option value="deadline">Deadline Soon</option>
            </select>
            <span style={{ fontSize:11, color:"#9b9890", alignSelf:"center", marginLeft:"auto", whiteSpace:"nowrap" }}>{assignments.length} found</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#9b9890" }}>Loading…</div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px", background:"#fff", border:"1px solid #e5e3dc", borderRadius:13 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📝</div>
            <div style={{ fontWeight:700 }}>{tab==="browse"?"No open assignments":tab==="my-posts"?"Nothing posted yet":"No work taken yet"}</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {assignments.map(a => {
              const tl = timeLeft(a.deadline);
              const isMine = a.postedBy?._id===user._id||a.postedBy===user._id;
              return (
                <div key={a._id} onClick={() => openDetail(a)} style={{ background:"#fff", border:"1px solid #e5e3dc", borderRadius:13, padding:"14px 16px", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:6 }}>
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, fontWeight:700, background:"#f0ede8", color:a.status==="completed"||a.status==="cancelled"?"#9b9890":"#1a1a18" }}>{a.status}</span>
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"#f0ede8", color:"#6b6860" }}>{a.subject}</span>
                        {tl.urgent && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:100, background:"#f0ede8", color:"#dc2626", fontWeight:600 }}>⚡ Urgent</span>}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{a.title}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:800, fontFamily:"monospace", lineHeight:1 }}>₹{a.budget}</div>
                      <div style={{ fontSize:10, color:"#9b9890", marginTop:2 }}>budget</div>
                    </div>
                  </div>

                  <p style={{ fontSize:12, color:"#9b9890", marginBottom:10, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{a.description}</p>

                  {a.tags?.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                      {a.tags.slice(0,3).map((t,i) => <span key={i} style={{ fontSize:10, padding:"2px 7px", borderRadius:100, background:"#f0ede8", color:"#6b6860" }}>#{t}</span>)}
                    </div>
                  )}

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:10, borderTop:"1px solid #f0ede8" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ width:20,height:20,borderRadius:"50%",background:"#e5e3dc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700 }}>{a.postedBy?.name?.charAt(0)}</div>
                      <span style={{ fontSize:11, color:"#9b9890" }}>{isMine?"You":a.postedBy?.name}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:tl.color }}>{tl.text}</span>
                      <span style={{ fontSize:11, color:"#9b9890" }}>{a.bids?.length||0} bids</span>
                      {isMine && a.status==="open" && (
                        <button onClick={e=>{e.stopPropagation();handleDelete(a._id);}} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#d1d0ca",padding:0 }}>🗑</button>
                      )}
                    </div>
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