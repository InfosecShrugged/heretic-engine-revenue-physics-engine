// ─── NetherOps OpptyCon — Alpha Access Gate ───
// Collects email before granting engine access.
// Uses Netlify Forms for zero-backend submission.
// Stores access grant in localStorage so returning users pass through.
//
// IMPORTANT: index.html must include a hidden form for Netlify detection:
//   <form name="alpha-access" netlify netlify-honeypot="bot-field" hidden>
//     <input name="email" /><input name="role" /><input name="company" /><input name="bot-field" />
//   </form>

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HouseFooter from './HouseFooter';

const STORAGE_KEY = 'opptycon_alpha_access';
const FORM_NAME = 'alpha-access';

// ─── TOKENS (Heretics House — NetherOps family, violet accent) ───
// Per fix-sheet B4: warm-paper canvas, violet accent, warm near-black ink.
// The light-mode violet is the deepened #5B3DF0 per the Albers rule (the
// dark-mode #8C73FF is too pastel against paper).
const C = {
  bg:"#F4F1EA", bgAlt:"#FBFAF6", card:"#FFFFFF",
  border:"rgba(20,18,14,0.12)", borderL:"rgba(20,18,14,0.07)",
  accent:"#5B3DF0", accentD:"rgba(91,61,240,0.10)", accentGlow:"rgba(91,61,240,0.18)",
  green:"#1A8A4A", greenD:"rgba(26,138,74,0.10)",
  rose:"#CC3340", roseD:"rgba(204,51,64,0.10)",
  text:"#1A1A1E", muted:"#57544D", dim:"#8E8A80",
};

// ─── CHECK IF USER HAS ACCESS ───
export function hasAlphaAccess() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const { granted, email } = JSON.parse(stored);
    return granted && email;
  } catch { return false; }
}

export function grantAlphaAccess(email) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    granted: true,
    email,
    grantedAt: new Date().toISOString(),
  }));
}

