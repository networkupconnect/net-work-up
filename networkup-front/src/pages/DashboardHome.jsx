import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { usePosts } from "../context/PostsContext";

const STYLES = `
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes fadeIn  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }

  .dh-wrap  { display:flex; min-height:100vh; }
  .dh-feed  { width:100%; overflow-y:auto; padding-bottom:80px; }
  @media(min-width:640px){ .dh-wrap{padding:12px;gap:12px} .dh-feed{width:520px;flex-shrink:0} }

  .sk { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:400px 100%; animation:shimmer 1.3s ease infinite; border-radius:6px; }
  .sk-card { background:#fff; border-bottom:1.5px solid #e5e7eb; padding:14px 12px; }
  .sk-compose { background:#f3f4f6; border-radius:24px; padding:12px; margin:8px 8px 4px; }

  .compose  { background:#f3f4f6; border-radius:24px; padding:12px; margin:8px 8px 4px; }
  .compose-ta { width:100%; background:#fff; border:1px solid #e5e7eb; outline:none; border-radius:18px; padding:8px 16px; font-size:14px; color:#111110; resize:none; overflow:hidden; min-height:36px; box-sizing:border-box; font-family:inherit; }
  .compose-preview { margin-top:9px; display:flex; align-items:center; gap:9px; padding:7px 9px; background:#fff; border-radius:10px; }
  .compose-preview img,.compose-preview video { width:56px; height:56px; object-fit:cover; border-radius:7px; }
  .compose-preview-rm { font-size:12px; color:#dc2626; background:none; border:none; cursor:pointer; }
  .compose-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; }
  .compose-img-btn { width:34px; height:34px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .compose-send { width:34px; height:34px; border-radius:50%; background:#2563eb; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .compose-send:disabled { opacity:0.35; cursor:not-allowed; }
  .compose-spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; }

  .fc { background:#fff; border-bottom:1.5px solid #e5e7eb; padding:14px 12px 12px; }
  .fc-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .fc-who { display:flex; align-items:center; gap:12px; flex:1; min-width:0; }
  .fc-clk { display:flex; align-items:center; gap:12px; cursor:pointer; }
  .fc-av { width:40px; height:40px; border-radius:50%; object-fit:cover; border:1.5px solid #e5e7eb; flex-shrink:0; display:block; }
  .fc-av-fb { width:40px; height:40px; border-radius:50%; background:#111110; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .fc-av-fb span { color:#fff; font-size:13px; font-weight:600; }
  .fc-name { font-size:13px; font-weight:600; color:#111110; line-height:1.2; }
  .fc-sub  { font-size:11px; color:#9ca3af; margin-top:1px; }

  .fc-img  { max-width:100%; max-height:300px; object-fit:contain; border-radius:10px; display:block; cursor:zoom-in; background:#f3f4f6; }
  .fc-body { padding-left:52px; }
  .fc-img-wrap { padding-left:52px; margin-bottom:8px; }
  .fc-caption { font-size:13px; color:#111110; line-height:1.5; margin-bottom:9px; white-space:pre-wrap; }
  .fc-actions { display:flex; gap:16px; }
  .fc-act-btn { display:flex; align-items:center; gap:5px; background:none; border:none; cursor:pointer; padding:0; }
  .fc-act-btn:disabled { cursor:default; }
  .fc-act-count { font-size:12px; color:#6b7280; font-weight:500; }
  .fc-act-count.liked { color:#ef4444; }
  .del-btn { font-size:12px; color:#9ca3af; background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:6px; flex-shrink:0; }
  .del-btn:hover { color:#dc2626; }

  .cmt-wrap { margin-top:10px; background:#f9fafb; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb; }
  .cmt-list { padding:10px 12px; max-height:170px; overflow-y:auto; display:flex; flex-direction:column; gap:7px; }
  .cmt-row  { display:flex; align-items:flex-start; gap:7px; }
  .cmt-mini-av { width:22px; height:22px; border-radius:50%; background:#111110; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; overflow:hidden; }
  .cmt-mini-av span,.cmt-mini-av-img { font-size:10px; font-weight:600; color:#fff; }
  .cmt-mini-av-img { width:22px; height:22px; object-fit:cover; }
  .cmt-bubble { background:#fff; border-radius:10px; border-top-left-radius:3px; padding:5px 10px; border:1px solid #e5e7eb; max-width:85%; }
  .cmt-author { font-size:11px; font-weight:600; color:#111110; margin-right:5px; }
  .cmt-text   { font-size:11px; color:#6b7280; }
  .cmt-empty  { text-align:center; font-size:11px; color:#9ca3af; padding:4px 0; }
  .cmt-form   { display:flex; align-items:center; gap:7px; padding:7px 10px; border-top:1px solid #e5e7eb; background:#fff; }
  .cmt-in { flex:1; background:#f3f4f6; border:1px solid transparent; outline:none; border-radius:999px; padding:6px 13px; font-size:12px; color:#111110; font-family:inherit; }
  .cmt-in::placeholder { color:#9ca3af; }
  .cmt-send { width:26px; height:26px; border-radius:50%; background:#111110; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cmt-send:disabled { opacity:0.3; cursor:not-allowed; }
  .cmt-login { text-align:center; font-size:11px; color:#9ca3af; padding:7px 0; border-top:1px solid #e5e7eb; }

  .fc-cover { width:100%; max-height:200px; object-fit:contain; border-radius:10px; display:block; margin-bottom:8px; cursor:zoom-in; background:#f3f4f6; }
  .fc-proj-title  { font-size:14px; font-weight:600; color:#111110; margin-bottom:2px; }
  .fc-proj-tline  { font-size:12px; color:#9ca3af; margin-bottom:5px; }
  .fc-proj-desc   { font-size:13px; color:#6b7280; line-height:1.5; margin-bottom:7px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .fc-tags { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
  .fc-tag  { font-size:11px; padding:2px 7px; border-radius:999px; background:#f3f4f6; border:1px solid #e5e7eb; color:#6b7280; font-family:monospace; }
  .fc-links { display:flex; gap:14px; padding-top:8px; border-top:1px solid #f3f4f6; margin-bottom:2px; }
  .fc-link  { font-size:12px; font-weight:500; color:#6b7280; text-decoration:none; }
  .fc-link.primary { color:#2563eb; }

  .badge { font-size:10px; font-weight:500; padding:2px 8px; border-radius:999px; font-family:monospace; flex-shrink:0; }
  .badge-completed   { background:#f0fdf4; color:#16a34a; }
  .badge-in-progress { background:#fffbeb; color:#b45309; }
  .badge-idea        { background:#f3f4f6; color:#6b7280; }
  .badge-done        { background:#f0fdf4; color:#16a34a; }

  .stars { display:flex; align-items:center; gap:4px; margin-top:10px; }
  .star  { background:none; border:none; cursor:pointer; font-size:15px; padding:0; line-height:1; }
  .star.off { color:#e5e7eb; }
  .star.on  { color:#f59e0b; }
  .star-avg { font-size:11px; color:#9ca3af; margin-left:3px; }

  .tc-tl-body { flex:1; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:9px 11px; }
  .tc-complete-tag { font-size:10px; font-weight:600; color:#16a34a; font-family:monospace; letter-spacing:0.04em; display:block; margin-bottom:3px; }
  .tc-p-text { font-size:13px; color:#374151; line-height:1.45; }
  .tc-p-link { font-size:11px; color:#2563eb; text-decoration:none; word-break:break-all; display:block; margin-top:3px; }
  .tc-p-img  { max-width:110px; max-height:80px; object-fit:cover; border-radius:5px; border:1px solid #e5e7eb; display:block; margin-top:6px; cursor:zoom-in; }
  .tc-toggle-btn { font-size:11px; color:#9ca3af; background:none; border:none; cursor:pointer; padding:0; margin-bottom:6px; }
  .tc-expand-list { display:flex; flex-direction:column; gap:5px; margin-bottom:6px; }

  .feed-empty { text-align:center; padding:64px 0; color:#9ca3af; font-size:14px; }
  .dh-sidebar { display:none; }
  @media(min-width:640px){ .dh-sidebar{ display:block; flex:1; background:#f3f4f6; border-radius:24px; height:100vh; position:sticky; top:0; } }

  .compose-vid-btn { width:34px; height:34px; border-radius:50%; background:#e5e7eb; display:flex; align-items:center; justify-content:center; cursor:pointer; }

  .lightbox-overlay {
    position:fixed; inset:0; z-index:9999;
    background:rgba(0,0,0,0.92);
    display:flex; align-items:center; justify-content:center;
    cursor:zoom-out;
    animation:fadeIn 0.18s ease;
  }
  .lightbox-img {
    max-width:94vw; max-height:92vh;
    object-fit:contain; border-radius:8px;
    box-shadow:0 8px 40px rgba(0,0,0,0.5);
    cursor:default;
  }
  .lightbox-close {
    position:fixed; top:18px; right:22px;
    background:rgba(255,255,255,0.12); border:none; color:#fff;
    width:38px; height:38px; border-radius:50%; font-size:20px;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(6px);
  }
  .lightbox-close:hover { background:rgba(255,255,255,0.22); }

  /* ── Video: full card width, dynamic height ─────────────────────────────── */
  .fc-video-wrap { margin-bottom:8px; }

  /* Native <video>: width fills card, height follows natural aspect ratio    */
  .fc-video-native {
    width:100%; height:auto; display:block;
    border-radius:10px; background:#000;
  }

  /* YouTube iframe wrapper: aspect-ratio set via inline style from oEmbed    */
  .fc-video-box {
    position:relative; width:100%; height:64vh;
    border-radius:10px; overflow:hidden; background:#000;
  }
  .fc-video-box iframe {
    position:absolute; inset:0;
    width:100%; height:100%;
    border:none; display:block;
  }
  /* processing / not-ready state card */
  .fc-video-box .yt-proc-card {
    position:absolute; inset:0;
    display:flex; align-items:center; gap:12px;
    padding:14px 16px;
    background:#0a0a0a;
    text-decoration:none;
  }
  .yt-proc-card-text p { margin:0; }
  .yt-proc-title { font-size:13px; font-weight:600; color:#fff; }
  .yt-proc-sub   { font-size:11px; color:#aaa; margin-top:3px !important; }
`;

