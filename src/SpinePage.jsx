// ─── Governed Revenue Architecture — Spine Page ───
// Renders governance verdicts as the operating system view.
// Imported by App.jsx, wired to the "spine" nav item.

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, CheckCircle, Info, ChevronRight, 
  Activity, Zap, ExternalLink, X
} from 'lucide-react';
import { evaluateSpine, SEVERITY_COLORS, SYSTEM_HEALTH_COLORS } from './governance';

// ─── DOMAIN METADATA ───
const DOMAIN_META = {
  pnl:         { label: "P&L Constraints", layer: "Governance", icon: "💰", desc: "Can we afford this plan?" },
  stage:       { label: "Stage Definitions", layer: "Governance", icon: "🔬", desc: "Are funnel gates healthy?" },
  icp:         { label: "ICP Governance", layer: "Governance", icon: "🎯", desc: "Right people, right price?" },
  coverage:    { label: "Coverage Agent", layer: "Agent", icon: "👥", desc: "Enough people to carry the number?" },
  attribution: { label: "Attribution Agent", layer: "Agent", icon: "📊", desc: "Is the mix yielding efficiently?" },
  forecast:    { label: "Forecast Agent", layer: "Agent", icon: "📈", desc: "Will we hit the number?" },
};

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  healthy: CheckCircle,
  info: Info,
};

// ─── TOKENS (matches App.jsx C object) ───
const C = {
  bg:"#EBEBEB", bgAlt:"#F4F4F2", card:"#FFFFFF",
  border:"rgba(0,0,0,0.13)", borderL:"rgba(0,0,0,0.07)",
  accent:"#111111", accentD:"rgba(0,0,0,0.06)",
  lime:"#C8FF6E", limeD:"rgba(200,255,110,0.15)",
  text:"#111111", muted:"#555555", dim:"#909090",
};

