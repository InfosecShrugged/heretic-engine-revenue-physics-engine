import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════
// REVENUE PHYSICS ENGINE — SYSTEM ARCHITECTURE
// Constraint → Policy → Agent → Execution → Market → Feedback
// ═══════════════════════════════════════════════════════════

const TAU = Math.PI * 2;

// ─── DESIGN TOKENS ───
const T = {
  bg: "#06080d",
  surface: "#0c1018",
  ring: "#141a26",
  border: "#1a2233",
  core: "#22d3ee",
  coreGlow: "rgba(34,211,238,0.12)",
  governance: "#8b5cf6",
  agent: "#f59e0b",
  execution: "#10b981",
  market: "#f43f5e",
  feedback: "#3b82f6",
  text: "#e8ecf2",
  muted: "#64748b",
  dim: "#334155",
  font: "'Söhne', 'SF Pro Display', -apple-system, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
};

// ─── LAYER DEFINITIONS ───
const LAYERS = [
  { id: "core", label: "Revenue Physics Engine", r: 68, color: T.core, type: "core" },
  { id: "governance", label: "Governance Layer", r: 152, color: T.governance, desc: "Constraint & Policy" },
  { id: "agent", label: "Agent Layer", r: 232, color: T.agent, desc: "Autonomous Decision" },
  { id: "execution", label: "Execution Systems", r: 308, color: T.execution, desc: "System of Record & Action" },
  { id: "market", label: "Market Interface", r: 378, color: T.market, desc: "Signal & Response" },
];

// ─── NODE DEFINITIONS ───
const NODES = [
  // Governance Layer
  { id: "pnl", label: "P&L Constraints", layer: "governance", angle: -40, color: T.governance,
    desc: "Operating margin floors, burn guardrails, CAC ceilings" },
  { id: "stage", label: "Stage Definitions", layer: "governance", angle: 80, color: T.governance,
    desc: "Meeting=Held, SQO criteria, compression metrics" },
  { id: "icp", label: "ICP Governance", layer: "governance", angle: 200, color: T.governance,
    desc: "Segment rules, deal size floors, territory logic" },
  // Agent Layer
  { id: "coverage", label: "Coverage Agent", layer: "agent", angle: -10, color: T.agent,
    desc: "AE capacity, quota attainment, ramp-adjusted coverage" },
  { id: "attribution", label: "Attribution Agent", layer: "agent", angle: 120, color: T.agent,
    desc: "Motion allocation, channel yield, CAC decomposition" },
  { id: "forecast", label: "Forecast Agent", layer: "agent", angle: 240, color: T.agent,
    desc: "Pipeline velocity, win-rate trending, glideslope" },
  // Execution Systems
  { id: "salesforce", label: "Salesforce", layer: "execution", angle: 30, color: T.execution,
    sub: "System of Record", desc: "Pipeline, opportunities, closed-won truth" },
  { id: "hubspot", label: "HubSpot", layer: "execution", angle: 150, color: T.execution,
    sub: "Orchestration", desc: "Lifecycle stage, lead routing, nurture" },
  { id: "clay", label: "Clay", layer: "execution", angle: 270, color: T.execution,
    sub: "Signal Execution", desc: "Enrichment, sequencing, ICP scoring" },
  // Market Interface
  { id: "6sense", label: "6sense", layer: "market", angle: 60, color: T.market,
    sub: "Intent Signals", desc: "Buying stage, account surge, keyword intent" },
  { id: "buyer", label: "Buyer Market", layer: "market", angle: 180, color: T.market,
    sub: "Demand Surface", desc: "Net-new inquiries, engagement, conversion" },
  { id: "feedback", label: "Feedback Loop", layer: "market", angle: 300, color: T.market,
    sub: "Closed-Loop", desc: "Win/loss → constraint recalibration" },
];