if (typeof document !== "undefined" && !document.getElementById("dh-styles")) {
  const el = document.createElement("style");
  el.id = "dh-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

const fmtDate = (d) => {
  const ms = Date.now() - new Date(d);
  const m = Math.floor(ms / 6e4), h = Math.floor(ms / 36e5), dy = Math.floor(ms / 864e5);
  if (m < 1) return "now"; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`; if (dy < 7) return `${dy}d`;
  return new Date(d).toLocaleDateString();
};

const badgeClass = (s) => `badge ${s === "completed" ? "badge-completed" : s === "in-progress" ? "badge-in-progress" : "badge-idea"}`;
const badgeLabel = (s) => s === "in-progress" ? "In Progress" : s === "completed" ? "Completed" : "Idea";

const YT_ICON = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff0000" style={{ flexShrink: 0 }}>
    <path d="M23.5 6.2s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.6 2 12 2 12 2s-4.6 0-7.3.1c-.6.1-1.9.1-3 1.3C.8 4.2.5 6.2.5 6.2S.2 8.5.2 10.8v2.1c0 2.3.3 4.6.3 4.6s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7 21.7 12 21.8 12 21.8s4.6 0 7.3-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.6v-2.1C23.8 8.5 23.5 6.2 23.5 6.2zM9.7 15.5V8.4l8.1 3.6-8.1 3.5z"/>
  </svg>
);

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = memo(({ src, onClose }) => {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <img className="lightbox-img" src={src} alt="Full view" onClick={(e) => e.stopPropagation()} />
    </div>
  );
});

// ── Avatar ────────────────────────────────────────────────────────────────────
const Av = memo(({ src, name, onClick }) =>
  src
    ? <img src={src} alt={name || ""} className="fc-av" onClick={onClick} decoding="async" width={40} height={40} style={onClick ? { cursor: "pointer" } : undefined} />
    : <div className="fc-av-fb" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}><span>{(name || "?").charAt(0).toUpperCase()}</span></div>
);

// ── Stars ─────────────────────────────────────────────────────────────────────
const Stars = memo(({ ratings, itemId, type, onRate, userId }) => {
  const mine = userId ? (ratings.find(r => r.userId?.toString() === userId)?.stars || 0) : 0;
  const avg  = ratings.length ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1) : null;
  return (
    <div className="stars">
      {[1,2,3,4,5].map(s => (
        <button key={s} className={`star ${s <= mine ? "on" : "off"}`}
          onClick={() => userId && onRate(itemId, type, s)}
          style={!userId ? { cursor: "default" } : undefined}>★</button>
      ))}
      {avg && <span className="star-avg">{avg} ({ratings.length})</span>}
    </div>
  );
});

// ── Video Block ───────────────────────────────────────────────────────────────
const VideoBlock = memo(({ videoUrl }) => {
  const [ytReady,      setYtReady]      = useState(true);
  const [ytRatio,      setYtRatio]      = useState(16 / 9);

  const nativeRef = useRef(null);
  const iframeRef = useRef(null);

  const isYouTube = Boolean(
    videoUrl && (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"))
  );

  const videoId = useMemo(() => {
    if (!isYouTube) return null;
    const m = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return m ? m[1] : null;
  }, [videoUrl, isYouTube]);

  useEffect(() => {
    if (!videoId) return;
    setYtReady(true);

    const img = new Image();
    img.onload  = () => setYtReady(true);
    img.onerror = () => setYtReady(false);
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    let cancelled = false;
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled && data.width && data.height) {
          setYtRatio(data.width / data.height);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [videoId]);

  useEffect(() => {
    const el = nativeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.play().catch(() => {}); }
        else { el.pause(); }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, isYouTube]);

  const sendYTCmd = useCallback((iframe, cmd) => {
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: cmd, args: [] }),
        "*"
      );
    } catch {}
  }, []);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          sendYTCmd(el, "unMute");
          sendYTCmd(el, "playVideo");
        } else {
          sendYTCmd(el, "pauseVideo");
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, videoId, sendYTCmd]);

  if (!videoUrl) return null;

  if (!isYouTube) {
    return (
      <div className="fc-video-wrap">
        <video
          ref={nativeRef}
          className="fc-video-native"
          loop
          playsInline
          controls
          src={videoUrl}
        />
      </div>
    );
  }

  if (!ytReady) {
    return (
      <div className="fc-video-wrap">
        <div className="fc-video-box" style={{ aspectRatio: ytRatio }}>
          <a href={videoUrl} target="_blank" rel="noreferrer" className="yt-proc-card">
            {YT_ICON}
            <div className="yt-proc-card-text">
              <p className="yt-proc-title">Video processing on YouTube…</p>
              <p className="yt-proc-sub">Usually ready in 2–5 min · tap to watch when ready ↗</p>
            </div>
          </a>
        </div>
      </div>
    );
  }

  const embedUrl =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&mute=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&controls=1`;

  return (
    <div className="fc-video-wrap">
      <div className="fc-video-box" style={{ aspectRatio: ytRatio }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
});

// ── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard = memo(({ project, onRate, onNav, userId, onOpenImage }) => {
  const cover = project.coverImages?.[0] || project.coverImage;
  const tags  = project.tags?.length ? project.tags : (project.techStack || []);
  const a     = project.author;
  const goProfile = () => onNav(`/user/${a?._id}`);
  return (
    <article className="fc">
      <div className="fc-hd">
        <div className="fc-who">
          <div className="fc-clk" onClick={goProfile}>
            <Av src={a?.profileImage} name={a?.name} />
            <div><p className="fc-name">{a?.name}</p><p className="fc-sub">published a project</p></div>
          </div>
        </div>
        <span className={badgeClass(project.status)}>{badgeLabel(project.status)}</span>
      </div>
      <div className="fc-body">
        {cover && (
          <img src={cover} alt={project.title} className="fc-cover"
            loading="lazy" decoding="async" width={480} height={200}
            onClick={() => onOpenImage(cover)} />
        )}
        <p className="fc-proj-title">{project.title}</p>
        {project.tagline    && <p className="fc-proj-tline">{project.tagline}</p>}
        {project.description && <p className="fc-proj-desc">{project.description}</p>}
        {tags.length > 0 && <div className="fc-tags">{tags.map((t, i) => <span key={i} className="fc-tag">{t}</span>)}</div>}
        {(project.liveUrl || project.repoUrl || project.ytUrl) && (
          <div className="fc-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="fc-link primary">Live ↗</a>}
            {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="fc-link">Repo ↗</a>}
            {project.ytUrl   && <a href={project.ytUrl}   target="_blank" rel="noreferrer" className="fc-link">▶ Video</a>}
          </div>
        )}
        <Stars ratings={project.ratings || []} itemId={project._id} type="project" onRate={onRate} userId={userId} />
      </div>
    </article>
  );
});

