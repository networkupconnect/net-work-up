import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios";

const COURSE_BRANCHES = {
  "BTech":  [
    "Civil Engg",
    "Civil Engg (Construction Tech) SF",
    "Electrical Engg",
    "Electrical & Computer Engg SF",
    "Mechanical Engg",
    "Robotics & AI SF",
    "Electronics & Communication Engg",
    "Electronics (VLSI) SF",
    "Computer Engg",
    "CS (Data Sciences) SF",
  ],
  "MTech":  ["CSE","ECE","EE","ME","CE","VLSI Design","Data Science","Power Systems","Other"],
  "BCA":    ["Computer Applications"],
  "MCA":    ["Computer Applications"],
  "BSc":    ["Computer Science","Physics","Mathematics","Chemistry","Biology","Statistics","Other"],
  "MSc":    ["Computer Science","Physics","Mathematics","Chemistry","Biology","Other"],
  "MBA":    ["General Management","Finance","Marketing","Human Resources","Operations","IT Management"],
  "BBA":    ["General Management","Finance","Marketing","HR","Other"],
  "B.Com":  ["Accounting & Finance","Commerce","Banking & Insurance","Other"],
  "M.Com":  ["Accounting","Finance","Commerce","Other"],
  "BPharm": ["Pharmaceutical Sciences"],
  "MPharm": ["Pharmaceutical Sciences","Pharmacology","Pharmaceutics"],
  "LLB":    ["General Law","Corporate Law","Criminal Law"],
  "Other":  ["General"],
};

const MAX_YEARS = { "BTech":4,"MTech":2,"BCA":3,"MCA":2,"BSc":3,"MSc":2,"MBA":2,"BBA":3,"B.Com":3,"M.Com":2,"BPharm":4,"MPharm":2,"LLB":5,"Other":4 };
const HAS_SECTION = ["BTech"];

// Export so Profile.jsx can reuse the same mapping
export { COURSE_BRANCHES, MAX_YEARS, HAS_SECTION };

