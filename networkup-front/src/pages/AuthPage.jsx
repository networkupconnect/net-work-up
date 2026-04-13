import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BACKEND = "https://network.networkup.in";

// After auth, go to onboarding if not complete, else intended path or home
const redirect = (navigate, user) => {
  if (!user?.onboardingComplete) {
    navigate("/onboarding", { replace: true });
    return;
  }
  const returnPath = localStorage.getItem("returnPath");
  if (returnPath) {
    localStorage.removeItem("returnPath");
    navigate(returnPath, { replace: true });
  } else {
    navigate("/", { replace: true });
  }
};

export default function AuthPage() {
  // ✅ Default to "signup" — first page new users see
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { emailRef.current?.focus(); }, [mode]);
  useEffect(() => { if (user) redirect(navigate, user); }, [user, navigate]);

  // Google redirect token handler
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const err = params.get("error");
    if (token || err) window.history.replaceState({}, "", "/login");
    if (err) { setError("Google sign-in failed. Please try again."); return; }
    if (token) {
      setGoogleLoading(true);
      localStorage.setItem("token", token);
      api.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { login({ token, user: res.data }); redirect(navigate, res.data); })
        .catch(() => { localStorage.removeItem("token"); setError("Google sign-in failed. Please try again."); setGoogleLoading(false); });
    }
  }, []);

  const switchMode = (m) => { setName(""); setEmail(""); setPassword(""); setError(""); setShowPw(false); setMode(m); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !name.trim()) return setError("Name is required");
    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");
    if (mode === "signup" && password.length < 6) return setError("Password must be at least 6 characters");
    try {
      setLoading(true);
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? { email: email.trim().toLowerCase(), password }
        : { name: name.trim(), email: email.trim().toLowerCase(), password };
      const res = await api.post(endpoint, payload);
      login({ token: res.data.token, user: res.data.user });
      redirect(navigate, res.data.user);
    } catch (err) {
      const status = err?.response?.status;
      setError(status === 500 ? "Something went wrong. Please try again." : (err?.response?.data?.message || (mode === "login" ? "Invalid email or password" : "Signup failed")));
    } finally { setLoading(false); }
  };

  const handleGoogle = () => { setGoogleLoading(true); window.location.href = `${BACKEND}/api/auth/google`; };
  const isLoading = loading || googleLoading;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#fafaf9;--surface:#fff;--border:#e5e5e0;--border-focus:#1a1a1a;--text:#1a1a1a;--text-2:#737373;--text-3:#a3a3a3;--accent:#1a1a1a;--accent-text:#fff;--error-bg:#fff5f5;--error-border:#fca5a5;--error-text:#dc2626;--radius:10px;--font:'DM Sans',sans-serif}
        .ap-root{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;font-family:var(--font);padding:24px 16px}
        .ap-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:40px 36px;width:100%;max-width:400px;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 24px rgba(0,0,0,0.06)}
        .ap-logo{display:flex;align-items:center;gap:8px;margin-bottom:32px}
        .ap-logo-mark{width:28px;height:28px;background:var(--text);border-radius:7px;display:grid;place-items:center;flex-shrink:0}
        .ap-logo-name{font-size:15px;font-weight:600;color:var(--text);letter-spacing:-0.3px}
        .ap-heading{font-size:22px;font-weight:600;color:var(--text);letter-spacing:-0.5px;margin-bottom:4px}
        .ap-sub{font-size:14px;color:var(--text-2);margin-bottom:28px}
        .ap-tabs{display:flex;border:1px solid var(--border);border-radius:8px;padding:3px;margin-bottom:24px;background:var(--bg)}
        .ap-tab{flex:1;padding:8px;border:none;background:transparent;font-family:var(--font);font-size:13.5px;font-weight:500;color:var(--text-3);border-radius:6px;cursor:pointer}
        .ap-tab.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.08)}
        .ap-error{background:var(--error-bg);border:1px solid var(--error-border);color:var(--error-text);border-radius:8px;padding:10px 14px;font-size:13.5px;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;line-height:1.5}
        .ap-error svg{flex-shrink:0;margin-top:1px}
        .ap-fields{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
        .ap-field{display:flex;flex-direction:column;gap:5px}
        .ap-label{font-size:13px;font-weight:500;color:var(--text-2)}
        .ap-input-wrap{position:relative}
        .ap-input{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--radius);font-family:var(--font);font-size:14.5px;color:var(--text);background:var(--surface);outline:none}
        .ap-input::placeholder{color:var(--text-3)}
        .ap-input:focus{border-color:var(--border-focus);box-shadow:0 0 0 3px rgba(26,26,26,0.06)}
        .ap-input:disabled{opacity:0.5;cursor:not-allowed}
        .ap-input.pw{padding-right:44px}
        .ap-pw-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-3);cursor:pointer;padding:4px;display:grid;place-items:center;border-radius:4px}
        .ap-pw-toggle:hover{color:var(--text)}
        .ap-btn-primary{width:100%;padding:12px;border:none;border-radius:var(--radius);background:var(--accent);color:var(--accent-text);font-family:var(--font);font-size:14.5px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:-0.1px;margin-bottom:14px}
        .ap-btn-primary:hover:not(:disabled){opacity:0.88}
        .ap-btn-primary:disabled{opacity:0.45;cursor:not-allowed}
        .ap-divider{display:flex;align-items:center;gap:10px;margin-bottom:14px}
        .ap-divider-line{flex:1;height:1px;background:var(--border)}
        .ap-divider-label{font-size:12px;color:var(--text-3);white-space:nowrap}
        .ap-btn-google{width:100%;padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-family:var(--font);font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px}
        .ap-btn-google:hover:not(:disabled){background:#f9f9f8;border-color:#d4d4d0}
        .ap-btn-google:disabled{opacity:0.45;cursor:not-allowed}
        .ap-footer{text-align:center;font-size:13.5px;color:var(--text-2)}
        .ap-switch{background:none;border:none;font-family:var(--font);font-size:13.5px;font-weight:500;color:var(--text);cursor:pointer;text-decoration:underline;text-underline-offset:2px;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ap-spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:spin 0.65s linear infinite;flex-shrink:0}
        .ap-spinner.dark{border-color:rgba(0,0,0,0.15);border-top-color:var(--text)}
        @media(max-width:440px){.ap-card{padding:28px 20px;border-radius:12px}}
      `}</style>

      <div className="ap-root">
        <div className="ap-card">
          <div className="ap-logo">
            <div className="ap-logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="ap-logo-name">NetworkUp</span>
          </div>

          <div className="ap-tabs" role="tablist">
            {["signup","login"].map(m => (
              <button key={m} className={`ap-tab ${mode === m ? "active" : ""}`}
                onClick={() => switchMode(m)} role="tab" aria-selected={mode === m} disabled={isLoading}>
                {m === "signup" ? "Sign up" : "Sign in"}
              </button>
            ))}
          </div>

          <h1 className="ap-heading">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
          <p className="ap-sub">{mode === "signup" ? "Takes less than a minute" : "Enter your credentials to continue"}</p>

          {error && (
            <div className="ap-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          <button className="ap-btn-google" onClick={handleGoogle} disabled={isLoading} type="button">
            {googleLoading ? <span className="ap-spinner dark" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? "Connecting…" : `Continue with Google`}
          </button>

          <div className="ap-divider">
            <div className="ap-divider-line" />
            <span className="ap-divider-label">or</span>
            <div className="ap-divider-line" />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="ap-fields">
              {mode === "signup" && (
                <div className="ap-field">
                  <label className="ap-label" htmlFor="name">Full name</label>
                  <input id="name" className="ap-input" type="text" placeholder="Your name"
                    value={name} onChange={e => setName(e.target.value)} disabled={isLoading} autoComplete="name" />
                </div>
              )}
              <div className="ap-field">
                <label className="ap-label" htmlFor="email">Email</label>
                <input id="email" ref={emailRef} className="ap-input" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" />
              </div>
              <div className="ap-field">
                <label className="ap-label" htmlFor="password">Password</label>
                <div className="ap-input-wrap">
                  <input id="password" className="ap-input pw" type={showPw ? "text" : "password"}
                    placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                    value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading}
                    autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  <button type="button" className="ap-pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" className="ap-btn-primary" disabled={isLoading}>
              {loading && <span className="ap-spinner" />}
              {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
            </button>
          </form>

          <p className="ap-footer">
            {mode === "signup"
              ? <>Already have an account?{" "}<button className="ap-switch" onClick={() => switchMode("login")} disabled={isLoading}>Sign in</button></>
              : <>No account?{" "}<button className="ap-switch" onClick={() => switchMode("signup")} disabled={isLoading}>Sign up free</button></>}
          </p>
        </div>
      </div>
    </>
  );
}