// ─── FLOW CONNECTIONS ───
const FLOWS = [
  // Constraint → Policy → Agent
  { from: "pnl", to: "coverage", type: "constraint", label: "Budget ceiling" },
  { from: "stage", to: "attribution", type: "constraint", label: "Yield rules" },
  { from: "icp", to: "forecast", type: "constraint", label: "Segment bounds" },
  // Agent → Execution
  { from: "coverage", to: "salesforce", type: "directive", label: "Capacity signal" },
  { from: "attribution", to: "hubspot", type: "directive", label: "Motion mix" },
  { from: "forecast", to: "clay", type: "directive", label: "Enrichment priority" },
  // Execution → Market
  { from: "hubspot", to: "buyer", type: "action", label: "Campaign" },
  { from: "clay", to: "6sense", type: "action", label: "Signal match" },
  { from: "salesforce", to: "buyer", type: "action", label: "Outbound" },
  // Market → Feedback → Core
  { from: "buyer", to: "feedback", type: "feedback" },
  { from: "6sense", to: "feedback", type: "feedback" },
  { from: "feedback", to: "pnl", type: "recalibrate", label: "Recalibrate" },
  { from: "feedback", to: "stage", type: "recalibrate" },
];

// ─── SIMULATION TRIGGERS ───
const TRIGGERS = [
  { id: "arr_change", label: "ARR Change", desc: "Revenue target shifts → constraints cascade", path: ["pnl", "coverage", "salesforce", "buyer", "feedback", "pnl"] },
  { id: "coverage_gap", label: "Coverage Gap", desc: "Pipeline insufficient → agent rebalances", path: ["coverage", "salesforce", "buyer", "feedback", "stage", "attribution"] },
  { id: "cac_breach", label: "CAC Breach", desc: "Payback exceeds ceiling → governance intervenes", path: ["feedback", "pnl", "attribution", "hubspot", "buyer"] },
  { id: "intent_surge", label: "Intent Surge", desc: "6sense detects buying signal → execution accelerates", path: ["6sense", "feedback", "forecast", "clay", "hubspot", "buyer"] },
];