const SS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#fafaf9;--surface:#fff;--border:#e5e5e0;--bf:#1a1a1a;--text:#1a1a1a;--t2:#737373;--t3:#a3a3a3;--accent:#1a1a1a;--radius:10px;--font:'DM Sans',sans-serif}
  .ob-root{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;font-family:var(--font);padding:24px 16px}
  .ob-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:40px 36px;width:100%;max-width:420px;box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 24px rgba(0,0,0,.06)}
  .ob-logo{display:flex;align-items:center;gap:8px;margin-bottom:28px}
  .ob-logo-mark{width:28px;height:28px;background:var(--text);border-radius:7px;display:grid;place-items:center}
  .ob-logo-name{font-size:15px;font-weight:600;color:var(--text);letter-spacing:-0.3px}
  .ob-progress{display:flex;align-items:center;gap:6px;margin-bottom:28px}
  .ob-step{display:flex;align-items:center;gap:6px;flex:1}
  .ob-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0}
  .ob-dot.done{background:#1a1a1a;color:#fff}
  .ob-dot.active{background:#1a1a1a;color:#fff;box-shadow:0 0 0 3px rgba(26,26,26,.15)}
  .ob-dot.pending{background:#f3f4f6;color:#a3a3a3;border:1.5px solid #e5e5e0}
  .ob-line{flex:1;height:1.5px;background:#e5e5e0}
  .ob-line.done{background:#1a1a1a}
  .ob-heading{font-size:20px;font-weight:600;color:var(--text);letter-spacing:-0.4px;margin-bottom:4px}
  .ob-sub{font-size:13.5px;color:var(--t2);margin-bottom:24px}
  .ob-error{background:#fff5f5;border:1px solid #fca5a5;color:#dc2626;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:14px;word-break:break-word}
  .ob-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
  .ob-field{display:flex;flex-direction:column;gap:5px}
  .ob-label{font-size:13px;font-weight:500;color:var(--t2)}
  .ob-hint{font-size:11px;color:var(--t3);margin-top:3px}
  .ob-input{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-family:var(--font);font-size:14px;color:var(--text);background:var(--surface);outline:none}
  .ob-input:focus{border-color:var(--bf);box-shadow:0 0 0 3px rgba(26,26,26,.06)}
  .ob-input:disabled{opacity:.5;cursor:not-allowed}
  .ob-select{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-family:var(--font);font-size:14px;color:var(--text);background:var(--surface);outline:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
  .ob-select:focus{border-color:var(--bf);box-shadow:0 0 0 3px rgba(26,26,26,.06)}
  .ob-select:disabled{opacity:.5;cursor:not-allowed}
  .ob-row{display:flex;gap:10px}
  .ob-row .ob-field{flex:1}
  .ob-actions{display:flex;justify-content:space-between;align-items:center;gap:12px}
  .ob-btn{flex:1;padding:12px;border-radius:var(--radius);font-family:var(--font);font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px}
  .ob-btn-primary{background:var(--accent);color:#fff;border:none}
  .ob-btn-primary:hover:not(:disabled){opacity:.88}
  .ob-btn-primary:disabled{opacity:.45;cursor:not-allowed}
  .ob-btn-ghost{background:transparent;color:var(--t2);border:1.5px solid var(--border);max-width:90px}
  .ob-btn-ghost:hover{border-color:#d4d4d0;color:var(--text)}
  @keyframes spin{to{transform:rotate(360deg)}}
  .ob-spinner{width:13px;height:13px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite}
  @media(max-width:440px){.ob-card{padding:28px 20px}}
`;

const STEPS = [
  { num: 1, title: "Your identity", sub: "How others will find and know you" },
  { num: 2, title: "Your course",   sub: "Helps connect you with the right peers" },
  { num: 3, title: "Contact",       sub: "For collaboration and networking" },
];

export default function OnboardingFlow() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [course, setCourse] = useState(user?.course || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [year, setYear] = useState(user?.year ? String(user.year) : "");
  const [section, setSection] = useState(user?.section || "");
  const [phone, setPhone] = useState(user?.phone || "");

  useEffect(() => { setBranch(""); }, [course]);

  useEffect(() => {
    if (user?.onboardingComplete) navigate("/", { replace: true });
  }, []);

  const branches = COURSE_BRANCHES[course] || [];
  const maxYear = MAX_YEARS[course] || 4;
  const showSection = HAS_SECTION.includes(course);

  const next = () => {
    setError("");
    if (step === 1) {
      if (!name.trim()) return setError("Full name is required");
      if (!username.trim()) return setError("Username is required");
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim()))
        return setError("Username: 3–20 chars, letters/numbers/underscore only");
      setStep(2);
    } else if (step === 2) {
      if (!course) return setError("Please select your course");
      if (!branch) return setError("Please select your branch / department");
      if (!year) return setError("Please select your current year");
      setStep(3);
    }
  };

  const back = () => { setError(""); setStep(s => s - 1); };

  const finish = async () => {
    setError("");
    if (!phone.trim()) return setError("Phone number is required");
    // Relaxed: just needs 7+ digits after stripping formatting
    const digits = phone.trim().replace(/[\s\-()+ ]/g, "");
    if (digits.length < 7 || !/^\d+$/.test(digits))
      return setError("Enter a valid phone number (e.g. 9876543210)");

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        course,
        branch,
        year: Number(year),
        section: showSection ? section : "",
        phone: phone.trim(),
        onboardingComplete: true,
      };

      // ✅ Correct path: /api/user/me (matches users.route.js mounted at /api/user)
      const res = await api.put("/api/user/me", payload);
      const token = localStorage.getItem("token");
      login({ token, user: { ...user, ...res.data } });
      navigate("/", { replace: true });
    } catch (e) {
      const status = e.response?.status ?? "network";
      const msg = e.response?.data?.message ?? e.message ?? "Unknown error";
      setError(`Error ${status}: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{SS}</style>
      <div className="ob-root">
        <div className="ob-card">

          <div className="ob-logo">
            <div className="ob-logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="ob-logo-name">NetworkUp</span>
          </div>

          <div className="ob-progress">
            {STEPS.map((s, i) => (
              <div key={s.num} className="ob-step">
                <div className={`ob-dot ${step > s.num ? "done" : step === s.num ? "active" : "pending"}`}>
                  {step > s.num ? "✓" : s.num}
                </div>
                {i < STEPS.length - 1 && <div className={`ob-line ${step > s.num ? "done" : ""}`} />}
              </div>
            ))}
          </div>

          <h1 className="ob-heading">{STEPS[step - 1].title}</h1>
          <p className="ob-sub">{STEPS[step - 1].sub}</p>

          {error && <div className="ob-error">{error}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div className="ob-fields">
              <div className="ob-field">
                <label className="ob-label">Full name</label>
                <input className="ob-input" placeholder="Your full name" value={name}
                  onChange={e => setName(e.target.value)} autoComplete="name" autoFocus />
              </div>
              <div className="ob-field">
                <label className="ob-label">Username</label>
                <input className="ob-input" placeholder="e.g. john_doe99" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  autoComplete="username" />
                <span className="ob-hint">3–20 chars · letters, numbers, underscore</span>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="ob-fields">
              <div className="ob-field">
                <label className="ob-label">Course</label>
                <select className="ob-select" value={course} onChange={e => setCourse(e.target.value)}>
                  <option value="">Select course</option>
                  {Object.keys(COURSE_BRANCHES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              
              {course && (
                <div className="ob-field">
                  <label className="ob-label">Branch / Department</label>
                  <select className="ob-select" value={branch} onChange={e => setBranch(e.target.value)}>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {course && (
                <div className="ob-row">
                  <div className="ob-field">
                    <label className="ob-label">Current year</label>
                    <select className="ob-select" value={year} onChange={e => setYear(e.target.value)}>
                      <option value="">Year</option>
                      {Array.from({ length: maxYear }, (_, i) => i + 1).map(y =>
                        <option key={y} value={y}>Year {y}</option>
                      )}
                    </select>
                  </div>
                  {showSection && (
                    <div className="ob-field">
                      <label className="ob-label">Section <span style={{ color: "#a3a3a3" }}>(optional)</span></label>
                      <input className="ob-input" placeholder="e.g. A" value={section}
                        onChange={e => setSection(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="ob-fields">
              <div className="ob-field">
                <label className="ob-label">Phone number</label>
                <input className="ob-input" type="tel" placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" autoFocus />
                <span className="ob-hint">Used for collaboration requests — not publicly shown</span>
              </div>
            </div>
          )}

          <div className="ob-actions">
            {step > 1
              ? <button className="ob-btn ob-btn-ghost" onClick={back} disabled={saving}>Back</button>
              : <div />}
            {step < 3
              ? <button className="ob-btn ob-btn-primary" onClick={next}>Continue →</button>
              : <button className="ob-btn ob-btn-primary" onClick={finish} disabled={saving}>
                  {saving && <span className="ob-spinner" />}
                  {saving ? "Saving…" : "Finish setup"}
                </button>}
          </div>

        </div>
      </div>
    </>
  );
}