// ── Target Card ───────────────────────────────────────────────────────────────
const TargetCard = memo(({ target, onRate, onNav, userId, onOpenImage }) => {
  const [open, setOpen] = useState(false);
  const a    = target.author;
  const prog = target.progress || [];
  const latest = prog[prog.length - 1];
  const goProfile = () => onNav(`/user/${a?._id}`);
  return (
    <article className="fc">
      <div className="fc-hd">
        <div className="fc-who">
          <div className="fc-clk" onClick={goProfile}>
            <Av src={a?.profileImage} name={a?.name} />
            <div><p className="fc-name">{a?.name}</p><p className="fc-sub">progress update</p></div>
          </div>
        </div>
        {target.isCompleted && <span className="badge badge-done">Done</span>}
      </div>
      <div className="fc-body">
        <p className="fc-proj-title">🎯 {target.title}</p>
        <p className="fc-sub" style={{ marginBottom: 8 }}>{prog.length} update{prog.length !== 1 ? "s" : ""}</p>
        {latest && (
          <div className="tc-tl-body" style={{ marginBottom: 6 }}>
            {latest.isCompletion && <span className="tc-complete-tag">✓ COMPLETION</span>}
            {latest.text  && <p className="tc-p-text">{latest.text}</p>}
            {latest.link  && <a href={latest.link} target="_blank" rel="noreferrer" className="tc-p-link">{latest.link}</a>}
            {latest.image && <img src={latest.image} alt="" className="tc-p-img" loading="lazy" decoding="async" onClick={() => onOpenImage(latest.image)} />}
          </div>
        )}
        {prog.length > 1 && (
          <button className="tc-toggle-btn" onClick={() => setOpen(o => !o)}>
            {open ? "▲ less" : `▼ ${prog.length - 1} more update${prog.length - 1 !== 1 ? "s" : ""}`}
          </button>
        )}
        {open && (
          <div className="tc-expand-list">
            {prog.slice(0, -1).reverse().map(p => (
              <div key={p._id} className="tc-tl-body">
                {p.isCompletion && <span className="tc-complete-tag">✓ COMPLETION</span>}
                {p.text  && <p className="tc-p-text">{p.text}</p>}
                {p.link  && <a href={p.link} target="_blank" rel="noreferrer" className="tc-p-link">{p.link}</a>}
                {p.image && <img src={p.image} alt="" className="tc-p-img" loading="lazy" decoding="async" onClick={() => onOpenImage(p.image)} />}
              </div>
            ))}
          </div>
        )}
        <Stars ratings={target.ratings || []} itemId={target._id} type="target" onRate={onRate} userId={userId} />
      </div>
    </article>
  );
});