function polarToCart(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getNodePos(node, cx, cy) {
  const layer = LAYERS.find(l => l.id === node.layer);
  if (!layer) return { x: cx, y: cy };
  return polarToCart(cx, cy, layer.r, node.angle);
}

// ─── ANIMATED FLOW PARTICLE ───
function FlowParticle({ x1, y1, x2, y2, color, delay = 0, dur = 2 }) {
  return (
    <motion.circle r={3}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
      fill={color} filter="url(#particleGlow)" />
  );
}

// ─── MAIN COMPONENT ───
export default function ArchitectureDiagram() {
  const [hovered, setHovered] = useState(null);
  const [activeFlow, setActiveFlow] = useState(null);
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const containerRef = useRef(null);

  const CX = 440, CY = 420;

  useEffect(() => {
    const interval = setInterval(() => setPulsePhase(p => p + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  // Active path nodes for trigger simulation
  const activePath = activeTrigger ? TRIGGERS.find(t => t.id === activeTrigger)?.path || [] : [];
  const isNodeActive = (id) => activePath.includes(id);

  return (
    <div ref={containerRef} style={{
      width: "100%", maxWidth: 920, margin: "0 auto",
      background: T.bg, fontFamily: T.font, color: T.text,
      position: "relative", borderRadius: 20,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
    }}>
      {/* Subtle background grain */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 50% 50%, ${T.core} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ padding: "28px 32px 0", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
              System Architecture
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.2 }}>
              Revenue Physics Engine
            </h1>
            <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0", maxWidth: 400, lineHeight: 1.5 }}>
              Constraint → Policy → Agent → Execution → Market → Feedback
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LAYERS.filter(l => l.id !== "core").map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, opacity: 0.7 }} />
                <span style={{ fontSize: 9, color: T.muted, fontFamily: T.mono }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Diagram */}
      <svg viewBox="0 0 880 840" style={{ width: "100%", height: "auto" }}>
        <defs>
          {/* Glows */}
          <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="particleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="activeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Arrow marker */}
          <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={T.dim} opacity="0.5" />
          </marker>
        </defs>

        {/* Concentric rings */}
        {LAYERS.filter(l => l.id !== "core").map((l, i) => (
          <g key={l.id}>
            <motion.circle cx={CX} cy={CY} r={l.r} fill="none" stroke={l.color}
              strokeWidth={0.5} strokeDasharray="4 8" opacity={0.2}
              initial={{ opacity: 0 }} animate={{ opacity: 0.2 }}
              transition={{ delay: i * 0.15, duration: 0.6 }} />
            {/* Ring label */}
            <text x={CX} y={CY - l.r + 14} textAnchor="middle"
              fill={l.color} fontSize={8} fontFamily={T.mono} opacity={0.35}
              style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {l.label}
            </text>
          </g>
        ))}

        {/* Flow connections */}
        {FLOWS.map((flow, i) => {
          const fromNode = NODES.find(n => n.id === flow.from);
          const toNode = NODES.find(n => n.id === flow.to);
          if (!fromNode || !toNode) return null;
          const p1 = getNodePos(fromNode, CX, CY);
          const p2 = getNodePos(toNode, CX, CY);
          const isActive = activePath.includes(flow.from) && activePath.includes(flow.to) &&
            Math.abs(activePath.indexOf(flow.from) - activePath.indexOf(flow.to)) === 1;
          const color = flow.type === "constraint" ? T.governance :
            flow.type === "directive" ? T.agent :
            flow.type === "action" ? T.execution :
            flow.type === "feedback" ? T.feedback :
            flow.type === "recalibrate" ? T.market : T.dim;

          return (
            <g key={i}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={color} strokeWidth={isActive ? 1.5 : 0.5}
                opacity={isActive ? 0.7 : 0.12}
                markerEnd="url(#arrowHead)"
                style={{ transition: "all 0.5s ease" }} />
              {isActive && (
                <FlowParticle x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  color={color} delay={activePath.indexOf(flow.from) * 0.4} dur={1.5} />
              )}
            </g>
          );
        })}

        {/* Core */}
        <motion.circle cx={CX} cy={CY} r={52} fill={T.surface} stroke={T.core}
          strokeWidth={1.5} filter="url(#coreGlow)"
          animate={{ strokeOpacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        <motion.circle cx={CX} cy={CY} r={38} fill="none" stroke={T.core} strokeWidth={0.5}
          strokeDasharray="2 6" opacity={0.3}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />
        {/* Core icon — abstract physics symbol */}
        <motion.path d={`M${CX-12},${CY} Q${CX},${CY-18} ${CX+12},${CY} Q${CX},${CY+18} ${CX-12},${CY}`}
          fill="none" stroke={T.core} strokeWidth={1.5} opacity={0.6}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />
        <motion.path d={`M${CX},${CY-12} Q${CX+18},${CY} ${CX},${CY+12} Q${CX-18},${CY} ${CX},${CY-12}`}
          fill="none" stroke={T.core} strokeWidth={1.5} opacity={0.6}
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />
        <text x={CX} y={CY - 4} textAnchor="middle" fill={T.core} fontSize={9}
          fontFamily={T.mono} fontWeight={700} style={{ letterSpacing: "0.06em" }}>
          REVENUE
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fill={T.core} fontSize={7}
          fontFamily={T.mono} opacity={0.6} style={{ letterSpacing: "0.1em" }}>
          PHYSICS
        </text>

        {/* Nodes */}
        {NODES.map((node) => {
          const pos = getNodePos(node, CX, CY);
          const isHov = hovered === node.id;
          const isAct = isNodeActive(node.id);
          const r = isHov ? 28 : 24;

          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}>
              {/* Activation glow */}
              {isAct && (
                <motion.circle cx={pos.x} cy={pos.y} r={36}
                  fill="none" stroke={node.color} strokeWidth={2}
                  filter="url(#activeGlow)"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }} />
              )}
              {/* Node circle */}
              <motion.circle cx={pos.x} cy={pos.y} r={r}
                fill={T.surface} stroke={node.color}
                strokeWidth={isHov || isAct ? 1.5 : 0.8}
                filter={isHov ? "url(#nodeGlow)" : undefined}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + NODES.indexOf(node) * 0.05, type: "spring", stiffness: 200 }}
                style={{ transition: "stroke-width 0.2s" }} />
              {/* Node label */}
              <text x={pos.x} y={pos.y - 3} textAnchor="middle" fill={isHov || isAct ? node.color : T.text}
                fontSize={8} fontWeight={600} fontFamily={T.font}
                style={{ transition: "fill 0.2s", pointerEvents: "none" }}>
                {node.label.length > 12 ? node.label.split(" ").map((w, i, a) =>
                  <tspan key={i} x={pos.x} dy={i === 0 ? -3 : 11} textAnchor="middle">{w}</tspan>
                ) : node.label}
              </text>
              {node.sub && (
                <text x={pos.x} y={pos.y + (node.label.length > 12 ? 16 : 10)}
                  textAnchor="middle" fill={node.color} fontSize={6} fontFamily={T.mono}
                  opacity={0.5} style={{ pointerEvents: "none" }}>
                  {node.sub}
                </text>
              )}
            </g>
          );
        })}

        {/* Outer feedback orbit */}
        <motion.circle cx={CX} cy={CY} r={378} fill="none" stroke={T.feedback}
          strokeWidth={0.3} strokeDasharray="1 12" opacity={0.15}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />
      </svg>

      {/* Node detail tooltip */}
      <AnimatePresence>
        {hovered && (() => {
          const node = NODES.find(n => n.id === hovered);
          if (!node) return null;
          return (
            <motion.div key={hovered}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                position: "absolute", bottom: 120, left: "50%", transform: "translateX(-50%)",
                background: T.surface, border: `1px solid ${node.color}30`,
                borderRadius: 10, padding: "12px 16px", maxWidth: 280,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${node.color}10`,
                zIndex: 10,
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: node.color, marginBottom: 4 }}>{node.label}</div>
              {node.sub && <div style={{ fontSize: 9, color: T.muted, fontFamily: T.mono, marginBottom: 4 }}>{node.sub}</div>}
              <div style={{ fontSize: 10, color: T.text, lineHeight: 1.5, opacity: 0.8 }}>{node.desc}</div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Simulation triggers */}
      <div style={{ padding: "0 32px 28px", position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Simulate Constraint Cascade
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TRIGGERS.map(t => {
            const isActive = activeTrigger === t.id;
            return (
              <button key={t.id}
                onClick={() => setActiveTrigger(isActive ? null : t.id)}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: `1px solid ${isActive ? T.core : T.border}`,
                  background: isActive ? `${T.core}12` : "transparent",
                  color: isActive ? T.core : T.muted,
                  cursor: "pointer", fontSize: 10, fontWeight: 600,
                  fontFamily: T.font, transition: "all 0.2s",
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {activeTrigger && (() => {
            const t = TRIGGERS.find(tr => tr.id === activeTrigger);
            return t ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 10, padding: "10px 14px", background: `${T.core}08`,
                  borderRadius: 8, border: `1px solid ${T.core}20` }}>
                <div style={{ fontSize: 10, color: T.core, fontWeight: 600, marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>{t.desc}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {t.path.map((nodeId, i) => (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 8, padding: "2px 6px", borderRadius: 4,
                        background: `${NODES.find(n => n.id === nodeId)?.color || T.dim}20`,
                        color: NODES.find(n => n.id === nodeId)?.color || T.dim,
                        fontFamily: T.mono, fontWeight: 600,
                      }}>{NODES.find(n => n.id === nodeId)?.label || nodeId}</span>
                      {i < t.path.length - 1 && <span style={{ fontSize: 8, color: T.dim }}>→</span>}
                    </span>
                  ))}
                </div>
              </motion.div>
            ) : null;
          })()}
        </AnimatePresence>

        {/* Philosophy line */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.dim, fontStyle: "italic", lineHeight: 1.6 }}>
            Governance is not observation. It is intervention.
            <span style={{ color: T.muted, marginLeft: 6 }}>— Architecture with feedback loops is physics.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