// ─── ALPHA GATE COMPONENT ───
export default function AlphaGate({ onAccessGranted }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus email input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Submit to Netlify Forms
      const formData = new URLSearchParams();
      formData.append('form-name', FORM_NAME);
      formData.append('email', email);
      formData.append('role', role);
      formData.append('company', company);

      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (res.ok || res.status === 200) {
        grantAlphaAccess(email);
        setSubmitted(true);
        // Brief success state, then open the engine
        setTimeout(() => onAccessGranted(email), 1800);
      } else {
        // Still grant access even if Netlify form fails (offline, etc.)
        // Better to lose a lead than block someone
        console.warn('Form submission returned non-200, granting access anyway');
        grantAlphaAccess(email);
        setSubmitted(true);
        setTimeout(() => onAccessGranted(email), 1800);
      }
    } catch (err) {
      // Network error — still grant access
      console.warn('Form submission failed, granting access anyway:', err);
      grantAlphaAccess(email);
      setSubmitted(true);
      setTimeout(() => onAccessGranted(email), 1800);
    }

    setSubmitting(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, fontFamily: "'TWK Everett', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 520 }}
      >
        {/* Brand lockup — raven + netherops parent wordmark + >opptycon sub-brand.
            Per brief §4 sizing floor: raven 40 / parent wm 28 / sub wm 24. */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {/* Raven — mask-image so background-color drives the recolor (ink on light) */}
            <span aria-hidden="true" style={{
              display: "inline-block", width: 40, height: 40, flex: "none",
              backgroundColor: C.text,
              WebkitMask: "url('/raven/raven-simplified.svg') center/contain no-repeat",
              mask: "url('/raven/raven-simplified.svg') center/contain no-repeat",
            }} />
            {/* netherops parent wordmark — ink monochrome on light per recolor rule */}
            <span aria-hidden="true" style={{
              display: "inline-block", height: 28, width: 180, flex: "none",
              backgroundColor: C.text,
              WebkitMask: "url('/wordmarks/wordmark-netherops.svg') left center no-repeat",
              mask: "url('/wordmarks/wordmark-netherops.svg') left center no-repeat",
              WebkitMaskSize: "auto 28px", maskSize: "auto 28px",
            }} />
            {/* >opptycon sub-brand wordmark — accent (violet/amber-deep) per sub-brand rule */}
            <span aria-hidden="true" style={{
              display: "inline-block", height: 24, width: 110, flex: "none",
              backgroundColor: C.accent,
              WebkitMask: "url('/wordmarks/wordmark-opptycon.svg') left center no-repeat",
              mask: "url('/wordmarks/wordmark-opptycon.svg') left center no-repeat",
              WebkitMaskSize: "auto 24px", maskSize: "auto 24px",
            }} />
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace", fontSize: 9, color: C.dim,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Governed revenue architecture
          </div>
        </div>

        {/* Main card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, padding: "40px 36px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Accent top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, ${C.accent}, ${C.accent}66)`,
          }} />

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {/* Alpha badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", background: C.accentD, marginBottom: 20,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace", fontSize: 9, fontWeight: 700,
                    color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Private Alpha
                  </span>
                </div>

                {/* Hero per the canonical hero set 2026-05-29 — Fraunces display,
                    accent-tinted second line, two-line break for emphasis. */}
                <h1 style={{
                  fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
                  fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 0',
                  fontSize: "clamp(30px, 4.8vw, 46px)", fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: "-0.02em",
                  color: C.text, margin: "0 0 8px 0", lineHeight: 0.98,
                }}>
                  Don't just operate cyber GTM.{" "}
                  <span style={{ color: C.accent, display: "block" }}>Govern it.</span>
                </h1>

                <p style={{
                  fontSize: 13, color: C.muted, lineHeight: 1.7, margin: "0 0 24px 0",
                }}>
                  Operating cyber GTM is the easy part — most teams already do it.
                  Governing it is what holds the number together when capital,
                  capacity, and constraints all stop agreeing. Inverse-funnel math,
                  cost physics, and the governance spine — across eight persona views, live.
                </p>

                {/* Persona views callout */}
                <div style={{
                  padding: "12px 14px", marginBottom: 18,
                  border: `1px solid ${C.borderL}`, background: C.bgAlt,
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace", fontSize: 9, fontWeight: 600,
                    color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase",
                    marginBottom: 6,
                  }}>
                    Eight persona views
                  </div>
                  <div style={{
                    fontSize: 11, color: C.text, lineHeight: 1.6, letterSpacing: "0.01em",
                  }}>
                    CFO · CEO · CRO · CMO · VC · PE · Board · RevOps
                  </div>
                </div>

                {/* What's inside */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28,
                }}>
                  {[
                    "Cyber TAM segmentation",
                    "Governance spine",
                    "Inverse funnel model",
                    "Pipeline coverage",
                    "Cost physics (P&L)",
                    "Seller ramp + attrition",
                    "Revenue motions",
                    "Multi-year glideslope",
                  ].map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 11, color: C.text,
                    }}>
                      <span style={{ color: C.accent, fontSize: 10, fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace" }}>→</span>
                      {f}
                    </div>
                  ))}
                </div>

                {/* Join text */}
                <div style={{
                  fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 16,
                }}>
                  Join the alpha. Get access now, plus updates as new modules ship.
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Email (required) */}
                  <div>
                    <label style={{
                      display: "block", fontSize: 9, fontWeight: 600, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4,
                    }}>
                      Work email *
                    </label>
                    <input
                      ref={inputRef}
                      type="email" value={email} required
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{
                        width: "100%", padding: "10px 14px",
                        background: C.bg, border: `1px solid ${C.border}`,
                        fontSize: 14, fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
                        color: C.text, outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>

                  {/* Role + Company (optional, side by side) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{
                        display: "block", fontSize: 9, fontWeight: 600, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4,
                      }}>
                        Role
                      </label>
                      <input
                        type="text" value={role}
                        onChange={e => setRole(e.target.value)}
                        placeholder="VP Marketing"
                        style={{
                          width: "100%", padding: "10px 14px",
                          background: C.bg, border: `1px solid ${C.border}`,
                          fontSize: 12, fontFamily: "'TWK Everett', sans-serif",
                          color: C.text, outline: "none",
                        }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: "block", fontSize: 9, fontWeight: 600, color: C.muted,
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4,
                      }}>
                        Company
                      </label>
                      <input
                        type="text" value={company}
                        onChange={e => setCompany(e.target.value)}
                        placeholder="Acme Corp"
                        style={{
                          width: "100%", padding: "10px 14px",
                          background: C.bg, border: `1px solid ${C.border}`,
                          fontSize: 12, fontFamily: "'TWK Everett', sans-serif",
                          color: C.text, outline: "none",
                        }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  </div>

                  {error && (
                    <div style={{ fontSize: 11, color: C.rose, padding: "6px 0" }}>{error}</div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "13px 24px", marginTop: 6,
                      background: submitting ? C.dim : C.accent,
                      border: "none", color: "#fff", cursor: submitting ? "wait" : "pointer",
                      fontSize: 14, fontWeight: 700, fontFamily: "'TWK Everett', sans-serif",
                      letterSpacing: "0.02em",
                      transition: "background 0.2s",
                    }}
                  >
                    {submitting ? "Submitting..." : "Get Alpha Access →"}
                  </button>
                </form>

                {/* Privacy note */}
                <div style={{
                  fontSize: 10, color: C.dim, marginTop: 14, lineHeight: 1.5,
                  textAlign: "center",
                }}>
                  No spam. No pitch decks in your inbox. Just product updates
                  as new modules ship. Unsubscribe anytime.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: C.greenD, border: `2px solid ${C.green}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <span style={{ fontSize: 22 }}>✓</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                  You're in.
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  Loading the engine...
                </div>
                {/* Loading bar animation */}
                <div style={{
                  width: "60%", height: 3, background: C.border,
                  margin: "20px auto 0", borderRadius: 2, overflow: "hidden",
                }}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.6, ease: "easeInOut" }}
                    style={{ height: "100%", background: C.accent }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center", marginTop: 20,
          fontSize: 10, color: C.dim, fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
          letterSpacing: "0.04em",
        }}>
          netherops.com · governed revenue architecture
        </div>

        {/* Legal links — heretics.io canonical Terms + Privacy */}
        <div style={{
          textAlign: "center", marginTop: 8,
          fontSize: 9, color: C.dim, fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          <a href="https://heretics.io/terms" style={{ color: "inherit", textDecoration: "none", margin: "0 8px" }} target="_blank" rel="noopener">Terms</a>
          ·
          <a href="https://heretics.io/privacy" style={{ color: "inherit", textDecoration: "none", margin: "0 8px" }} target="_blank" rel="noopener">Privacy</a>
        </div>

        {/* Shared cross-property HouseMap — reads --house-* tokens set by
            App.jsx's theme effect, so it renders in OpptyCon's accent. */}
        <heretics-house-map current="opptycon" style={{ marginTop: 28, display: "block" }}></heretics-house-map>
      </motion.div>

      {/* Canonical Heretics House footer — lamplight raven + 5-col grid +
          engagement bridge back to heretics.io. Loads /styles/house-footer.css
          and sets data-property="opptycon" on <html> for accent + bridge gating. */}
      <HouseFooter property="opptycon" />
    </div>
  );
}