export default function SpinePage({ model, inputs, onInfoClick, mobile }) {
  const [expandedVerdict, setExpandedVerdict] = useState(null);
  const [domainFilter, setDomainFilter] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);

  // Run governance evaluation
  const spine = useMemo(() => evaluateSpine(model, inputs), [model, inputs]);

  // Filter verdicts
  const filteredVerdicts = spine.verdicts.filter(v => {
    if (domainFilter && v.domain !== domainFilter) return false;
    if (severityFilter && v.severity !== severityFilter) return false;
    return true;
  });

  const sysColor = SYSTEM_HEALTH_COLORS[spine.systemHealth];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── System Health Banner ── */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: C.card, border: `1px solid ${C.border}`, padding: "20px 24px",
          position: "relative", overflow: "hidden",
        }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: sysColor.bg }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: "50%", 
            background: `${sysColor.bg}22`, border: `2px solid ${sysColor.bg}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={22} style={{ color: sysColor.bg }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 4 }}>
              Governance Spine — System Health
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
              {spine.systemHealth.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {sysColor.label}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Critical", count: spine.counts.critical, color: SEVERITY_COLORS.critical.text },
              { label: "Warning", count: spine.counts.warning, color: SEVERITY_COLORS.warning.text },
              { label: "Total", count: spine.counts.total, color: C.muted },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Chivo Mono', monospace", color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: C.dim }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Domain Health Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(6, 1fr)", gap: 8 }}>
        {Object.entries(DOMAIN_META).map(([key, meta]) => {
          const health = spine.domainHealth[key] || "healthy";
          const sc = SEVERITY_COLORS[health];
          const isActive = domainFilter === key;
          const domainVerdicts = spine.verdicts.filter(v => v.domain === key);
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setDomainFilter(isActive ? null : key)}
              style={{
                background: isActive ? sc.bg : C.card,
                border: `1px solid ${isActive ? sc.border : C.border}`,
                padding: "14px 12px", cursor: "pointer",
                textAlign: "left", transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                <span style={{ 
                  fontSize: 9, fontWeight: 700, fontFamily: "'Chivo Mono', monospace",
                  color: sc.text, textTransform: "uppercase", letterSpacing: "0.04em",
                  padding: "2px 6px", background: sc.bg, borderRadius: 2,
                }}>{health}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>{meta.label}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{meta.desc}</div>
              {domainVerdicts.length > 0 && (
                <div style={{ fontSize: 9, fontFamily: "'Chivo Mono', monospace", color: C.dim, marginTop: 6 }}>
                  {domainVerdicts.length} verdict{domainVerdicts.length !== 1 ? "s" : ""}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      {(domainFilter || severityFilter) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Filtered:
          </span>
          {domainFilter && (
            <button onClick={() => setDomainFilter(null)} style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600,
              padding: "4px 8px", background: C.bgAlt, border: `1px solid ${C.border}`,
              cursor: "pointer", color: C.text,
            }}>
              {DOMAIN_META[domainFilter]?.label} <X size={10} />
            </button>
          )}
          {severityFilter && (
            <button onClick={() => setSeverityFilter(null)} style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600,
              padding: "4px 8px", background: SEVERITY_COLORS[severityFilter].bg, border: `1px solid ${SEVERITY_COLORS[severityFilter].border}`,
              cursor: "pointer", color: SEVERITY_COLORS[severityFilter].text,
            }}>
              {severityFilter.toUpperCase()} <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* ── Verdict Feed ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, padding: "4px 0" }}>
          Governance Verdicts ({filteredVerdicts.length})
        </div>

        <AnimatePresence mode="popLayout">
          {filteredVerdicts.map((v, i) => {
            const sc = SEVERITY_COLORS[v.severity];
            const Icon = SEVERITY_ICONS[v.severity];
            const isExpanded = expandedVerdict === v.id;
            const meta = DOMAIN_META[v.domain];

            return (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                style={{
                  background: C.card,
                  border: `1px solid ${isExpanded ? sc.border : C.border}`,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => setExpandedVerdict(isExpanded ? null : v.id)}
              >
                {/* Verdict header */}
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    <Icon size={14} style={{ color: sc.text }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: "'Chivo Mono', monospace",
                        color: sc.text, textTransform: "uppercase", letterSpacing: "0.04em",
                        padding: "1px 5px", background: sc.bg,
                      }}>{v.severity}</span>
                      <span style={{ fontSize: 9, color: C.dim, fontFamily: "'Chivo Mono', monospace" }}>
                        {meta?.icon} {meta?.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                      {v.signal}
                    </div>
                    {v.metrics && !isExpanded && (
                      <div style={{ 
                        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6,
                        fontSize: 10, fontFamily: "'Chivo Mono', monospace", color: C.muted,
                      }}>
                        <span style={{ color: sc.text, fontWeight: 700 }}>{typeof v.metrics.current === "number" ? v.metrics.current.toFixed(1) : v.metrics.current}</span>
                        <span>→</span>
                        <span style={{ color: C.dim }}>{typeof v.metrics.target === "number" ? v.metrics.target.toFixed(1) : v.metrics.target} {v.metrics.unit}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ 
                    color: C.dim, flexShrink: 0, marginTop: 4,
                    transform: isExpanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.2s",
                  }} />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 18px 18px 58px", display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Diagnosis */}
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.dim, marginBottom: 4 }}>
                            Diagnosis
                          </div>
                          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                            {v.diagnosis}
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: C.dim, marginBottom: 4 }}>
                            Recommendation
                          </div>
                          <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.6, fontWeight: 500 }}>
                            {v.recommendation}
                          </div>
                        </div>

                        {/* Metrics bar */}
                        {v.metrics && v.metrics.target && (
                          <div style={{ background: C.bgAlt, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 9, fontFamily: "'Chivo Mono', monospace", color: C.dim }}>
                                {v.metrics.unit}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3, position: "relative" }}>
                                {/* Target marker */}
                                {v.metrics.target && v.metrics.threshold && (
                                  <div style={{
                                    position: "absolute", top: -3, height: 12, width: 2,
                                    background: SEVERITY_COLORS.healthy.text,
                                    left: `${Math.min(100, Math.max(0, (v.metrics.target / (v.metrics.target * 2)) * 100))}%`,
                                  }} />
                                )}
                                {/* Current value */}
                                <div style={{
                                  position: "absolute", top: 0, left: 0, height: 6, borderRadius: 3,
                                  background: sc.border,
                                  width: `${Math.min(100, Math.max(5, (v.metrics.current / (Math.max(v.metrics.target, v.metrics.current) * 1.5)) * 100))}%`,
                                }} />
                              </div>
                              <div style={{ fontFamily: "'Chivo Mono', monospace", fontSize: 11, fontWeight: 700, color: sc.text, minWidth: 50, textAlign: "right" }}>
                                {typeof v.metrics.current === "number" ? v.metrics.current.toFixed(1) : v.metrics.current}
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                              <span style={{ fontSize: 9, fontFamily: "'Chivo Mono', monospace", color: SEVERITY_COLORS.healthy.text }}>
                                Target: {typeof v.metrics.target === "number" ? v.metrics.target.toFixed(1) : v.metrics.target}
                              </span>
                              {v.metrics.threshold && (
                                <span style={{ fontSize: 9, fontFamily: "'Chivo Mono', monospace", color: sc.text }}>
                                  Threshold: {typeof v.metrics.threshold === "number" ? v.metrics.threshold.toFixed(1) : v.metrics.threshold}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Affected modules */}
                        {v.affectedModules && v.affectedModules.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Affects:
                            </span>
                            {v.affectedModules.map(m => (
                              <button key={m} onClick={(e) => { e.stopPropagation(); onInfoClick?.(m); }}
                                style={{
                                  fontSize: 9, fontFamily: "'Chivo Mono', monospace", 
                                  padding: "2px 8px", background: C.bgAlt, border: `1px solid ${C.border}`,
                                  cursor: "pointer", color: C.accent, fontWeight: 600,
                                }}>
                                {m}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Cascade */}
                        {v.cascadeTo && v.cascadeTo.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Cascades to:
                            </span>
                            {v.cascadeTo.map(d => (
                              <span key={d} onClick={(e) => { e.stopPropagation(); setDomainFilter(d); setExpandedVerdict(null); }}
                                style={{
                                  fontSize: 9, fontFamily: "'Chivo Mono', monospace",
                                  padding: "2px 8px", background: SEVERITY_COLORS[spine.domainHealth[d] || "healthy"].bg,
                                  border: `1px solid ${SEVERITY_COLORS[spine.domainHealth[d] || "healthy"].border}`,
                                  cursor: "pointer", color: SEVERITY_COLORS[spine.domainHealth[d] || "healthy"].text,
                                }}>
                                {DOMAIN_META[d]?.icon} {DOMAIN_META[d]?.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredVerdicts.length === 0 && (
          <div style={{ 
            padding: 32, textAlign: "center", 
            background: SEVERITY_COLORS.healthy.bg, border: `1px solid ${SEVERITY_COLORS.healthy.border}`,
          }}>
            <CheckCircle size={32} style={{ color: SEVERITY_COLORS.healthy.text, marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: SEVERITY_COLORS.healthy.text }}>
              {domainFilter ? `No verdicts for ${DOMAIN_META[domainFilter]?.label}` : "All systems within governance thresholds"}
            </div>
          </div>
        )}
      </div>

      {/* ── Governance Legend ── */}
      <div style={{ 
        background: C.card, border: `1px solid ${C.border}`, padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>
          About the Governance Spine
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          The spine evaluates your revenue plan against governance rules across six domains. 
          Constraints cascade through the architecture: P&L floors constrain coverage, 
          stage definitions bound attribution, ICP governance shapes forecasts. 
          Each verdict includes a diagnosis and actionable recommendation.
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(SEVERITY_COLORS).map(([key, sc]) => (
            <button key={key}
              onClick={() => setSeverityFilter(severityFilter === key ? null : key)}
              style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.04em",
                padding: "3px 8px", background: severityFilter === key ? sc.bg : "transparent",
                border: `1px solid ${severityFilter === key ? sc.border : "transparent"}`,
                color: sc.text, cursor: "pointer",
              }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.border }} />
              {sc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