// ── Comment Section ───────────────────────────────────────────────────────────
const CommentSection = memo(({ post, commentText, onChangeComment, onAddComment, user }) => (
  <div className="cmt-wrap">
    <div className="cmt-list">
      {post.comments?.length > 0 ? post.comments.map(c => (
        <div key={c._id} className="cmt-row">
          <div className="cmt-mini-av"><span>{(c.userName || "?").charAt(0).toUpperCase()}</span></div>
          <div className="cmt-bubble">
            <span className="cmt-author">{c.userName}</span>
            <span className="cmt-text">{c.text}</span>
          </div>
        </div>
      )) : <p className="cmt-empty">No comments yet</p>}
    </div>
    {user ? (
      <div className="cmt-form">
        <div className="cmt-mini-av">
          {user.profileImage
            ? <img src={user.profileImage} alt="" className="cmt-mini-av-img" decoding="async" />
            : <span>{(user.name || "?").charAt(0).toUpperCase()}</span>}
        </div>
        <input className="cmt-in" placeholder="Write a comment…"
          value={commentText}
          onChange={e => onChangeComment(post._id, e.target.value)}
          onKeyDown={e => e.key === "Enter" && onAddComment(post._id)} />
        <button className="cmt-send" onClick={() => onAddComment(post._id)} disabled={!commentText?.trim()}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    ) : <p className="cmt-login">Login to comment</p>}
  </div>
));

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = memo(({ post, user, onLike, onDelete, onToggleComments, showComments, commentText, onChangeComment, onAddComment, onProfileClick, onOpenImage }) => {
  const pImg  = typeof post.userId === "object" && post.userId?.profileImage ? post.userId.profileImage
    : (user && (post.userId?._id || post.userId)?.toString() === user._id?.toString() ? user.profileImage : null);
  const pName = typeof post.userId === "object" && post.userId?.name ? post.userId.name : post.userName || "Unknown";
  const isOwn = user && (post.userId?._id || post.userId)?.toString() === user._id?.toString();
  const liked = user && (post.likes || []).includes(user._id);

  return (
    <article className="fc" style={post._isTemp ? { opacity: 0.65, pointerEvents: "none" } : undefined}>
      <div className="fc-hd">
        <div className="fc-who">
          <div className="fc-clk" onClick={() => !post._isTemp && onProfileClick(post)}>
            <Av src={pImg} name={pName} />
            <div>
              <p className="fc-name">{pName}</p>
              <p className="fc-sub">{post._isTemp ? "Posting…" : fmtDate(post.createdAt)}</p>
            </div>
          </div>
        </div>
        {!post._isTemp && isOwn && <button className="del-btn" onClick={() => onDelete(post._id)}>Delete</button>}
      </div>

      {post.image && (
        <div className="fc-img-wrap">
          <img src={post.image} alt={post.caption || "post"} className="fc-img"
            loading="lazy" decoding="async" width={468} height={300}
            onClick={() => !post._isTemp && onOpenImage(post.image)} />
        </div>
      )}

      {/* VideoBlock handles null/empty videoUrl safely — renders nothing */}
      {!post._isTemp && <VideoBlock videoUrl={post.videoUrl} />}

      <div className="fc-body">
        {post.caption && <p className="fc-caption">{post.caption}</p>}
        {!post._isTemp && (
          <div className="fc-actions" style={{ marginBottom: showComments ? 10 : 0 }}>
            <button className="fc-act-btn" onClick={() => onLike(post._id)} disabled={!user}>
              {liked
                ? <img width={15} height={15} src="/images/lheart.svg" alt="" />
                : <img width={15} height={15} src="/images/ulheart.svg" alt="" />}
              <span className={`fc-act-count ${liked ? "liked" : ""}`}>{(post.likes || []).length}</span>
            </button>
            <button className="fc-act-btn" onClick={() => onToggleComments(post._id)}>
              <img width={15} height={15} src="/images/comment.svg" alt="" />
              <span className="fc-act-count">{(post.comments || []).length}</span>
            </button>
          </div>
        )}
        {showComments && !post._isTemp && (
          <CommentSection post={post} commentText={commentText} onChangeComment={onChangeComment} onAddComment={onAddComment} user={user} />
        )}
      </div>
    </article>
  );
});

