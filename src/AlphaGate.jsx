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

const STORAGE_KEY = 'opptycon_alpha_access';
const FORM_NAME = 'alpha-access';

// ─── TOKENS (matches engine design system) ───
const C = {
  bg:"#EBEBEB", bgAlt:"#F4F4F2", card:"#FFFFFF",
  border:"rgba(0,0,0,0.13)", borderL:"rgba(0,0,0,0.07)",
  accent:"#111111", accentD:"rgba(0,0,0,0.06)", accentGlow:"rgba(0,0,0,0.12)",
  lime:"#C8FF6E", limeD:"rgba(200,255,110,0.15)",
  green:"#2E7D32", greenD:"rgba(46,125,50,0.10)",
  rose:"#D44C38", roseD:"rgba(212,76,56,0.10)",
  text:"#111111", muted:"#555555", dim:"#909090",
};

const LOGO_URL = "/netherops-logo.svg";

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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <img src={LOGO_URL} alt="NetherOps" style={{ height: 32, marginBottom: 8 }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{
            fontFamily: "'Chivo Mono', monospace", fontSize: 9, color: C.dim,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            governed revenue architecture
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
                    fontFamily: "'Chivo Mono', monospace", fontSize: 9, fontWeight: 700,
                    color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    Private Alpha
                  </span>
                </div>

                <h1 style={{
                  fontSize: 22, fontWeight: 700, color: C.text,
                  margin: "0 0 8px 0", lineHeight: 1.3,
                }}>
                  OpptyCon
                </h1>

                <p style={{
                  fontSize: 13, color: C.muted, lineHeight: 1.7, margin: "0 0 24px 0",
                }}>
                  The operating system for demand leaders who inherited a number
                  and need to reverse-engineer the machine that hits it.
                  Inverse-funnel math, governance constraints, and cost physics — live.
                </p>

                {/* What's inside */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 28,
                }}>
                  {[
                    "Inverse funnel model",
                    "Governance spine",
                    "Cost physics (P&L)",
                    "Pipeline coverage",
                    "Revenue motions",
                    "Seller ramp + attrition",
                    "Multi-year glideslope",
                    "Real-time recalculation",
                  ].map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 11, color: C.text,
                    }}>
                      <span style={{ color: C.accent, fontSize: 10, fontFamily: "'Chivo Mono', monospace" }}>→</span>
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
                        fontSize: 14, fontFamily: "'Chivo Mono', monospace",
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
          fontSize: 10, color: C.dim, fontFamily: "'Chivo Mono', monospace",
          letterSpacing: "0.04em",
        }}>
          netherops.io — governed revenue architecture
        </div>
      </motion.div>
    </div>
  );
}
