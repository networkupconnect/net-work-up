import { useEffect, useState, useRef, useMemo, useCallback } from "react";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri"];

const HOLIDAYS = new Set(["2026-02-28","2026-03-01"]);

const STORAGE_KEYS = {
  attendance: "att26_data",
  baseline:   "att26_baseline",
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function fmtKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function isWeekend(y, m, d) {
  const w = new Date(y, m, d).getDay();
  return w === 0 || w === 6;
}

function isHoliday(dk) { return HOLIDAYS.has(dk); }

function getWeekdayBlanks(y, m) {
  const firstDow  = new Date(y, m, 1).getDay();
  const monOffset = firstDow === 0 ? 6 : firstDow - 1;
  let blanks = 0;
  for (let i = 0; i < monOffset; i++) { if (i % 7 < 5) blanks++; }
  return blanks;
}

function fmtDateLong(y, m, d) {
  return new Date(y, m, d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ─── Default day record ────────────────────────────────────────────────── */
function emptyDay() {
  return { total: 0, attended: 0, bunk: 0, massBunk: false };
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      background:"#111", color:"#fff", fontSize:12, fontWeight:600,
      padding:"7px 18px", borderRadius:100,
      boxShadow:"0 4px 20px rgba(0,0,0,.22)",
      zIndex:999, whiteSpace:"nowrap", pointerEvents:"none",
      animation:"fadeup .15s ease both",
    }}>{msg}</div>
  );
}