// ── Dashboard Home ────────────────────────────────────────────────────────────
const DashboardHome = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { posts, setPosts, loading, fetchPosts } = usePosts();

  const [caption,     setCaption]     = useState("");
  const [imgFile,     setImgFile]     = useState(null);
  const [vidFile,     setVidFile]     = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [vidPreview,  setVidPreview]  = useState(null);
  const [creating,    setCreating]    = useState(false);
  const [comments,    setComments]    = useState({});
  const [openCmts,    setOpenCmts]    = useState({});
  const [projects,    setProjects]    = useState([]);
  const [targets,     setTargets]     = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const taRef = useRef(null);

  const resize = useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  useEffect(() => {
    fetchPosts();
    (async () => {
      try {
        const [pr, tr] = await Promise.all([
          api.get("/api/projects/recent"),
          api.get("/api/targets/recent"),
        ]);
        setProjects(Array.isArray(pr.data) ? pr.data : []);
        setTargets(Array.isArray(tr.data) ? tr.data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  const feed = useMemo(() => [
    ...posts.map(p => ({ ...p, _ft: "post" })),
    ...projects.map(p => ({ ...p, _ft: "project" })),
    ...targets.map(t => ({ ...t, _ft: "target" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [posts, projects, targets]);

  const handleRate = useCallback(async (id, type, stars) => {
    try {
      if (type === "project") {
        const r = await api.post(`/api/projects/${id}/rate`, { stars });
        setProjects(p => p.map(x => x._id === id ? { ...x, ratings: r.data.ratings } : x));
      } else {
        const r = await api.post(`/api/targets/${id}/rate`, { stars });
        setTargets(t => t.map(x => x._id === id ? { ...x, ratings: r.data.ratings } : x));
      }
    } catch { /* ignore */ }
  }, []);

  const handleProfileClick = useCallback((post) => {
    const pid = post.userId?._id || post.userId;
    if (!pid) return;
    if (user && pid.toString() === user._id.toString()) navigate("/profile");
    else navigate(`/user/${pid}`);
  }, [user, navigate]);

  // ── ✅ FIXED: Optimistic post creation ──────────────────────────────────────
  // The form clears and a dimmed preview card appears instantly.
  // On success it is swapped for the real server post.
  // On failure the temp card is removed and the form state is restored.
  const handleCreatePost = useCallback(async () => {
    if (!caption.trim() && !imgFile && !vidFile) {
      alert("Add a photo, video or write something");
      return;
    }

    // Snapshot current form values before clearing
    const savedCaption    = caption.trim();
    const savedImgFile    = imgFile;
    const savedVidFile    = vidFile;
    const savedPreview    = preview;
    const savedVidPreview = vidPreview;

    // Build a temporary post that matches PostCard's expected shape
    const tempId   = `temp_${Date.now()}`;
    const tempPost = {
      _id:       tempId,
      _ft:       "post",
      _isTemp:   true,
      userId:    { _id: user._id, name: user.name, profileImage: user.profileImage },
      userName:  user.name,
      caption:   savedCaption,
      image:     savedPreview    || "",
      videoUrl:  savedVidPreview || "",
      likes:     [],
      comments:  [],
      createdAt: new Date().toISOString(),
    };

    // Show it immediately & clear the form
    setPosts(p => [tempPost, ...p]);
    setCaption(""); setImgFile(null); setVidFile(null);
    setPreview(null); setVidPreview(null);
    if (taRef.current) taRef.current.style.height = "36px";

    const fd = new FormData();
    if (savedImgFile) fd.append("image", savedImgFile);
    if (savedVidFile) fd.append("video", savedVidFile);
    if (savedCaption) fd.append("caption", savedCaption);

    try {
      setCreating(true);
      const res = await api.post("/api/feed/post", fd);
      // Swap temp post with the real one from the server
      setPosts(p => p.map(x => x._id === tempId ? { ...res.data, _ft: "post" } : x));
    } catch (e) {
      // Roll back: remove the temp post and restore the form
      setPosts(p => p.filter(x => x._id !== tempId));
      setCaption(savedCaption);
      setImgFile(savedImgFile);    setVidFile(savedVidFile);
      setPreview(savedPreview);    setVidPreview(savedVidPreview);
      if (taRef.current) { taRef.current.style.height = "auto"; resize(); }
      alert(e.response?.data?.message || "Failed to post. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [caption, imgFile, vidFile, preview, vidPreview, user, setPosts, resize]);

  const handleDeletePost = useCallback(async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.delete(`/api/feed/post/${id}`); setPosts(p => p.filter(x => x._id !== id)); }
    catch { alert("Failed"); }
  }, [setPosts]);

  const handleLikePost = useCallback(async (id) => {
    if (!user) return;
    try {
      const r = await api.post(`/api/feed/post/${id}/like`);
      setPosts(p => p.map(x => x._id === id ? {
        ...x,
        likes: r.data.liked ? [...(x.likes || []), user._id] : (x.likes || []).filter(l => l !== user._id),
      } : x));
    } catch { /* ignore */ }
  }, [user, setPosts]);

  const handleToggleComments = useCallback((id) => setOpenCmts(c => ({ ...c, [id]: !c[id] })), []);
  const handleChangeComment  = useCallback((id, val) => setComments(c => ({ ...c, [id]: val })), []);

  const handleAddComment = useCallback(async (id) => {
    const text = comments[id]?.trim();
    if (!text || !user) return;
    try {
      const r = await api.post(`/api/feed/post/${id}/comment`, { text });
      setPosts(p => p.map(x => x._id === id ? { ...x, comments: [...(x.comments || []), r.data] } : x));
      setComments(c => ({ ...c, [id]: "" }));
    } catch { alert("Failed to comment"); }
  }, [comments, user, setPosts]);

  const handleOpenImage     = useCallback((src) => setLightboxSrc(src), []);
  const handleCloseLightbox = useCallback(() => setLightboxSrc(null), []);

  const userId = user?._id?.toString();

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading && posts.length === 0) return (
    <div className="dh-wrap">
      <div className="dh-feed">
        <div className="sk-compose"><div className="sk" style={{ height: 36, borderRadius: 18 }} /></div>
        {[0,1,2].map(i => (
          <div key={i} className="sk-card">
            <div style={{ display:"flex", gap:12, marginBottom:10, alignItems:"center" }}>
              <div className="sk" style={{ width:40, height:40, borderRadius:"50%", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div className="sk" style={{ height:12, width:"35%", marginBottom:6 }} />
                <div className="sk" style={{ height:10, width:"22%" }} />
              </div>
            </div>
            {i === 0 && <div className="sk" style={{ height:160, borderRadius:10, marginBottom:10, marginLeft:52 }} />}
            <div style={{ marginLeft:52 }}>
              <div className="sk" style={{ height:10, width:"65%", marginBottom:5 }} />
              <div className="sk" style={{ height:10, width:"45%" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="dh-sidebar" />
    </div>
  );

  return (
    <div className="dh-wrap">
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={handleCloseLightbox} />}

      <div className="dh-feed">
        {user && (
          <div className="compose">
            <textarea ref={taRef} className="compose-ta"
              placeholder="What's on your mind?"
              value={caption}
              onChange={e => { setCaption(e.target.value); resize(); }}
              onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleCreatePost()}
              rows={1} />

            {preview && (
              <div className="compose-preview">
                <img src={preview} alt="" decoding="async" />
                <button className="compose-preview-rm" onClick={() => { setImgFile(null); setPreview(null); }}>✕ Remove photo</button>
              </div>
            )}

            {vidPreview && (
              <div className="compose-preview">
                <video src={vidPreview} style={{ width:56, height:56, objectFit:"cover", borderRadius:7 }} muted />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:11, color:"#374151", margin:0 }}>{vidFile?.name}</p>
                  <p style={{ fontSize:10, color:"#9ca3af", margin:"2px 0 0" }}>Will be uploaded to YouTube (Unlisted)</p>
                </div>
                <button className="compose-preview-rm" onClick={() => { setVidFile(null); setVidPreview(null); }}>✕</button>
              </div>
            )}

            <div className="compose-actions">
              <label className="compose-img-btn" title="Add photo">
                <img src="/images/image.svg" alt="photo" style={{ width:17, height:17 }} />
                <input type="file" accept="image/*" style={{ display:"none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); setVidFile(null); setVidPreview(null); }
                    e.target.value = "";
                  }} />
              </label>

              <label className="compose-vid-btn" title="Add video (uploaded to YouTube Unlisted)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <input type="file" accept="video/*" style={{ display:"none" }}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setVidFile(f); setVidPreview(URL.createObjectURL(f)); setImgFile(null); setPreview(null); }
                    e.target.value = "";
                  }} />
              </label>

              <button className="compose-send" onClick={handleCreatePost} disabled={creating || (!caption.trim() && !imgFile && !vidFile)}>
                {creating
                  ? <div className="compose-spinner" />
                  : <img src="/images/send.svg" alt="" style={{ width:15, height:15 }} />}
              </button>
            </div>
          </div>
        )}

        {feed.length === 0
          ? <div className="feed-empty">Nothing here yet — be the first to share</div>
          : feed.map(item => {
            if (item._ft === "project") return (
              <ProjectCard key={`proj-${item._id}`} project={item} onRate={handleRate} onNav={navigate} userId={userId} onOpenImage={handleOpenImage} />
            );
            if (item._ft === "target") return (
              <TargetCard key={`tgt-${item._id}`} target={item} onRate={handleRate} onNav={navigate} userId={userId} onOpenImage={handleOpenImage} />
            );
            return (
              <PostCard key={item._id} post={item} user={user}
                onLike={handleLikePost} onDelete={handleDeletePost}
                onToggleComments={handleToggleComments} showComments={!!openCmts[item._id]}
                commentText={comments[item._id] || ""} onChangeComment={handleChangeComment}
                onAddComment={handleAddComment} onProfileClick={handleProfileClick}
                onOpenImage={handleOpenImage} />
            );
          })}
      </div>
      <div className="dh-sidebar" />
    </div>
  );
};

export default DashboardHome;