/* ─── Counter Row ───────────────────────────────────────────────────────── */
function Counter({ label, value, onInc, onDec, accent, disabled, extra }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"11px 0",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#6b6860", minWidth:110 }}>{label}</div>
        {extra}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <button
          onClick={onDec}
          disabled={disabled || value <= 0}
          style={{
            width:30, height:30, borderRadius:8,
            border:"1px solid #e0ddd5", background:"#f5f4f0",
            fontSize:16, fontWeight:700, color: disabled || value <= 0 ? "#ccc" : "#1c1b18",
            cursor: disabled || value <= 0 ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .12s",
          }}>−</button>
        <span style={{
          minWidth:36, textAlign:"center",
          fontSize:17, fontWeight:700, fontFamily:"monospace",
          color: accent || "#1c1b18",
        }}>{value}</span>
        <button
          onClick={onInc}
          disabled={disabled}
          style={{
            width:30, height:30, borderRadius:8,
            border:"1px solid #e0ddd5", background:"#f5f4f0",
            fontSize:16, fontWeight:700, color: disabled ? "#ccc" : "#1c1b18",
            cursor: disabled ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all .12s",
          }}>+</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════════════════════════════════ */
export default function Attendance() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayKey = fmtKey(today.getFullYear(), today.getMonth(), today.getDate());

  /* ── State ── */
  const [attendance, setAttendance] = useState(() => load(STORAGE_KEYS.attendance, {}));
  const [baseline,   setBaseline]   = useState(() => load(STORAGE_KEYS.baseline,   null));
  const [viewYear,   setViewYear]   = useState(today.getFullYear());
  const [viewMonth,  setViewMonth]  = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(() =>
    today.getDay() !== 0 && today.getDay() !== 6 ? todayKey : null
  );
  const [toast,         setToast]         = useState(null);
  const [baselineInput, setBaselineInput] = useState("");
  const toastRef = useRef(null);

  /* ── Persist ── */
  useEffect(() => { save(STORAGE_KEYS.attendance, attendance); }, [attendance]);
  useEffect(() => { save(STORAGE_KEYS.baseline,   baseline);   }, [baseline]);

  /* ── Toast ── */
  const showToast = useCallback((msg) => {
    clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 1800);
  }, []);

  /* ── Selected day data ── */
  const selectedParts = useMemo(() => {
    if (!selectedKey) return null;
    const [y, m, d] = selectedKey.split("-").map(Number);
    return { y, m: m-1, d };
  }, [selectedKey]);

  const isFuture = selectedParts
    ? new Date(selectedParts.y, selectedParts.m, selectedParts.d) > today
    : false;

  const dayData = useMemo(() => {
    if (!selectedKey) return emptyDay();
    return { ...emptyDay(), ...(attendance[selectedKey] || {}) };
  }, [attendance, selectedKey]);

  /* ── Mutate day ── */
  const mutatDay = useCallback((patch) => {
    if (!selectedKey || isFuture) return;
    setAttendance(prev => {
      const cur = { ...emptyDay(), ...(prev[selectedKey] || {}) };
      const next = { ...cur, ...patch };
      return { ...prev, [selectedKey]: next };
    });
  }, [selectedKey, isFuture]);

  /* ── Counter handlers ── */
  const handlers = useMemo(() => {
    const d = dayData;
    return {
      totalInc: () => { mutatDay({ total: d.total + 1 }); showToast("Total +1"); },
      totalDec: () => {
        if (d.total <= 0) return;
        const newTotal = d.total - 1;
        mutatDay({
          total:    newTotal,
          attended: Math.min(d.attended, newTotal),
          bunk:     Math.min(d.bunk, newTotal),
        });
        showToast("Total −1");
      },
      attendedInc: () => {
        if (d.attended >= d.total) { showToast("Can't exceed total"); return; }
        mutatDay({ attended: d.attended + 1, massBunk: false });
        showToast("Attended +1");
      },
      attendedDec: () => {
        if (d.attended <= 0) return;
        mutatDay({ attended: d.attended - 1 });
        showToast("Attended −1");
      },
      bunkInc: () => {
        if (d.bunk >= d.total) { showToast("Can't exceed total"); return; }
        mutatDay({ bunk: d.bunk + 1, massBunk: false });
        showToast("Bunk +1");
      },
      bunkDec: () => {
        if (d.bunk <= 0) return;
        mutatDay({ bunk: d.bunk - 1, massBunk: false });
        showToast("Bunk −1");
      },
      massBunk: () => {
        if (d.massBunk) {
          mutatDay({ massBunk: false });
          showToast("Mass bunk cleared");
        } else {
          mutatDay({ massBunk: true, attended: 0, bunk: 0 });
          showToast("Mass bunk — day off");
        }
      },
    };
  }, [dayData, mutatDay, showToast]);

  /* ── Overall stats ── */
  const overall = useMemo(() => {
    let tTotal = 0, tAttended = 0, tBunk = 0;
    Object.values(attendance).forEach(d => {
      if (!d.massBunk) {
        tTotal    += d.total    || 0;
        tAttended += d.attended || 0;
        tBunk     += d.bunk     || 0;
      }
    });
    // Baseline: virtual classes before this tracker
    const bPct = baseline?.pct ?? null;
    let fTotal = tTotal, fAttended = tAttended;
    if (bPct !== null) { fTotal += 100; fAttended += bPct; }
    const pct = fTotal ? Math.round((fAttended / fTotal) * 100) : null;
    return { pct, attended: fAttended, total: fTotal, bunk: tBunk };
  }, [attendance, baseline]);

  /* ── Insight ── */
  const insight = useMemo(() => {
    const { pct: op, attended, total } = overall;
    if (op === null || total === 0) return null;
    const T = 75;
    if (op >= T) {
      const skip = Math.max(0, Math.floor((100*attended - T*total) / T));
      return { type:"ok", msg:`${op}% · can skip ${skip} more` };
    }
    const need = Math.max(0, Math.ceil((T*total - 100*attended) / (100 - T)));
    return { type: op >= 60 ? "warn" : "danger", msg:`${op}% · need ${need} more` };
  }, [overall]);

  /* ── Calendar ── */
  function getDayDot(dk) {
    const d = attendance[dk];
    if (!d) return null;
    if (d.massBunk) return "mb";
    if (!d.total) return null;
    const p = Math.round((d.attended / d.total) * 100);
    if (p >= 75) return "ok";
    if (p >= 60) return "warn";
    return "bad";
  }

  const calCells = useMemo(() => {
    const blanks   = getWeekdayBlanks(viewYear, viewMonth);
    const daysInMo = new Date(viewYear, viewMonth+1, 0).getDate();
    const cells    = [];
    for (let i = 0; i < blanks; i++) cells.push({ type:"blank" });
    for (let d = 1; d <= daysInMo; d++) {
      if (isWeekend(viewYear, viewMonth, d)) continue;
      const dk  = fmtKey(viewYear, viewMonth, d);
      const hol = isHoliday(dk);
      cells.push({
        type:"day", d, dk, hol,
        isToday:  dk === todayKey,
        isFuture: !hol && new Date(viewYear, viewMonth, d) > today,
        isSel:    dk === selectedKey,
        dot:      hol ? null : getDayDot(dk),
      });
    }
    return cells;
  }, [viewYear, viewMonth, attendance, selectedKey, todayKey, today]);

  /* ── Month nav ── */
  const prevMonth = () => setViewMonth(m => { if(m===0){setViewYear(y=>y-1);return 11;} return m-1; });
  const nextMonth = () => setViewMonth(m => { if(m===11){setViewYear(y=>y+1);return 0;} return m+1; });

  /* ── Baseline ── */
  const saveBaseline = () => {
    const v = parseFloat(baselineInput);
    if (isNaN(v) || v < 0 || v > 100) { showToast("Enter 0–100"); return; }
    setBaseline({ pct: Math.round(v * 10) / 10 });
    showToast("Baseline saved");
  };

  /* ── Color helpers ── */
  const pctColor  = (p) => p === null ? "#aaa89e" : p >= 75 ? "#1a7a52" : p >= 60 ? "#a05810" : "#b83030";
  const pctBg     = (p) => p === null ? "#eeecea" : p >= 75 ? "#e6f4ee" : p >= 60 ? "#fdf0dc" : "#faeaea";
  const dotColors = { ok:"#1a7a52", warn:"#a05810", bad:"#b83030", mb:"#9b8fb5" };

  const dayPct = dayData.total ? Math.round((dayData.attended / dayData.total) * 100) : null;

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`
        .a26 *, .a26 *::before, .a26 *::after { box-sizing:border-box; }
        .a26 {
          font-family: 'DM Sans', system-ui, sans-serif;
          background:#f5f4f0; min-height:100vh; color:#1c1b18; font-size:14px;
        }
        @keyframes fadeup {
          from { opacity:0; transform:translateX(-50%) translateY(6px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        .a26 .rf {
          width:100%; padding:9px 12px; border-radius:10px;
          border:1px solid #e0ddd5; background:#fff;
          font-size:13px; font-family:inherit; color:#1c1b18; outline:none;
          transition:border-color .15s;
        }
        .a26 .rf:focus { border-color:#c5c2b8; }
        .a26 .rf::placeholder { color:#aaa89e; }
        .a26 .btn {
          padding:8px 14px; border-radius:10px; border:none;
          background:#1c1b18; color:#fff; font-size:12px; font-weight:600;
          cursor:pointer; font-family:inherit; transition:background .13s;
        }
        .a26 .btn:hover { background:#333; }
        .a26 .btn-ghost {
          background:none; border:none; cursor:pointer;
          font-family:inherit; font-size:11px; color:#aaa89e; padding:0;
        }
        .a26 .btn-ghost:hover { color:#b83030; }
        /* Calendar */
        .a26 .cc {
          border-right:1px solid #e0ddd5; border-bottom:1px solid #e0ddd5;
          min-height:60px; padding:7px 6px; cursor:pointer;
          transition:background .1s;
        }
        .a26 .cc:nth-child(5n) { border-right:none; }
        .a26 .cc:hover { background:#eeecea; }
        .a26 .cc-blank  { background:#f5f4f0; cursor:default; }
        .a26 .cc-hol    { background:#fdf5f5; cursor:default; }
        .a26 .cc-future { opacity:.4; cursor:default; }
        .a26 .cc-future:hover { background:#fff; }
        .a26 .cc-sel    { background:#1c1b18 !important; }
        .a26 .cc-sel:hover { background:#333 !important; }
        /* Divider */
        .a26 .divider { border:none; border-top:1px solid #e0ddd5; margin:0; }
        /* Counter section */
        .a26 .ctr-wrap { padding:14px 16px; }
        .a26 .ctr-wrap .ctr-row + .ctr-row { border-top:1px solid #f0ede8; }
        /* Mass bunk pill */
        .a26 .mb-pill {
          display:inline-flex; align-items:center; gap:4px;
          padding:3px 10px; border-radius:100px; font-size:11px; font-weight:600;
          cursor:pointer; border:1.5px solid #d5cde8;
          transition:all .12s;
        }
        .a26 .mb-pill.off { background:#fff; color:#9b8fb5; }
        .a26 .mb-pill.on  { background:#9b8fb5; color:#fff; border-color:#9b8fb5; }
      `}</style>

      <div className="a26">
        <div style={{ maxWidth:580, margin:"0 auto", padding:"20px 14px 80px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:19, fontWeight:700, letterSpacing:"-.3px" }}>Attendance</div>
            <div style={{ fontSize:11, color:"#aaa89e", marginTop:1 }}>2026 · Mar 2 onward</div>
          </div>

          {/* ── Stats row ── */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7, marginBottom:10,
          }}>
            {[
              { v: overall.pct !== null ? `${overall.pct}%` : "—", l:"Overall",  c: pctColor(overall.pct) },
              { v: overall.attended,                                l:"Attended", c:"#1a7a52" },
              { v: overall.total - overall.attended,               l:"Absent",   c:"#b83030" },
              { v: overall.bunk,                                    l:"Bunk",     c:"#a05810" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{
                background:"#fff", border:"1px solid #e0ddd5", borderRadius:10,
                padding:"10px 6px", textAlign:"center",
              }}>
                <div style={{ fontSize:20, fontWeight:700, fontFamily:"monospace", color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:10, color:"#aaa89e", fontWeight:600, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* ── Insight ── */}
          {insight && (
            <div style={{
              borderRadius:9, padding:"7px 12px", marginBottom:14,
              fontSize:12, fontWeight:600,
              background: insight.type==="ok" ? "#e6f4ee" : insight.type==="warn" ? "#fdf0dc" : "#faeaea",
              border:`1px solid ${insight.type==="ok" ? "#a3d9be" : insight.type==="warn" ? "#e8c878" : "#e8aaaa"}`,
              color: insight.type==="ok" ? "#1a7a52" : insight.type==="warn" ? "#a05810" : "#b83030",
            }}>{insight.msg}</div>
          )}

          {/* ── Baseline ── */}
          <div style={{
            background:"#fff", border:"1px solid #e0ddd5", borderRadius:12,
            padding:"12px 14px", marginBottom:14,
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa89e", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>
              Baseline · as of Feb 27
            </div>
            {baseline?.pct != null ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, fontWeight:600 }}>{baseline.pct}%</span>
                <button className="btn-ghost" onClick={() => { setBaseline(null); setBaselineInput(""); }}>Edit</button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ position:"relative", flex:1 }}>
                  <input
                    className="rf"
                    type="number" placeholder="e.g. 78" min="0" max="100" step="0.1"
                    value={baselineInput}
                    onChange={e => setBaselineInput(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && saveBaseline()}
                    style={{ fontFamily:"monospace", fontWeight:600, paddingRight:28 }}
                  />
                  <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#aaa89e", pointerEvents:"none" }}>%</span>
                </div>
                <button className="btn" onClick={saveBaseline}>Save</button>
              </div>
            )}
          </div>

          {/* ── Legend ── */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:12 }}>
            {[["#1a7a52","≥75%"],["#a05810","60–74%"],["#b83030","<60%"],["#9b8fb5","Mass bunk"],["#d4d1c8","Unmarked"]].map(([bg,lbl])=>(
              <div key={lbl} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:"#6b6860" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:bg }} />{lbl}
              </div>
            ))}
          </div>

          {/* ── Calendar ── */}
          <div style={{
            background:"#fff", border:"1px solid #e0ddd5", borderRadius:12,
            overflow:"hidden", marginBottom:14,
          }}>
            {/* Month nav */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"9px 12px", borderBottom:"1px solid #e0ddd5", background:"#faf9f7",
            }}>
              <button onClick={prevMonth} style={{
                width:26, height:26, borderRadius:7, border:"1px solid #e0ddd5",
                background:"#fff", cursor:"pointer", color:"#6b6860", fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>‹</button>
              <span style={{ fontSize:12, fontWeight:700, fontFamily:"monospace", color:"#1c1b18" }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} style={{
                width:26, height:26, borderRadius:7, border:"1px solid #e0ddd5",
                background:"#fff", cursor:"pointer", color:"#6b6860", fontSize:13,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>›</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", borderBottom:"1px solid #e0ddd5", background:"#eeecea" }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"#aaa89e", padding:"6px 4px", textTransform:"uppercase", letterSpacing:".05em" }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)" }}>
              {calCells.map((cell, idx) => {
                if (cell.type === "blank") return <div key={`b${idx}`} className="cc cc-blank" style={{ minHeight:60 }} />;
                const { d, dk, hol, isToday, isFuture: fut, isSel: sel, dot } = cell;
                const numStyle = isToday && !sel
                  ? { background:"#1c1b18", color:"#fff", width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }
                  : { fontSize:12, fontWeight:700, fontFamily:"monospace",
                      color: sel ? "rgba(255,255,255,.9)" : hol ? "#b83030" : fut ? "#bbb" : "#1c1b18" };
                return (
                  <div
                    key={dk}
                    className={`cc ${hol?"cc-hol":""} ${sel?"cc-sel":""} ${fut?"cc-future":""}`}
                    onClick={() => { if (!fut && !hol) setSelectedKey(dk); }}
                  >
                    <div style={numStyle}>{d}</div>
                    {hol && <div style={{ fontSize:8, color:"#e8aaaa", marginTop:2, fontWeight:600 }}>holiday</div>}
                    {!hol && dot && (
                      <div style={{ width:5, height:5, borderRadius:"50%", background:dotColors[dot], marginTop:4 }} />
                    )}
                    {!hol && !dot && attendance[dk] && !attendance[dk].massBunk && !attendance[dk].total && (
                      <div style={{ width:5, height:5, borderRadius:"50%", background:"#d4d1c8", marginTop:4 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Day Panel ── */}
          <div style={{
            background:"#fff", border:"1px solid #e0ddd5", borderRadius:12, overflow:"hidden",
          }}>
            {/* Header */}
            <div style={{
              padding:"11px 14px", borderBottom:"1px solid #e0ddd5",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"#eeecea",
            }}>
              <div style={{ fontSize:13, fontWeight:700 }}>
                {selectedParts ? fmtDateLong(selectedParts.y, selectedParts.m, selectedParts.d) : "Select a day"}
              </div>
              {selectedKey && !isFuture && !isHoliday(selectedKey) && dayPct !== null && (
                <span style={{
                  fontSize:11, fontWeight:700, fontFamily:"monospace",
                  padding:"2px 8px", borderRadius:100,
                  color: pctColor(dayPct), background: pctBg(dayPct),
                }}>{dayPct}%</span>
              )}
              {isFuture && (
                <span style={{ fontSize:10, color:"#aaa89e", background:"#f5f4f0", border:"1px solid #e0ddd5", padding:"2px 8px", borderRadius:100 }}>locked</span>
              )}
            </div>

            {/* Body */}
            {!selectedKey ? (
              <div style={{ textAlign:"center", padding:"28px 16px", color:"#aaa89e", fontSize:12 }}>
                ↑ tap a day
              </div>
            ) : isHoliday(selectedKey) ? (
              <div style={{ textAlign:"center", padding:"22px 16px" }}>
                <div style={{ fontSize:12, color:"#b83030", fontWeight:600 }}>Holiday</div>
              </div>
            ) : isFuture ? (
              <div style={{ textAlign:"center", padding:"22px 16px", color:"#aaa89e", fontSize:12 }}>
                Future date
              </div>
            ) : dayData.massBunk ? (
              <div className="ctr-wrap">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0" }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#9b8fb5" }}>Mass Bunk Day</span>
                  <button
                    className="mb-pill on"
                    onClick={handlers.massBunk}
                  >✕ Clear</button>
                </div>
                <div style={{ fontSize:11, color:"#aaa89e" }}>No classes were held · nothing counted</div>
              </div>
            ) : (
              <div className="ctr-wrap">
                {/* Total classes today */}
                <div className="ctr-row">
                  <Counter
                    label="Total classes"
                    value={dayData.total}
                    onInc={handlers.totalInc}
                    onDec={handlers.totalDec}
                    disabled={isFuture}
                  />
                </div>

                <hr className="divider" />

                {/* Attended */}
                <div className="ctr-row">
                  <Counter
                    label="Attended"
                    value={dayData.attended}
                    onInc={handlers.attendedInc}
                    onDec={handlers.attendedDec}
                    accent="#1a7a52"
                    disabled={isFuture || dayData.total === 0}
                  />
                </div>

                <hr className="divider" />

                {/* Bunk */}
                <div className="ctr-row">
                  <Counter
                    label="Bunk"
                    value={dayData.bunk}
                    onInc={handlers.bunkInc}
                    onDec={handlers.bunkDec}
                    accent="#a05810"
                    disabled={isFuture || dayData.total === 0}
                    extra={
                      <button
                        className={`mb-pill ${dayData.massBunk ? "on" : "off"}`}
                        onClick={handlers.massBunk}
                        style={{ display: dayData.total === 0 && !dayData.massBunk ? "none" : undefined }}
                      >
                        Mass bunk
                      </button>
                    }
                  />
                </div>

                {/* Progress bar */}
                {dayData.total > 0 && (
                  <div style={{ marginTop:12, height:3, background:"#e0ddd5", borderRadius:100, overflow:"hidden" }}>
                    <div style={{
                      height:"100%", borderRadius:100,
                      width: `${Math.min(100, Math.round((dayData.attended / dayData.total) * 100))}%`,
                      background: pctColor(dayPct),
                      transition:"width .25s",
                    }} />
                  </div>
                )}

                {/* Mass bunk toggle when no total set yet */}
                {dayData.total === 0 && (
                  <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end" }}>
                    <button
                      className={`mb-pill ${dayData.massBunk ? "on" : "off"}`}
                      onClick={handlers.massBunk}
                    >
                      Mass bunk
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ fontSize:10, color:"#c5c2b8", textAlign:"center", marginTop:20, lineHeight:1.8 }}>
            Bunk = voluntary skip, not counted in % &nbsp;·&nbsp; Mass bunk = day off, nothing counted
          </div>
        </div>
        <Toast msg={toast} />
      </div>
    </>
  );
}