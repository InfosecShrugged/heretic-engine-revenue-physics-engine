import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge, Users, Megaphone, Layers, GitBranch, TrendingUp, DollarSign, Target,
  BarChart3, Calendar, Settings, Zap, ChevronRight, ArrowUpRight, ArrowDownRight,
  Minus, Activity, Clock, Shield, Heart, PieChart as PieIcon, Split, Info, X, BookOpen, ExternalLink, Sun, Moon
} from 'lucide-react';
import {
  AreaChart, Area, ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { computeModel, DEFAULT_INPUTS, MONTHS, QUARTERS } from './engine';
import ArchitectureDiagram from './ArchitectureDiagram';
import SpinePage from './SpinePage';
import DataIngestionPage from './DataIngestionPage';
import AlphaGate, { hasAlphaAccess } from './AlphaGate';
import { lightTheme, darkTheme, fonts, shadows } from './tokens';
import { FIELD_AUDIT, scoreObject, gradeFromPct, topFixes, answeredCount } from './fieldAuditData';

// ─── THEME — Three-Mode Dual Accent System ───
// Module-level C that gets swapped when theme changes.
// Dark default. Components re-render via React state in App.
let C = darkTheme;
function setC(mode) { C = mode === 'dark' ? darkTheme : lightTheme; }

const fmt=(n,d=0)=>{if(n==null||isNaN(n))return"$0";const s=n<0?"-":"",a=Math.abs(n);if(a>=1e6)return`${s}$${(a/1e6).toFixed(1)}M`;if(a>=1e3)return`${s}$${(a/1e3).toFixed(d>0?d:0)}K`;return`${s}$${a.toFixed(d)}`;};
const fN=(n)=>n==null||isNaN(n)?"0":Math.round(n).toLocaleString();
const fP=(n)=>`${(n*100).toFixed(1)}%`;

// ─── RESPONSIVE ───
function useMediaQuery(query){
  const[matches,setMatches]=useState(()=>typeof window!=='undefined'&&window.matchMedia(query).matches);
  useEffect(()=>{
    const mq=window.matchMedia(query);
    const handler=(e)=>setMatches(e.matches);
    mq.addEventListener('change',handler);
    return()=>mq.removeEventListener('change',handler);
  },[query]);
  return matches;
}
// Responsive grid: collapses to 1 col on mobile, 2 on tablet
const rGrid=(cols,mob)=>({display:"grid",gridTemplateColumns:cols,gap:mob?8:12});

const Card=({children,style={}})=><div style={{background:C.surface,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:24,...style}}>{children}</div>;

const Metric=({label,value,sub,color=C.accent,icon:I,delay=0})=>(
  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:delay*0.04,duration:0.3}}
    style={{background:C.surface,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${color},${color}66)`}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
      <span style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</span>
      {I&&<I size={14} style={{color:C.dim}}/>}
    </div>
    <div style={{fontSize:24,fontWeight:700,color:C.text,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:5}}>{sub}</div>}
  </motion.div>
);

const Input=({label,value,onChange,prefix="",suffix="",min,max,step=1,compact})=>(
  <div style={{marginBottom:compact?8:13}}>
    <label style={{display:"block",fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{label}</label>
    <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:compact?"5px 9px":"7px 11px",gap:4}}>
      {prefix&&<span style={{color:C.dim,fontSize:13}}>{prefix}</span>}
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e=>onChange(parseFloat(e.target.value)||0)}
        style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"'Chivo Mono',monospace",width:"100%"}}/>
      {suffix&&<span style={{color:C.dim,fontSize:11}}>{suffix}</span>}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════
// AE QUOTA BENCHMARKS — Global Drivers helper
// Compact expandable table of cyber AE quota benchmarks by
// segment. Sources cited in tooltip — all from public-ish
// benchmark reports (Bridge Group, Pavilion, RepVue, Kellblog,
// SaaS Capital). Click a row to apply the midpoint as quota.
// ════════════════════════════════════════════════════════════
const QUOTA_BENCHMARKS = [
  { seg: "SMB",       acv: "$5–25K",  range: "$600K–$1.0M", mid: 800000,  deals: "30–80/yr" },
  { seg: "Mid-Market",acv: "$25–100K",range: "$800K–$1.2M", mid: 1000000, deals: "10–30/yr" },
  { seg: "Enterprise",acv: "$100–500K",range:"$1.0M–$1.5M",mid: 1250000, deals: "4–10/yr"  },
  { seg: "Strategic", acv: "$500K+",  range: "$1.5M–$3.0M", mid: 2250000, deals: "2–5/yr"   },
  { seg: "Federal",   acv: "$200K+",  range: "$1.2M–$2.5M", mid: 1850000, deals: "3–8/yr"   },
];
const QuotaBenchmarks=({C,currentQuota,onPick})=>{
  const [open,setOpen]=useState(false);
  const fmtK=(n)=>n>=1e6?`$${(n/1e6).toFixed(2)}M`:`$${Math.round(n/1000)}K`;
  return (
    <div style={{marginTop:-4,marginBottom:8}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",padding:0,cursor:"pointer",
          fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"}}>
        <span style={{color:C.accent,fontSize:10}}>{open?"−":"+"}</span>
        <span>Cyber benchmarks</span>
      </button>
      {open&&(
        <div style={{marginTop:6,padding:8,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0}}>
          <div style={{display:"grid",gridTemplateColumns:"54px 1fr auto",gap:4,fontSize:9,color:C.dim,
            fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4,paddingBottom:4,borderBottom:`1px solid ${C.borderMid}`}}>
            <span>Seg</span><span>Range</span><span>Apply</span>
          </div>
          {QUOTA_BENCHMARKS.map(b=>{
            const isCurrent=Math.abs(currentQuota-b.mid)<50000;
            return (
              <div key={b.seg} title={`${b.seg} cyber AE — ACV ${b.acv}, ${b.deals}`}
                style={{display:"grid",gridTemplateColumns:"54px 1fr auto",gap:4,alignItems:"center",padding:"3px 0",
                  fontSize:10,fontFamily:"'Chivo Mono',monospace",color:isCurrent?C.accent:C.text}}>
                <span style={{fontWeight:600}}>{b.seg}</span>
                <span style={{color:C.muted,fontSize:9}}>{b.range}</span>
                <button onClick={()=>onPick(b.mid)}
                  style={{background:isCurrent?C.accent:"transparent",color:isCurrent?C.bg:C.accent,
                    border:`1px solid ${C.accent}`,borderRadius:0,padding:"1px 5px",cursor:"pointer",
                    fontSize:9,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{fmtK(b.mid)}</button>
              </div>
            );
          })}
          <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.borderMid}`,fontSize:8,color:C.dim,lineHeight:1.4}}>
            Sources: Bridge Group SaaS, Pavilion, RepVue, Kellblog, SaaS Capital. Cyber runs ~20% below horizontal SaaS at same ACV (longer cycles, heavier SE).
          </div>
        </div>
      )}
    </div>
  );
};


// ════════════════════════════════════════════════════════════
// DATA CONFIDENCE — workstream C v1
// Tracks which "hard-to-measure" inputs (the 🔴 cluster from
// docs/PERSONA-AND-DATA-AUDIT.md §2) are still at module defaults.
// When more than half are untouched, the output is flagged as
// "directional, not forecast" — surfaces the silent-default problem.
// ════════════════════════════════════════════════════════════
const RED_INPUTS = [
  // Funnel conversion (most teams measure these wrong)
  'inquiryToMqlRate', 'mqlToSqlRate', 'sqlToMeetingRate', 'meetingToSqoRate', 'sqoToWonRate',
  'meetingShowRate', 'stage1MinPct',
  // Multi-year planning
  'y2GrowthRate', 'y2ConversionLift',
  // Phase-shift (most teams don't model)
  'sqoLeadQuarters', 'mqlLeadQuarters',
  // Behavioral cost splits (most don't split this way)
  'salesVariablePct', 'fixedMktgPct', 'martechPctOfVariable',
  // Sales capacity wishful-thinking inputs
  'aeRampMonths', 'aeAttritionRate', 'mktgSourcedPct',
  // Velocity by stage (almost never tracked)
  'velStage1to2', 'velStage2to3', 'velStage3to4', 'velStage4to5', 'velStage5toClose',
  // ACCELERATE outcomes (require experiment culture)
  'accelDaysReduced', 'accelWinRateLift', 'accelAccountsCoverage',
  // Expansion-as-funnel
  'expansionAvgDeal', 'expansionSqoToWon', 'expansionCycleWeeks',
];

function computeDataConfidence(inputs) {
  const untouched = RED_INPUTS.filter(k => {
    const def = DEFAULT_INPUTS[k];
    return def !== undefined && def === inputs[k];
  });
  const pct = (untouched.length / RED_INPUTS.length) * 100;
  return {
    untouched,
    untouchedCount: untouched.length,
    totalRedInputs: RED_INPUTS.length,
    untouchedPct: pct,
    tier: pct >= 60 ? "directional" : pct >= 30 ? "partial" : "solid",
  };
}

function DataConfidenceCallout({inputs, compact=false}) {
  const[expanded, setExpanded] = useState(false);
  const conf = computeDataConfidence(inputs);
  const color = conf.tier === "directional" ? C.amber : conf.tier === "partial" ? C.blue : C.green;
  const label = conf.tier === "directional" ? "Directional · not forecast" : conf.tier === "partial" ? "Partial data — read with caution" : "Data confidence · solid";
  const subtext = conf.tier === "directional"
    ? "These are inputs most teams either don't track or measure inconsistently — funnel conversion, velocity by stage, motion economics, expansion-as-funnel. Your output is directional. Open Global Drivers to override the ones you can."
    : conf.tier === "partial"
    ? "Some hard-to-measure inputs are set; others still at defaults. Mixed-confidence output — verify before quoting any specific number to a board."
    : "Most hard-to-measure inputs have been confirmed. Your output is a forecast, not just directional. Standard model caveats still apply.";
  return(<div style={{marginBottom:18}}>
    <div onClick={()=>setExpanded(!expanded)} style={{cursor:"pointer",padding:"12px 14px",background:`${color}10`,border:`1px solid ${color}33`,borderLeft:`3px solid ${color}`,display:"flex",alignItems:"baseline",gap:14,flexWrap:"wrap"}}>
      <div style={{flex:"0 0 auto"}}>
        <div style={{fontSize:9,fontWeight:700,color:color,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
        <div style={{fontSize:13,color:C.text,fontWeight:600,fontFamily:"'Chivo Mono',monospace"}}>{conf.untouchedCount}<span style={{color:C.muted,fontWeight:400}}>/{conf.totalRedInputs}</span> hard-to-measure inputs still at defaults</div>
      </div>
      <div style={{flex:1,minWidth:240,fontSize:11,color:C.muted,lineHeight:1.55}}>{subtext}</div>
      <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.06em"}}>{expanded?"▾ HIDE LIST":"▸ SHOW LIST"}</div>
    </div>
    {expanded && (
      <div style={{padding:"10px 14px",background:C.bg,border:`1px solid ${C.borderMid}`,borderTop:"none",fontSize:11,color:C.muted,lineHeight:1.6}}>
        <div style={{marginBottom:8,fontSize:10,fontWeight:600,color:C.dim,textTransform:"uppercase",letterSpacing:"0.04em"}}>Inputs still at default ({conf.untouchedCount})</div>
        <div style={{display:"grid",gridTemplateColumns:compact?"1fr":"repeat(auto-fit,minmax(220px,1fr))",gap:"4px 14px"}}>
          {conf.untouched.length === 0 ? (
            <div style={{color:C.green}}>None — all hard-to-measure inputs have been overridden.</div>
          ) : (
            conf.untouched.map(k => (
              <div key={k} style={{fontFamily:"'Chivo Mono',monospace",fontSize:10,color:C.muted}}>
                <span style={{color:C.text}}>{k}</span> <span style={{color:C.dim}}>= {String(inputs[k])}</span>
              </div>
            ))
          )}
        </div>
        <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${C.borderMid}`,fontSize:10,color:C.dim,lineHeight:1.6}}>
          Audit reference: <span style={{color:C.muted}}>docs/PERSONA-AND-DATA-AUDIT.md §2</span> — these inputs were flagged as 🟡 (often wrong) or 🔴 (don't have) for typical mid-market teams. Confirming each input is the path from "directional" to "forecast."
        </div>
      </div>
    )}
  </div>);
}



// ════════════════════════════════════════════════════════════
// HORIZON PLANNER CARD — workstream F
// Asks: given your targetARR + targetDate, can the current bench
// actually produce that velocity? Feasibility check + lever ladder.
// ════════════════════════════════════════════════════════════
function HorizonPlannerCard({model, inputs, mobile}){
  const h = model.horizonPlanner;
  if (!h) return null;
  if (h.error === "target_in_past") {
    return(<Card style={{marginBottom:18,borderLeft:`3px solid ${C.amber}`}}>
      <div style={{fontSize:11,color:C.amber,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Horizon Planner</div>
      <div style={{fontSize:12,color:C.text}}>Target date is at or before plan start. Set <strong>Target Date</strong> in Global Drivers to a future date.</div>
    </Card>);
  }
  if (h.error === "target_beyond_horizon") {
    return(<Card style={{marginBottom:18,borderLeft:`3px solid ${C.amber}`}}>
      <div style={{fontSize:11,color:C.amber,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Horizon Planner</div>
      <div style={{fontSize:12,color:C.text}}>Target date is {h.monthsToTarget} months out, beyond your {h.plannedMonths}-month planning horizon. Increase <strong>planningYears</strong> in Global Drivers.</div>
    </Card>);
  }
  const verdictColor = h.verdict === "achievable" ? C.green : h.verdict === "stretch" ? C.amber : h.verdict === "behind" ? C.amber : C.red;
  const verdictLabel = h.verdict === "achievable" ? "Achievable at current bench" : h.verdict === "stretch" ? "Stretch — possible at peak performance" : h.verdict === "behind" ? "Behind — meaningful gap" : "Unrealistic at current bench";
  return(<Card style={{marginBottom:18,borderLeft:`3px solid ${verdictColor}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14,gap:12,flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:9,fontWeight:700,color:verdictColor,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Horizon Planner · {verdictLabel}</div>
        <div style={{fontSize:14,color:C.text,fontWeight:600}}>
          <span style={{fontFamily:"'Chivo Mono',monospace"}}>{fmt(h.horizonTarget)}</span> by <span style={{fontFamily:"'Chivo Mono',monospace"}}>{h.targetDate}</span> · {h.monthsToTarget} months from plan start
        </div>
      </div>
      <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.06em",textAlign:"right"}}>
        {h.onTrackPct.toFixed(0)}% on-track
      </div>
    </div>
    {/* Velocity comparison */}
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:14}}>
      <div>
        <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Velocity Required</div>
        <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(h.velocityRequired)}<span style={{fontSize:11,color:C.muted}}>/mo</span></div>
        <div style={{fontSize:10,color:C.dim,marginTop:3}}>{fmt(h.newARRRequired)} new ARR over {h.monthsToTarget} months</div>
      </div>
      <div>
        <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Bench Can Produce</div>
        <div style={{fontSize:22,fontWeight:700,color:verdictColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(h.aeMonthlyCapacity)}<span style={{fontSize:11,color:C.muted}}>/mo</span></div>
        <div style={{fontSize:10,color:C.dim,marginTop:3}}>{inputs.aeCount} AEs × {fmt(inputs.aeQuota)} × {h.realisticAttainment.toFixed(0)}% attain.</div>
      </div>
      <div>
        <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Cumulative Gap</div>
        <div style={{fontSize:22,fontWeight:700,color:h.cumulativeGap>0?C.red:C.green,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{h.cumulativeGap>0?fmt(h.cumulativeGap):"—"}</div>
        <div style={{fontSize:10,color:C.dim,marginTop:3}}>{h.cumulativeGap>0?`${fmt(h.monthlyGap)}/mo short`:"Bench covers target"}</div>
      </div>
    </div>
    {/* Lever ladder — only if gap > 0 */}
    {h.levers && (
      <div style={{padding:14,background:C.bg,borderLeft:`2px solid ${verdictColor}`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Lever Ladder — any ONE of these closes the gap</div>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{h.levers.ae.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>+{h.levers.ae.gap}</div>
            <div style={{fontSize:10,color:C.dim,marginTop:4}}>From {h.levers.ae.current} to {h.levers.ae.needed} AEs</div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{h.levers.dealSize.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>+{h.levers.dealSize.liftPct.toFixed(0)}%</div>
            <div style={{fontSize:10,color:C.dim,marginTop:4}}>{fmt(h.levers.dealSize.current)} → {fmt(h.levers.dealSize.needed)}</div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{h.levers.attainment.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:h.levers.attainment.needed>110?C.red:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{h.levers.attainment.needed.toFixed(0)}%</div>
            <div style={{fontSize:10,color:C.dim,marginTop:4}}>From {h.levers.attainment.current.toFixed(0)}% realistic{h.levers.attainment.needed>110?" — implausible":""}</div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{h.levers.inquiryVolume.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>+{h.levers.inquiryVolume.liftPct.toFixed(0)}%</div>
            <div style={{fontSize:10,color:C.dim,marginTop:4}}>More marketing throughput</div>
          </div>
        </div>
        <div style={{marginTop:12,fontSize:10,color:C.dim,lineHeight:1.6}}>
          Each lever computed in isolation — in practice, you'd combine 2-3 levers each contributing partially. Attainment >110% is the implausibility flag; nobody runs a whole team there sustainably.
        </div>
      </div>
    )}
    {!h.levers && h.cumulativeGap <= 0 && (
      <div style={{padding:12,background:`${C.green}10`,borderLeft:`2px solid ${C.green}`,fontSize:12,color:C.text,lineHeight:1.6}}>
        <strong style={{color:C.green}}>The current bench can produce this velocity</strong> — no lever changes needed to hit the target by date. Standard execution risks still apply (ramp time, attrition, funnel conversion holding up).
      </div>
    )}
  </Card>);
}



// ════════════════════════════════════════════════════════════
// PHASE 0 — CRM READINESS DIAGNOSTIC (workstream E)
// Before the engine math means anything, the source data has to be
// trustworthy. This diagnostic scores the CRM hygiene foundations
// across four categories: definitions+capture, pipeline integrity,
// attribution+demand, forecasting. Output is a readiness grade and
// prioritized fixes for what's broken.
// ════════════════════════════════════════════════════════════
const PHASE_0_CHECKLIST = {
  foundation: {
    label: "Foundation — definitions + data capture",
    desc: "If these aren't true, every number downstream is suspect.",
    color: "accent",
    questions: [
      { id: "mql_def", text: "MQL, SQL, SQO have documented definitions consistently applied across marketing + sales", fix: "Write definitions in a shared doc. Walk both teams through them. Track misclassifications until <5%." },
      { id: "stage_dates", text: "Stage entry/exit timestamps are captured automatically (not manually backfilled)", fix: "Turn on stage history tracking in SFDC/HubSpot. Velocity math is impossible without this." },
      { id: "lead_source", text: "Lead source is captured at creation (required field, not nullable)", fix: "Make Lead Source required. Audit existing leads with missing source — usually 20-40% of historical records." },
      { id: "conv_measured", text: "Conversion rates have been measured from actual CRM data in the last 90 days", fix: "Pull real conversion rates from CRM cohorts. The defaults in this model are mid-market benchmarks — your reality is probably different." },
    ],
  },
  pipeline: {
    label: "Pipeline integrity",
    desc: "Pipeline you can't trust forecasts a number you can't hit.",
    color: "blue",
    questions: [
      { id: "stage2_criteria", text: "Stage 2 (SQO) has explicit promotion criteria; AEs trained on it", fix: "Document Stage 2 entry criteria (BANT or MEDDICC subset). Train AEs. Audit existing Stage 2 for misclassifications — purge or demote." },
      { id: "owner_next", text: "Every open opportunity has an owner + next step + next-step date", fix: "Make next step + date required on Stage 2+. Set up a missing-next-step report; review weekly." },
      { id: "stage_velocity", text: "Median time-in-stage is tracked per stage", fix: "Build a stage-velocity report. Required for the Velocity module + horizon planner to be meaningful." },
      { id: "lost_reasons", text: "Lost reasons are required on closed-lost; categorical (not free text); reviewed quarterly", fix: "Define ~6 lost-reason categories (price, no decision, lost-to-competitor, product gap, etc.). Required on close. Quarterly readout." },
    ],
  },
  attribution: {
    label: "Attribution + demand",
    desc: "Channel ROI is undecidable without these.",
    color: "violet",
    questions: [
      { id: "channel_attr", text: "Channel attribution captured on every lead AND opportunity", fix: "Enforce UTM tracking on inbound + manual source-of-origin on outbound. No null sources." },
      { id: "meeting_held", text: "Set vs held meetings distinguished; show rate tracked", fix: "Calendar integration or manual held-confirmation. Track no-shows / cancels separately. ~20% gap between set and held is normal." },
      { id: "mktg_rule", text: "Marketing-sourced vs AE-sourced has an unambiguous rule (no recurring fights)", fix: "Document the rule (first-touch / last-touch / SAL handoff). Get VP Sales + VP Marketing to sign off. Re-audit quarterly." },
      { id: "multi_touch", text: "Multi-touch — or consistent single-touch — attribution is implemented", fix: "Pick a model — pure first-touch is fine. The discipline is consistency, not sophistication." },
    ],
  },
  forecast: {
    label: "Forecasting",
    desc: "Without these, the model's output is louder than your real visibility.",
    color: "amber",
    questions: [
      { id: "forecast_cats", text: "Forecast categories used meaningfully (Commit / Best Case / Pipeline) — not just AE moods", fix: "Define entry criteria per category. Train AEs. Use them in weekly forecast calls. Audit accuracy retrospectively." },
      { id: "forecast_accuracy", text: "Forecast accuracy is tracked vs actual quarter-over-quarter", fix: "Snapshot forecast at week 1 of each quarter; compare to actuals at QE. Track delta. Coach AEs on systematic bias." },
      { id: "stale_flag", text: "Stale opportunities (no activity 30+ days) are flagged and reviewed weekly", fix: "Set up stalled-deal report. Review weekly in pipeline meeting. Force close-lost on 60+ day stalls without action." },
    ],
  },
};

function CRMReadinessPage({onInfoClick, mobile}){
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opptycon-phase0-answers') || '{}'); }
    catch(e) { return {}; }
  });
  const setAnswer = (id, value) => {
    setAnswers(prev => {
      const next = {...prev, [id]: value};
      try { localStorage.setItem('opptycon-phase0-answers', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  // Score: Yes=2, Unsure=1, No=0, unanswered=0
  const allQuestions = Object.values(PHASE_0_CHECKLIST).flatMap(cat => cat.questions);
  const totalQuestions = allQuestions.length;
  const maxScore = totalQuestions * 2;
  const score = allQuestions.reduce((sum, q) => sum + (answers[q.id] === "yes" ? 2 : answers[q.id] === "unsure" ? 1 : 0), 0);
  const pct = (score / maxScore) * 100;
  const grade = pct >= 90 ? "A" : pct >= 70 ? "B" : pct >= 50 ? "C" : pct >= 25 ? "D" : "F";
  const gradeColor = grade === "A" ? C.green : grade === "B" ? C.green : grade === "C" ? C.amber : C.red;
  const verdict = grade === "A" ? "CRM is ready for revenue modeling"
    : grade === "B" ? "Mostly ready — close the gaps in your weakest category"
    : grade === "C" ? "Foundation is shaky — read modeling output as directional only"
    : "Phase 0 hygiene needed before modeling makes sense";

  const failedQuestions = allQuestions.filter(q => answers[q.id] === "no");
  const unsureQuestions = allQuestions.filter(q => answers[q.id] === "unsure");
  const answered = allQuestions.filter(q => answers[q.id]).length;

  return(<div>
    <Header title="Phase 0 — CRM Readiness" sub="Before the engine math means anything, the source data has to be trustworthy. Score yours." icon={BookOpen} moduleId="phase0" onInfoClick={onInfoClick}/>

    {/* Score summary */}
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"2fr 3fr",gap:14,marginBottom:24}}>
      <Card style={{borderLeft:`3px solid ${gradeColor}`}}>
        <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:8,flexWrap:"wrap"}}>
          <div style={{fontSize:72,fontWeight:700,color:gradeColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{grade}</div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.text}}>{score} <span style={{color:C.muted,fontWeight:400}}>/ {maxScore}</span></div>
            <div style={{fontSize:10,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{pct.toFixed(0)}% · {answered} of {totalQuestions} answered</div>
          </div>
        </div>
        <div style={{fontSize:12,color:C.text,fontWeight:500,lineHeight:1.5}}>{verdict}</div>
      </Card>
      <Card>
        <div style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Score breakdown</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {Object.entries(PHASE_0_CHECKLIST).map(([key, cat])=>{
            const catScore = cat.questions.reduce((sum, q) => sum + (answers[q.id] === "yes" ? 2 : answers[q.id] === "unsure" ? 1 : 0), 0);
            const catMax = cat.questions.length * 2;
            const catPct = (catScore/catMax)*100;
            const catColor = catPct >= 70 ? C.green : catPct >= 40 ? C.amber : C.red;
            return(
              <div key={key} style={{padding:10,background:C.bg,borderLeft:`2px solid ${catColor}`}}>
                <div style={{fontSize:10,color:C.text,fontWeight:600,marginBottom:4}}>{cat.label.split(" — ")[0]}</div>
                <div style={{fontSize:9,color:catColor,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{catScore}/{catMax} · {catPct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>

    {/* Top fixes — if any */}
    {(failedQuestions.length > 0 || unsureQuestions.length > 0) && (
      <Card style={{marginBottom:24,borderLeft:`3px solid ${C.amber}`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Top fixes — what to do first</div>
        {failedQuestions.slice(0,3).map((q,i)=>(
          <div key={q.id} style={{padding:"10px 0",borderBottom:i<Math.min(2,failedQuestions.length-1)?`1px solid ${C.borderMid}`:"none"}}>
            <div style={{fontSize:11,fontWeight:600,color:C.red,marginBottom:4,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>NO · {q.id}</div>
            <div style={{fontSize:12,color:C.text,marginBottom:6,lineHeight:1.5}}>{q.text}</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.6,paddingLeft:14,borderLeft:`2px solid ${C.amber}`}}>Fix: {q.fix}</div>
          </div>
        ))}
        {failedQuestions.length === 0 && unsureQuestions.slice(0,3).map((q,i)=>(
          <div key={q.id} style={{padding:"10px 0",borderBottom:i<Math.min(2,unsureQuestions.length-1)?`1px solid ${C.borderMid}`:"none"}}>
            <div style={{fontSize:11,fontWeight:600,color:C.amber,marginBottom:4,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>UNSURE · {q.id}</div>
            <div style={{fontSize:12,color:C.text,marginBottom:6,lineHeight:1.5}}>{q.text}</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.6,paddingLeft:14,borderLeft:`2px solid ${C.amber}`}}>Find out: {q.fix}</div>
          </div>
        ))}
      </Card>
    )}

    {/* Category cards with all questions */}
    {Object.entries(PHASE_0_CHECKLIST).map(([key, cat])=>{
      const catScore = cat.questions.reduce((sum, q) => sum + (answers[q.id] === "yes" ? 2 : answers[q.id] === "unsure" ? 1 : 0), 0);
      const catMax = cat.questions.length * 2;
      const catColor = cat.color === "accent" ? C.accent : cat.color === "blue" ? C.blue : cat.color === "violet" ? C.violet : cat.color === "amber" ? C.amber : C.text;
      return(
        <Card key={key} style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6,flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:catColor,marginBottom:2}}>{cat.label}</div>
              <div style={{fontSize:11,color:C.muted}}>{cat.desc}</div>
            </div>
            <div style={{fontSize:11,fontWeight:700,color:catColor,fontFamily:"'Chivo Mono',monospace"}}>{catScore}/{catMax}</div>
          </div>
          <div style={{marginTop:10}}>
            {cat.questions.map((q,i)=>{
              const ans = answers[q.id];
              return(
                <div key={q.id} style={{padding:"12px 0",borderTop:i>0?`1px solid ${C.borderMid}`:"none"}}>
                  <div style={{fontSize:12,color:C.text,lineHeight:1.55,marginBottom:8}}>{q.text}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[{v:"yes",l:"Yes",c:C.green},{v:"unsure",l:"Unsure",c:C.amber},{v:"no",l:"No",c:C.red}].map(opt=>(
                      <button key={opt.v} onClick={()=>setAnswer(q.id, opt.v === ans ? null : opt.v)}
                        style={{padding:"6px 14px",borderRadius:0,border:`1.5px solid ${ans===opt.v?opt.c:C.borderMid}`,
                          background:ans===opt.v?`${opt.c}20`:"transparent",color:ans===opt.v?opt.c:C.muted,
                          cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'TWK Everett',sans-serif",
                          textTransform:"uppercase",letterSpacing:"0.06em",transition:"all 0.15s"}}>{opt.l}</button>
                    ))}
                  </div>
                  {ans === "no" && (
                    <div style={{marginTop:8,padding:10,background:`${C.red}08`,borderLeft:`2px solid ${C.red}`,fontSize:11,color:C.muted,lineHeight:1.6}}>
                      <strong style={{color:C.red,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em",fontSize:9,textTransform:"uppercase"}}>Fix:</strong> {q.fix}
                    </div>
                  )}
                  {ans === "unsure" && (
                    <div style={{marginTop:8,padding:10,background:`${C.amber}08`,borderLeft:`2px solid ${C.amber}`,fontSize:11,color:C.muted,lineHeight:1.6}}>
                      <strong style={{color:C.amber,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em",fontSize:9,textTransform:"uppercase"}}>Find out:</strong> {q.fix}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      );
    })}

    {/* Reset + footer */}
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.6,flex:1,minWidth:240}}>
          Answers persist locally (your browser only). Re-take when you've worked on the failed items. The goal isn't a perfect A — it's knowing where the modeling output is real vs directional.
        </div>
        <button onClick={()=>{
          if(confirm('Reset all Phase 0 answers?')) {
            setAnswers({});
            try { localStorage.removeItem('opptycon-phase0-answers'); } catch(e) {}
          }
        }} style={{padding:"8px 14px",borderRadius:0,border:`1px solid ${C.borderMid}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"'TWK Everett',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em"}}>Reset answers</button>
      </div>
    </Card>

    <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Phase 0 framework · Read the diagnostic alongside the Data Confidence callout on persona views — they answer different questions (inputs you've confirmed vs CRM that can support those inputs). Both being green is the bar for forecast-grade output.
    </div>
    {/* Cross-link to Field Audit — deeper inventory at the field level */}
    <div style={{marginTop:14,padding:14,background:C.violetDim,border:`1px solid ${C.violet}`,borderRadius:0}}>
      <div style={{fontSize:10,fontWeight:700,color:C.violet,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Go deeper · Field Audit</div>
      <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>Phase 0 grades the <b>practice</b> (15 questions about how you run the CRM). The <b>Field Audit</b> grades the <b>plumbing</b> — 47 specific SFDC/HubSpot fields across Contact + Deal objects. Same A-F framework, much more granular.</div>
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// FIELD AUDIT — Phase 0's deeper companion
// 47-field SFDC/HubSpot attribution + pipeline hygiene checklist.
// Weighted scoring (Critical/Important/Standard), A-F grade per object,
// top-fixes recommendations. State persists to localStorage.
// Data: src/fieldAuditData.js
// ════════════════════════════════════════════════════════════
function FieldAuditPage({onInfoClick, mobile}){
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opptycon-field-audit') || '{}'); }
    catch(e) { return {}; }
  });
  const [fieldNames, setFieldNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opptycon-field-audit-names') || '{}'); }
    catch(e) { return {}; }
  });
  const setAnswer = (id, value) => {
    setAnswers(prev => {
      const next = {...prev, [id]: value};
      try { localStorage.setItem('opptycon-field-audit', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };
  const setFieldName = (id, value) => {
    setFieldNames(prev => {
      const next = {...prev, [id]: value};
      try { localStorage.setItem('opptycon-field-audit-names', JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  const contactScore = scoreObject(FIELD_AUDIT.contact.fields, answers);
  const dealScore = scoreObject(FIELD_AUDIT.deal.fields, answers);
  const allFields = [...FIELD_AUDIT.contact.fields, ...FIELD_AUDIT.deal.fields];
  const overallScore = scoreObject(allFields, answers);
  const overallGrade = gradeFromPct(overallScore.pct);
  const contactGrade = gradeFromPct(contactScore.pct);
  const dealGrade = gradeFromPct(dealScore.pct);
  const fixes = topFixes(answers, 8);
  const ans = answeredCount(answers);

  const gradeColor = (g) => g === 'A' ? C.green : g === 'B' ? C.green : g === 'C' ? C.amber : C.red;
  const verdict = overallGrade === 'A' ? "Attribution + pipeline data is forecast-grade"
    : overallGrade === 'B' ? "Mostly there — close the gaps and you're production-ready"
    : overallGrade === 'C' ? "Foundation is shaky — most attribution numbers are directional only"
    : overallGrade === 'D' ? "Significant field gaps — re-read every channel ROI number with skepticism"
    : "Field hygiene is the bottleneck — fix this before trusting any attribution math";

  const statusBtn = (id, value, label, color) => {
    const active = answers[id] === value;
    return (
      <button onClick={() => setAnswer(id, value)} style={{
        padding:"4px 8px",border:`1px solid ${active?color:C.borderMid}`,
        background:active?color:"transparent",color:active?'#fff':C.muted,
        fontSize:9,fontWeight:600,fontFamily:"'Chivo Mono',monospace",
        letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",
        borderRadius:0,transition:"all .15s",minWidth:48,
      }}>{label}</button>
    );
  };

  return(<div>
    <Header title="Field Audit" sub="51-field SFDC/HubSpot attribution + pipeline hygiene diagnostic. Phase 0 grades the practice; this grades the plumbing." icon={BookOpen} moduleId="phase0" onInfoClick={onInfoClick}/>

    {/* Score summary */}
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr 1fr",gap:14,marginBottom:18}}>
      <Card style={{borderLeft:`3px solid ${gradeColor(overallGrade)}`}}>
        <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Overall</div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
          <div style={{fontSize:64,fontWeight:700,color:gradeColor(overallGrade),fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{overallGrade}</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{overallScore.earned} <span style={{color:C.muted,fontWeight:400}}>/ {overallScore.total}</span></div>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{overallScore.pct.toFixed(0)}%</div>
          </div>
        </div>
        <div style={{fontSize:11,color:C.text,fontWeight:500,lineHeight:1.5}}>{verdict}</div>
      </Card>
      <Card style={{borderLeft:`3px solid ${gradeColor(contactGrade)}`}}>
        <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Contact object</div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
          <div style={{fontSize:48,fontWeight:700,color:gradeColor(contactGrade),fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{contactGrade}</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{contactScore.earned}<span style={{color:C.muted,fontWeight:400}}> / {contactScore.total}</span></div>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{contactScore.pct.toFixed(0)}% · {FIELD_AUDIT.contact.fields.length} fields</div>
          </div>
        </div>
      </Card>
      <Card style={{borderLeft:`3px solid ${gradeColor(dealGrade)}`}}>
        <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Deal / opportunity</div>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
          <div style={{fontSize:48,fontWeight:700,color:gradeColor(dealGrade),fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{dealGrade}</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{dealScore.earned}<span style={{color:C.muted,fontWeight:400}}> / {dealScore.total}</span></div>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{dealScore.pct.toFixed(0)}% · {FIELD_AUDIT.deal.fields.length} fields</div>
          </div>
        </div>
      </Card>
    </div>

    {/* Coverage indicator */}
    <div style={{marginBottom:24,padding:"10px 14px",background:C.bg,border:`1px solid ${C.borderMid}`,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em",flexWrap:"wrap",gap:10}}>
      <span style={{color:C.muted}}>{ans.answered} of {ans.total} fields answered</span>
      <span style={{color:ans.answered === ans.total ? C.green : C.amber}}>
        {ans.answered === ans.total ? "✓ Complete audit" : `${ans.total - ans.answered} unknown — score weighted accordingly`}
      </span>
    </div>

    {/* Top fixes — biggest score jumps */}
    {fixes.length > 0 && overallScore.pct < 100 && (
      <Card style={{marginBottom:24,borderLeft:`3px solid ${C.violet}`}}>
        <div style={{fontSize:10,fontWeight:700,color:C.violet,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Top 8 fixes — biggest score jumps if added</div>
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:8}}>
          {fixes.map((f,i)=>(
            <div key={f.id} style={{padding:"8px 10px",background:C.bg,borderLeft:`2px solid ${f.weight===3?C.red:f.weight===2?C.amber:C.muted}`}}>
              <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:3,lineHeight:1.3}}>{f.label}</div>
              <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:4}}>
                {f.objLabel.split(' ')[0]} · weight {f.weight === 3 ? 'CRITICAL' : f.weight === 2 ? 'IMPORTANT' : 'STANDARD'}
              </div>
              <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{f.consequence}</div>
            </div>
          ))}
        </div>
      </Card>
    )}

    {/* Field tables — Contact first, then Deal */}
    {Object.entries(FIELD_AUDIT).map(([objKey, obj]) => {
      const score = scoreObject(obj.fields, answers);
      const grade = gradeFromPct(score.pct);
      const color = obj.color === 'violet' ? C.violet : C.accent;
      return (
        <Card key={objKey} style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div>
              <h3 style={{fontSize:14,fontWeight:700,color:C.text,margin:0,marginBottom:4,letterSpacing:"-0.01em"}}>{obj.label} <span style={{fontSize:10,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em",fontWeight:400,marginLeft:6}}>· {obj.fields.length} FIELDS</span></h3>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.5,maxWidth:600}}>{obj.desc}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase",letterSpacing:"0.06em"}}>Section grade</div>
              <div style={{fontSize:28,fontWeight:700,color:gradeColor(grade),fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{grade}</div>
              <div style={{fontSize:9,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{score.pct.toFixed(0)}%</div>
            </div>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.borderStrong}`}}>
                  <th style={{textAlign:"left",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace",width:32}}>Wt</th>
                  <th style={{textAlign:"left",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Field</th>
                  <th style={{textAlign:"left",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace",width:mobile?120:160}}>Your field name</th>
                  <th style={{textAlign:"left",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace",width:240}}>Exists?</th>
                </tr>
              </thead>
              <tbody>
                {obj.fields.map(f => {
                  const wtColor = f.weight === 3 ? C.red : f.weight === 2 ? C.amber : C.muted;
                  const wtLabel = f.weight === 3 ? 'CRIT' : f.weight === 2 ? 'IMP' : 'STD';
                  return (
                    <tr key={f.id} style={{borderBottom:`1px solid ${C.borderMid}`}}>
                      <td style={{padding:"8px",verticalAlign:"top"}}>
                        <span style={{fontSize:8,fontWeight:700,color:wtColor,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.06em",padding:"2px 4px",border:`1px solid ${wtColor}`,borderRadius:0}}>{wtLabel}</span>
                      </td>
                      <td style={{padding:"8px",verticalAlign:"top"}}>
                        <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:2,lineHeight:1.3}}>{f.label}{f.locked && <span style={{fontSize:9,color:C.violet,marginLeft:6,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>🔒 LOCKED</span>}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{f.definition}</div>
                        {f.example && f.example !== '—' && <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",marginTop:3,lineHeight:1.4}}>e.g. {f.example}</div>}
                      </td>
                      <td style={{padding:"8px",verticalAlign:"top"}}>
                        <input
                          type="text"
                          value={fieldNames[f.id] || ''}
                          onChange={e => setFieldName(f.id, e.target.value)}
                          placeholder="SFDC field name"
                          style={{width:"100%",fontSize:10,fontFamily:"'Chivo Mono',monospace",color:C.text,background:C.bg,border:`1px solid ${C.borderMid}`,padding:"5px 7px",borderRadius:0,outline:"none"}}
                        />
                      </td>
                      <td style={{padding:"8px",verticalAlign:"top"}}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                          {statusBtn(f.id, 'yes', 'YES', C.green)}
                          {statusBtn(f.id, 'partial', 'PARTIAL', C.amber)}
                          {statusBtn(f.id, 'no', 'NO', C.red)}
                          {statusBtn(f.id, 'unknown', '?', C.muted)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      );
    })}

    {/* Reset + footer */}
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5,maxWidth:600}}>
          Answers persist in your browser (localStorage). Reset clears everything. No data leaves your machine.
        </div>
        <button onClick={() => {
          if (confirm('Clear all field-audit answers? This cannot be undone.')) {
            setAnswers({});
            setFieldNames({});
            try {
              localStorage.removeItem('opptycon-field-audit');
              localStorage.removeItem('opptycon-field-audit-names');
            } catch(e) {}
          }
        }} style={{
          padding:"7px 12px",border:`1px solid ${C.red}`,background:"transparent",color:C.red,
          fontSize:10,fontWeight:600,fontFamily:"'Chivo Mono',monospace",
          letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",borderRadius:0
        }}>Reset audit</button>
      </div>
    </Card>

    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Field Audit · 47 fields across Contact + Deal objects · Weighted scoring (Critical=3, Important=2, Standard=1) · Yes=100%, Partial=50%, No/Unknown=0%. Source: opptycon docs/FIELD-AUDIT-SOURCE.md. The diagnostic complements Phase 0 — Phase 0 grades the practice, Field Audit grades the plumbing.
    </div>
  </div>);
}


// ─── MODULE DOC REGISTRY ───
// Every module gets a stable docRef, tooltip, and structured content
const MODULE_DOCS = {
  cfo: {
    title: "CFO View", docRef: "/docs/modules/cfo",
    tooltip: "Unit economics, cash sustainability, and the S&M investment band",
    tldr: "A persona-curated subset of the model that answers the five questions a CFO asks in their first five minutes. Unit economics, burn vs revenue, S&M as % of revenue band, plus two honest 'not yet modeled' gaps (variance sensitivity, gross margin trajectory).",
    included: ["LTV:CAC, CAC payback, Magic Number, Rule of 40 (the four unit economics tiles)", "Operating margin + annual burn + cumulative N-year cash required", "S&M as % of revenue with band visualization (underinvest / growth / stretch / burn zones)", "Acknowledged gaps: sensitivity analysis + gross margin trajectory"],
    excluded: ["Functional cost detail (see P&L)", "Pipeline + capacity modeling (see CRO View / Sales Model)", "Channel-level CAC (see CAC Breakdown)"],
    assumptions: ["All metrics derived from Global Drivers", "Burn = absolute value of operating loss if opMargin < 0", "Cumulative cash assumes flat burn rate across plan years (doesn't model Y2 cost scaling)", "S&M band: 30-55% growth, 55-60% stretch, ≥60% burn, <30% underinvest"],
    whatChanges: ["Target ARR / growth rate", "All cost % inputs (G&A, R&D, Sales OPEX, Variable Mktg)", "Marketing budget tiers (executive, PMM, MarTech)", "Gross margin", "Planning years (changes cumulative cash math)"],
    relatedModules: ["dashboard", "pnl", "sandmBudget", "cacBreakdown"],
  },
  ceo: {
    title: "CEO View", docRef: "/docs/modules/ceo",
    tooltip: "On the number, biggest threat, investment posture",
    tldr: "A persona-curated view that answers the five questions a CEO asks in their first five minutes. Plan confidence, single biggest threat to the plan (derived from model thresholds), burn assessment, and an investment-by-function band showing where to over- or under-spend versus benchmark.",
    included: ["Q1: Target / Capacity / Confidence tiles", "Q2: Single-biggest-threat callout (derived from S&M, attainment, funnel, coverage, CAC thresholds)", "Q3: Operating margin + annual burn + Rule of 40", "Q4: G&A / R&D / Sales OPEX / Variable Mktg vs benchmark band (4 mini band tiles)", "Q5: Acknowledged gap — marginal-$ allocator"],
    excluded: ["Full Governance Spine prioritized verdicts (see Spine module)", "Pipeline detail (see Pipeline / Funnel Health)", "Cost detail (see P&L)"],
    assumptions: ["Threat detection priority: burn > capacity > funnel-broken > pipeline-gap > CAC > funnel-warning > underinvestment", "Confidence levels: <85% attainment = on track, 85-100% stretch, 100-120% behind, >120% unrealistic", "Investment bands sourced from inputs.costBenchmarks"],
    whatChanges: ["Target ARR / growth rate", "AE count / quota / attainment", "All cost % inputs", "Funnel conversion rates"],
    relatedModules: ["cfo", "dashboard", "spine", "sandmBudget"],
  },
  cro: {
    title: "CRO View", docRef: "/docs/modules/cro",
    tooltip: "Ramped capacity, quarterly coverage, hire timing, SDR engine, attainment realism",
    tldr: "A persona-curated view for the CRO / VP Sales. Answers the five operational questions a sales leader asks in their first five minutes: capacity vs target, pipeline by quarter, how many AEs short and when, the SDR engine, and whether implied AE attainment is realistic.",
    included: ["Q1: Full vs Ramped capacity, coverage %, with comparison bar visualization", "Q2: Quarterly SQO / MQL / closing deal targets (phase-shifted)", "Q3: AE gap to plan + hire timing narrative (ramp-aware)", "Q4: SDR:AE ratio + mktg-sourced split + outbound constraint verdict", "Q5: Required attainment with 4-zone band (realistic / stretch / aggressive / unrealistic)"],
    excluded: ["Per-rep territory analysis (use CRM)", "Forecast accuracy / commit (use CRM forecasting)", "Comp plan modeling (see S&M Budget)"],
    assumptions: ["Industry-realistic average AE attainment: 85% (~70% of AEs achieve)", "Hire-by buffer = aeRampMonths - 3 (start hiring N months before you need ramped)", "Quarterly targets are phase-shifted: closing → SQO (sqoLeadQuarters ahead) → MQL (+mqlLeadQuarters ahead)"],
    whatChanges: ["aeCount, aeQuota", "aeRampMonths, aeAttritionRate", "sdrsPerAe", "mktgSourcedPct", "Target ARR (cascades to capacity gap)"],
    relatedModules: ["sales", "sellerRamp", "targets", "pipeline"],
  },
  cmo: {
    title: "CMO View", docRef: "/docs/modules/cmo",
    tooltip: "Monthly demand, CAC variants, channel concentration, fixed/variable, motion mix",
    tldr: "A persona-curated view for the CMO / VP Marketing. Shows the calendar-shaped view of inquiry/MQL demand (not just funnel-shaped), four CAC variants from optimistic to honest, concentration risk on the largest CREATE channel, the fixed-vs-variable budget split, and the CREATE/CONVERT/ACCELERATE motion mix with per-motion ROI signals.",
    included: ["Q1: Monthly inquiry/MQL bar chart + summary tiles + funnel yield", "Q2: 4 CAC variants (programmatic / martech-loaded / fully-burdened / all-in) with payback months each", "Q3: Top CREATE channel concentration check (≥40% triggers risk verdict) + full channel bar list", "Q4: Total / Fixed / Variable split with band context", "Q5: 3 motion tiles (CREATE / CONVERT / ACCELERATE) with spend + per-motion metrics", "Honest gap: stage-recommended motion split"],
    excluded: ["Channel-by-channel CPL/CPM detail (see Revenue Motions)", "Stage conversion math (see Funnel Health)", "Sales budget detail (see S&M Budget)"],
    assumptions: ["Concentration risk threshold: ≥40% of any single CREATE channel", "Fixed/variable healthy band: 20-35% fixed / 65-80% variable for growth stage", "Calendar-shaped demand uses NORAM seasonality by default"],
    whatChanges: ["motionAllocation %", "motionChannels[].pct and CPL/cost params", "variableMktgPct, fixedMktgPct, martechPctOfVariable", "All funnel conversion rates (cascade to monthly volume)"],
    relatedModules: ["channels", "cacBreakdown", "marketing", "mktgBudget"],
  },
  vc: {
    title: "VC View", docRef: "/docs/modules/vc",
    tooltip: "Rule of 40, Magic, glideslope credibility, all-in CAC, mktg vs sales-led",
    tldr: "A persona-curated view for the VC / investor seat. Five efficiency-and-credibility checks: Rule of 40 + Magic + LTV:CAC + Burn Multiple, multi-year glideslope feasibility, all-in CAC payback, marketing-vs-sales-led posture. Plus an honest gap for the unfunded-funding-need question.",
    included: ["Q1: 4 efficiency tiles (Rule of 40, Magic, LTV:CAC, Burn Multiple)", "Q2: Y1/Y2 targets + credibility verdict + ARR glideslope chart", "Q3: All-in CAC payback (the honest number) with investable verdict", "Q4: Gap — funding need + runway (math exists, view doesn't)", "Q5: Mktg-sourced % with led-by verdict + horizontal split visualization"],
    excluded: ["Funnel detail (see Funnel Health)", "Cost detail (see P&L)", "Capacity (see CRO View)"],
    assumptions: ["Investable payback: ≤24 months (mid-market cyber default)", "Y2 credibility threshold: ≤100% growth (~10% of mid-market SaaS sustain >100%)", "Marketing-led: ≥60% mktg-sourced; sales-led: ≤35%"],
    whatChanges: ["All P&L inputs (cascade to Rule of 40)", "Y2 growth rate input", "Marketing budget (cascades to all-in CAC)", "mktgSourcedPct"],
    relatedModules: ["cfo", "glideslope", "cacBreakdown", "pnl"],
  },
  board: {
    title: "Board View", docRef: "/docs/modules/board",
    tooltip: "Quarterly waterfall, biggest miss, attainment, investment band, assumptions",
    tldr: "A persona-curated view for the operating board. Five oversight checks: quarterly closing/SQO/MQL waterfall, biggest leading-indicator miss, AE attainment posture, growth-vs-burn investment band, and a defensibility panel for the six load-bearing assumptions.",
    included: ["Q1: Quarterly waterfall — closing deals, SQOs needed, MQLs needed across 8 quarters", "Q2: Biggest miss (priority chain across S&M, capacity, funnel, coverage, CAC)", "Q3: Attainment + AE count + attrition tiles", "Q4: S&M band with growth/burn verdict", "Q5: Assumptions panel — 6 load-bearing inputs with source/derivation per row"],
    excluded: ["Detailed module mechanics (drill in via full nav)", "Channel-level detail (see RevOps View)"],
    assumptions: ["Board surface intentionally light — most board read on phones at midnight", "Quarterly view defaults to phase-shifted (SQO lead = sqoLeadQuarters; MQL lead = mqlLeadQuarters)"],
    whatChanges: ["All inputs cascade — Board view is a summarization layer"],
    relatedModules: ["spine", "qbr", "ceo", "cfo"],
  },
  revops: {
    title: "RevOps View", docRef: "/docs/modules/revops",
    tooltip: "Funnel diagnostic, channel economics, capacity decomposition, floor flags, leverage",
    tldr: "The operator persona — the role the alpha was built for today. Five operational diagnostics: where the funnel is breaking, channel-level cost-per-SQO and CAC, theoretical-vs-effective capacity decomposition, floor-bound state flags, and the highest-leverage 5pp conversion improvement.",
    included: ["Q1: Funnel grade + worst-stage callout", "Q2: Top channels by spend with Cost/SQO + CAC + ROI", "Q3: Capacity waterfall (full minus ramp minus attrition equals effective)", "Q4: Floor-bound flags consolidated (sales + fixed mktg)", "Q5: Highest-leverage stage by absolute gap to 'great' benchmark"],
    excluded: ["Persona-friendly framing (this view is for the operator)", "Strategic narrative (see CEO/CFO views)"],
    assumptions: ["Worst-stage detection: prioritizes 'bad' status stages, then 'good' stages with largest gap to 'great'", "Highest-leverage: largest absolute pp gap to 'great' benchmark (compounding through downstream stages)"],
    whatChanges: ["All funnel conversion rates", "Channel mix + CPL/cost params", "AE count, ramp, attrition", "All cost % inputs"],
    relatedModules: ["funnelHealth", "channels", "pipeline", "sellerRamp"],
  },
  phase0: {
    title: "Phase 0 — CRM Readiness", docRef: "/docs/modules/phase0",
    tooltip: "Score CRM hygiene foundations before trusting the model",
    tldr: "Before the engine math means anything, the source data has to be trustworthy. This diagnostic scores ~15 yes/no questions across four categories — foundation, pipeline integrity, attribution, forecasting. Output is an A-F readiness grade and prioritized fixes for what's broken. Read alongside the Data Confidence callout on persona views.",
    included: ["Foundation: MQL/SQL/SQO definitions, stage dates, lead source capture, conversion rate measurement", "Pipeline integrity: Stage 2 criteria, owner+next-step hygiene, stage velocity tracking, lost reason discipline", "Attribution: channel attribution, set-vs-held meetings, mktg-sourced rule, single/multi-touch consistency", "Forecasting: category usage, accuracy tracking, stale-deal flagging", "Top fixes panel — surfaces the 3 highest-priority NO answers", "Per-category subscore + overall A-F grade"],
    excluded: ["Auto-scoring from CRM API (this is self-assessment)", "Specific tooling recommendations (the questions are tool-agnostic)"],
    assumptions: ["Yes = 2 pts, Unsure = 1 pt, No = 0 pts", "Grade thresholds: A ≥90%, B ≥70%, C ≥50%, D ≥25%, F <25%", "Answers persist in localStorage — survive page reloads, not browser clears"],
    whatChanges: ["Your honest yes/no/unsure answers — this is the only module where input quality is the entire point"],
    relatedModules: ["spine", "dashboard"],
  },
  dashboard: {
    title: "Command Center", docRef: "/docs/modules/dashboard",
    tooltip: "Top-level health metrics and deal math summary",
    tldr: "Single-screen operating snapshot. If these numbers are green, the plan is working. If not, drill into the module that's red.",
    included: ["ARR target vs actual", "New ARR needed", "Deals required", "Pipeline coverage", "Funnel yield", "S&M health"],
    excluded: ["Multi-year projections (see Glideslope)", "Channel-level detail (see Channel Mix)"],
    assumptions: ["All metrics derived from Global Drivers inputs", "Pipeline coverage = SQO pipeline ÷ remaining ARR needed", "S&M health benchmarked at 35-55% of revenue for growth stage"],
    whatChanges: ["Target ARR / Starting ARR", "Average deal size", "Funnel conversion rates", "AE count and quota"],
    relatedModules: ["targets", "funnelHealth", "pnl"],
  },
  targets: {
    title: "Target Tracker", docRef: "/docs/modules/targets",
    tooltip: "Quarterly and monthly ARR targets with pipeline tracking",
    tldr: "Breaks the annual target into quarterly and monthly chunks. Shows pipeline coverage per quarter and flags where you're short.",
    included: ["Quarterly ARR targets", "Monthly new ARR glidepath", "Pipeline coverage per quarter", "Mktg vs AE sourced split"],
    excluded: ["Channel-level attribution", "Individual rep targets"],
    assumptions: ["Linear quarterly distribution (adjustable via weighting)", "Pipeline coverage uses SQO-stage pipeline only", "Mktg/AE split applied uniformly across quarters"],
    whatChanges: ["Target ARR", "Mktg sourced %", "Average deal size", "SQO-to-won rate"],
    relatedModules: ["dashboard", "glideslope", "pipeline"],
  },
  funnelHealth: {
    title: "Funnel Health", docRef: "/docs/modules/funnel-health",
    tooltip: "Stage conversion health + compression metrics exposing true engine yield",
    tldr: "Stage-by-stage conversion health with benchmarks, plus compression metrics (Inquiry→SQO, Inquiry→Won) that expose the true revenue yield of the engine. Meeting stage standardized to 'held' (not scheduled) with show-rate tracking.",
    included: ["Stage conversion rates with benchmarks", "Compression metrics: Inquiry→SQO and Inquiry→Won", "Cost/SQO and Cost/Won from programmatic spend", "Required inquiry volume to hit ARR target", "Meeting held vs set tracking (show rate)", "Pipeline coverage settings"],
    excluded: ["Time-based analysis (see Velocity)", "Channel-specific funnels", "Grading does not yet factor compression health"],
    assumptions: ["Benchmarks based on mid-market B2B SaaS / cyber", "Meeting = first live sales conversation held, not scheduled", "Meeting show rate default 80% (20% no-show/cancel)", "Compression rates are compounded products, not averages", "Cost metrics use programmatic channel spend only"],
    whatChanges: ["All stage conversion rates", "Meeting show rate (affects set→held)", "Average deal size (changes cost/won)", "Variable marketing budget (changes cost metrics)"],
    relatedModules: ["pipeline", "marketing", "velocity", "cacBreakdown"],
  },
  sales: {
    title: "Sales Model", docRef: "/docs/modules/sales",
    tooltip: "AE capacity, quota coverage, and ramp modeling",
    tldr: "Models whether you have enough AEs at quota to hit target. Accounts for ramp time, attrition, and the gap between theoretical and effective capacity.",
    included: ["AE count and quota", "Ramp-adjusted capacity", "Attrition impact", "Quota coverage ratio"],
    excluded: ["Sales comp detail (see S&M Budget)", "SDR/BDR modeling (see S&M Budget)"],
    assumptions: ["Linear ramp (0% at start → 100% at ramp months)", "Attrition replaces mid-year (replacement starts at 0% ramp)", "Quota is gross booking, not net ARR"],
    whatChanges: ["AE count", "AE quota", "Ramp months", "Attrition rate"],
    relatedModules: ["sellerRamp", "sandmBudget", "targets"],
  },
  marketing: {
    title: "Marketing Funnel", docRef: "/docs/modules/marketing-funnel",
    tooltip: "Marketing-sourced pipeline generation model",
    tldr: "Works backward from deals needed to inquiries required. Shows the volume at each funnel stage that marketing must generate.",
    included: ["Inquiry → MQL → SQL → Meeting → SQO → Won waterfall", "Mktg-sourced vs AE-sourced split", "Volume requirements per stage"],
    excluded: ["Channel attribution (see Channel Mix)", "Cost per stage (see Pipeline)"],
    assumptions: ["Conversion rates applied sequentially", "Mktg sourced % applied at SQO level", "All marketing inquiries enter top of funnel"],
    whatChanges: ["Mktg sourced %", "All conversion rates", "Deals needed (driven by target ARR and deal size)"],
    relatedModules: ["channels", "pipeline", "funnelHealth"],
  },
  channels: {
    title: "Revenue Motions", docRef: "/docs/modules/revenue-motions",
    tooltip: "How demand is created, converted, and accelerated — motion-first, not channel-first",
    tldr: "Every dollar gets two tags: a motion (CREATE, CONVERT, ACCELERATE) and an intent. Channels exist inside motions, not as standalone entities. This answers 'what job did this dollar perform?' instead of 'which channel gets credit?'",
    included: ["Motion budget allocation (CREATE/CONVERT/ACCELERATE)", "Channel composition per motion", "Demand Creation: CPL, inquiries, pipeline, creation-only CAC", "Demand Conversion: cost/SQL, throughput, capacity utilization", "Deal Acceleration: accounts touched, opps influenced, days reduced, win-rate delta, revenue pulled forward"],
    excluded: ["Fixed marketing infrastructure (see Mktg Budget)", "Martech stack costs (allocated in Mktg Budget)", "Sales comp (see S&M Budget)"],
    assumptions: ["Channels can appear in multiple motions with separate budgets", "Creation channels are measured by CPL and pipeline created", "Conversion is a throughput engine — no revenue attribution", "Acceleration is measured by velocity and win-rate lift, not CPL", "ABM is a pattern of ACCELERATE-tagged spend, not a channel"],
    whatChanges: ["Motion allocation % (CREATE/CONVERT/ACCELERATE split)", "Channel mix within each motion", "CPL per creation channel", "Cost/SQL per conversion function", "Cost/account per acceleration program", "Acceleration assumptions (days reduced, win-rate lift, account coverage %)"],
    relatedModules: ["mktgBudget", "pipeline", "cacBreakdown"],
  },
  mktgBudget: {
    title: "Marketing Budget", docRef: "/docs/modules/marketing-budget",
    tooltip: "Fixed marketing infrastructure + variable demand investment",
    tldr: "Marketing infrastructure cost that exists before a single lead is generated. Grouped by role in the system: executive layer, revenue engine operations, product & market strategy, brand & content production, and marketing technology. Variable demand investment is separate and motion-allocated.",
    included: ["Fixed infrastructure by layer (Executive, RevEngine Ops, PMM, Brand/Content, MarTech Infrastructure)", "Variable demand investment (motion-allocated)", "Stress modes (lean/normal/transform)", "Tactical debt tax", "CAC layers (programmatic through all-in)", "Sensitivity analysis", "Floor-bound compression warnings"],
    excluded: ["Sales budget (see S&M Budget)", "Motion-level channel detail (see Revenue Motions)", "Cross-functional RevOps (sits in G&A)"],
    assumptions: ["Executive layer is floor-bound (step function of funding stage, not revenue)", "Revenue Engine Ops scales slower than revenue but faster than leadership", "PMM is fixed infrastructure — not variable spend", "Core MarTech (CRM, MAP, attribution, CMS) is fixed; performance tools (6sense, intent data) are variable/motion-allocated", "Marketing Ops belongs here; cross-functional RevOps belongs in G&A"],
    whatChanges: ["Variable mktg % of revenue", "Fixed mktg % of total", "Martech % of variable", "Stress mode selection", "Debt tax slider", "Funding stage (changes executive comp)", "Infrastructure layer toggles"],
    relatedModules: ["sandmBudget", "channels", "cacBreakdown"],
  },
  sandmBudget: {
    title: "S&M Budget", docRef: "/docs/modules/sandm-budget",
    tooltip: "Combined Sales & Marketing — the CFO view",
    tldr: "The full cost of go-to-market in one view. Shows sales budget (AE/SDR/SE comp, tools, enablement) alongside marketing budget, with leadership cost layer and headcount detail.",
    included: ["Sales budget breakdown", "Marketing budget summary", "Leadership cost layer by funding stage", "GTM headcount & comp table", "Fixed vs variable split", "S&M P&L waterfall"],
    excluded: ["Channel-level marketing detail", "Individual rep performance"],
    assumptions: ["AE OTE $280K (mid-market cyber), benefits load 1.25x", "SDR OTE $95K, benefits load 1.22x", "SE at 1:3 ratio to AEs", "Leadership comp driven by funding stage, not revenue", "Headcount floor = minimum viable team regardless of formula"],
    whatChanges: ["AE count", "Sales OPEX %", "Funding stage", "Leadership role toggles", "AE/SDR OTE inputs"],
    relatedModules: ["mktgBudget", "sales", "pnl"],
  },
  cacBreakdown: {
    title: "CAC Breakdown", docRef: "/docs/modules/cac-breakdown",
    tooltip: "Acquisition cost decomposed by spend category",
    tldr: "Four layers of CAC from optimistic to honest: programmatic (channel spend only), martech-loaded, fully burdened (all marketing), and all-in blended (all S&M ÷ all deals including expansion).",
    included: ["Four CAC variants", "Payback period per variant", "CAC:LTV ratio", "Channel-level CAC"],
    excluded: ["CS costs in retention CAC", "Expansion-only CAC"],
    assumptions: ["Programmatic CAC = channel spend ÷ new deals", "Fully burdened includes all fixed marketing overhead", "Payback = CAC ÷ monthly revenue per customer", "LTV assumes gross margin applied"],
    whatChanges: ["Marketing budget (all components)", "Deals needed", "Average deal size", "Gross margin"],
    relatedModules: ["mktgBudget", "channels", "sandmBudget"],
  },
  pipeline: {
    title: "Pipeline", docRef: "/docs/modules/pipeline",
    tooltip: "Funnel waterfall with cost per stage and budget context",
    tldr: "The funnel with a price tag. Shows volume at each stage plus what it costs to generate that volume. Connects the marketing budget to actual pipeline output.",
    included: ["Stage volumes", "Cost per stage unit", "Budget → pipeline flow", "Cost benchmarks per stage", "Funnel efficiency ratios", "Budget reality check"],
    excluded: ["Time-in-stage (see Velocity)", "Win/loss analysis"],
    assumptions: ["Cost per stage = total channel spend ÷ stage volume", "Benchmarks based on mid-market B2B cyber", "All costs attributed to marketing (no sales cost allocation per stage)"],
    whatChanges: ["All conversion rates", "Marketing budget", "Channel CPLs", "Deals needed"],
    relatedModules: ["funnelHealth", "velocity", "mktgBudget"],
  },
  velocity: {
    title: "Velocity", docRef: "/docs/modules/velocity",
    tooltip: "Stage-level time analysis and pipeline velocity",
    tldr: "How fast deals move through each stage. Total cycle time drives pipeline requirements — longer cycles mean you need more pipeline earlier.",
    included: ["Stage duration inputs", "Total cycle time", "Daily velocity (revenue per day in pipe)", "Stage duration breakdown chart"],
    excluded: ["Conversion rates (see Funnel Health)", "Cost analysis"],
    assumptions: ["Stages are sequential (no skip-stage)", "Duration is median, not mean", "Velocity = pipeline value × win rate ÷ cycle days"],
    whatChanges: ["Stage duration inputs (days per stage)", "SQO pipeline value", "Win rate"],
    relatedModules: ["pipeline", "funnelHealth", "targets"],
  },
  sellerRamp: {
    title: "Seller Ramp", docRef: "/docs/modules/seller-ramp",
    tooltip: "AE ramp curve and effective capacity over time",
    tldr: "Models the gap between headcount and capacity. New AEs don't produce at full quota immediately — ramp time means your effective team is smaller than your actual team.",
    included: ["Ramp curve visualization", "Effective vs theoretical capacity", "Ramp-adjusted quota attainment", "Attrition replacement modeling"],
    excluded: ["SDR ramp (simpler, assumed faster)", "SE ramp"],
    assumptions: ["Linear ramp from 0% to 100% over ramp period", "Replacement hires start at 0% on attrition date", "No over-attainment modeled"],
    whatChanges: ["AE count", "Ramp months", "Attrition rate", "AE quota"],
    relatedModules: ["sales", "sandmBudget", "targets"],
  },
  pnl: {
    title: "P&L", docRef: "/docs/modules/pnl",
    tooltip: "Full operating P&L with functional cost breakdown",
    tldr: "Revenue through operating income. Shows COGS, gross margin, then functional OPEX (G&A, R&D, Sales, Marketing) with the behavioral split (fixed vs variable).",
    included: ["Revenue and COGS", "Gross margin", "OPEX by function", "Operating income/margin", "Fixed vs variable cost split", "Rule of 40 and burn metrics"],
    excluded: ["Below-the-line items (interest, tax, D&A)", "Cash flow"],
    assumptions: ["Revenue = blended of starting + new ARR (mid-year recognition)", "COGS = 1 - gross margin %", "All costs are annual run-rate", "No seasonality"],
    whatChanges: ["All cost % inputs", "Gross margin", "Target ARR", "AE count (drives sales cost floor)"],
    relatedModules: ["sandmBudget", "dashboard", "mktgBudget"],
  },
  glideslope: {
    title: "Glideslope", docRef: "/docs/modules/glideslope",
    tooltip: "Multi-year ARR trajectory and growth curve",
    tldr: "Projects the ARR path over 2-3 years. Shows the growth curve, year-over-year rates, and what the business looks like at each year-end.",
    included: ["Multi-year ARR projection", "Growth rate trajectory", "Year-end ARR milestones", "Cross-year pipeline carry"],
    excluded: ["Multi-year cost modeling (P&L is Y1 only)", "Headcount planning by year"],
    assumptions: ["Y2/Y3 growth rates are inputs (not derived)", "Conversion rates can improve year-over-year", "Pipeline carries across year boundaries"],
    whatChanges: ["Planning years (2 or 3)", "Y2 growth rate", "Y2 conversion lift", "All Y1 inputs (cascade forward)"],
    relatedModules: ["targets", "qbr", "pnl"],
  },
  qbr: {
    title: "QBR Metrics", docRef: "/docs/modules/qbr",
    tooltip: "Board-ready quarterly business review metrics",
    tldr: "The slides you show the board. Key metrics formatted for quarterly review: ARR progress, pipeline health, efficiency ratios, and trend indicators.",
    included: ["Quarterly ARR progress", "Pipeline coverage", "Efficiency metrics", "Trend indicators", "Year selector for multi-year"],
    excluded: ["Detailed funnel analysis", "Rep-level performance"],
    assumptions: ["Metrics are model-derived (not actuals)", "Quarters are calendar-aligned", "Board benchmarks based on growth-stage SaaS"],
    whatChanges: ["All model inputs (this view is read-only)", "Year selector"],
    relatedModules: ["dashboard", "targets", "glideslope"],
  },
  weekly: {
    title: "Weekly Tracker", docRef: "/docs/modules/weekly",
    tooltip: "Weekly operational cadence metrics",
    tldr: "Breaks monthly targets into weekly operating numbers. Use this for Monday pipeline reviews and Friday commit calls.",
    included: ["Weekly inquiry/MQL/SQL targets", "Weekly deal targets", "Pacing indicators"],
    excluded: ["Actual vs plan (model only)", "Individual contributor tracking"],
    assumptions: ["4.33 weeks per month", "Linear distribution within month", "No holiday/seasonality adjustment"],
    whatChanges: ["Monthly targets (derived from annual)", "All conversion rates"],
    relatedModules: ["targets", "pipeline", "dashboard"],
  },
};

// ─── DOC PANEL (side panel for module info) ───
function DocPanel({moduleId, onClose}){
  const doc = MODULE_DOCS[moduleId];
  if(!doc) return null;
  return(
    <motion.div initial={{x:320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:320,opacity:0}} transition={{duration:0.2,ease:"easeOut"}}
      style={{position:"fixed",top:48,right:0,width:360,height:"calc(100vh - 48px)",background:C.bgAlt,borderLeft:`1px solid ${C.borderMid}`,
        zIndex:201,display:"flex",flexDirection:"column",boxShadow:"-2px 0 8px rgba(0,0,0,0.08)"}}>
      {/* Header */}
      <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.borderMid}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>{doc.title}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>{doc.tooltip}</div>
        </div>
        <button onClick={onClose} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",padding:4}}>
          <X size={16}/>
        </button>
      </div>
      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
        {/* TL;DR */}
        <div style={{padding:12,background:`${C.accent}08`,borderRadius:0,border:`1px solid ${C.accent}15`,marginBottom:16}}>
          <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>In Plain English</div>
          <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{doc.tldr}</div>
        </div>
        {/* What's In / Out */}
        <DocSection title="What's Included" color={C.green}>
          {doc.included.map((item,i)=><DocBullet key={i} text={item} color={C.green}/>)}
        </DocSection>
        <DocSection title="What's Excluded" color={C.dim}>
          {doc.excluded.map((item,i)=><DocBullet key={i} text={item} color={C.dim}/>)}
        </DocSection>
        {/* Assumptions */}
        <DocSection title="Key Assumptions" color={C.amber}>
          {doc.assumptions.map((item,i)=><DocBullet key={i} text={item} color={C.amber}/>)}
        </DocSection>
        {/* What changes it */}
        <DocSection title="What Changes This Number" color={C.violet}>
          {doc.whatChanges.map((item,i)=><DocBullet key={i} text={item} color={C.violet}/>)}
        </DocSection>
        {/* Related */}
        <DocSection title="Related Modules" color={C.blue}>
          {doc.relatedModules.map(id=>{
            const rd = MODULE_DOCS[id];
            return rd ? <div key={id} style={{fontSize:11,color:C.blue,padding:"3px 0",cursor:"default"}}>→ {rd.title}</div> : null;
          })}
        </DocSection>
      </div>
      {/* Footer links */}
      <div style={{padding:"12px 18px",borderTop:`1px solid ${C.borderMid}`,display:"flex",flexDirection:"column",gap:6}}>
        <DocLink icon={BookOpen} label="Open full documentation" href={doc.docRef}/>
        <DocLink icon={ExternalLink} label="View assumptions & formulas" href={`${doc.docRef}#assumptions`}/>
      </div>
    </motion.div>
  );
}

function DocSection({title,color,children}){
  return(<div style={{marginBottom:14}}>
    <div style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{title}</div>
    {children}
  </div>);
}

function DocBullet({text,color}){
  return(<div style={{display:"flex",gap:8,padding:"3px 0",fontSize:11,color:C.muted,lineHeight:1.5}}>
    <div style={{width:4,height:4,borderRadius:"50%",background:color,marginTop:6,flexShrink:0}}/>
    <span>{text}</span>
  </div>);
}

function DocLink({icon:I,label,href}){
  return(<div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:0,background:C.bg,cursor:"pointer",fontSize:11,color:C.accent}}
    onClick={()=>{}}>
    <I size={12}/>{label}
  </div>);
}

const Header=({title,sub,icon:I,moduleId,onInfoClick})=>(
  <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} style={{marginBottom:24}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      {I&&<div style={{width:30,height:30,borderRadius:0,background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center"}}><I size={15} style={{color:C.accent}}/></div>}
      <div style={{flex:1}}><h2 style={{fontSize:21,fontWeight:700,color:C.text,margin:0}}>{title}</h2>
        {sub&&<p style={{fontSize:12,color:C.muted,margin:0,marginTop:2}}>{sub}</p>}</div>
      {moduleId && MODULE_DOCS[moduleId] && (
        <button onClick={()=>onInfoClick&&onInfoClick(moduleId)}
          title={MODULE_DOCS[moduleId].tooltip}
          style={{width:28,height:28,borderRadius:0,border:`1px solid ${C.borderMid}`,background:"transparent",
            color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;e.currentTarget.style.background=C.accentDim}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.borderMid;e.currentTarget.style.color=C.muted;e.currentTarget.style.background="transparent"}}>
          <Info size={14}/>
        </button>
      )}
    </div>
  </motion.div>
);

const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:C.bgAlt,border:`1px solid ${C.border}`,borderRadius:0,padding:"10px 14px",boxShadow:"none"}}>
    <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:6}}>{label}</div>
    {payload.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.muted,marginBottom:2}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:p.color}}/>{p.name}: <span style={{color:C.text,fontWeight:600,fontFamily:"'Chivo Mono',monospace"}}>{typeof p.value==="number"&&Math.abs(p.value)>100?fmt(p.value):fN(p.value)}</span>
    </div>))}
  </div>);
};

const Badge=({label,status="neutral"})=>{
  const m={good:{bg:C.greenDim,c:C.green},great:{bg:C.greenDim,c:C.green},warning:{bg:C.amberDim,c:C.amber},bad:{bg:C.redDim,c:C.red},neutral:{bg:C.accentDim,c:C.accent}};
  const s=m[status]||m.neutral;
  return <span style={{padding:"3px 9px",borderRadius:0,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",background:s.bg,color:s.c,border:`1px solid ${s.c}33`}}>{label}</span>;
};

const SegmentToggle=({options,value,onChange})=>(
  <div style={{display:"flex",gap:2,padding:3,background:C.bg,borderRadius:0,border:`1px solid ${C.borderMid}`}}>
    {options.map(o=>(
      <button key={o.value} onClick={()=>onChange(o.value)} style={{padding:"6px 14px",borderRadius:0,border:"none",background:value===o.value?C.accentDim:"transparent",color:value===o.value?C.accent:C.dim,cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'TWK Everett',sans-serif",textTransform:"uppercase",letterSpacing:"0.04em",transition:"all 0.15s"}}>{o.label}</button>
    ))}
  </div>
);

const NAV_SECTIONS=[
  { section: null, items: [
    {id:"dashboard",label:"Command Center",icon:Gauge},
  ]},
  { section: "Persona Views", items: [
    {id:"cfo",label:"CFO View",icon:DollarSign},
    {id:"ceo",label:"CEO View",icon:Activity},
    {id:"cro",label:"CRO View",icon:Users},
    {id:"cmo",label:"CMO View",icon:Megaphone},
    {id:"vc",label:"VC View",icon:BarChart3},
    {id:"pe",label:"PE View",icon:BarChart3},
    {id:"board",label:"Board View",icon:Shield},
    {id:"revops",label:"RevOps View",icon:Zap},
  ]},
  { section: "Revenue", items: [
    {id:"targets",label:"Target Tracker",icon:Target},
    {id:"glideslope",label:"Glideslope",icon:Target},
    {id:"qbr",label:"QBR Metrics",icon:BarChart3},
    {id:"weekly",label:"Weekly Tracker",icon:Calendar},
  ]},
  { section: "Pipeline", items: [
    {id:"funnelHealth",label:"Funnel Health",icon:Heart},
    {id:"marketingPlan",label:"Marketing Plan",icon:Target},
    {id:"pipeline",label:"Pipeline",icon:GitBranch},
    {id:"marketing",label:"Marketing Funnel",icon:Megaphone},
    {id:"velocity",label:"Velocity",icon:Clock},
  ]},
  { section: "GTM Economics", items: [
    {id:"sandmBudget",label:"S&M Budget",icon:DollarSign},
    {id:"mktgBudget",label:"Mktg Budget",icon:DollarSign},
    {id:"channels",label:"Revenue Motions",icon:Layers},
    {id:"cacBreakdown",label:"CAC Breakdown",icon:PieIcon},
    {id:"sales",label:"Sales Model",icon:Users},
    {id:"sellerRamp",label:"Seller Ramp",icon:TrendingUp},
    {id:"aeHiringPlan",label:"AE Hiring Plan",icon:Users},
  ]},
  { section: "Finance", items: [
    {id:"pnl",label:"P&L",icon:DollarSign},
  ]},
  { section: "System", items: [
    {id:"phase0",label:"Phase 0 — CRM Readiness",icon:BookOpen},
    {id:"fieldAudit",label:"Field Audit",icon:BookOpen},
    {id:"spine",label:"Governance Spine",icon:Shield},
    {id:"data",label:"Data Sources",icon:Zap},
    {id:"architecture",label:"Architecture",icon:Activity},
  ]},
];

const LOGO_URL = "/netherops-logo.svg";

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function DashboardPage({model,inputs,onInfoClick,mobile,tablet}){
  const{summary:s,monthly,glideslope,funnelHealth}=model;
  const isSplit = inputs.revenueMode === "split";
  return(<div>
    <Header title="Command Center" sub="Every metric derived from your model inputs" icon={Gauge} moduleId="dashboard" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fit,minmax(200px,1fr))",gap:mobile?8:12,marginBottom:mobile?16:24}}>
      <Metric label="Target ARR" value={fmt(s.targetARR)} sub={inputs.targetMode==="growthRate"?`${inputs.targetGrowthRate}% growth`:""} icon={Target} color={C.accent} delay={0}/>
      <Metric label="Starting ARR" value={fmt(s.startingARR)} sub={`NRR retained: ${fmt(s.retainedARR)}`} icon={DollarSign} color={C.green} delay={1}/>
      <Metric label="New ARR Gap" value={fmt(s.newARRNeeded)} sub={isSplit?`${fN(s.dealsNeeded)} logo + ${fN(s.expansionDeals)} exp`:`${fN(s.dealsNeeded)} deals`} icon={TrendingUp} color={C.amber} delay={2}/>
      <Metric label="Projected Revenue" value={fmt(s.totalRevenue)} sub={`Op margin: ${(s.opMargin*100).toFixed(1)}%`} icon={DollarSign} color={C.violet} delay={3}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(auto-fit,minmax(165px,1fr))",gap:mobile?8:12,marginBottom:mobile?16:24}}>
      <Metric label="LTV:CAC" value={`${s.ltvCac.toFixed(1)}x`} color={s.ltvCac>3?C.green:C.amber} delay={4}/>
      <Metric label="CAC Payback" value={`${s.cacPayback.toFixed(1)} mo`} color={s.cacPayback<18?C.green:C.red} delay={5}/>
      <Metric label="Magic Number" value={s.magicNumber.toFixed(2)} color={s.magicNumber>0.75?C.green:C.amber} delay={6}/>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} icon={Gauge} color={s.rule40>=40?C.green:C.red} delay={7}/>
      <Metric label="Funnel Grade" value={s.funnelGrade} sub={`${s.overallFunnelScore}/${s.maxFunnelScore}`} icon={Heart} color={s.funnelGrade==="A"?C.green:s.funnelGrade==="B"?C.accent:C.amber} delay={8}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`${Math.round(1/s.effectiveFunnelYield)} inq/deal`} color={C.blue} delay={9}/>
    </div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Funnel Health</h3>
        <Badge label={`Grade ${s.funnelGrade}`} status={s.funnelGrade==="A"||s.funnelGrade==="B"?"good":s.funnelGrade==="C"?"warning":"bad"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:mobile?8:10}}>
        {funnelHealth.map((f)=>(
          <div key={f.stage} style={{padding:mobile?"10px 8px":"12px 10px",background:C.bg,borderRadius:0,border:`1px solid ${f.status==="great"?C.green:f.status==="good"?C.accent:C.red}22`,textAlign:"center"}}>
            <div style={{fontSize:mobile?8:9,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:6}}>{f.stage}</div>
            <div style={{fontSize:mobile?18:22,fontWeight:700,color:f.status==="great"?C.green:f.status==="good"?C.accent:C.red}}>{f.rate}%</div>
            <Badge label={f.status} status={f.status}/>
          </div>
        ))}
      </div>
    </Card>
    {/* Engine Output — compressed on dashboard */}
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:mobile?8:10,marginBottom:18}}>
      <div style={{padding:10,background:C.bgAlt,borderRadius:0,borderBottom:`2px solid ${C.accent}`}}>
        <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Inq → SQO</div>
        <div style={{fontSize:mobile?14:16,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{s.inquiryToSqoRate.toFixed(2)}%</div>
      </div>
      <div style={{padding:10,background:C.bgAlt,borderRadius:0,borderBottom:`2px solid ${C.green}`}}>
        <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Inq → Won</div>
        <div style={{fontSize:mobile?14:16,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace"}}>{s.inquiryToWonRate.toFixed(2)}%</div>
      </div>
      <div style={{padding:10,background:C.bgAlt,borderRadius:0,borderBottom:`2px solid ${C.amber}`}}>
        <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Cost / SQO</div>
        <div style={{fontSize:mobile?14:16,fontWeight:700,color:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.costPerSqo)}</div>
      </div>
      <div style={{padding:10,background:C.bgAlt,borderRadius:0,borderBottom:`2px solid ${C.violet}`}}>
        <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Cost / Won</div>
        <div style={{fontSize:mobile?14:16,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.costPerWon)}</div>
      </div>
      <div style={{padding:10,background:C.bgAlt,borderRadius:0,borderBottom:`2px solid ${C.text}`,gridColumn:mobile?"span 2":"auto"}}>
        <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",fontWeight:700}}>Required Inquiries</div>
        <div style={{fontSize:mobile?14:16,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fN(s.requiredInquiries)}</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:16}}>
      <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>ARR Trajectory</h3>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={monthly}>
          <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.25}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill="url(#ag)" strokeWidth={2.5} name="Total ARR"/>
        </AreaChart></ResponsiveContainer></Card>
      <Card><div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Glideslope</h3><Badge label={glideslope[11]?.gapToTarget>=0?"On track":"Behind"} status={glideslope[11]?.gapToTarget>=0?"good":"bad"}/></div>
        <ResponsiveContainer width="100%" height={260}><ComposedChart data={glideslope}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill={C.accentDim} strokeWidth={2} name="Projected"/><Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2} strokeDasharray="8 4" dot={false} name="Target"/>
        </ComposedChart></ResponsiveContainer></Card>
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// CFO PERSONA VIEW — unit economics + cash sustainability
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Is unit economics sustainable?      → tile row (LTV:CAC, CAC Payback, Magic, Rule of 40)
//   Q2: Burn rate vs revenue projection?    → operating margin + computed annual burn
//   Q3: S&M as % of revenue — band or burn? → visualized band with current position
//   Q4: 20% miss → Y2 cash impact           → gap card (NOT MODELED — flagged honestly)
//   Q5: Gross margin trajectory             → gap card (NOT MODELED — flagged honestly)
// ════════════════════════════════════════════════════════════
function CFOPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, pnl } = model;
  // Burn = absolute value of negative operating income (only if opMargin < 0)
  const isLosing = s.operatingIncome < 0;
  const annualBurn = isLosing ? Math.abs(s.operatingIncome) : 0;
  const monthlyBurn = annualBurn / 12;
  const cumulativeBurnOverPlan = annualBurn * (inputs.planningYears || 2); // simple multi-year
  // S&M band zones
  const bandMax = 80; // visualization x-axis max
  const bandPct = Math.min(100, (s.totalSAndMPct / bandMax) * 100);
  const sAndMZone = s.totalSAndMPct < 30 ? "underinvest" : s.totalSAndMPct > 60 ? "burn" : s.totalSAndMPct > 55 ? "stretch" : "growth";
  const sAndMZoneColor = sAndMZone === "underinvest" ? C.amber : sAndMZone === "burn" ? C.red : sAndMZone === "stretch" ? C.amber : C.green;
  const sAndMZoneLabel = sAndMZone === "underinvest" ? "Underinvestment" : sAndMZone === "burn" ? "Burn territory" : sAndMZone === "stretch" ? "Stretch zone" : "Growth band";
  return(<div>
    <Header title="CFO View" sub="Unit economics, cash sustainability, and the S&M investment band" icon={DollarSign} moduleId="cfo" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>
    
    {/* Q1 — Unit Economics */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Is unit economics sustainable?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:24}}>
      <Metric label="LTV : CAC" value={`${s.ltvCac.toFixed(1)}x`} sub={s.ltvCac>=3?"Healthy (≥3x)":s.ltvCac>=2?"Watch (2-3x)":"Below threshold"} color={s.ltvCac>=3?C.green:s.ltvCac>=2?C.amber:C.red} delay={0}/>
      <Metric label="CAC Payback" value={`${s.cacPayback.toFixed(1)} mo`} sub={`Target ${inputs.cacPaybackTarget||24}mo`} color={s.cacPayback<=(inputs.cacPaybackTarget||24)?C.green:s.cacPayback<=(inputs.cacPaybackTarget||24)*1.5?C.amber:C.red} delay={1}/>
      <Metric label="Magic Number" value={s.magicNumber.toFixed(2)} sub={s.magicNumber>=0.75?"Efficient growth":s.magicNumber>=0.5?"Marginal":"Inefficient"} color={s.magicNumber>=0.75?C.green:s.magicNumber>=0.5?C.amber:C.red} delay={2}/>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} sub={`${(s.growthRate||0).toFixed(0)}% growth + ${(s.opMargin*100).toFixed(0)}% margin`} color={s.rule40>=40?C.green:C.amber} delay={3}/>
    </div>
    
    {/* Q2 — Burn vs Revenue */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Burn rate at plan vs revenue projection</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:18,marginBottom:isLosing?16:0}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Operating Margin</div>
          <div style={{fontSize:30,fontWeight:700,color:s.opMargin>=0?C.green:C.red,lineHeight:1.05,fontFamily:"'Chivo Mono',monospace"}}>{(s.opMargin*100).toFixed(1)}%</div>
          <div style={{fontSize:11,color:C.dim,marginTop:6}}>{s.opMargin>=0?`Operating income ${fmt(s.operatingIncome)}`:`Operating loss ${fmt(Math.abs(s.operatingIncome))}`}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Annual Burn</div>
          <div style={{fontSize:30,fontWeight:700,color:annualBurn>0?C.red:C.green,lineHeight:1.05,fontFamily:"'Chivo Mono',monospace"}}>{annualBurn>0?fmt(annualBurn):"—"}</div>
          <div style={{fontSize:11,color:C.dim,marginTop:6}}>{annualBurn>0?`~${fmt(monthlyBurn)}/month`:"Profitable at plan"}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Cumulative {inputs.planningYears||2}-Yr</div>
          <div style={{fontSize:30,fontWeight:700,color:cumulativeBurnOverPlan>0?C.red:C.green,lineHeight:1.05,fontFamily:"'Chivo Mono',monospace"}}>{cumulativeBurnOverPlan>0?fmt(cumulativeBurnOverPlan):"—"}</div>
          <div style={{fontSize:11,color:C.dim,marginTop:6}}>{cumulativeBurnOverPlan>0?"Cash required at flat burn":"No cumulative burn at plan"}</div>
        </div>
      </div>
      {isLosing && (
        <div style={{padding:10,background:C.redDim,borderLeft:`2px solid ${C.red}`,marginTop:4}}>
          <div style={{fontSize:11,color:C.text,lineHeight:1.55}}>
            <strong style={{color:C.red}}>At plan, this business burns {fmt(monthlyBurn)} per month.</strong> Cumulative {inputs.planningYears||2}-year cash required is {fmt(cumulativeBurnOverPlan)} assuming flat burn rate (does not model Y2 cost scaling). Funding sufficiency depends on current cash position and bridge to profitability.
          </div>
        </div>
      )}
    </Card>
    
    {/* Q3 — S&M Investment Band */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · S&M investment band</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
        <div>
          <span style={{fontSize:36,fontWeight:700,color:sAndMZoneColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{s.totalSAndMPct.toFixed(1)}%</span>
          <span style={{fontSize:13,color:C.muted,marginLeft:8}}>S&M ÷ revenue</span>
        </div>
        <Badge label={sAndMZoneLabel} status={sAndMZone==="growth"?"good":sAndMZone==="burn"?"bad":"warning"}/>
      </div>
      {/* Band visualization */}
      <div style={{position:"relative",height:28,background:C.bg,borderRadius:0,overflow:"hidden",marginBottom:8}}>
        {/* Underinvest zone 0-30% */}
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(30/bandMax)*100}%`,background:`${C.amber}15`,borderRight:`1px dashed ${C.amber}66`}}/>
        {/* Growth band 30-55% */}
        <div style={{position:"absolute",left:`${(30/bandMax)*100}%`,top:0,bottom:0,width:`${(25/bandMax)*100}%`,background:`${C.green}20`,borderRight:`1px dashed ${C.amber}66`}}/>
        {/* Stretch 55-60% */}
        <div style={{position:"absolute",left:`${(55/bandMax)*100}%`,top:0,bottom:0,width:`${(5/bandMax)*100}%`,background:`${C.amber}20`,borderRight:`1px dashed ${C.red}66`}}/>
        {/* Burn 60-80% */}
        <div style={{position:"absolute",left:`${(60/bandMax)*100}%`,top:0,bottom:0,width:`${(20/bandMax)*100}%`,background:`${C.red}15`}}/>
        {/* Current position marker */}
        <motion.div initial={{left:0}} animate={{left:`${bandPct}%`}} transition={{duration:0.5}}
          style={{position:"absolute",top:0,bottom:0,width:3,background:C.text,boxShadow:`0 0 6px ${C.text}66`,zIndex:5}}/>
      </div>
      {/* Zone labels */}
      <div style={{position:"relative",height:18,marginBottom:14,fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>
        <span style={{position:"absolute",left:`${(15/bandMax)*100}%`,transform:"translateX(-50%)",color:C.amber}}>UNDERINVEST</span>
        <span style={{position:"absolute",left:`${(42.5/bandMax)*100}%`,transform:"translateX(-50%)",color:C.green}}>GROWTH 30-55%</span>
        <span style={{position:"absolute",left:`${(57.5/bandMax)*100}%`,transform:"translateX(-50%)",color:C.amber}}>STRETCH</span>
        <span style={{position:"absolute",left:`${(70/bandMax)*100}%`,transform:"translateX(-50%)",color:C.red}}>BURN ≥60%</span>
      </div>
      <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
        {sAndMZone==="growth"&&`At ${s.totalSAndMPct.toFixed(1)}% S&M, you're in the growth-stage band (35-55% is typical for SaaS targeting >50% YoY growth). Investing enough to fund the plan; not over-spending.`}
        {sAndMZone==="underinvest"&&`At ${s.totalSAndMPct.toFixed(1)}% S&M, spend is below the 30% growth-band floor. Either the growth target is unrealistic given current investment, or budget needs to expand to fund the motion.`}
        {sAndMZone==="stretch"&&`At ${s.totalSAndMPct.toFixed(1)}% S&M, you're in the stretch zone (55-60%). Sustainable only if growth rate justifies it — verify Rule of 40.`}
        {sAndMZone==="burn"&&`At ${s.totalSAndMPct.toFixed(1)}% S&M, spend is in burn territory (≥60%). The business cannot sustain this without continuous funding. Either reduce S&M or accelerate revenue.`}
      </div>
    </Card>
    
    {/* Q4 + Q5 — honest gaps (not yet modeled) */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Q5 — Not yet modeled <span style={{color:C.amber,marginLeft:6}}>↘ on build queue</span></div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:14}}>
      <Card style={{borderLeft:`2px solid ${C.amber}`,opacity:0.92}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em"}}>Q4 · Coming soon</span>
        </div>
        <h3 style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.3}}>Sensitivity analysis: plan variance → cash impact</h3>
        <p style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:0}}>If Y1 misses by 10/20/30%, what happens to Y2 cash burn and runway? The current Glideslope assumes plan attainment. A sensitivity slider is on the build queue.</p>
      </Card>
      <Card style={{borderLeft:`2px solid ${C.amber}`,opacity:0.92}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em"}}>Q5 · Coming soon</span>
        </div>
        <h3 style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.3}}>Gross margin trajectory across the plan</h3>
        <p style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:0}}>Currently a static input at {inputs.grossMargin}%. Modeled trajectory across the {inputs.planningYears||2}-year horizon (COGS scaling, infra leverage) is on the build queue.</p>
      </Card>
    </div>
    
    {/* Footer attribution */}
    <div style={{marginTop:32,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · The {model.summary.fundingStage||"seriesB"} model assumes mid-market cyber benchmarks. Numbers are derived from Global Drivers — change them in the right-side panel. Every metric here is in the full module tree (Dashboard, P&L, S&M Budget) if you want to drill in.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// CEO PERSONA VIEW — on the number, biggest threat, investment posture
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Will we hit the number?                       → Capacity vs target + confidence
//   Q2: Single biggest thing breaking the plan?       → Derived from model thresholds
//   Q3: How much will we burn, is it affordable?      → Same as CFO Q2
//   Q4: Where am I over/under-investing by function?  → 4 function-by-band tiles
//   Q5: If I had +$1M, where would it go?             → gap card (NOT MODELED)
// ════════════════════════════════════════════════════════════
function CEOPage({model, inputs, onInfoClick, mobile}){
  const { summary: s } = model;
  // Q1 — capacity coverage
  const capacityRatio = s.steadyStateQuota > 0 ? s.steadyStateQuota / s.newARRNeeded : 0;
  const attainment = s.attainmentRequired || 100;
  const confidence = attainment <= 85 ? "on-track" : attainment <= 100 ? "stretch" : attainment <= 120 ? "behind" : "unrealistic";
  const confColor = confidence === "on-track" ? C.green : confidence === "stretch" ? C.amber : confidence === "behind" ? C.amber : C.red;
  const confLabel = confidence === "on-track" ? "On track" : confidence === "stretch" ? "Stretch" : confidence === "behind" ? "Behind" : "Unrealistic";
  // Q2 — derive the single biggest threat using model thresholds (no spine.js needed here)
  let threat;
  if (s.totalSAndMPct > 60) threat = { tier: "critical", label: "S&M burn", detail: `S&M at ${s.totalSAndMPct.toFixed(1)}% of revenue — over the 60% burn threshold.`, recommendation: "Reduce variable marketing or sales OPEX, or accelerate revenue to dilute the ratio.", linkModule: "pnl", linkLabel: "Open P&L" };
  else if (attainment > 120) threat = { tier: "critical", label: "Capacity gap", detail: `Plan demands ${attainment.toFixed(0)}% AE attainment — historically only ~50% of AEs hit quota.`, recommendation: `Add ~${Math.ceil((attainment - 85) / 100 * inputs.aeCount)} AEs or raise deal size by ~${((attainment / 85 - 1) * 100).toFixed(0)}%.`, linkModule: "sales", linkLabel: "Open Sales Model" };
  else if (s.funnelGrade === "D") threat = { tier: "critical", label: "Funnel broken", detail: `Funnel grade D — multiple stages below benchmarks.`, recommendation: "Fix the worst single stage first. Compounding effect through the rest of the funnel.", linkModule: "funnelHealth", linkLabel: "Open Funnel Health" };
  else if (s.funnelGrade === "C") threat = { tier: "warning", label: "Funnel underperforming", detail: `Funnel grade C — leaving revenue on the table at multiple stages.`, recommendation: "Identify the stage with highest volume × lowest conversion — that's the highest-leverage fix.", linkModule: "funnelHealth", linkLabel: "Open Funnel Health" };
  else if (s.coverageHealth === "bad") threat = { tier: "critical", label: "Pipeline coverage", detail: `Coverage health: bad — insufficient pipeline to forecast confidently.`, recommendation: "Front-load CREATE motion spend or extend the planning window.", linkModule: "pipeline", linkLabel: "Open Pipeline" };
  else if (s.cacPayback > 36) threat = { tier: "warning", label: "CAC payback", detail: `Payback at ${s.cacPayback.toFixed(0)} months — unit economics eroding.`, recommendation: "Increase deal size, improve SQO→Won, or reduce channel CAC.", linkModule: "cacBreakdown", linkLabel: "Open CAC Breakdown" };
  else if (s.totalSAndMPct < 30 && s.growthRate > 30) threat = { tier: "warning", label: "Underinvesting for the growth rate", detail: `Targeting ${s.growthRate.toFixed(0)}% growth with only ${s.totalSAndMPct.toFixed(1)}% S&M — below 30% growth-band floor.`, recommendation: "Either raise the budget or moderate the target.", linkModule: "sandmBudget", linkLabel: "Open S&M Budget" };
  else threat = { tier: "ok", label: "No critical threats detected", detail: "Plan looks executable at current inputs. Standard quarterly reviews apply.", recommendation: null, linkModule: "spine", linkLabel: "Open Governance Spine" };
  const threatBorder = threat.tier === "critical" ? C.red : threat.tier === "warning" ? C.amber : C.green;
  const threatBg = threat.tier === "critical" ? C.redDim : threat.tier === "warning" ? C.amberDim : C.greenDim;
  // Q3 — burn
  const isLosing = s.operatingIncome < 0;
  const annualBurn = isLosing ? Math.abs(s.operatingIncome) : 0;
  const monthlyBurn = annualBurn / 12;
  // Q4 — investment by function (4 cost categories vs benchmark)
  const bench = inputs.costBenchmarks || {};
  const fnCheck = (val, b) => {
    if (!b) return { status: "ok", label: "—" };
    if (val < b.low) return { status: "under", label: "Under-investing", color: C.amber };
    if (val > b.high) return { status: "over", label: "Over-spending", color: C.red };
    return { status: "in", label: "In band", color: C.green };
  };
  const functions = [
    { key: "G&A", value: inputs.gAndAPct, b: bench.gAndAPct, sub: "Finance, Legal, HR, Exec, IT" },
    { key: "R&D", value: inputs.rAndDPct, b: bench.rAndDPct, sub: "Product, eng, security R&D" },
    { key: "Sales OPEX", value: inputs.salesOpexPct, b: bench.salesOpexPct, sub: "AE/SDR comp, tools, enablement" },
    { key: "Variable Mktg", value: inputs.variableMktgPct, b: bench.variableMktgPct, sub: "Demand gen, programmatic" },
  ].map(f => ({ ...f, check: fnCheck(f.value, f.b) }));
  return(<div>
    <Header title="CEO View" sub="Are we hitting the number, what's threatening it, and is the investment posture right" icon={Activity} moduleId="ceo" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>
    
    {/* Q1 — On the number */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Will we hit the number?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:18}}>
      <Metric label="Target ARR" value={fmt(s.targetARR)} sub={`Growth ${(s.growthRate||0).toFixed(0)}% from ${fmt(s.startingARR)}`} color={C.accent} delay={0}/>
      <Metric label="New ARR Needed" value={fmt(s.newARRNeeded)} sub={`${s.dealsNeeded} new logo deals`} color={C.violet} delay={1}/>
      <Metric label="Steady-State Capacity" value={fmt(s.steadyStateQuota)} sub={`${inputs.aeCount} AEs × ${fmt(inputs.aeQuota)} quota`} color={C.blue} delay={2}/>
      <Metric label="Plan Confidence" value={confLabel} sub={`${attainment.toFixed(0)}% AE attainment required`} color={confColor} delay={3}/>
    </div>
    
    {/* Q2 — Biggest threat */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Single biggest threat to the plan</div>
    <Card style={{marginBottom:24,borderLeft:`3px solid ${threatBorder}`,background:threatBg}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:240}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:9,fontWeight:700,color:threatBorder,textTransform:"uppercase",letterSpacing:"0.08em"}}>{threat.tier === "critical" ? "Critical" : threat.tier === "warning" ? "Watch" : "Healthy"}</span>
          </div>
          <h3 style={{fontSize:20,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.2}}>{threat.label}</h3>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:threat.recommendation?12:0}}>{threat.detail}</p>
          {threat.recommendation && <p style={{fontSize:12,color:C.text,lineHeight:1.6,padding:10,background:C.bg,borderRadius:0,borderLeft:`2px solid ${threatBorder}`}}><strong style={{color:threatBorder}}>Move:</strong> {threat.recommendation}</p>}
        </div>
        {threat.linkModule && (
          <div style={{fontSize:10,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.06em"}}>
            ↘ {threat.linkLabel}
          </div>
        )}
      </div>
    </Card>
    
    {/* Q3 — Burn affordable */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · How much will we burn — is it affordable?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:mobile?8:12,marginBottom:24}}>
      <Metric label="Operating Margin" value={`${(s.opMargin*100).toFixed(1)}%`} sub={s.opMargin>=0?fmt(s.operatingIncome)+" income":fmt(Math.abs(s.operatingIncome))+" loss"} color={s.opMargin>=0?C.green:C.red} delay={4}/>
      <Metric label="Annual Burn" value={annualBurn>0?fmt(annualBurn):"—"} sub={annualBurn>0?`~${fmt(monthlyBurn)}/mo`:"Profitable at plan"} color={annualBurn>0?C.red:C.green} delay={5}/>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} sub={s.rule40>=40?"Healthy":"Below threshold"} color={s.rule40>=40?C.green:C.red} delay={6}/>
    </div>
    
    {/* Q4 — Investment by function */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Where am I over-spending and under-investing?</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:14}}>
        {functions.map((fn,i)=>{
          const b = fn.b;
          if (!b) return null;
          const max = b.high * 1.5;
          const valPct = Math.min(100, (fn.value / max) * 100);
          const lowPct = (b.low / max) * 100;
          const highPct = (b.high / max) * 100;
          return(
            <div key={fn.key} style={{padding:14,background:C.bg,border:`1px solid ${C.borderMid}`,borderTop:`2px solid ${fn.check.color || C.dim}`}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{fn.key}</div>
              <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{fn.value}%</div>
              <div style={{fontSize:9,color:C.dim,marginTop:3,marginBottom:8}}>{fn.sub}</div>
              {/* Band visualization */}
              <div style={{position:"relative",height:6,background:C.surface,borderRadius:0,overflow:"hidden",marginBottom:6}}>
                <div style={{position:"absolute",left:`${lowPct}%`,top:0,bottom:0,width:`${highPct-lowPct}%`,background:`${C.green}25`}}/>
                <motion.div initial={{left:0}} animate={{left:`${valPct}%`}} transition={{duration:0.4,delay:i*0.05}}
                  style={{position:"absolute",top:0,bottom:0,width:2,background:fn.check.color || C.text}}/>
              </div>
              <div style={{fontSize:9,color:fn.check.color||C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{fn.check.label} · band {b.low}-{b.high}%</div>
            </div>
          );
        })}
      </div>
    </Card>
    
    {/* Q5 — gap (marginal $ allocator) */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 — Not yet modeled <span style={{color:C.amber,marginLeft:6}}>↘ on build queue</span></div>
    <Card style={{marginBottom:18,borderLeft:`2px solid ${C.amber}`,opacity:0.92}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em"}}>Q5 · Coming soon</span>
      </div>
      <h3 style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.3}}>Marginal $1M allocator: where would the next dollar earn the most?</h3>
      <p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>The CEO's hardest question. Sensitivity to incremental spend across CREATE / CONVERT / ACCELERATE motions, AE headcount, or deal size — ranked by marginal-$-to-marginal-ARR. The plumbing exists (Revenue Motions has the unit economics); the visualization is on the build queue.</p>
    </Card>
    
    {/* Footer attribution */}
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Threat detection derives from model thresholds, not the full Governance Spine — open the Spine module for the prioritized verdict list. Every metric here is in the full module tree if you need to drill in.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// CRO / VP SALES PERSONA VIEW — capacity, coverage, hire timing
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Ramped quota capacity vs target?         → Capacity comparison + ramp curve
//   Q2: Pipeline coverage by quarter?            → Quarterly target/coverage table
//   Q3: How many AEs am I short, and when?       → Computed gap + hire-by timing
//   Q4: SDR:AE ratio constraining outbound?      → Ratio + implied outbound capacity
//   Q5: Attainment realism — implied % per AE?   → Required attainment vs industry benchmark
// ════════════════════════════════════════════════════════════
function CROPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, monthly, quarterlyTargets, phaseShiftedFunnel } = model;
  // Q1 — Capacity layers
  const fullCapacity = inputs.aeCount * inputs.aeQuota;
  const rampedCapacity = s.steadyStateQuota || 0;
  const rampLoss = fullCapacity - rampedCapacity;
  const capCoverage = s.newARRNeeded > 0 ? (rampedCapacity / s.newARRNeeded) * 100 : 100;
  // Q3 — AEs short
  const targetAttainment = 85; // industry-realistic average AE attainment
  const aesNeededAt85 = Math.ceil((s.newARRNeeded / (targetAttainment/100)) / inputs.aeQuota);
  const aeGap = Math.max(0, aesNeededAt85 - inputs.aeCount);
  const aeSurplus = Math.max(0, inputs.aeCount - aesNeededAt85);
  const rampMonths = inputs.aeRampMonths || 6;
  // Q4 — SDR ratio
  const sdrRatio = inputs.sdrsPerAe || 1.5;
  const sdrRatioColor = sdrRatio >= 1.5 ? C.green : sdrRatio >= 1.0 ? C.amber : C.red;
  const sdrRatioLabel = sdrRatio >= 1.5 ? "Healthy" : sdrRatio >= 1.0 ? "Minimum" : "Below floor";
  const aeSelfPct = 100 - (inputs.mktgSourcedPct || 50);
  // Q5 — Attainment realism
  const att = s.attainmentRequired || 100;
  const attColor = att <= 85 ? C.green : att <= 100 ? C.amber : att <= 120 ? C.red : C.red;
  const attBand = att <= 85 ? "Realistic" : att <= 100 ? "Stretch" : att <= 120 ? "Aggressive" : "Unrealistic";
  // Q2 — quarterly coverage rows. Read from phaseShiftedFunnel (which has the
  // correct field names — closingDeals, sqosNeeded, mqlsNeeded). The
  // quarterlyTargets object uses different naming (sqoTarget, dealsTarget,
  // no mql field) and was returning zeros from missing-field fallback.
  const qRows = (phaseShiftedFunnel || []).slice(0, 8);
  return(<div>
    <Header title="CRO View" sub="Ramped capacity, quarterly pipeline coverage, hire timing, and the SDR engine" icon={Users} moduleId="cro" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>
    
    {/* Q1 — Capacity vs target */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Do I have enough ramped quota capacity?</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:14,marginBottom:18}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>New ARR Needed</div>
          <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(s.newARRNeeded)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{s.dealsNeeded} deals @ {fmt(inputs.avgDealSize)}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Full Capacity</div>
          <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(fullCapacity)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{inputs.aeCount} AEs × {fmt(inputs.aeQuota)}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Ramped Capacity</div>
          <div style={{fontSize:22,fontWeight:700,color:rampLoss>0?C.amber:C.green,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(rampedCapacity)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>Ramp loss: {fmt(rampLoss)} · attrition loss: {fmt(s.totalAttrLoss||0)}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Coverage</div>
          <div style={{fontSize:22,fontWeight:700,color:capCoverage>=115?C.green:capCoverage>=85?C.amber:C.red,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{capCoverage.toFixed(0)}%</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{capCoverage>=115?"Margin for error":capCoverage>=85?"Tight":"Gap"}</div>
        </div>
      </div>
      {/* Capacity bar — visual comparison */}
      <div style={{marginTop:8}}>
        {[
          { label: "Target (New ARR Needed)", value: s.newARRNeeded, color: C.text },
          { label: "Full Capacity (no ramp loss)", value: fullCapacity, color: C.dim },
          { label: "Ramped Capacity (effective)", value: rampedCapacity, color: rampLoss>0?C.amber:C.green },
        ].map((row,i)=>{
          const maxV = Math.max(s.newARRNeeded, fullCapacity);
          const pct = (row.value / maxV) * 100;
          return(
            <div key={i} style={{display:"grid",gridTemplateColumns:"180px 1fr 90px",gap:10,alignItems:"center",marginBottom:6}}>
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{row.label}</div>
              <div style={{height:14,background:C.bg,borderRadius:0,position:"relative",overflow:"hidden"}}>
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.5,delay:i*0.06}}
                  style={{height:"100%",background:row.color,opacity:0.85}}/>
              </div>
              <div style={{fontSize:11,fontWeight:600,color:row.color,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(row.value)}</div>
            </div>
          );
        })}
      </div>
    </Card>
    
    {/* Q2 — Quarterly pipeline coverage */}
    {qRows.length > 0 && (
      <>
        <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Pipeline coverage by quarter</div>
        <Card style={{marginBottom:24}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(qRows.length, mobile?2:8)},1fr)`,gap:10}}>
            {qRows.slice(0, mobile?4:8).map((q,i)=>(
              <div key={i} style={{padding:12,background:C.bg,borderRadius:0,borderTop:`2px solid ${q.isCurrentYear?C.accent:C.dim}`}}>
                <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{q.quarter}</div>
                <div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{q.sqosNeeded||0}</div>
                <div style={{fontSize:9,color:C.dim,marginTop:3}}>SQOs · {q.closingDeals||0} closing</div>
                <div style={{fontSize:9,color:C.dim,marginTop:2}}>{q.mqlsNeeded||0} MQLs</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
            Phase-shifted: each quarter's closing deals come from SQOs created <b style={{color:C.text}}>{inputs.sqoLeadQuarters||2} quarter(s) earlier</b>, and those SQOs need MQLs <b style={{color:C.text}}>{inputs.mqlLeadQuarters||1} quarter(s)</b> before that. Front-loading matters.
          </div>
        </Card>
      </>
    )}
    
    {/* Q3 — AEs short, hire timing */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · How many AEs am I short, and when?</div>
    <Card style={{marginBottom:24,borderLeft:`3px solid ${aeGap>0?C.red:C.green}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{fontSize:48,fontWeight:700,color:aeGap>0?C.red:C.green,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{aeGap>0?`+${aeGap}`:aeSurplus>0?`+${aeSurplus}`:"0"}</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{aeGap>0?`AEs short of plan`:aeSurplus>0?`AE surplus at plan`:`AE count matches plan`}</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            Plan needs {aesNeededAt85} AEs at {targetAttainment}% average attainment (industry-realistic). Current bench: {inputs.aeCount}.
          </div>
        </div>
      </div>
      {aeGap > 0 && (
        <div style={{padding:12,background:C.redDim,borderLeft:`2px solid ${C.red}`,fontSize:12,color:C.text,lineHeight:1.6}}>
          <strong style={{color:C.red}}>Hire timing matters.</strong> Each new AE needs ~{rampMonths} months to ramp. To have {aeGap} new AEs productive by mid-plan, hire by month {Math.max(1, rampMonths-3)} — earlier is better. If you can't hire, raise deal size, accept lower coverage, or moderate the target.
        </div>
      )}
      {aeSurplus > 0 && (
        <div style={{padding:12,background:C.greenDim,borderLeft:`2px solid ${C.green}`,fontSize:12,color:C.text,lineHeight:1.6}}>
          Headcount sufficient with margin. Watch attrition (current {inputs.aeAttritionRate}%) — at this rate you'll lose ~{((inputs.aeAttritionRate/100)*inputs.aeCount).toFixed(1)} AEs across the year.
        </div>
      )}
    </Card>
    
    {/* Q4 — SDR ratio + outbound */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · SDR engine + outbound capacity</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>SDR : AE Ratio</div>
          <div style={{fontSize:30,fontWeight:700,color:sdrRatioColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{sdrRatio}:1</div>
          <div style={{fontSize:11,color:sdrRatioColor,marginTop:4,fontWeight:600}}>{sdrRatioLabel}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:6,lineHeight:1.5}}>{Math.ceil(inputs.aeCount*sdrRatio)} SDRs supporting {inputs.aeCount} AEs</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Mktg-Sourced Split</div>
          <div style={{fontSize:30,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{inputs.mktgSourcedPct}%</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4,fontWeight:500}}>Marketing → AE Self-source</div>
          <div style={{fontSize:10,color:C.dim,marginTop:6,lineHeight:1.5}}>{aeSelfPct}% of pipeline depends on AE/SDR outbound</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Outbound Constraint</div>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginTop:8,lineHeight:1.5}}>
            {sdrRatio < 1.0 ? <span style={{color:C.red}}>SDR ratio below 1.0 starves outbound</span> :
             aeSelfPct > 65 ? <span style={{color:C.amber}}>Heavy outbound dependency — needs strong SDR engine</span> :
             aeSelfPct < 35 ? <span style={{color:C.green}}>Marketing-led — outbound is a supplement</span> :
             <span style={{color:C.green}}>Balanced motion</span>}
          </div>
        </div>
      </div>
    </Card>
    
    {/* Q5 — Attainment realism */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 · Attainment realism per AE</div>
    <Card style={{marginBottom:18,borderLeft:`3px solid ${attColor}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:18,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontSize:48,fontWeight:700,color:attColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{att.toFixed(0)}%</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>Required attainment per AE — <span style={{color:attColor}}>{attBand}</span></div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            For the team to hit plan, the average AE needs to attain {att.toFixed(0)}% of their {fmt(inputs.aeQuota)} quota. Industry distribution: ~50% of AEs hit ≥100%; ~70% hit ≥85%.
          </div>
        </div>
      </div>
      {/* Attainment band visualization */}
      <div style={{position:"relative",height:22,background:C.bg,borderRadius:0,overflow:"hidden",marginBottom:8}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${(85/150)*100}%`,background:`${C.green}25`}}/>
        <div style={{position:"absolute",left:`${(85/150)*100}%`,top:0,bottom:0,width:`${(15/150)*100}%`,background:`${C.amber}25`}}/>
        <div style={{position:"absolute",left:`${(100/150)*100}%`,top:0,bottom:0,width:`${(20/150)*100}%`,background:`${C.red}15`}}/>
        <div style={{position:"absolute",left:`${(120/150)*100}%`,top:0,bottom:0,right:0,background:`${C.red}30`}}/>
        <motion.div initial={{left:0}} animate={{left:`${Math.min(98,(att/150)*100)}%`}} transition={{duration:0.5}}
          style={{position:"absolute",top:0,bottom:0,width:3,background:C.text,boxShadow:`0 0 6px ${C.text}66`,zIndex:5}}/>
      </div>
      <div style={{position:"relative",height:14,fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>
        <span style={{position:"absolute",left:`${(42.5/150)*100}%`,transform:"translateX(-50%)",color:C.green}}>REALISTIC ≤85%</span>
        <span style={{position:"absolute",left:`${(92/150)*100}%`,transform:"translateX(-50%)",color:C.amber}}>STRETCH</span>
        <span style={{position:"absolute",left:`${(110/150)*100}%`,transform:"translateX(-50%)",color:C.red}}>AGGRESSIVE</span>
        <span style={{position:"absolute",left:`${(135/150)*100}%`,transform:"translateX(-50%)",color:C.red}}>UNREALISTIC</span>
      </div>
    </Card>
    
    {/* Footer attribution */}
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Capacity numbers derived from inputs.aeCount × inputs.aeQuota with ramp + attrition adjustments. For per-AE territory analysis or rep-level forecasting (not modeled), use your CRM. Open Sales Model + Seller Ramp for the full mechanics.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// CMO / VP MARKETING PERSONA VIEW
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: How many inquiries / MQLs per month?           → Monthly demand calendar
//   Q2: CAC payback at current motion mix?             → 4-variant CAC tiles
//   Q3: Channel concentration risk?                     → Highest-share CREATE channel
//   Q4: Fixed/variable split healthy?                   → Split with band context
//   Q5: Right CREATE/CONVERT/ACCELERATE split?         → Motion mix + ROI per motion
// ════════════════════════════════════════════════════════════
function CMOPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, monthly, motions, pnl, channels } = model;
  // Q1 — monthly demand
  const y1Months = (monthly||[]).filter(m => m.yearIndex === 0);
  const totalInq = y1Months.reduce((sum,m)=>sum+(m.monthlyInquiries||0),0);
  const totalMQL = y1Months.reduce((sum,m)=>sum+(m.monthlyMQLs||0),0);
  const peakInq = y1Months.reduce((max,m)=>m.monthlyInquiries>max.monthlyInquiries?m:max, {monthlyInquiries:0,month:"—"});
  // Q2 — CAC variants
  const cacs = [
    { label: "Programmatic", value: pnl.programmaticCAC || 0, desc: "Channel spend ÷ deals (optimistic)" },
    { label: "MarTech-Loaded", value: pnl.martechLoadedCAC || 0, desc: "+ martech / data tools" },
    { label: "Fully Burdened", value: pnl.fullyBurdenedCAC || 0, desc: "+ all fixed mktg overhead" },
    { label: "All-In Blended", value: pnl.blendedAllInCAC || 0, desc: "+ all S&M ÷ all deals (honest)" },
  ];
  const targetPayback = inputs.cacPaybackTarget || 24;
  // Q3 — channel concentration
  const createChannels = (motions?.create?.channels) || [];
  const sortedChannels = [...createChannels].sort((a,b)=>b.pct-a.pct);
  const topChannel = sortedChannels[0];
  const concentrationRisk = topChannel && topChannel.pct >= 40;
  // Q4 — fixed/variable
  const totalMktg = (pnl?.totalMktgBudget) || 0;
  const fixed = (pnl?.fixedMktg) || 0;
  const variable = (pnl?.variableMktg) || 0;
  const fixedPct = totalMktg > 0 ? (fixed/totalMktg)*100 : 0;
  const variablePct = totalMktg > 0 ? (variable/totalMktg)*100 : 0;
  // Q5 — motion mix
  const ma = inputs.motionAllocation || {create:45,convert:30,accelerate:25};
  const motionData = [
    { key:"CREATE", value: ma.create, totals: motions?.create?.totals, color: C.green, desc: "Net-new demand" },
    { key:"CONVERT", value: ma.convert, totals: motions?.convert?.totals, color: C.blue, desc: "Qualification throughput" },
    { key:"ACCELERATE", value: ma.accelerate, totals: motions?.accelerate?.totals, color: C.violet, desc: "Deal velocity + win-rate lift" },
  ];
  return(<div>
    <Header title="CMO View" sub="Monthly demand, CAC variants, channel concentration, fixed/variable split, motion mix" icon={Megaphone} moduleId="cmo" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>
    
    {/* Q1 — Monthly demand */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · How many inquiries / MQLs per month?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:14}}>
      <Metric label="Total Inquiries (Y1)" value={fN(totalInq)} sub={`${fN(Math.round(totalInq/12))} avg/month`} color={C.accent} delay={0}/>
      <Metric label="Total MQLs (Y1)" value={fN(totalMQL)} sub={`${fN(Math.round(totalMQL/12))} avg/month`} color={C.blue} delay={1}/>
      <Metric label="Peak Month" value={peakInq.month} sub={`${fN(peakInq.monthlyInquiries)} inquiries (seasonality)`} color={C.violet} delay={2}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`1 deal per ${Math.round(1/s.effectiveFunnelYield)} inq`} color={C.text} delay={3}/>
    </div>
    {/* Monthly bar chart */}
    <Card style={{marginBottom:24}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Monthly inquiry + MQL demand · Y1</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={y1Months} margin={{top:5,right:10,left:10,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/>
          <XAxis dataKey="month" stroke={C.dim} fontSize={10} tickLine={false}/>
          <YAxis stroke={C.dim} fontSize={10} tickLine={false} axisLine={false}/>
          <Tooltip content={<TT/>}/>
          <Bar dataKey="monthlyInquiries" name="Inquiries" fill={C.accent}/>
          <Bar dataKey="monthlyMQLs" name="MQLs" fill={C.blue}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>
    
    {/* Q2 NEW — Mid-funnel + meetings (BDR layer, MQL→SQO velocity, close rates) */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Mid-funnel — what marketing+BDR delivers through SQO</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:14}}>
      <Metric label="Meetings Set" value={fN(s.meetingsSetNeeded)} sub={`${s.meetingShowRate}% show rate`} color={C.blue} delay={4}/>
      <Metric label="Meetings Held" value={fN(s.meetingsNeeded)} sub={`${fN(s.meetingsSetNeeded - s.meetingsNeeded)} no-show/cancel`} color={C.text} delay={5}/>
      <Metric label="MQL → SQO" value={`${((inputs.mqlToSqlRate*inputs.sqlToMeetingRate*inputs.meetingToSqoRate/1e4)).toFixed(1)}%`} sub={`Qualification yield through 3 gates`} color={C.violet} delay={6}/>
      <Metric label="SQO → Won" value={`${inputs.sqoToWonRate}%`} sub={`Sales close rate`} color={inputs.sqoToWonRate>=25?C.green:C.amber} delay={7}/>
    </div>
    <Card style={{marginBottom:24}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Funnel velocity — median days per stage</div>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(5,1fr)",gap:10}}>
        {[
          {label:"Stage 1→2", days:inputs.velStage1to2, color:C.accent},
          {label:"Stage 2→3", days:inputs.velStage2to3, color:C.blue},
          {label:"Stage 3→4", days:inputs.velStage3to4, color:C.violet},
          {label:"Stage 4→5", days:inputs.velStage4to5, color:C.amber},
          {label:"Stage 5→Close", days:inputs.velStage5toClose, color:C.text},
        ].map(v=>(
          <div key={v.label} style={{padding:10,background:C.bg,borderTop:`2px solid ${v.color}`}}>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{v.label}</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{v.days}<span style={{fontSize:10,color:C.muted}}>d</span></div>
          </div>
        ))}
      </div>
      <div style={{marginTop:10,fontSize:11,color:C.muted,lineHeight:1.6}}>
        Total cycle: <strong style={{color:C.text}}>{s.totalCycleDays} days</strong>. The mid-funnel sales-stage time (Stage 2→3 and Stage 3→4) is where MQL-to-revenue lag accumulates. Watch for stage durations creeping; that's the leading indicator of pipeline stalls.
      </div>
    </Card>

    {/* Q3 NEW — Stage 2 pipeline + coverage */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · Stage 2 pipeline — the pipeline that forecasts</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Stage 2 Pipeline Required</div>
          <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(s.stage2Pipeline)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{fN(s.sqosNeeded)} SQOs × {fmt(inputs.avgDealSize)} avg deal</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Pipeline Coverage</div>
          <div style={{fontSize:22,fontWeight:700,color:s.coverageHealth==="good"?C.green:s.coverageHealth==="warning"?C.amber:C.red,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{inputs.pipelineCoverage}%</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{s.coverageHealth==="good"?"Healthy (≥350%)":s.coverageHealth==="warning"?"At threshold":"Below floor"}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Mktg-Sourced Share</div>
          <div style={{fontSize:22,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{inputs.mktgSourcedPct}%</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{fN(s.mktgSQOs)} of {fN(s.sqosNeeded)} SQOs come from marketing</div>
        </div>
      </div>
      <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
        Stage 2 is the pipeline that forecasts — AE-promoted, qualified opportunities. If BDRs report to marketing, this entire metric is in your ownership. The board cares about Stage 2 coverage, not raw lead count.
      </div>
    </Card>

    {/* Q4 NEW — Channel performance cohort */}
    {channels && channels.length > 0 && (
      <>
        <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Channel performance cohort — through-funnel</div>
        <Card style={{marginBottom:24}}>
          <div style={{display:"grid",gridTemplateColumns:mobile?"1.5fr repeat(3,1fr)":"1.4fr repeat(6,1fr)",gap:8,padding:"6px 0",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.borderMid}`}}>
            <div>Channel</div>
            <div style={{textAlign:"right"}}>Inq</div>
            <div style={{textAlign:"right"}}>SQOs</div>
            <div style={{textAlign:"right"}}>Deals</div>
            {!mobile && <div style={{textAlign:"right"}}>Win %</div>}
            {!mobile && <div style={{textAlign:"right"}}>CAC</div>}
            {!mobile && <div style={{textAlign:"right"}}>ROI</div>}
          </div>
          {channels.map((ch,i)=>{
            const winPct = ch.sqos > 0 ? (ch.deals/ch.sqos*100).toFixed(0) : "—";
            return(
              <div key={i} style={{display:"grid",gridTemplateColumns:mobile?"1.5fr repeat(3,1fr)":"1.4fr repeat(6,1fr)",gap:8,padding:"9px 0",borderBottom:i<channels.length-1?`1px solid ${C.borderMid}`:"none",fontSize:11,alignItems:"baseline"}}>
                <div style={{color:C.text,fontWeight:500}}>{ch.name}</div>
                <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.text}}>{fN(ch.channelInquiries)}</div>
                <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.blue}}>{fN(ch.sqos)}</div>
                <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.green}}>{fN(ch.deals)}</div>
                {!mobile && <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:winPct!=="—"&&parseFloat(winPct)>=25?C.green:C.amber}}>{winPct}%</div>}
                {!mobile && <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.text}}>{fmt(ch.cac)}</div>}
                {!mobile && <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:ch.roi>=2?C.green:ch.roi>=1?C.amber:C.red,fontWeight:600}}>{ch.roi?ch.roi.toFixed(1):"0"}x</div>}
              </div>
            );
          })}
          <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
            Through-funnel cohort by CREATE channel — inquiries flow through MQL/SQL/Meeting/SQO at the same global funnel rates, so SQO and Deal counts here assume each channel's leads convert at the same rate. In practice channels have different quality — overlay actual win rates from CRM to find which channels actually deliver pipeline that closes.
          </div>
        </Card>

        {/* Quarter cohort — seasonal volume distribution */}
        {model.qbrData && model.qbrData.length > 0 && (
          <Card style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Quarter cohort — pipeline contribution by quarter</div>
            <div style={{display:"grid",gridTemplateColumns:`120px repeat(${Math.min(model.qbrData.length,8)},1fr)`,gap:8}}>
              <div></div>
              {model.qbrData.slice(0,8).map((q,i)=>(
                <div key={i} style={{fontSize:9,fontWeight:700,color:i<4?C.text:C.dim,textAlign:"center",fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{q.quarter?q.quarter.split(" ")[0]:`Q${i+1}`}</div>
              ))}
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>Inquiries</div>
              {model.qbrData.slice(0,8).map((q,i)=>(<div key={i} style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{fN(q.inquiries)}</div>))}
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>Meetings</div>
              {model.qbrData.slice(0,8).map((q,i)=>(<div key={i} style={{fontSize:11,fontWeight:600,color:C.blue,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{fN(q.meetings)}</div>))}
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>SQOs</div>
              {model.qbrData.slice(0,8).map((q,i)=>(<div key={i} style={{fontSize:11,fontWeight:600,color:C.violet,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{fN(q.sqos)}</div>))}
              <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>Deals</div>
              {model.qbrData.slice(0,8).map((q,i)=>(<div key={i} style={{fontSize:11,fontWeight:600,color:C.green,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{fN(q.deals)}</div>))}
            </div>
            <div style={{marginTop:12,fontSize:11,color:C.muted,lineHeight:1.6}}>
              Same global conversion rates applied to each quarter's seasonal weight (NORAM B2B pattern by default). Volumes shift across quarters; conversion stays constant in the model. Real cohort drift (e.g. Q1 leads converting worse than Q4) requires CRM-actuals overlay — on build queue.
            </div>
          </Card>
        )}
      </>
    )}

    {/* Q2 — CAC variants */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 · CAC payback at current motion mix</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:14}}>
        {cacs.map((c,i)=>{
          const payback = inputs.avgDealSize > 0 ? c.value / (inputs.avgDealSize/12) : 0;
          const color = payback <= targetPayback ? C.green : payback <= targetPayback*1.5 ? C.amber : C.red;
          return(
            <div key={c.label} style={{padding:12,background:C.bg,borderRadius:0,borderTop:`2px solid ${color}`}}>
              <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{c.label}</div>
              <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{fmt(c.value)}</div>
              <div style={{fontSize:10,color:color,marginTop:4,fontWeight:600,fontFamily:"'Chivo Mono',monospace"}}>{payback.toFixed(1)}mo payback</div>
              <div style={{fontSize:9,color:C.dim,marginTop:6,lineHeight:1.4}}>{c.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
        The honest CAC is the rightmost column — all S&M divided by all deals (including expansion). Target payback: <strong style={{color:C.text}}>≤{targetPayback} months</strong>. If the all-in number is far from programmatic, fixed overhead is dominating.
      </div>
    </Card>
    
    {/* Q3 — Channel concentration */}
    {topChannel && (
      <>
        <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q6 · Channel concentration risk</div>
        <Card style={{marginBottom:24,borderLeft:`3px solid ${concentrationRisk?C.amber:C.green}`}}>
          <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{fontSize:32,fontWeight:700,color:concentrationRisk?C.amber:C.green,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{topChannel.pct}%</div>
            <div style={{flex:1,minWidth:240}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{topChannel.name} is the largest CREATE channel</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
                {concentrationRisk ? `Over the 40% concentration threshold. If ${topChannel.name} CPL increases 30%, it blows up the whole CREATE budget.` : `Within healthy concentration limits (under 40%). Diversified motion is more resilient to channel-level shocks.`}
              </div>
            </div>
          </div>
          {/* Channel allocation bars */}
          <div style={{marginTop:8}}>
            {sortedChannels.map((ch,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"140px 1fr 70px",gap:10,alignItems:"center",marginBottom:5}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{ch.name}</div>
                <div style={{height:10,background:C.bg,borderRadius:0,overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${ch.pct*1.5}%`}} transition={{duration:0.4,delay:i*0.04}}
                    style={{height:"100%",background:ch.pct>=40?C.amber:C.green,opacity:0.7}}/>
                </div>
                <div style={{fontSize:10,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{ch.pct}% · {fmt(ch.spend)}</div>
              </div>
            ))}
          </div>
        </Card>
      </>
    )}
    
    {/* Q4 — Fixed/Variable split */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q7 · Fixed / variable marketing split</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Total Marketing</div>
          <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(totalMktg)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{((totalMktg/s.totalRevenue)*100).toFixed(1)}% of revenue</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Fixed (Infrastructure)</div>
          <div style={{fontSize:22,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(fixed)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{fixedPct.toFixed(0)}% · Exec, PMM, MarTech, ops, brand</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Variable (Demand)</div>
          <div style={{fontSize:22,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{fmt(variable)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>{variablePct.toFixed(0)}% · Motion-allocated channels</div>
        </div>
      </div>
      {/* Fixed/Variable split visualization */}
      <div style={{position:"relative",height:14,background:C.bg,borderRadius:0,overflow:"hidden",marginBottom:8}}>
        <motion.div initial={{width:0}} animate={{width:`${fixedPct}%`}} transition={{duration:0.5}}
          style={{position:"absolute",left:0,top:0,bottom:0,background:C.violet,opacity:0.85}}/>
        <motion.div initial={{width:0}} animate={{width:`${variablePct}%`}} transition={{duration:0.5,delay:0.1}}
          style={{position:"absolute",left:`${fixedPct}%`,top:0,bottom:0,background:C.green,opacity:0.85}}/>
      </div>
      <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
        {pnl.fixedMktgIsFloorBound ? `Fixed budget is structurally floor-bound — the minimum-viable team costs more than the formula allocates. This resolves as revenue scales. ` : ""}
        Benchmark for growth stage: <strong style={{color:C.text}}>20-35% fixed / 65-80% variable</strong>. Current split is <strong style={{color:fixedPct>40||fixedPct<15?C.amber:C.text}}>{fixedPct.toFixed(0)}% fixed</strong>.
      </div>
    </Card>
    
    {/* Q5 — Motion mix */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q8 · CREATE / CONVERT / ACCELERATE split</div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14}}>
        {motionData.map((m,i)=>{
          const roi = m.totals?.revenue && m.totals?.spend ? (m.totals.revenue / m.totals.spend) : null;
          return(
            <div key={m.key} style={{padding:14,background:C.bg,borderRadius:0,borderTop:`2px solid ${m.color}`}}>
              <div style={{fontSize:9,fontWeight:700,color:m.color,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{m.key}</div>
              <div style={{fontSize:28,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1.05}}>{m.value}%</div>
              <div style={{fontSize:10,color:C.dim,marginTop:4}}>{m.desc}</div>
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderMid}`}}>
                <div style={{fontSize:10,color:C.muted,marginBottom:2}}>Spend: <span style={{color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(m.totals?.spend||0)}</span></div>
                {m.key === "CREATE" && m.totals?.deals !== undefined && (
                  <div style={{fontSize:10,color:C.muted}}>Deals: <span style={{color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.totals.deals}</span> · ROI: <span style={{color:roi&&roi>=2?C.green:roi&&roi>=1?C.amber:C.red,fontFamily:"'Chivo Mono',monospace"}}>{roi?roi.toFixed(1):"0"}x</span></div>
                )}
                {m.key === "CONVERT" && m.totals?.sqosCreated !== undefined && (
                  <div style={{fontSize:10,color:C.muted}}>SQOs created: <span style={{color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.totals.sqosCreated}</span> · cost/SQO: <span style={{color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(m.totals.costPerSqo||0)}</span></div>
                )}
                {m.key === "ACCELERATE" && m.totals?.oppsInfluenced !== undefined && (
                  <div style={{fontSize:10,color:C.muted}}>Opps touched: <span style={{color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.totals.oppsInfluenced}</span> · +{m.totals.winRateLift||5}pp win rate</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
    
    {/* Honest gap — stage-recommended motion split */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Bonus gap <span style={{color:C.amber,marginLeft:6}}>↘ on build queue</span></div>
    <Card style={{marginBottom:18,borderLeft:`2px solid ${C.amber}`,opacity:0.92}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em"}}>Q5 cousin · Coming soon</span>
      </div>
      <h3 style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.3}}>What's the right CREATE/CONVERT/ACCELERATE split for our stage?</h3>
      <p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>The audit flagged this: Revenue Motions has the framework but no stage-anchored recommendation (e.g. seed-stage favors CREATE heavily; Series C balances). A "recommended for {inputs.fundingStage||"seriesB"} / {fmt(s.targetARR)}" overlay is on the build queue.</p>
    </Card>
    
    {/* Footer */}
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Channel data sourced from inputs.motionChannels. Phase-shifted seasonality reflected in monthly demand. Open Revenue Motions for channel-level mechanics, CAC Breakdown for the 4 variants in depth.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// VC / INVESTOR PERSONA VIEW
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Rule of 40 + Magic — efficient or burning?  → 4 unit-economic tiles
//   Q2: Multi-year glideslope credible?             → Glideslope chart + Y2 feasibility
//   Q3: CAC payback months — investable?            → All-in CAC + payback verdict
//   Q4: Funding need to hit the plan?               → gap card (NOT MODELED)
//   Q5: Marketing-led or sales-led business?        → Mktg-sourced + outbound dependency
// ════════════════════════════════════════════════════════════
function VCPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, glideslope, yearTargets, pnl } = model;
  const allInCAC = pnl?.blendedAllInCAC || 0;
  const allInPayback = inputs.avgDealSize > 0 ? allInCAC / (inputs.avgDealSize/12) : 0;
  const investable = allInPayback <= (inputs.cacPaybackTarget || 24);
  const y2 = yearTargets && yearTargets[1];
  const y2GrowthRate = y2 ? y2.growthRate : null;
  const y2Credible = y2GrowthRate === null ? null : y2GrowthRate <= 100;
  return(<div>
    <Header title="VC View" sub="Efficiency metrics, multi-year credibility, investability" icon={BarChart3} moduleId="vc" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    
    {/* Q1 — Efficient or burning */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Efficient or burning?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:24}}>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} sub={s.rule40>=40?"Investable":"Below threshold"} color={s.rule40>=40?C.green:C.red} delay={0}/>
      <Metric label="Magic Number" value={s.magicNumber.toFixed(2)} sub={s.magicNumber>=0.75?"Efficient":s.magicNumber>=0.5?"Marginal":"Inefficient"} color={s.magicNumber>=0.75?C.green:s.magicNumber>=0.5?C.amber:C.red} delay={1}/>
      <Metric label="LTV : CAC" value={`${s.ltvCac.toFixed(1)}x`} sub={s.ltvCac>=3?"Healthy":"Below 3x"} color={s.ltvCac>=3?C.green:C.amber} delay={2}/>
      <Metric label="Burn Multiple" value={s.burnMultiple?s.burnMultiple.toFixed(2):"—"} sub={s.burnMultiple==null?"Profitable":s.burnMultiple<=1?"Best-in-class":s.burnMultiple<=2?"Acceptable":"Inefficient"} color={s.burnMultiple==null||s.burnMultiple<=1?C.green:s.burnMultiple<=2?C.amber:C.red} delay={3}/>
    </div>
    
    {/* Q2 — Multi-year glideslope */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Multi-year glideslope · credibility</div>
    <Card style={{marginBottom:24}}>
      {y2 && (
        <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:14}}>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Y1 Target</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.targetARR)}</div>
            <div style={{fontSize:10,color:C.dim,marginTop:3}}>{(s.growthRate||0).toFixed(0)}% growth</div>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Y2 Target</div>
            <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(y2.targetARR)}</div>
            <div style={{fontSize:10,color:y2GrowthRate>100?C.amber:C.dim,marginTop:3}}>{y2GrowthRate.toFixed(0)}% over Y1 exit</div>
          </div>
          <div>
            <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Y2 Credibility</div>
            <div style={{fontSize:14,fontWeight:600,color:y2Credible?C.green:C.amber,marginTop:6}}>{y2Credible?"Plausible":"Historically rare"}</div>
            <div style={{fontSize:10,color:C.dim,marginTop:6,lineHeight:1.5}}>{y2Credible?"Y2 growth ≤100% — within mid-market SaaS distribution":"Y2 growth >100% — fewer than 10% of mid-market SaaS sustain"}</div>
          </div>
        </div>
      )}
      {glideslope && glideslope.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={glideslope} margin={{top:5,right:10,left:10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/>
            <XAxis dataKey="month" stroke={C.dim} fontSize={9} tickLine={false} interval={2}/>
            <YAxis stroke={C.dim} fontSize={9} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill={C.accentDim} strokeWidth={2} name="Projected ARR"/>
            <Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Target"/>
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
    
    {/* Q3 — CAC payback */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · CAC payback — investable?</div>
    <Card style={{marginBottom:24,borderLeft:`3px solid ${investable?C.green:C.amber}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:18,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontSize:42,fontWeight:700,color:investable?C.green:C.amber,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{allInPayback.toFixed(1)}<span style={{fontSize:18,color:C.muted}}>mo</span></div>
        <div style={{flex:1,minWidth:240}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>All-in CAC payback — the honest number</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            {fmt(allInCAC)} all-in CAC ÷ {fmt(inputs.avgDealSize/12)} monthly customer revenue. Target ≤{inputs.cacPaybackTarget||24}mo. {investable?"Within investable range.":`${(allInPayback-(inputs.cacPaybackTarget||24)).toFixed(1)}mo over target — flags scrutiny.`}
          </div>
        </div>
      </div>
    </Card>
    
    {/* Q4 — Funding need (gap) */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Funding need <span style={{color:C.amber,marginLeft:6}}>↘ on build queue</span></div>
    <Card style={{marginBottom:18,borderLeft:`2px solid ${C.amber}`,opacity:0.92}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:9,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.08em"}}>Q4 · Coming soon</span>
      </div>
      <h3 style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.3}}>What funding does the plan require, and over what runway?</h3>
      <p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>The VC's last question. Cumulative burn over the planning horizon × current cash position × buffer = funding need + when. The burn math is in CFO View (Q2); pairing it with starting cash and a buffer assumption is on the build queue.</p>
    </Card>
    
    {/* Q5 — Mktg-led vs sales-led */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 · Marketing-led or sales-led business?</div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",alignItems:"baseline",gap:18,marginBottom:10,flexWrap:"wrap"}}>
        <div style={{fontSize:36,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{inputs.mktgSourcedPct}<span style={{fontSize:16,color:C.muted}}>%</span></div>
        <div style={{flex:1,minWidth:240}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>Marketing-sourced pipeline</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            {inputs.mktgSourcedPct >= 60 ? "Marketing-led business. Scales with brand and demand-gen investment; less dependent on individual AE outbound." :
             inputs.mktgSourcedPct <= 35 ? "Sales-led business. Heavy outbound dependency — capacity scales linearly with AE/SDR headcount." :
             "Balanced motion. Marketing creates the air cover, sales builds the pipeline."}
          </div>
        </div>
      </div>
      <div style={{position:"relative",height:10,background:C.bg,borderRadius:0,overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${inputs.mktgSourcedPct}%`,background:C.accent,opacity:0.85}}/>
        <div style={{position:"absolute",left:`${inputs.mktgSourcedPct}%`,top:0,bottom:0,right:0,background:C.violet,opacity:0.85}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>
        <span>MARKETING-SOURCED {inputs.mktgSourcedPct}%</span>
        <span>AE/SDR-SOURCED {100-inputs.mktgSourcedPct}%</span>
      </div>
    </Card>
    
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Investability framing uses mid-market SaaS benchmarks. Multi-year credibility based on Y2 growth rate distribution. For sensitivity to misses, see CFO View (Q4 gap).
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// MARKETING PLAN — Kellogg-style inverse waterfall
// Inverts the marketing planning question: instead of starting with
// activities and forecasting outcomes, starts with the revenue commit
// and derives required inputs at each funnel stage. Then runs
// sensitivity analysis on per-stage conversion rates, and shows the
// quarterly distribution applied via seasonal weights + phase-shift.
function MarketingPlanPage({model, inputs, onInfoClick, mobile}){
  const imp = model.inverseMarketingPlan;
  if (!imp) return <div><Header title="Marketing Plan" sub="Inverse waterfall" icon={Target} moduleId="marketingPlan" onInfoClick={onInfoClick}/><div style={{padding:20,color:C.muted}}>Marketing plan data unavailable. Check engine model output.</div></div>;
  const { stages, sensitivities, quarterly, base, inputs: ipInputs } = imp;
  const headlineInquiries = base.inquiries;
  const headlineMQLs = base.mqls;
  const headlineSQOs = base.sqos;
  const headlineWins = ipInputs.dealsNeeded;
  return(<div>
    <Header title="Marketing Plan" sub="Inverse waterfall — target revenue → required inquiries, with sensitivity" icon={Target} moduleId="marketingPlan" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>

    {/* Q1 — The Commit */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · The commit · what marketing has to produce</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:mobile?10:14,marginBottom:18}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Revenue target</div>
          <div style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(ipInputs.targetARR)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>by end of plan · {ipInputs.numYears}yr horizon</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>New ARR needed</div>
          <div style={{fontSize:22,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(ipInputs.newARRNeeded)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>after retained: {fmt(ipInputs.retainedARR)}</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Wins needed</div>
          <div style={{fontSize:22,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace"}}>{fN(headlineWins)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>@ {fmt(ipInputs.avgDealSize)} ASP</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Required inquiries</div>
          <div style={{fontSize:22,fontWeight:700,color:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fN(headlineInquiries)}</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>top of funnel · all sources</div>
        </div>
      </div>
      <div style={{fontSize:11,color:C.muted,lineHeight:1.7,paddingTop:14,borderTop:`1px solid ${C.borderMid}`}}>
        <b style={{color:C.text}}>The inverse read.</b> Marketing's job is to produce <b style={{color:C.amber}}>{fN(headlineInquiries)}</b> inquiries that convert through the funnel to <b style={{color:C.green}}>{fN(headlineWins)} wins</b>. Every stage's conversion rate is a load-bearing assumption. If any of them shifts, the inquiry requirement at the top moves. See Q3 below.
      </div>
    </Card>

    {/* Q2 — The waterfall */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · The waterfall · stage by stage</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {stages.map((stage, i) => {
          const isTop = i === 0;
          const isBottom = i === stages.length - 1;
          const widthPct = headlineInquiries > 0 ? Math.max(8, (stage.count / headlineInquiries) * 100) : 0;
          const stageColor = isBottom ? C.green : isTop ? C.amber : i <= 1 ? C.blue : i === 2 ? C.violet : C.accent;
          return (
            <div key={stage.key} style={{display:"grid",gridTemplateColumns:mobile?"110px 1fr":"160px 1fr 100px",gap:14,alignItems:"center",padding:"14px 0",borderBottom:isBottom?"none":`1px solid ${C.borderSubtle}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{stage.label}</div>
                <div style={{fontSize:9,color:C.dim,marginTop:2,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>{stage.owner.toUpperCase()}</div>
              </div>
              <div>
                <div style={{height:24,background:C.bg,borderRadius:0,position:"relative",overflow:"hidden"}}>
                  <motion.div initial={{width:0}} animate={{width:`${widthPct}%`}} transition={{duration:0.6,delay:i*0.08}} style={{height:"100%",background:stageColor,opacity:0.85,display:"flex",alignItems:"center",paddingLeft:10}}>
                    <span style={{fontSize:13,fontWeight:700,color:C.bg,fontFamily:"'Chivo Mono',monospace"}}>{fN(stage.count)}</span>
                  </motion.div>
                </div>
                {!mobile && <div style={{fontSize:10,color:C.muted,marginTop:6,lineHeight:1.5}}>{stage.description}</div>}
              </div>
              {!mobile && stage.conversion !== null && (
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,fontWeight:700,color:stageColor,fontFamily:"'Chivo Mono',monospace"}}>{stage.conversion}%</div>
                  <div style={{fontSize:9,color:C.dim,marginTop:2}}>{stage.conversionLabel}</div>
                </div>
              )}
              {!mobile && stage.conversion === null && (
                <div style={{textAlign:"right",fontSize:9,color:C.dim,fontStyle:"italic"}}>terminal</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:10,color:C.dim,lineHeight:1.7}}>
        Each row shows the required count at that stage and the conversion rate to the next. Conversion rates set in Global Drivers (right rail) under <b style={{color:C.muted}}>Lifecycle</b>. Edit them there to see this waterfall recompute.
      </div>
    </Card>

    {/* Q3 — Sensitivity */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · Sensitivity · which assumption is load-bearing</div>
    <Card style={{marginBottom:24}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:14,lineHeight:1.6}}>
        Each row asks: <b style={{color:C.text}}>if this single conversion rate shifts ±5pp from its current value, how many MORE or FEWER inquiries does marketing have to produce</b> to still hit {fN(headlineWins)} wins?
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Stage gate</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Base rate</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>−5pp impact</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>+5pp impact</th>
            </tr>
          </thead>
          <tbody>
            {sensitivities.map((sens, i) => {
              const m5color = sens.impactMinus5pp > headlineInquiries * 0.10 ? C.red : sens.impactMinus5pp > 0 ? C.amber : C.muted;
              const p5color = sens.impactPlus5pp < -headlineInquiries * 0.10 ? C.green : sens.impactPlus5pp < 0 ? C.green : C.muted;
              return (
                <tr key={sens.stage} style={{borderBottom:i<sensitivities.length-1?`1px solid ${C.borderSubtle}`:"none"}}>
                  <td style={{padding:"12px 12px",color:C.text,fontWeight:600}}>{sens.stage}</td>
                  <td style={{textAlign:"right",padding:"12px 12px",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{sens.baseRate}%</td>
                  <td style={{textAlign:"right",padding:"12px 12px",color:m5color,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>
                    {sens.impactMinus5pp > 0 ? "+" : ""}{fN(sens.impactMinus5pp)}
                    <div style={{fontSize:9,color:C.dim,fontWeight:400,marginTop:2}}>{fN(sens.minus5Inquiries)} total inquiries</div>
                  </td>
                  <td style={{textAlign:"right",padding:"12px 12px",color:p5color,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>
                    {sens.impactPlus5pp > 0 ? "+" : ""}{fN(sens.impactPlus5pp)}
                    <div style={{fontSize:9,color:C.dim,fontWeight:400,marginTop:2}}>{fN(sens.plus5Inquiries)} total inquiries</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:10,color:C.dim,lineHeight:1.7}}>
        <b style={{color:C.muted}}>Read this as risk.</b> A stage where −5pp adds tens of thousands of inquiries is your most fragile assumption. That's where data quality, A/B testing, and process discipline matter most. A stage where the impact is small is well-buffered.
      </div>
    </Card>

    {/* Q4 — Quarterly distribution */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Quarterly distribution · seasonal weights applied</div>
    <Card style={{marginBottom:24}}>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:680}}>
          <thead>
            <tr>
              <th style={{textAlign:"left",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Quarter</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Inquiries</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>MQLs</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>SQLs</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Meetings</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>SQOs</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Wins</th>
              <th style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em",borderBottom:`1px solid ${C.borderMid}`}}>Season %</th>
            </tr>
          </thead>
          <tbody>
            {quarterly.map((q, i) => (
              <tr key={q.globalQi} style={{borderBottom:i<quarterly.length-1?`1px solid ${C.borderSubtle}`:"none",background:q.isCurrentYear?"transparent":C.bgAlt}}>
                <td style={{padding:"10px 12px",color:C.text,fontWeight:q.isCurrentYear?600:400}}>{q.quarter}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.amber,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fN(q.inquiries)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{fN(q.mqls)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{fN(q.sqls)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{fN(q.meetings)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.accent,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fN(q.sqos)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.green,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fN(q.wins)}</td>
                <td style={{textAlign:"right",padding:"10px 12px",color:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{q.seasonalPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:14,fontSize:10,color:C.dim,lineHeight:1.7}}>
        Quarterly weights applied from NORAM B2B seasonality (front-loaded fall, summer dip). Adjust in Global Drivers → Seasonality. Current year quarters in solid type; future-year quarters in dimmer background.
      </div>
    </Card>

    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Inverse marketing plan · Kellogg-inspired waterfall · sensitivity ±5pp per stage · seasonal quarterly distribution. Conversion rates editable in Global Drivers right rail. For headcount feasibility, see Horizon Planner above.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// AE HIRING PLAN — bridges current AE roster (today) with target
// AE roster (needed to land the plan). Models cohort ramps with
// hire lead time + realistic attainment. Surfaces month-by-month
// productive capacity vs required productive capacity — the most
// common failure mode in aggressive growth plans (over-counting
// AEs you haven't hired yet or that haven't ramped).
// ════════════════════════════════════════════════════════════
function AeHiringPlanPage({model, inputs, setInputs, onInfoClick, mobile}){
  const plan = model.aeHiringPlan;
  const summary = model.aeHiringSummary;
  if (!plan || !summary) return <div><Header title="AE Hiring Plan" sub="Capacity bridge" icon={Users} moduleId="sellerRamp" onInfoClick={onInfoClick}/><div style={{padding:20,color:C.muted}}>Hiring plan data unavailable. Check engine model output.</div></div>;

  const fmtAe = (n) => Math.round(n * 10) / 10;
  const gapColor = (g) => g >= 0 ? C.green : g >= -1 ? C.amber : C.red;

  return(<div>
    <Header title="AE Hiring Plan" sub="The capacity bridge — what you have today vs what the plan requires" icon={Users} moduleId="sellerRamp" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>

    {/* Q1 — The Bridge */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · The bridge · today → target</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:18}}>
      <Metric label="AEs Today" value={summary.startNameplate} sub="Current nameplate roster" color={C.text}/>
      <Metric label="AEs Needed (target)" value={summary.targetNameplate} sub={`At plan exit · ${(summary.realisticAttainment).toFixed(0)}% attain`} color={C.text}/>
      <Metric label="Hires Needed" value={summary.hiresNeeded} sub={`${summary.aeTimeToHire}mo hire lead time`} color={summary.hiresNeeded > 0 ? C.accent : C.green}/>
      <Metric label="Peak Required" value={fmtAe(summary.peakRequired)} sub="Peak productive AEs needed" color={C.text}/>
    </div>

    {/* Q2 — Capacity gap callout */}
    <Card>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:13,fontWeight:600,color:C.text,margin:0,marginBottom:4}}>Capacity Gap Read</h3>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Productive AE supply vs demand month by month. Deficit months = plan won't hit unless you front-load hiring or accelerate ramp.</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:9,color:C.dim,fontFamily:"'Chivo Mono',monospace",textTransform:"uppercase"}}>Months in deficit</div>
          <div style={{fontSize:24,fontWeight:300,color:summary.monthsInDeficit > 6 ? C.red : summary.monthsInDeficit > 2 ? C.amber : C.green,fontFamily:"'Chivo Mono',monospace"}}>{summary.monthsInDeficit} <span style={{fontSize:11,color:C.dim}}>/ {plan.length}</span></div>
        </div>
      </div>
      <div style={{padding:12,background:summary.monthsInDeficit > 6 ? C.redDim : summary.monthsInDeficit > 2 ? C.amberDim : C.greenDim,border:`1px solid ${summary.monthsInDeficit > 6 ? C.red : summary.monthsInDeficit > 2 ? C.amber : C.green}`,borderRadius:0,fontSize:12,color:C.text,lineHeight:1.6}}>
        {summary.monthsInDeficit === 0 ? (
          <span><b>Plan is feasible from day one.</b> Current roster of {summary.startNameplate} productive AEs covers required capacity throughout the plan. Watch for ramp loss as you hire — productive ≠ nameplate.</span>
        ) : summary.firstMonthGreen ? (
          <span><b>Plan goes green {summary.firstMonthGreen}.</b> Before that, productive capacity is below required — {summary.monthsInDeficit} months in deficit. Peak gap: {fmtAe(Math.abs(summary.peakGap))} AEs short in {summary.peakGapMonth}. To close this faster: hire earlier, reduce ramp time, or pull a year forward.</span>
        ) : (
          <span><b>Plan never reaches productive coverage.</b> {summary.monthsInDeficit} of {plan.length} months in deficit. Peak shortage: {fmtAe(Math.abs(summary.peakGap))} AEs in {summary.peakGapMonth}. The hiring plan as configured cannot land this revenue plan — either lower the target, raise quota, raise ASP, or massively accelerate hiring.</span>
        )}
      </div>
    </Card>

    {/* Q3 — Capacity curve chart */}
    <Card>
      <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Productive Capacity vs Required · Month by Month</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={plan} margin={{top:10,right:20,bottom:5,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/>
          <XAxis dataKey="monthShort" stroke={C.dim} fontSize={10} tickLine={false}/>
          <YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} label={{value:'AEs',angle:-90,position:'insideLeft',style:{fontSize:10,fill:C.dim}}}/>
          <Tooltip content={<TT/>}/>
          <Bar dataKey="nameplate" fill={C.borderMid} stroke={C.borderStrong} strokeWidth={1} name="Nameplate (hired)" radius={[2,2,0,0]}/>
          <Line type="monotone" dataKey="productive" stroke={C.accent} strokeWidth={2.5} dot={{r:3,fill:C.accent}} name="Productive AEs"/>
          <Line type="monotone" dataKey="requiredProductive" stroke={C.red} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Required (red dashed)"/>
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{marginTop:10,fontSize:10,color:C.dim,lineHeight:1.6}}>
        Bars = nameplate (warm bodies on payroll). Solid line = productive capacity (cohorts × ramp%). Dashed red = required productive ({(summary.realisticAttainment).toFixed(0)}% attainment of ${(inputs.aeQuota/1000).toFixed(0)}K quota). Where the line drops below dashed red = deficit month.
      </div>
    </Card>

    {/* Q4 — Hiring schedule table */}
    <Card>
      <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Hiring Schedule · {summary.hiringPlanMode === 'frontload' ? 'Front-loaded (60/30/10)' : 'Linear'}</h3>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${C.borderStrong}`}}>
              <th style={{textAlign:"left",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Month</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Hires</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Nameplate</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Productive</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Required</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Gap</th>
              <th style={{textAlign:"right",padding:"6px 8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'Chivo Mono',monospace"}}>Monthly Comp</th>
            </tr>
          </thead>
          <tbody>
            {plan.map((m, i) => (
              <tr key={i} style={{borderBottom:`1px solid ${C.borderMid}`,background: i % 2 === 0 ? C.bg : 'transparent'}}>
                <td style={{padding:"6px 8px",color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.monthLong}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:m.hiresThisMonth > 0 ? C.accent : C.dim,fontFamily:"'Chivo Mono',monospace",fontWeight:m.hiresThisMonth > 0 ? 700 : 400}}>{m.hiresThisMonth > 0 ? `+${m.hiresThisMonth}` : '—'}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.nameplate}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.productive}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{m.requiredProductive}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:gapColor(m.gap),fontFamily:"'Chivo Mono',monospace",fontWeight:600}}>{m.gap >= 0 ? `+${m.gap}` : m.gap}</td>
                <td style={{padding:"6px 8px",textAlign:"right",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>{fmt(m.monthlyAeComp)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{borderTop:`2px solid ${C.borderStrong}`,background:C.bg}}>
              <td style={{padding:"8px",color:C.dim,fontFamily:"'Chivo Mono',monospace",fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em"}}>Plan total</td>
              <td style={{padding:"8px",textAlign:"right",color:C.accent,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>+{summary.hiresNeeded}</td>
              <td style={{padding:"8px",textAlign:"right",color:C.text,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{summary.finalNameplate}</td>
              <td style={{padding:"8px",textAlign:"right",color:C.text,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmtAe(summary.finalProductive)}</td>
              <td style={{padding:"8px",textAlign:"right",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>—</td>
              <td style={{padding:"8px",textAlign:"right",color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>—</td>
              <td style={{padding:"8px",textAlign:"right",color:C.text,fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmt(summary.totalComp)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{marginTop:14,fontSize:10,color:C.dim,lineHeight:1.7}}>
        Total AE comp over plan: <b style={{color:C.text}}>{fmt(summary.totalComp)}</b> ({(summary.totalComp / 1000000).toFixed(2)}M) — fully-loaded (OTE × {((inputs.aeBenefitsLoad || 1.25) * 100).toFixed(0)}% benefits load). Does not include SDRs, SEs, sales leadership, marketing, or tools — see CFO View or S&M Budget for full GTM cost.
      </div>
    </Card>

    {/* Q5 — Inline controls */}
    <Card>
      <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Tune the Plan</h3>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
        <Input label="AEs Today" value={inputs.currentAeCount} onChange={v=>setInputs(p=>({...p,currentAeCount:v}))} min={0} step={1}/>
        <Input label="Target AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1} step={1}/>
        <Input label="Hire Lead Time" value={inputs.aeTimeToHire} onChange={v=>setInputs(p=>({...p,aeTimeToHire:v}))} suffix="mo" min={0} max={6} step={1}/>
        <Input label="Realistic Attain" value={inputs.realisticAeAttainment} onChange={v=>setInputs(p=>({...p,realisticAeAttainment:v}))} suffix="%" min={50} max={100} step={5}/>
      </div>
      <div style={{marginTop:14,padding:10,background:C.bg,border:`1px solid ${C.borderMid}`,fontSize:11,color:C.muted,lineHeight:1.6}}>
        <b style={{color:C.text}}>Tip:</b> The biggest lever is <b style={{color:C.accent}}>realistic attainment</b>. Most plans assume 85-100% — reality is 60-75%. Drop this to 70% and watch the required AE count rise (and your hire schedule with it). Be brutal here; this is where plans break.
      </div>
    </Card>

    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      AE hiring plan · Cohort ramp math · Hire lead time + realistic attainment · For the seller productivity curve see Seller Ramp; for headcount feasibility against the target date see Horizon Planner.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// PE PERSONA VIEW
// Private Equity buyer / operating partner. Different from VC:
// FCF + EBITDA discipline, exit multiple math, 5-7yr horizon,
// operational lever extraction. Less tolerance for burn; more
// focus on Rule of 50/60+, margin expansion path, and customer
// concentration risk.
function PEPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, glideslope, yearTargets, pnl } = model;
  const allInCAC = pnl?.blendedAllInCAC || 0;
  const allInPayback = inputs.avgDealSize > 0 ? allInCAC / (inputs.avgDealSize/12) : 0;
  // PE thresholds are stricter than VC: payback < 18mo target, Rule of 50+
  const investablePE = allInPayback <= 18;
  const ruleOf50 = s.rule40 >= 50;
  const ruleOf60 = s.rule40 >= 60;
  // EBITDA-like margin proxy: ARR growth + operating-margin signals
  const sandmRev = pnl?.sandmAsPctRevenue || 0;
  const grossMargin = inputs.grossMargin || 80;
  const opMarginProxy = grossMargin - sandmRev - 20; // rough G&A + R&D estimate
  const fcfHealthy = opMarginProxy >= 15;
  const fcfApproaching = opMarginProxy >= 5;
  // Exit multiple range — Rule of 40 + growth correlation
  const exitMultLow = s.rule40 >= 60 ? 12 : s.rule40 >= 50 ? 8 : s.rule40 >= 40 ? 6 : 4;
  const exitMultHigh = s.rule40 >= 60 ? 18 : s.rule40 >= 50 ? 12 : s.rule40 >= 40 ? 9 : 6;
  const targetEntryMult = 5; // typical PE entry multiple for SaaS
  const multipleExpansion = ((exitMultLow / targetEntryMult) - 1) * 100;
  // NRR — PE cares about this more than VC
  const nrr = (inputs.nrr || 100);
  const nrrHealthy = nrr >= 115;
  const nrrAcceptable = nrr >= 105;
  return(<div>
    <Header title="PE View" sub="Margin trajectory, exit multiple thesis, operational levers" icon={BarChart3} moduleId="pe" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>

    {/* Q1 — Margin trajectory */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Margin trajectory · Rule of 50+</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:24}}>
      <Metric label="Rule of 40" value={s.rule40.toFixed(0)} sub={ruleOf60?"Rule of 60 · elite":ruleOf50?"Rule of 50 · PE-fundable":s.rule40>=40?"Min threshold met":"Below PE threshold"} color={ruleOf60?C.green:ruleOf50?C.green:s.rule40>=40?C.amber:C.red} delay={0}/>
      <Metric label="Op Margin (est.)" value={`${opMarginProxy.toFixed(0)}%`} sub={fcfHealthy?"FCF-positive territory":fcfApproaching?"Approaching FCF+":"Burn-funded"} color={fcfHealthy?C.green:fcfApproaching?C.amber:C.red} delay={1}/>
      <Metric label="Gross Margin" value={`${grossMargin.toFixed(0)}%`} sub={grossMargin>=75?"SaaS-grade":grossMargin>=65?"Services-heavy":"Capex-heavy"} color={grossMargin>=75?C.green:grossMargin>=65?C.amber:C.red} delay={2}/>
      <Metric label="S&M / Revenue" value={`${sandmRev.toFixed(0)}%`} sub={sandmRev<=35?"Efficient":sandmRev<=50?"Growth-stage":"Heavy spend"} color={sandmRev<=35?C.green:sandmRev<=50?C.amber:C.red} delay={3}/>
    </div>

    {/* Q2 — Exit multiple thesis */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Exit multiple thesis · 5-7yr hold</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:14}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Entry mult. (typical)</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{targetEntryMult}x ARR</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>Mid-market SaaS PE comparable</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Exit mult. range</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{exitMultLow}–{exitMultHigh}x ARR</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>Based on Rule of {s.rule40.toFixed(0)} at exit</div>
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Multiple expansion</div>
          <div style={{fontSize:18,fontWeight:700,color:multipleExpansion>=50?C.green:multipleExpansion>=0?C.amber:C.red,fontFamily:"'Chivo Mono',monospace"}}>{multipleExpansion>0?'+':''}{multipleExpansion.toFixed(0)}%</div>
          <div style={{fontSize:10,color:C.dim,marginTop:3}}>{multipleExpansion>=50?"Strong expansion thesis":multipleExpansion>=0?"Flat — operate-up-only":"Multiple compression risk"}</div>
        </div>
      </div>
      <div style={{fontSize:11,color:C.muted,lineHeight:1.6,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <b style={{color:C.text}}>The PE thesis</b> — at current Rule of {s.rule40.toFixed(0)}, the exit multiple lands {exitMultLow}–{exitMultHigh}x ARR. Against a {targetEntryMult}x entry, that's {multipleExpansion>=50?'a strong multiple-expansion deal':multipleExpansion>=0?'an operate-up play (margin + growth, no multiple help)':'multiple compression risk — depends on margin gains'}. The number the LP partners care about: at year 5, what ARR × what multiple gets to the target gross MOIC?
      </div>
    </Card>

    {/* Q3 — Capital efficiency at scale */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · Capital efficiency · payback discipline</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:24}}>
      <Metric label="CAC Payback" value={`${allInPayback.toFixed(1)}mo`} sub={investablePE?"PE-fundable":allInPayback<=24?"VC-acceptable":"Inefficient"} color={investablePE?C.green:allInPayback<=24?C.amber:C.red} delay={0}/>
      <Metric label="LTV : CAC" value={`${s.ltvCac.toFixed(1)}x`} sub={s.ltvCac>=4?"PE-grade":s.ltvCac>=3?"Acceptable":"Tight"} color={s.ltvCac>=4?C.green:s.ltvCac>=3?C.amber:C.red} delay={1}/>
      <Metric label="NRR" value={`${nrr}%`} sub={nrrHealthy?"Expansion engine":nrrAcceptable?"Holding":"Churn problem"} color={nrrHealthy?C.green:nrrAcceptable?C.amber:C.red} delay={2}/>
      <Metric label="Magic Number" value={s.magicNumber.toFixed(2)} sub={s.magicNumber>=1?"Re-invest more":s.magicNumber>=0.75?"Efficient":"Slow it down"} color={s.magicNumber>=1?C.green:s.magicNumber>=0.75?C.amber:C.red} delay={3}/>
    </div>

    {/* Q4 — Operational levers */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Operational levers · where margin expands</div>
    <Card>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(2,1fr)",gap:14}}>
        <div style={{padding:14,background:C.surface,borderRadius:6}}>
          <div style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{sandmRev>40?"◆ S&M efficiency":"◇ S&M efficient"}</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>S&M is <b>{sandmRev.toFixed(0)}%</b> of revenue. {sandmRev>50?"Heavy spend — primary margin lever. A 10pp reduction adds 10pp to op margin.":sandmRev>40?"Above PE-comfortable. Consolidate channels, rationalize AE bench, push for inbound mix.":"Already efficient — protect this; further cuts risk pipeline."}</div>
        </div>
        <div style={{padding:14,background:C.surface,borderRadius:6}}>
          <div style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{nrrHealthy?"◇ Retention engine":"◆ NRR opportunity"}</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>NRR is <b>{nrr}%</b>. {nrrHealthy?"Expansion is doing real work — the cheapest revenue you'll book. Defend it.":nrrAcceptable?"Holding ground but not expanding. Customer success investment likely under-funded.":"Below 100% — paying CAC to backfill churn. The most expensive way to grow."}</div>
        </div>
        <div style={{padding:14,background:C.surface,borderRadius:6}}>
          <div style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{grossMargin>=75?"◇ Gross margin solid":"◆ Gross margin lever"}</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>Gross margin is <b>{grossMargin.toFixed(0)}%</b>. {grossMargin>=80?"SaaS-elite. Multiple expansion friendly.":grossMargin>=70?"Standard SaaS. Push toward 80% via infra optimization, fewer pro-services.":"Services-heavy or unit-cost-heavy. Restructure the COGS line or accept lower multiples."}</div>
        </div>
        <div style={{padding:14,background:C.surface,borderRadius:6}}>
          <div style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{ruleOf50?"◇ Composite score":"◆ Composite focus"}</div>
          <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>Rule of {s.rule40.toFixed(0)}. {ruleOf60?"Top-decile composite — keep both arms working.":ruleOf50?"PE-fundable composite. Hold the line; small operating gains compound into multiple expansion.":"Below 50. Bias toward margin over growth — investors pay for efficient growth, not growth-at-any-cost."}</div>
        </div>
      </div>
    </Card>
  </div>);
}


// ════════════════════════════════════════════════════════════
// BOARD MEMBER PERSONA VIEW
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Where are we vs plan — quarterly waterfall?  → Quarterly target/closing table
//   Q2: Biggest leading-indicator miss?              → Top-priority threat (shared with CEO)
//   Q3: Quota attainment trend?                      → Required attainment in context
//   Q4: Underinvesting or burning toward death?      → S&M band (shared with CFO)
//   Q5: Are the assumptions defensible?              → Key assumptions panel
// ════════════════════════════════════════════════════════════
function BoardPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, quarterlyTargets } = model;
  const att = s.attainmentRequired || 100;
  const attColor = att <= 100 ? C.green : att <= 120 ? C.amber : C.red;
  const sAndMZone = s.totalSAndMPct < 30 ? "underinvest" : s.totalSAndMPct > 60 ? "burn" : s.totalSAndMPct > 55 ? "stretch" : "growth";
  const sAndMZoneColor = sAndMZone === "underinvest" ? C.amber : sAndMZone === "burn" ? C.red : sAndMZone === "stretch" ? C.amber : C.green;
  const sAndMVerdict = sAndMZone === "burn" ? "Burning toward death" : sAndMZone === "underinvest" ? "Underinvesting" : sAndMZone === "stretch" ? "Stretch zone" : "Healthy growth investment";
  // Biggest miss — same priority chain as CEO
  let issue;
  if (s.totalSAndMPct > 60) issue = "S&M burn at " + s.totalSAndMPct.toFixed(1) + "%";
  else if (att > 120) issue = "Capacity gap — " + att.toFixed(0) + "% AE attainment required";
  else if (s.funnelGrade === "D") issue = "Funnel grade D";
  else if (s.coverageHealth === "bad") issue = "Pipeline coverage insufficient";
  else if (s.cacPayback > 36) issue = "CAC payback " + s.cacPayback.toFixed(0) + "mo";
  else issue = null;
  return(<div>
    <Header title="Board View" sub="Where we are vs plan, biggest miss, attainment posture, investment band, key assumptions" icon={Shield} moduleId="board" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={mobile}/>
    
    {/* Q1 — Quarterly waterfall */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Where are we vs plan — quarterly waterfall</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:`140px repeat(${Math.min((quarterlyTargets||[]).length,8)},1fr)`,gap:8}}>
        <div></div>
        {(quarterlyTargets||[]).slice(0,8).map(q=>(
          <div key={q.quarter} style={{fontSize:9,fontWeight:700,color:q.isCurrentYear?C.text:C.dim,textTransform:"uppercase",letterSpacing:"0.06em",textAlign:"center"}}>{q.quarter}</div>
        ))}
        <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>Closing deals</div>
        {(quarterlyTargets||[]).slice(0,8).map((q,i)=>(
          <div key={i} style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{q.closingDeals||0}</div>
        ))}
        <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>SQOs needed</div>
        {(quarterlyTargets||[]).slice(0,8).map((q,i)=>(
          <div key={i} style={{fontSize:13,fontWeight:600,color:C.blue,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{q.sqosNeeded||0}</div>
        ))}
        <div style={{fontSize:10,color:C.muted,fontFamily:"'Chivo Mono',monospace"}}>MQLs needed</div>
        {(quarterlyTargets||[]).slice(0,8).map((q,i)=>(
          <div key={i} style={{fontSize:13,fontWeight:600,color:C.violet,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}>{q.mqlsNeeded||0}</div>
        ))}
      </div>
      <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
        Quarterly waterfall: deals close in their quarter; SQOs come from <strong style={{color:C.text}}>{inputs.sqoLeadQuarters||2} quarter(s) earlier</strong>; MQLs lead SQOs by <strong style={{color:C.text}}>{inputs.mqlLeadQuarters||1}</strong>. Quarter labels marked <span style={{color:C.text}}>brighter</span> are the current planning year.
      </div>
    </Card>
    
    {/* Q2 — Biggest miss */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Biggest leading-indicator miss</div>
    <Card style={{marginBottom:24,borderLeft:`3px solid ${issue?C.amber:C.green}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:240}}>
          <h3 style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.2}}>{issue || "No critical leading-indicator misses"}</h3>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            {issue ? "Surfaces the single highest-priority signal from the Governance Spine. For the full prioritized verdict list across all six domains (P&L, Stage, ICP, Coverage, Attribution, Forecast), open the Spine module." : "All governance domains are within thresholds at current inputs. Standard quarterly review applies."}
          </div>
        </div>
        <div style={{fontSize:10,color:C.dim,fontFamily:"'Chivo Mono',monospace",letterSpacing:"0.04em"}}>↘ Open Governance Spine</div>
      </div>
    </Card>
    
    {/* Q3 — Attainment trend */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · Implied AE attainment</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:24}}>
      <Metric label="Required Attainment" value={`${att.toFixed(0)}%`} sub={att<=100?"Realistic":att<=120?"Stretch":"Unrealistic"} color={attColor}/>
      <Metric label="AE Count" value={inputs.aeCount} sub={`Quota ${fmt(inputs.aeQuota)} each`} color={C.text}/>
      <Metric label="Attrition Rate" value={`${inputs.aeAttritionRate}%`} sub={`Loses ~${((inputs.aeAttritionRate/100)*inputs.aeCount).toFixed(1)} AEs/yr`} color={inputs.aeAttritionRate>=15?C.red:inputs.aeAttritionRate>=10?C.amber:C.green}/>
    </div>
    
    {/* Q4 — Investment posture */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Underinvesting in growth or burning toward death?</div>
    <Card style={{marginBottom:24,borderLeft:`3px solid ${sAndMZoneColor}`}}>
      <div style={{display:"flex",alignItems:"baseline",gap:18,marginBottom:8,flexWrap:"wrap"}}>
        <div style={{fontSize:36,fontWeight:700,color:sAndMZoneColor,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>{s.totalSAndMPct.toFixed(1)}%</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>S&M ÷ revenue · <span style={{color:sAndMZoneColor}}>{sAndMVerdict}</span></div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Growth-stage benchmark: 30-55%. Above 60% is burn territory; below 30% is underinvestment relative to growth target.</div>
        </div>
      </div>
    </Card>
    
    {/* Q5 — Assumptions panel */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 · Are the assumptions defensible?</div>
    <Card style={{marginBottom:18}}>
      <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:14}}>
        {[
          { label: "Target ARR", value: fmt(s.targetARR), source: inputs.targetMode==="growthRate"?`${inputs.targetGrowthRate}% growth from ${fmt(inputs.startingARR)}`:"Set absolute" },
          { label: "Avg Deal Size", value: fmt(inputs.avgDealSize), source: "User input — verify against last 4 quarters of closed-won median" },
          { label: "Funnel Conversion (Inq→Won)", value: `${(s.effectiveFunnelYield*100).toFixed(2)}%`, source: `Compounded from 5 stage rates: ${inputs.inquiryToMqlRate}/${inputs.mqlToSqlRate}/${inputs.sqlToMeetingRate}/${inputs.meetingToSqoRate}/${inputs.sqoToWonRate}%` },
          { label: "AE Capacity", value: `${inputs.aeCount} × ${fmt(inputs.aeQuota)}`, source: `${inputs.aeRampMonths}mo ramp, ${inputs.aeAttritionRate}% attrition applied` },
          { label: "NRR", value: `${inputs.nrrPercent}%`, source: "Retention assumption — used to compute retained ARR" },
          { label: "CAC Payback Target", value: `${inputs.cacPaybackTarget||24}mo`, source: "Benchmark — mid-market cyber 18-30mo" },
        ].map((row,i)=>(
          <div key={i} style={{padding:10,background:C.bg,borderRadius:0,borderLeft:`2px solid ${C.borderMid}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.04em"}}>{row.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{row.value}</span>
            </div>
            <div style={{fontSize:10,color:C.dim,lineHeight:1.5}}>{row.source}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
        Defensibility = sourcing. Each row's "source" line tells you whether it's an input, a benchmark, or a derived number. Inputs the team can't sourcing back to recent data are the ones to challenge.
      </div>
    </Card>
    
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Board surface intentionally light — most board members read on phones at midnight. Drill-in via the full module tree.
    </div>
  </div>);
}


// ════════════════════════════════════════════════════════════
// REVOPS PERSONA VIEW — the operator who knows it all
// First-5-min questions (from docs/PERSONA-AND-DATA-AUDIT.md §1):
//   Q1: Where's the funnel breaking and by how much?  → Funnel grade + worst stage
//   Q2: Cost per SQO / cost per Won by channel?       → Channel CAC table
//   Q3: Theoretical vs effective capacity gap?         → Capacity loss decomposition
//   Q4: Where is the model floor-bound?                → Floor-bound flags consolidated
//   Q5: Next 5pp of conversion improvement?            → Highest-leverage stage
// ════════════════════════════════════════════════════════════
function RevOpsPage({model, inputs, onInfoClick, mobile}){
  const { summary: s, funnelHealth, channels, monthly } = model;
  // Q1 — worst funnel stage
  const worstStage = (funnelHealth||[]).filter(f=>f.status==="bad").sort((a,b)=>(b.bench.good-b.rate)-(a.bench.good-a.rate))[0]
    || (funnelHealth||[]).filter(f=>f.status==="good").sort((a,b)=>(b.bench.great-b.rate)-(a.bench.great-a.rate))[0];
  // Q3 — capacity decomposition
  const fullCap = inputs.aeCount * inputs.aeQuota;
  const rampLoss = s.totalRampLoss || 0;
  const attrLoss = s.totalAttrLoss || 0;
  const effCap = fullCap - rampLoss - attrLoss;
  // Q4 — floor-bound flags
  const floorFlags = [];
  if (s.salesIsFloorBound) floorFlags.push({label:"Sales budget", detail:`Headcount cost (${fmt(s.salesHeadcountFloor)}) exceeds formula (${fmt(s.salesOpex)}) by ${fmt(s.salesFloorDelta)}`});
  if (s.fixedMktgIsFloorBound) floorFlags.push({label:"Fixed marketing", detail:`Minimum viable team costs exceed formula allocation. Floor: ${s.floorPctOfRev?.toFixed(1)}% of revenue.`});
  // Q5 — highest-leverage stage (largest absolute gap from "great")
  const leverage = (funnelHealth||[]).map(f=>({stage:f.stage, gap:f.bench.great-f.rate, current:f.rate, target:f.bench.great})).filter(x=>x.gap>0).sort((a,b)=>b.gap-a.gap)[0];
  // Q2 — top channels by cost-per-SQO
  const channelsSorted = [...(channels||[])].sort((a,b)=>b.spend-a.spend).slice(0,5);
  return(<div>
    <Header title="RevOps View" sub="Funnel diagnostic, channel economics, capacity decomposition, floor-bound flags, leverage points" icon={Zap} moduleId="revops" onInfoClick={onInfoClick}/>
    <DataConfidenceCallout inputs={inputs}/>
    
    {/* Q1 — Funnel break */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q1 · Where's the funnel breaking?</div>
    <div style={{display:"grid",gridTemplateColumns:mobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:mobile?8:12,marginBottom:14}}>
      <Metric label="Funnel Grade" value={s.funnelGrade} sub={`Score ${s.overallFunnelScore}/${s.maxFunnelScore}`} color={s.funnelGrade==="A"?C.green:s.funnelGrade==="B"?C.accent:s.funnelGrade==="C"?C.amber:C.red}/>
      <Metric label="Inq → Won" value={`${(s.inquiryToWonRate||0).toFixed(2)}%`} sub={`1 deal per ${Math.round(100/(s.inquiryToWonRate||0.01))} inq`} color={C.violet}/>
      <Metric label="Cost / SQO" value={fmt(s.costPerSqo||0)} sub={`vs $${(inputs.cpSqoBenchmark||12000).toLocaleString()} bench`} color={(s.costPerSqo||0)>(inputs.cpSqoBenchmark||12000)?C.red:C.green}/>
      <Metric label="Cycle Days" value={s.totalCycleDays||0} sub={s.totalCycleDays>120?"Slow":"Normal"} color={s.totalCycleDays>120?C.amber:C.green}/>
    </div>
    {worstStage && (
      <Card style={{marginBottom:24,borderLeft:`3px solid ${worstStage.status==="bad"?C.red:C.amber}`}}>
        <div style={{display:"flex",alignItems:"baseline",gap:14,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:240}}>
            <div style={{fontSize:9,fontWeight:700,color:worstStage.status==="bad"?C.red:C.amber,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Weakest stage</div>
            <h3 style={{fontSize:17,fontWeight:600,color:C.text,marginBottom:6}}>{worstStage.stage} at <span style={{color:worstStage.status==="bad"?C.red:C.amber}}>{worstStage.rate}%</span></h3>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Good benchmark: {worstStage.bench.good}% · Great: {worstStage.bench.great}%. Gap to good: <strong style={{color:C.text}}>{Math.max(0,worstStage.bench.good-worstStage.rate)}pp</strong>. Compounds through every downstream stage.</div>
          </div>
        </div>
      </Card>
    )}
    
    {/* Q2 — Channel CAC */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q2 · Channel cost-per-SQO and cost-per-won</div>
    <Card style={{marginBottom:24}}>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr repeat(4,1fr)",gap:8,padding:"6px 0",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.borderMid}`}}>
        <div>Channel</div><div style={{textAlign:"right"}}>Spend</div><div style={{textAlign:"right"}}>Cost/SQO</div><div style={{textAlign:"right"}}>CAC</div><div style={{textAlign:"right"}}>ROI</div>
      </div>
      {channelsSorted.map((ch,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1.5fr repeat(4,1fr)",gap:8,padding:"9px 0",borderBottom:i<channelsSorted.length-1?`1px solid ${C.borderMid}`:"none",fontSize:11,alignItems:"baseline"}}>
          <div style={{color:C.text,fontWeight:500}}>{ch.name}</div>
          <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.text}}>{fmt(ch.spend)}</div>
          <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:ch.costPerSqo>(inputs.cpSqoBenchmark||12000)?C.amber:C.green}}>{fmt(ch.costPerSqo)}</div>
          <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.text}}>{fmt(ch.cac)}</div>
          <div style={{textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:ch.roi>=2?C.green:ch.roi>=1?C.amber:C.red,fontWeight:600}}>{ch.roi?ch.roi.toFixed(1):"0"}x</div>
        </div>
      ))}
    </Card>
    
    {/* Q3 — Capacity decomposition */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q3 · Theoretical vs effective capacity</div>
    <Card style={{marginBottom:24}}>
      {[
        { label: "Full Capacity (theoretical)", value: fullCap, color: C.text },
        { label: "− Ramp Loss", value: rampLoss, color: C.amber, negative: true },
        { label: "− Attrition Loss", value: attrLoss, color: C.red, negative: true },
        { label: "= Effective Capacity", value: effCap, color: effCap>=s.newARRNeeded?C.green:C.red },
        { label: "Target (New ARR Needed)", value: s.newARRNeeded, color: C.dim, dashed: true },
      ].map((row,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"200px 1fr 120px",gap:10,alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:11,color:row.color,fontWeight:row.label.startsWith("=")?700:500}}>{row.label}</div>
          <div style={{height:14,background:C.bg,borderRadius:0,position:"relative",overflow:"hidden"}}>
            <motion.div initial={{width:0}} animate={{width:`${Math.min(100,(Math.abs(row.value)/Math.max(fullCap,s.newARRNeeded))*100)}%`}} transition={{duration:0.5,delay:i*0.05}}
              style={{height:"100%",background:row.color,opacity:row.dashed?0:0.85,border:row.dashed?`1px dashed ${row.color}`:"none"}}/>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:row.color,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{row.negative?"−":""}{fmt(row.value)}</div>
        </div>
      ))}
    </Card>
    
    {/* Q4 — Floor-bound */}
    <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q4 · Where is the model floor-bound?</div>
    <Card style={{marginBottom:24}}>
      {floorFlags.length === 0 ? (
        <div style={{fontSize:12,color:C.green,padding:8,background:C.greenDim,borderLeft:`2px solid ${C.green}`}}>No floor-bound items. Formula-driven costs exceed minimum-viable team costs at this scale.</div>
      ) : (
        floorFlags.map((flag,i)=>(
          <div key={i} style={{padding:10,background:C.amberDim,borderLeft:`2px solid ${C.amber}`,marginBottom:i<floorFlags.length-1?8:0}}>
            <div style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{flag.label}</div>
            <div style={{fontSize:11,color:C.text,lineHeight:1.6}}>{flag.detail}</div>
          </div>
        ))
      )}
      <div style={{marginTop:floorFlags.length===0?0:14,fontSize:10,color:C.dim,lineHeight:1.6}}>
        Floor-bound = the people you've hired cost more than the % model allocates. Resolves as revenue grows OR by reducing headcount. Early-stage expectation.
      </div>
    </Card>
    
    {/* Q5 — Highest-leverage improvement */}
    {leverage && (
      <>
        <div style={{marginBottom:8,fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Q5 · Next 5pp of conversion improvement</div>
        <Card style={{marginBottom:18,borderLeft:`3px solid ${C.accent}`}}>
          <div style={{display:"flex",alignItems:"baseline",gap:14,marginBottom:10,flexWrap:"wrap"}}>
            <div style={{fontSize:32,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace",lineHeight:1}}>+{leverage.gap}pp</div>
            <div style={{flex:1,minWidth:240}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{leverage.stage} · {leverage.current}% → {leverage.target}%</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Largest absolute gap to "great" benchmark. Fixing this stage compounds through every downstream conversion — highest dollar leverage in the funnel.</div>
            </div>
          </div>
        </Card>
      </>
    )}
    
    <div style={{marginTop:24,paddingTop:14,borderTop:`1px solid ${C.borderMid}`,fontSize:9,color:C.dim,lineHeight:1.7,letterSpacing:"0.04em"}}>
      Persona view · Diagnostic surface. The deepest persona — open Funnel Health, Pipeline, Channel Mix, Sales Model for the underlying mechanics.
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// FUNNEL HEALTH
// ════════════════════════════════════════════════════════════
function FunnelHealthPage({model,inputs,setInputs,onInfoClick,mobile}){
  const{funnelHealth,summary:s}=model;
  const bk=["inquiryToMqlRate","mqlToSqlRate","sqlToMeetingRate","meetingToSqoRate","sqoToWonRate"];
  const bl=["Inquiry→MQL","MQL→SQL","SQL→Meeting (Held)","Meeting→SQO","SQO→Won"];
  return(<div>
    <Header title="Funnel Health" sub="Conversion benchmarks, compression metrics, and stage-level diagnostics" icon={Heart} moduleId="funnelHealth" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
      <Metric label="Overall Grade" value={s.funnelGrade} sub={`Score: ${s.overallFunnelScore}/${s.maxFunnelScore}`} color={s.funnelGrade==="A"?C.green:s.funnelGrade==="B"?C.accent:C.amber}/>
      <Metric label="Pipeline Coverage" value={`${inputs.pipelineCoverage}%`} sub={s.coverageHealth==="good"?"Healthy":"Needs attention"} color={s.coverageHealth==="good"?C.green:s.coverageHealth==="warning"?C.amber:C.red}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`1 deal per ${Math.round(1/s.effectiveFunnelYield)} inquiries`} color={C.accent}/>
    </div>

    {/* Engine Output — Compression Metrics */}
    <Card style={{marginBottom:20,borderLeft:`3px solid ${C.accent}`}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Engine Output — Compression Metrics</h3>
      <div style={{fontSize:10,color:C.dim,marginBottom:14}}>True revenue yield of the engine. Compounded from each stage — not averages, not estimates.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Inquiry → SQO</div>
          <div style={{fontSize:18,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{s.inquiryToSqoRate.toFixed(2)}%</div>
          <div style={{fontSize:8,color:C.muted,marginTop:2}}>1 SQO per {Math.round(100/s.inquiryToSqoRate)} inquiries</div>
        </div>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Inquiry → Won</div>
          <div style={{fontSize:18,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace"}}>{s.inquiryToWonRate.toFixed(2)}%</div>
          <div style={{fontSize:8,color:C.muted,marginTop:2}}>1 deal per {Math.round(100/s.inquiryToWonRate)} inquiries</div>
        </div>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Cost / SQO</div>
          <div style={{fontSize:18,fontWeight:700,color:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.costPerSqo)}</div>
          <div style={{fontSize:8,color:C.muted,marginTop:2}}>Programmatic spend ÷ SQOs</div>
        </div>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Cost / Won</div>
          <div style={{fontSize:18,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.costPerWon)}</div>
          <div style={{fontSize:8,color:C.muted,marginTop:2}}>Programmatic spend ÷ deals</div>
        </div>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>Required Inquiries</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fN(s.requiredInquiries)}</div>
          <div style={{fontSize:8,color:C.muted,marginTop:2}}>To hit {fmt(s.targetARR)} new ARR</div>
        </div>
      </div>
      <div style={{marginTop:10,padding:8,background:`${C.accent}08`,borderRadius:0,border:`1px solid ${C.accent}15`}}>
        <div style={{fontSize:9,color:C.muted}}><strong style={{color:C.accent}}>CEO lever:</strong> "How many net-new names do we need to hit ${fmt(s.targetARR)}?" → <strong style={{color:C.text}}>{fN(s.requiredInquiries)} inquiries</strong> at current conversion rates.</div>
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Stage Conversion Health</h3>
        {funnelHealth.map((f,i)=>{const pct=f.bench.great>0?Math.min(100,f.rate/f.bench.great*100):100;return(
          <div key={f.stage} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{f.stage}</span>
                <Badge label={f.status} status={f.status}/>
                {f.def && <span title={f.def} style={{fontSize:10,color:C.dim,cursor:"help"}}>ⓘ</span>}
              </div>
              <span style={{fontSize:14,fontWeight:700,color:f.status==="great"?C.green:f.status==="good"?C.accent:C.red,fontFamily:"'Chivo Mono',monospace"}}>{f.rate}%</span>
            </div>
            <div style={{position:"relative",height:20,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <div style={{position:"absolute",left:`${f.bench.good/f.bench.great*100}%`,top:0,bottom:0,width:1,background:C.amber,zIndex:2}}/>
              <motion.div initial={{width:0}} animate={{width:`${Math.min(pct,100)}%`}} transition={{duration:0.5,delay:i*0.06}}
                style={{height:"100%",background:f.status==="great"?C.green:f.status==="good"?C.accent:C.red,borderRadius:0,opacity:0.7}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
              <span style={{fontSize:8,color:C.dim}}>0%</span>
              <span style={{fontSize:8,color:C.amber}}>Good: {f.bench.good}%</span>
              <span style={{fontSize:8,color:C.green}}>Great: {f.bench.great}%</span>
            </div>
          </div>);})}
        {/* Meeting show rate inline */}
        <div style={{padding:8,background:C.bg,borderRadius:0,marginTop:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <span style={{fontSize:10,fontWeight:600,color:C.muted}}>Meeting Show Rate</span>
              <span title="SQL→Meeting tracks held meetings. Show rate converts set→held internally." style={{fontSize:10,color:C.dim,cursor:"help",marginLeft:4}}>ⓘ</span>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{s.meetingShowRate}%</span>
          </div>
          <div style={{fontSize:8,color:C.dim,marginTop:2}}>
            {fN(s.meetingsSetNeeded)} meetings set → {fN(s.meetingsNeeded)} held ({100-s.meetingShowRate}% no-show/cancel)
          </div>
        </div>
      </Card>
      <div>
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Pipeline Coverage Settings</h3>
          <Input label="Coverage Ratio" value={inputs.pipelineCoverage} onChange={v=>setInputs(p=>({...p,pipelineCoverage:v}))} suffix="%" step={10}/>
          <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:8,marginTop:8}}>Health Thresholds</div>
          <Input compact label="Green" value={inputs.coverageGreen} onChange={v=>setInputs(p=>({...p,coverageGreen:v}))} suffix="%" step={10}/>
          <Input compact label="Yellow" value={inputs.coverageYellow} onChange={v=>setInputs(p=>({...p,coverageYellow:v}))} suffix="%" step={10}/>
          <Input compact label="Red" value={inputs.coverageRed} onChange={v=>setInputs(p=>({...p,coverageRed:v}))} suffix="%" step={10}/>
          <div style={{marginTop:10,padding:10,background:C.bg,borderRadius:0,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:12,height:12,borderRadius:"50%",background:s.coverageHealth==="good"?C.green:s.coverageHealth==="warning"?C.amber:C.red}}/>
            <span style={{fontSize:13,fontWeight:700,color:C.text}}>{inputs.pipelineCoverage}%</span>
            <Badge label={s.coverageHealth} status={s.coverageHealth}/>
          </div>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Benchmark Thresholds</h3>
          {bk.map((key,i)=>(
            <div key={key} style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr",gap:6,marginBottom:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:C.muted}}>{bl[i]}</span>
              <div style={{display:"flex",alignItems:"center",gap:3,background:C.bg,borderRadius:0,padding:"3px 6px"}}>
                <span style={{fontSize:8,color:C.amber}}>G</span>
                <input type="number" value={inputs.funnelBenchmarks[key].good} onChange={e=>setInputs(p=>({...p,funnelBenchmarks:{...p.funnelBenchmarks,[key]:{...p.funnelBenchmarks[key],good:parseInt(e.target.value)||0}}}))}
                  style={{width:35,background:"transparent",border:"none",color:C.text,fontSize:11,fontFamily:"'Chivo Mono',monospace",outline:"none"}}/><span style={{fontSize:8,color:C.dim}}>%</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:3,background:C.bg,borderRadius:0,padding:"3px 6px"}}>
                <span style={{fontSize:8,color:C.green}}>★</span>
                <input type="number" value={inputs.funnelBenchmarks[key].great} onChange={e=>setInputs(p=>({...p,funnelBenchmarks:{...p.funnelBenchmarks,[key]:{...p.funnelBenchmarks[key],great:parseInt(e.target.value)||0}}}))}
                  style={{width:35,background:"transparent",border:"none",color:C.text,fontSize:11,fontFamily:"'Chivo Mono',monospace",outline:"none"}}/><span style={{fontSize:8,color:C.dim}}>%</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// CAC BREAKDOWN
// ════════════════════════════════════════════════════════════
function CACBreakdownPage({model,inputs,onInfoClick}){
  const{cacBreakdown,channels,summary:s}=model;
  const isSplit=inputs.revenueMode==="split";
  const pieData=Object.entries(cacBreakdown).map(([k,v],i)=>({name:v.label,value:v.spend,fill:C.chart[i]}));
  return(<div>
    <Header title="CAC Breakdown" sub="Acquisition cost decomposed by spend category and channel" icon={PieIcon} moduleId="cacBreakdown" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>
      <Metric label="Blended CAC" value={fmt(s.blendedCAC)} sub="New logo only" color={C.accent}/>
      {isSplit&&<Metric label="Fully Loaded CAC" value={fmt(s.fullyLoadedCAC)} sub="All motions" color={C.violet}/>}
      <Metric label="Total Acq Cost" value={fmt(s.totalAcquisitionCost)} sub="Mktg + SDR" color={C.amber}/>
      <Metric label="LTV:CAC" value={`${s.ltvCac.toFixed(1)}x`} color={s.ltvCac>3?C.green:C.amber}/>
      <Metric label="CAC Payback" value={`${s.cacPayback.toFixed(1)} mo`} color={s.cacPayback<18?C.green:C.red}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20}}>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Spend Composition</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
            {pieData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
          </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
        </ResponsiveContainer>
        {Object.entries(cacBreakdown).map(([k,v],i)=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.borderMid}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:C.chart[i]}}/><span style={{fontSize:11,color:C.text}}>{v.label}</span></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(v.spend)}</div><div style={{fontSize:9,color:C.dim}}>{v.pctOfTotal.toFixed(0)}% • {fmt(v.perDeal)}/deal</div></div>
          </div>
        ))}
      </Card>
      <Card>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Channel-Level CAC Economics</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["Channel","Spend","Deals","CAC","$/MQL","$/SQL","$/SQO","Payback","LTV:CAC"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
          <tbody>{channels.map((c,i)=><tr key={c.name}>
            <td style={{padding:"7px",textAlign:"right"}}><div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}><div style={{width:5,height:5,borderRadius:"50%",background:C.chart[i]}}/><span style={{color:C.text,fontWeight:600}}>{c.name}</span></div></td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(c.spend)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fN(c.deals)}</td>
            <td style={{padding:"7px",color:c.cac<s.blendedCAC?C.green:C.red,fontWeight:700,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(c.cac)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(c.costPerMql)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(c.costPerSql)}</td>
            <td style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(c.costPerSqo)}</td>
            <td style={{padding:"7px",color:c.cacPayback<18?C.green:C.red,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{c.cacPayback.toFixed(1)}mo</td>
            <td style={{padding:"7px",color:c.ltvCac>3?C.green:C.amber,fontWeight:700,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{c.ltvCac.toFixed(1)}x</td>
          </tr>)}</tbody>
        </table></div>
      </Card>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// S&M BUDGET (CFO VIEW)
// ════════════════════════════════════════════════════════════
function SandMBudgetPage({model,inputs,setInputs,onInfoClick}){
  const{pnl:p,summary:s}=model;
  const salesItems = p.salesBudgetItems || [];
  const mktgItems = p.fixedMktgItems || [];

  // Combined S&M
  const totalSales = p.salesBudgetActual || p.salesOpex;
  const totalMktg = p.totalMktgBudget;
  const totalSandM = totalSales + totalMktg;
  const sandMPctRev = p.totalRevenue > 0 ? totalSandM / p.totalRevenue * 100 : 0;
  const salesPctRev = p.totalRevenue > 0 ? totalSales / p.totalRevenue * 100 : 0;
  const mktgPctRev = p.totalRevenue > 0 ? totalMktg / p.totalRevenue * 100 : 0;

  // Total headcount
  const salesHeads = (p.aeCount||0) + (p.sdrCount||0) + (p.seCount||0);
  const revPerSalesHead = salesHeads > 0 ? p.totalRevenue / salesHeads : 0;
  const costPerDeal = s.dealsNeeded > 0 ? totalSandM / s.dealsNeeded : 0;

  // Health
  const healthColor = sandMPctRev > 60 ? C.red : sandMPctRev < 30 ? C.amber : C.green;
  const healthLabel = sandMPctRev > 60 ? "BURN RISK" : sandMPctRev < 30 ? "UNDERINVEST" : "HEALTHY";

  // Pie data for S vs M split
  const splitData = [
    {name:"Sales", value:totalSales, fill:C.accent},
    {name:"Marketing", value:totalMktg, fill:C.violet},
  ];

  return(<div>
    <Header title="S&M Budget" sub="Combined Sales & Marketing — the CFO view" icon={DollarSign} moduleId="sandmBudget" onInfoClick={onInfoClick}/>

    {/* Health banner */}
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderRadius:0,marginBottom:20,
      background:`${healthColor}08`,border:`1px solid ${healthColor}20`}}>
      <div style={{padding:"6px 14px",borderRadius:0,background:healthColor,color:"#fff",fontSize:11,fontWeight:700}}>{healthLabel}</div>
      <div style={{fontSize:13,color:C.text}}>Total S&M: <strong style={{fontFamily:"'Chivo Mono',monospace"}}>{fmt(totalSandM)}</strong> = <strong>{sandMPctRev.toFixed(1)}%</strong> of revenue</div>
      <div style={{marginLeft:"auto",fontSize:10,color:C.dim}}>Benchmark: 35-55% growth stage • &gt;60% = burn risk</div>
    </div>

    {/* Top metrics */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Total S&M" value={fmt(totalSandM)} sub={`${sandMPctRev.toFixed(1)}% of rev`} color={healthColor}/>
      <Metric label="Sales Budget" value={fmt(totalSales)} sub={`${salesPctRev.toFixed(1)}% of rev`} color={C.accent}/>
      <Metric label="Mktg Budget" value={fmt(totalMktg)} sub={`${mktgPctRev.toFixed(1)}% of rev`} color={C.violet}/>
      <Metric label="S&M per Deal" value={fmt(costPerDeal)} sub={`${fN(s.dealsNeeded)} deals`} color={C.amber}/>
      <Metric label="Rev / Sales HC" value={fmt(revPerSalesHead)} sub={`${salesHeads} heads`} color={C.green}/>
      <Metric label="Sales:Mktg Ratio" value={`${(totalSales/Math.max(totalMktg,1)).toFixed(1)}:1`} sub="spend ratio" color={C.blue}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
      {/* Sales Budget Breakdown */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sales Budget</h3>
          {p.salesIsFloorBound && <div style={{padding:"3px 8px",borderRadius:0,background:`${C.red}15`,fontSize:9,fontWeight:700,color:C.red}}>FLOOR-BOUND +{fmt(p.salesFloorDelta)}</div>}
        </div>
        {salesItems.map((si,i)=>{
          const barW = p.salesBudgetActual > 0 ? si.amount / p.salesBudgetActual * 100 : 0;
          return(<div key={si.name} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{si.name}</span>
                {si.isFloorBound && <span style={{fontSize:8,color:C.amber,fontWeight:700}}>▲ FLOOR</span>}
                {si.headcount && <span style={{fontSize:9,color:C.dim}}>({si.headcount} × {fmt(si.perHead)})</span>}
              </div>
              <span style={{fontSize:13,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(si.amount)}</span>
            </div>
            <div style={{height:16,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:si.isFloorBound?`linear-gradient(90deg,${C.accent},${C.amber})`:C.accent,borderRadius:0,opacity:0.7}}/>
            </div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>{si.desc}</div>
          </div>);
        })}
        <div style={{height:1,background:C.borderMid,margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
          <span style={{fontSize:11,fontWeight:600,color:C.text}}>Total Sales</span>
          <span style={{fontSize:13,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(totalSales)}</span>
        </div>
        <div style={{fontSize:9,color:C.dim}}>Formula ({inputs.salesOpexPct}% of rev): {fmt(p.salesOpex)} • Actual: {fmt(totalSales)}{p.salesIsFloorBound?" — headcount exceeds formula":""}</div>
      </Card>

      {/* Marketing Budget Summary */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Budget</h3>
          {p.fixedMktgIsFloorBound && <div style={{padding:"3px 8px",borderRadius:0,background:`${C.red}15`,fontSize:9,fontWeight:700,color:C.red}}>FLOOR-BOUND</div>}
        </div>
        {[
          {name:"Programmatic (Channel)", amount:p.programmaticBudget, color:C.green, desc:"Paid media, events — buys inquiries"},
          {name:"Martech (Variable)", amount:p.martechSpend, color:C.blue, desc:"Intent data, enrichment, MAP overage"},
          ...mktgItems.map(fi=>({name:fi.name, amount:fi.amount, color:C.violet, desc:fi.desc, isFloor:fi.isFloorBound})),
        ].map((item,i)=>{
          const barW = totalMktg > 0 ? item.amount / totalMktg * 100 : 0;
          return(<div key={item.name} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:item.color}}/>
                <span style={{fontSize:11,fontWeight:600,color:C.text}}>{item.name}</span>
                {item.isFloor && <span style={{fontSize:8,color:C.amber,fontWeight:700}}>▲ FLOOR</span>}
              </div>
              <span style={{fontSize:12,fontWeight:600,color:item.color,fontFamily:"'Chivo Mono',monospace"}}>{fmt(item.amount)}</span>
            </div>
            <div style={{height:12,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:item.color,borderRadius:0,opacity:0.6}}/>
            </div>
          </div>);
        })}
        <div style={{height:1,background:C.borderMid,margin:"10px 0"}}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
          <span style={{fontSize:11,fontWeight:600,color:C.text}}>Total Marketing</span>
          <span style={{fontSize:13,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace"}}>{fmt(totalMktg)}</span>
        </div>
      </Card>
    </div>

    {/* Combined S&M waterfall */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>S&M P&L Waterfall</h3>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",height:200,padding:"0 20px"}}>
        {[
          {label:"Revenue", value:p.totalRevenue, color:C.green, full:true},
          {label:"COGS", value:p.cogsAmount, color:C.red, neg:true},
          {label:"Gross Profit", value:p.grossProfit, color:C.green, full:true},
          {label:"Sales", value:totalSales, color:C.accent, neg:true},
          {label:"Marketing", value:totalMktg, color:C.violet, neg:true},
          {label:"G&A", value:p.gAndA, color:C.dim, neg:true},
          {label:"R&D", value:p.rAndD, color:C.dim, neg:true},
          {label:"Op Income", value:p.operatingIncome, color:p.operatingIncome>=0?C.green:C.red, full:true},
        ].map((bar,i)=>{
          const maxVal = p.totalRevenue;
          const h = maxVal > 0 ? Math.abs(bar.value) / maxVal * 160 : 0;
          return(<div key={bar.label} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:700,color:bar.color,fontFamily:"'Chivo Mono',monospace",marginBottom:4}}>{fmt(bar.value)}</div>
            <div style={{height:h,background:bar.neg?`${bar.color}40`:bar.color,borderRadius:0,marginBottom:2,opacity:bar.full?1:0.7}}/>
            <div style={{fontSize:8,color:C.dim,marginTop:4,lineHeight:1.2}}>{bar.label}</div>
          </div>);
        })}
      </div>
    </Card>

    {/* Leadership Cost Layer */}
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <h3 style={{fontSize:11,fontWeight:700,color:C.red,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Leadership Cost Layer</h3>
          <div style={{fontSize:10,color:C.muted}}>Step function — driven by funding stage, not revenue. Board-mandated comp bands.</div>
        </div>
        <div style={{padding:"6px 12px",borderRadius:0,background:`${C.red}12`,border:`1px solid ${C.red}30`}}>
          <div style={{fontSize:14,fontWeight:700,color:C.red,fontFamily:"'Chivo Mono',monospace"}}>{(p.leadershipPctOfRev||0).toFixed(1)}%</div>
          <div style={{fontSize:8,color:C.dim}}>of revenue</div>
        </div>
      </div>

      {/* Funding stage selector */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["bootstrapped","seed","seriesA","seriesB","seriesC"].map(fs=>{
          const isActive = (inputs.fundingStage||"seriesB") === fs;
          const labels = {bootstrapped:"Bootstrapped",seed:"Seed",seriesA:"Series A",seriesB:"Series B",seriesC:"Series C+"};
          return(<button key={fs} onClick={()=>setInputs(prev=>({...prev,fundingStage:fs}))}
            style={{padding:"6px 14px",borderRadius:0,border:`1px solid ${isActive?C.accent:C.borderMid}`,
              background:isActive?C.accentDim:"transparent",color:isActive?C.accent:C.muted,
              cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'TWK Everett',sans-serif"}}>
            {labels[fs]}
          </button>);
        })}
      </div>

      {/* Leadership table */}
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Role","OTE","Loaded","Sits In","% of Rev","Status"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>
        )}</tr></thead>
        <tbody>
          {(p.leadershipDetail||[]).map(l=>{
            const pctRev = p.totalRevenue > 0 ? l.loaded / p.totalRevenue * 100 : 0;
            const sitsColor = l.sitsIn==="Sales"?C.accent:l.sitsIn==="Marketing"?C.violet:l.sitsIn==="R&D"?C.blue:C.dim;
            return(<tr key={l.role} style={{opacity:l.enabled?1:0.35}}>
              <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:l.enabled?C.text:C.dim}}>{l.role}</td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(l.ote)}</td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:l.enabled?C.text:C.dim}}>{fmt(l.loaded)}</td>
              <td style={{padding:"10px",textAlign:"right"}}><span style={{padding:"2px 8px",borderRadius:0,background:`${sitsColor}15`,color:sitsColor,fontSize:9,fontWeight:600}}>{l.sitsIn}</span></td>
              <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:pctRev>5?C.red:C.text}}>{l.enabled?pctRev.toFixed(1)+"%":"—"}</td>
              <td style={{padding:"10px",textAlign:"right"}}>
                <button onClick={()=>setInputs(prev=>{
                  const roles = {...(prev.leadershipRoles||{vpSales:true,vpMarketing:true,vpCS:true,vpOps:false,vpProduct:false})};
                  const key = l.role.includes("Sales")?"vpSales":l.role.includes("Marketing")?"vpMarketing":l.role.includes("CS")?"vpCS":l.role.includes("Ops")?"vpOps":"vpProduct";
                  roles[key] = !roles[key];
                  return {...prev, leadershipRoles: roles};
                })} style={{padding:"3px 10px",borderRadius:0,border:`1px solid ${l.enabled?C.green:C.borderMid}`,
                  background:l.enabled?`${C.green}15`:"transparent",color:l.enabled?C.green:C.dim,
                  cursor:"pointer",fontSize:9,fontWeight:600,fontFamily:"'TWK Everett',sans-serif"}}>
                  {l.enabled?"Active":"Add"}
                </button>
              </td>
            </tr>);
          })}
          <tr style={{borderTop:`2px solid ${C.borderMid}`}}>
            <td style={{padding:"10px",textAlign:"right",fontWeight:700,color:C.text}}>Total Leadership</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:C.red}}>{fmt(p.totalLeadershipCost)}</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:(p.leadershipPctOfRev||0)>15?C.red:C.text}}>{(p.leadershipPctOfRev||0).toFixed(1)}%</td>
            <td style={{padding:"10px"}}/>
          </tr>
        </tbody>
      </table></div>
      <div style={{marginTop:10,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {[
          {label:"In Sales", value:p.leadershipInSales, color:C.accent},
          {label:"In Marketing", value:p.leadershipInMktg, color:C.violet},
          {label:"In G&A", value:p.leadershipInGA, color:C.dim},
          {label:"In R&D", value:p.leadershipInRD, color:C.blue},
        ].map(b=>(<div key={b.label} style={{padding:8,background:C.bg,borderRadius:0,textAlign:"center"}}>
          <div style={{fontSize:9,color:C.dim}}>{b.label}</div>
          <div style={{fontSize:14,fontWeight:700,color:b.color,fontFamily:"'Chivo Mono',monospace"}}>{fmt(b.value)}</div>
        </div>))}
      </div>
    </Card>

    {/* Headcount & Comp Detail */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>GTM Headcount & Comp</h3>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Role","Count","Per Head","Total Comp","Base (Fixed)","Variable","% of Rev"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>
        )}</tr></thead>
        <tbody>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.accent}}>AEs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{p.aeCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.aeFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmt(p.aeCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(p.aeCompFloor * (1 - inputs.salesVariablePct/100))}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.amber}}>{fmt(p.aeCompFloor * (inputs.salesVariablePct/100))}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:p.aeCompFloor/p.totalRevenue>0.3?C.red:C.text}}>{(p.aeCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.blue}}>SDRs/BDRs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{p.sdrCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.sdrFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmt(p.sdrCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(p.sdrCompFloor * 0.7)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.amber}}>{fmt(p.sdrCompFloor * 0.3)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{(p.sdrCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td style={{padding:"10px",textAlign:"right",fontWeight:600,color:C.green}}>SEs</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{p.seCount}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.seFullyLoaded)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmt(p.seCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(p.seCompFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.dim}}>—</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{(p.seCompFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
          <tr style={{borderTop:`2px solid ${C.borderMid}`}}>
            <td style={{padding:"10px",textAlign:"right",fontWeight:700,color:C.text}}>Total GTM</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{salesHeads}</td>
            <td style={{padding:"10px"}}/>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(p.salesHeadcountFloor)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700}}>{fmt(p.totalSalesFixedComp)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:C.amber}}>{fmt(p.totalSalesVariableComp)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:p.salesHeadcountFloor/p.totalRevenue>0.4?C.red:C.text}}>{(p.salesHeadcountFloor/p.totalRevenue*100).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table></div>
      {p.salesIsFloorBound && (
        <div style={{marginTop:12,padding:10,background:`${C.amber}08`,borderRadius:0,border:`1px solid ${C.amber}15`}}>
          <span style={{fontSize:10,color:C.amber,fontWeight:600}}>⚠ Headcount floor exceeds formula:</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:6}}>
            {inputs.salesOpexPct}% of revenue = {fmt(p.salesOpex)}, but {salesHeads} heads cost {fmt(p.salesHeadcountFloor)} in comp alone before tools/enablement/travel.
            Either raise salesOpexPct or reduce headcount.
          </span>
        </div>
      )}
    </Card>

    {/* Fixed vs Variable Split */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sales:Marketing Split</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart><Pie data={splitData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
            {splitData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
          </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
        </ResponsiveContainer>
        <div style={{textAlign:"center",marginTop:8}}>
          {splitData.map(d=>(
            <span key={d.name} style={{fontSize:10,color:d.fill,fontWeight:600,marginRight:16}}>
              <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:d.fill,marginRight:4}}/>
              {d.name}: {fmt(d.value)} ({(d.value/totalSandM*100).toFixed(0)}%)
            </span>
          ))}
        </div>
      </Card>
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fixed vs Variable (All S&M)</h3>
        {[
          {label:"Fixed Sales Comp", value:p.totalSalesFixedComp, color:C.accent},
          {label:"Variable Sales Comp", value:p.totalSalesVariableComp, color:C.amber},
          {label:"Sales Non-Comp", value:Math.max(0, totalSales - p.salesHeadcountFloor), color:C.dim},
          {label:"Fixed Marketing", value:p.fixedMktg, color:C.violet},
          {label:"Variable Marketing", value:p.variableMktg, color:C.green},
        ].map(item=>{
          const barW = totalSandM > 0 ? item.value / totalSandM * 100 : 0;
          return(<div key={item.label} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:10,color:C.text}}>{item.label}</span>
              <span style={{fontSize:11,fontWeight:600,color:item.color,fontFamily:"'Chivo Mono',monospace"}}>{fmt(item.value)}</span>
            </div>
            <div style={{height:10,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${barW}%`,background:item.color,borderRadius:0,opacity:0.6}}/>
            </div>
          </div>);
        })}
      </Card>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════════════
// MARKETING BUDGET (DETAIL)
// ════════════════════════════════════════════════════════════
const STRESS_MODES = [
  { id:"lean", label:"Lean Execution", fixedPct:30, color:C.green,
    desc:"Limited GTM change. Minimal RevOps remediation. Stable brand narrative. No major platform migrations." },
  { id:"normal", label:"Normal Operating", fixedPct:38, color:C.amber,
    desc:"Active GTM optimization. RevOps remediation in progress. Brand refresh underway. Standard tooling lifecycle." },
  { id:"transform", label:"Transformation", fixedPct:45, color:C.red,
    desc:"Full GTM rebuild. Heavy RevOps investment. New positioning/messaging. Platform migration. Analyst relations." },
];

function MarketingBudgetPage({model,inputs,setInputs,onInfoClick}){
  const{pnl:p,summary:s}=model;
  const[debtTax,setDebtTax]=useState(0);
  const[simArr,setSimArr]=useState(Math.round(s.targetARR/1000000)||10);
  const currentMode = STRESS_MODES.find(m => m.fixedPct <= inputs.fixedMktgPct) || STRESS_MODES[0];
  const activeMode = STRESS_MODES.find(m => m.fixedPct === inputs.fixedMktgPct);

  // Base values from engine
  const totalBudget = p.totalMktgBudget;
  const variableBudget = p.variableMktg;
  const fixedBudget = p.fixedMktg;
  const programmatic = p.programmaticBudget;
  const martech = p.martechSpend;
  const fixedItems = p.fixedMktgItems || [];

  // Tactical debt tax: adds % on top of fixed overhead
  const debtTaxAmount = fixedBudget * (debtTax / 100);
  const adjustedFixedBudget = fixedBudget + debtTaxAmount;
  const adjustedTotalBudget = variableBudget + adjustedFixedBudget;
  const adjustedBurdenedCAC = s.dealsNeeded > 0 ? adjustedTotalBudget / s.dealsNeeded : 0;
  const adjustedPayback = adjustedBurdenedCAC > 0 ? adjustedBurdenedCAC / (inputs.avgDealSize / 12) : 0;

  // Sensitivity: what breaks at 30%, 38%, 45% fixed overhead
  const sensitivity = STRESS_MODES.map(mode => {
    const modeVariable = variableBudget; // variable stays constant
    const modeTotalMktg = modeVariable / (1 - mode.fixedPct / 100);
    const modeFixed = modeTotalMktg - modeVariable;
    const modeFixedWithDebt = modeFixed * (1 + debtTax / 100);
    const modeTotalWithDebt = modeVariable + modeFixedWithDebt;
    const modeCAC = s.dealsNeeded > 0 ? modeTotalWithDebt / s.dealsNeeded : 0;
    const modePayback = modeCAC > 0 ? modeCAC / (inputs.avgDealSize / 12) : 0;
    const modeOpex = p.gAndA + p.rAndD + p.salesOpex + modeTotalWithDebt;
    const modeOpIncome = p.grossProfit - modeOpex;
    const modeOpMargin = p.totalRevenue > 0 ? modeOpIncome / p.totalRevenue * 100 : 0;
    const modeSandM = p.salesOpex + modeTotalWithDebt;
    const modeSandMPct = p.totalRevenue > 0 ? modeSandM / p.totalRevenue * 100 : 0;
    // Required pipeline efficiency: if overhead is higher, you need better conversion to maintain payback
    const requiredSqoWin = modeCAC > 0 && inputs.avgDealSize > 0 ? Math.min(100, (inputs.avgDealSize / modeCAC) * (inputs.sqoToWonRate / 100) * 100) : 0;
    return { ...mode, totalMktg: modeTotalWithDebt, fixedAmount: modeFixedWithDebt, cac: modeCAC, payback: modePayback,
      opMargin: modeOpMargin, sandMPct: modeSandMPct, requiredSqoWin, isActive: mode.fixedPct === inputs.fixedMktgPct };
  });

  // Budget waterfall
  const waterfallData = [
    {name:"Total Mktg Budget", value: adjustedTotalBudget, fill: C.accent},
    {name:"Variable (Demand)", value: variableBudget, fill: C.amber},
    {name:"  Programmatic", value: programmatic, fill: C.green},
    {name:"  Martech", value: martech, fill: C.blue},
    {name:"Fixed (Overhead)", value: fixedBudget, fill: C.violet},
    ...fixedItems.map(fi => ({name:`  ${fi.name}`, value: fi.amount, fill: C.violet})),
    ...(debtTax > 0 ? [{name:"Tactical Debt Tax", value: debtTaxAmount, fill: C.red}] : []),
  ];

  // CAC layers
  const cacLayers = [
    {label:"Programmatic CAC", value: p.programmaticCAC, desc:"Channel spend ÷ deals", color: C.green},
    {label:"+ Martech CAC", value: p.martechLoadedCAC, desc:"Channel + martech ÷ deals", color: C.blue},
    {label:"Fully Burdened CAC", value: adjustedBurdenedCAC, desc:`All marketing${debtTax>0?" + debt tax":""} ÷ deals`, color: C.violet},
    {label:"All-In Blended", value: (s.dealsNeeded+s.expansionDeals)>0?adjustedTotalBudget/(s.dealsNeeded+s.expansionDeals):0, desc:"All marketing ÷ all deals (incl expansion)", color: C.amber},
  ];

  return(<div>
    <Header title="Marketing Budget" sub="Budget decomposition — stress testing, tactical debt, CAC layers" icon={DollarSign} moduleId="mktgBudget" onInfoClick={onInfoClick}/>

    {/* Fixed Marketing Stress Toggle */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fixed Overhead Stress Mode</h3>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {STRESS_MODES.map(mode=>{
          const isActive = inputs.fixedMktgPct === mode.fixedPct;
          return(<div key={mode.id} onClick={()=>setInputs(p=>({...p,fixedMktgPct:mode.fixedPct}))}
            style={{padding:16,borderRadius:0,cursor:"pointer",transition:"all 0.2s",
              background:isActive?`${mode.color}12`:"transparent",
              border:`2px solid ${isActive?mode.color:C.borderMid}`,
            }}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:isActive?mode.color:C.muted}}>{mode.label}</span>
              <span style={{fontSize:18,fontWeight:700,color:mode.color,fontFamily:"'Chivo Mono',monospace"}}>{mode.fixedPct}%</span>
            </div>
            <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{mode.desc}</div>
          </div>);
        })}
      </div>
    </Card>

    {/* Top metrics */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Total Marketing" value={fmt(adjustedTotalBudget)} sub={`${(adjustedTotalBudget/p.totalRevenue*100).toFixed(1)}% of rev`} color={C.accent}/>
      <Metric label="Variable (Demand)" value={fmt(variableBudget)} sub={`${inputs.variableMktgPct}% of rev`} color={C.amber}/>
      <Metric label="Programmatic" value={fmt(programmatic)} sub="Channel spend" color={C.green}/>
      <Metric label="Martech" value={fmt(martech)} sub={`${inputs.martechPctOfVariable||25}% of variable`} color={C.blue}/>
      <Metric label="Fixed Overhead" value={fmt(adjustedFixedBudget)} sub={debtTax>0?`${inputs.fixedMktgPct}% + ${debtTax}% debt`:`${inputs.fixedMktgPct}% of total mktg`} color={C.violet}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
      {/* Budget breakdown */}
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Budget Waterfall</h3>
        {waterfallData.map((item,i)=>{
          const indent = item.name.startsWith("  ");
          const pctOfTotal = adjustedTotalBudget > 0 ? item.value / adjustedTotalBudget * 100 : 0;
          return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:0,background:!indent&&i<5?C.bg:"transparent"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {indent&&<div style={{width:16}}/>}
              <div style={{width:8,height:8,borderRadius:"50%",background:item.fill}}/>
              <span style={{fontSize:indent?11:12,fontWeight:indent?400:600,color:indent?C.muted:C.text}}>{item.name.trim()}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:12,fontWeight:600,color:item.fill,fontFamily:"'Chivo Mono',monospace"}}>{fmt(item.value)}</span>
              <span style={{fontSize:9,color:C.dim,marginLeft:8}}>{pctOfTotal.toFixed(0)}%</span>
            </div>
          </div>);
        })}
        <div style={{height:1,background:C.borderMid,margin:"10px 0"}}/>
        <div style={{padding:"6px 10px"}}>
          <div style={{fontSize:9,color:C.dim,marginBottom:4}}>DRIVERS</div>
          <Input compact label="Variable Mktg % Rev" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
          <Input compact label="Martech % of Variable" value={inputs.martechPctOfVariable} onChange={v=>setInputs(p=>({...p,martechPctOfVariable:v}))} suffix="%" step={5}/>
          <Input compact label="Fixed Mktg % of Total" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={1}/>
        </div>
      </Card>

      {/* CAC Layers */}
      <Card>
        <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>CAC Layers (Increasing Burden)</h3>
        <div style={{fontSize:10,color:C.muted,marginBottom:14}}>Same deals, different cost denominators. Shows true acquisition cost at each burden level.</div>
        {cacLayers.map((cac,i)=>{
          const maxVal = Math.max(...cacLayers.map(c=>c.value));
          const barW = maxVal > 0 ? cac.value / maxVal * 100 : 0;
          return(<div key={cac.label} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:600,color:C.text}}>{cac.label}</span>
              <span style={{fontSize:14,fontWeight:700,color:cac.color,fontFamily:"'Chivo Mono',monospace"}}>{fmt(cac.value)}</span>
            </div>
            <div style={{height:20,background:C.bg,borderRadius:0,overflow:"hidden",position:"relative"}}>
              <div style={{height:"100%",width:`${barW}%`,background:cac.color,borderRadius:0,opacity:0.7}}/>
            </div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>{cac.desc}</div>
          </div>);
        })}
        <div style={{height:1,background:C.borderMid,margin:"12px 0"}}/>
        <div style={{padding:10,background:C.bg,borderRadius:0}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:C.dim}}>CAC Payback (Programmatic)</span>
            <span style={{fontSize:12,fontWeight:700,color:s.cacPayback<18?C.green:C.red,fontFamily:"'Chivo Mono',monospace"}}>{s.cacPayback.toFixed(1)} mo</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:10,color:C.dim}}>CAC Payback (Fully Burdened)</span>
            <span style={{fontSize:12,fontWeight:700,color:adjustedPayback<24?C.green:C.red,fontFamily:"'Chivo Mono',monospace"}}>{adjustedPayback.toFixed(1)} mo</span>
          </div>
        </div>
      </Card>
    </div>

    {/* Tactical Debt Tax */}
    <Card style={{marginBottom:18,borderLeft:`3px solid ${C.red}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:11,fontWeight:700,color:C.red,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Tactical Debt Tax</h3>
          <div style={{fontSize:10,color:C.muted,maxWidth:500}}>
            Hidden cost of accumulated GTM shortcuts — patched processes, legacy integrations, 
            manual workarounds, undocumented tribal knowledge. Applied as a surcharge on fixed overhead.
          </div>
        </div>
        <div style={{fontSize:28,fontWeight:700,color:debtTax>0?C.red:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{debtTax}%</div>
      </div>
      <div style={{marginBottom:14}}>
        <input type="range" min={0} max={20} step={2} value={debtTax} onChange={e=>setDebtTax(Number(e.target.value))}
          style={{width:"100%",accentColor:C.red,height:6,cursor:"pointer"}}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9,color:C.dim}}>0% — Clean ops</span>
          <span style={{fontSize:9,color:C.dim}}>10% — Normal tech debt</span>
          <span style={{fontSize:9,color:C.dim}}>20% — Legacy rebuild</span>
        </div>
      </div>
      {debtTax > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <div style={{padding:10,background:`${C.red}08`,borderRadius:0}}>
            <div style={{fontSize:9,color:C.dim}}>Debt Tax Cost</div>
            <div style={{fontSize:16,fontWeight:700,color:C.red,fontFamily:"'Chivo Mono',monospace"}}>{fmt(debtTaxAmount)}</div>
          </div>
          <div style={{padding:10,background:`${C.red}08`,borderRadius:0}}>
            <div style={{fontSize:9,color:C.dim}}>Burdened CAC Impact</div>
            <div style={{fontSize:16,fontWeight:700,color:C.red,fontFamily:"'Chivo Mono',monospace"}}>+{fmt(adjustedBurdenedCAC - p.fullyBurdenedCAC)}</div>
          </div>
          <div style={{padding:10,background:`${C.red}08`,borderRadius:0}}>
            <div style={{fontSize:9,color:C.dim}}>Payback Impact</div>
            <div style={{fontSize:16,fontWeight:700,color:C.red,fontFamily:"'Chivo Mono',monospace"}}>+{(adjustedPayback - (p.fullyBurdenedCAC/(inputs.avgDealSize/12))).toFixed(1)} mo</div>
          </div>
        </div>
      )}
    </Card>

    {/* Sensitivity: What Breaks First */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.amber,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sensitivity: What Breaks First?</h3>
      <div style={{fontSize:10,color:C.muted,marginBottom:14}}>Same variable spend, different fixed overhead assumptions{debtTax>0?` + ${debtTax}% debt tax`:""}.  Shows downstream impact on CAC, payback, margins, and required pipeline efficiency.</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{["Mode","Fixed OH","Total Mktg","Burdened CAC","Payback","Op Margin","S&M %","Status"].map(h=>
          <th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>
        )}</tr></thead>
        <tbody>{sensitivity.map(row=>{
          const paybackOk = row.payback < 24;
          const marginOk = row.opMargin > 0;
          const sandMOk = row.sandMPct < 60;
          const status = !marginOk ? "☠️ Negative margin" : !sandMOk ? "🔥 Burn risk" : !paybackOk ? "⚠️ Long payback" : "✅ Sustainable";
          const statusColor = !marginOk ? C.red : !sandMOk ? C.red : !paybackOk ? C.amber : C.green;
          return(<tr key={row.id} style={{background:row.isActive?`${row.color}08`:"transparent"}}>
            <td style={{padding:"10px",textAlign:"right"}}><span style={{fontWeight:700,color:row.color}}>{row.label}</span>{row.isActive&&<span style={{fontSize:8,color:C.dim,marginLeft:4}}>●</span>}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.text}}>{row.fixedPct}%</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:600,color:C.text}}>{fmt(row.totalMktg)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",fontWeight:700,color:row.cac<p.programmaticCAC*2?C.text:C.red}}>{fmt(row.cac)}</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:paybackOk?C.green:C.red}}>{row.payback.toFixed(1)} mo</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:marginOk?C.green:C.red}}>{row.opMargin.toFixed(1)}%</td>
            <td style={{padding:"10px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:sandMOk?C.text:C.red}}>{row.sandMPct.toFixed(0)}%</td>
            <td style={{padding:"10px",textAlign:"right",fontSize:10,color:statusColor,fontWeight:600}}>{status}</td>
          </tr>);
        })}</tbody>
      </table></div>
    </Card>
    {/* ═══ STRUCTURAL GRAVITY VS REVENUE LIFT ═══ */}
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <h3 style={{fontSize:12,fontWeight:700,color:C.violet,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>Structural Gravity vs Revenue Lift</h3>
          <div style={{fontSize:10,color:C.muted,lineHeight:1.5,maxWidth:520}}>
            At low ARR, structural gravity is heavy — fixed commitments consume a large share of revenue.
            As revenue grows, lift wins. Same dollars, shrinking percentage.
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {p.fixedMktgIsFloorBound ? (
            <button onClick={()=>setDebtTax(dt=>dt===0?1:0)} style={{padding:"5px 10px",borderRadius:0,border:`1px solid ${debtTax>0?C.green:C.amber}`,background:debtTax>0?`${C.green}12`:`${C.amber}12`,color:debtTax>0?C.green:C.amber,cursor:"pointer",fontSize:9,fontWeight:700,fontFamily:"'TWK Everett',sans-serif"}}>
              {debtTax>0?"Strategic Overbuild":"Compression Active"}
            </button>
          ) : (
            <div style={{padding:"5px 10px",borderRadius:0,background:`${C.green}12`,border:`1px solid ${C.green}30`}}>
              <span style={{fontSize:9,fontWeight:700,color:C.green}}>Revenue Exceeds Structure</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Tension: Formula vs Structural bars */}
      {(()=>{
        const formulaBudget = Math.round(variableBudget * (inputs.fixedMktgPct / 100) / (1 - inputs.fixedMktgPct / 100));
        const structBudget = p.fixedMktgActual || 0;
        const maxBar = Math.max(formulaBudget, structBudget) * 1.1;
        const formulaW = maxBar > 0 ? formulaBudget / maxBar * 100 : 0;
        const structW = maxBar > 0 ? structBudget / maxBar * 100 : 0;
        const overflow = structBudget > formulaBudget;
        const overflowPct = formulaBudget > 0 ? ((structBudget - formulaBudget) / formulaBudget * 100) : 0;
        const growthRate = inputs.targetGrowthRate || 30;
        const quartersToResolve = overflow ? Math.max(1, Math.ceil(Math.log(structBudget / Math.max(1,formulaBudget)) / Math.log(1 + growthRate / 400))) : 0;
        return(<div style={{marginBottom:16}}>
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:9,color:C.dim,fontWeight:600}}>Revenue-Driven Budget (formula at {inputs.fixedMktgPct}%)</span>
              <span style={{fontSize:10,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(formulaBudget)}</span>
            </div>
            <div style={{position:"relative",height:22,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <motion.div initial={{width:0}} animate={{width:`${formulaW}%`}} transition={{duration:0.6}}
                style={{height:"100%",background:`${C.accent}40`,borderRadius:0}}/>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:9,color:C.dim,fontWeight:600}}>Structural Minimum (commitments)</span>
              <span style={{fontSize:10,fontWeight:700,color:overflow?C.amber:C.green,fontFamily:"'Chivo Mono',monospace"}}>{fmt(structBudget)}</span>
            </div>
            <div style={{position:"relative",height:22,background:C.bg,borderRadius:0,overflow:"hidden"}}>
              <motion.div initial={{width:0}} animate={{width:`${Math.min(formulaW,structW)}%`}} transition={{duration:0.6}}
                style={{height:"100%",background:`${C.violet}50`,borderRadius:0}}/>
              {overflow && <motion.div initial={{width:0}} animate={{width:`${structW - formulaW}%`}} transition={{duration:0.8,delay:0.3}}
                style={{position:"absolute",left:`${formulaW}%`,top:0,height:"100%",
                  background:`linear-gradient(90deg, ${C.amber}60, ${C.amber}30)`,borderRadius:0,
                  boxShadow:`0 0 12px ${C.amber}40`}}/>}
            </div>
          </div>
          {overflow && (
            <div style={{padding:10,background:debtTax>0?`${C.green}08`:`${C.amber}08`,borderRadius:0,border:`1px solid ${debtTax>0?C.green:C.amber}20`}}>
              <div style={{fontSize:10,color:debtTax>0?C.green:C.amber,fontWeight:600,marginBottom:2}}>
                {debtTax>0 ? "Intentional Front-Loading for Growth" : `Structure exceeds formula by ${fmt(structBudget - formulaBudget)} (+${overflowPct.toFixed(0)}%)`}
              </div>
              <div style={{fontSize:9,color:C.muted}}>
                {debtTax>0
                  ? "Building infrastructure ahead of revenue. Strategic bet — investing in capacity before demand arrives."
                  : `At ${growthRate}% growth, compression resolves in ~${quartersToResolve} quarter${quartersToResolve!==1?"s":""}. Every demand dollar carries ${overflowPct.toFixed(0)}% overhead surplus until then.`}
              </div>
            </div>
          )}
        </div>);
      })()}

      {/* STRUCTURAL CORE (Layer 1) */}
      <div style={{padding:14,background:C.bg,borderRadius:0,border:`1px solid ${C.borderMid}`,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:4,height:14,background:C.accent,borderRadius:0}}/>
          <span style={{fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.05em"}}>Structural Core</span>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:0,background:`${C.accent}12`,color:C.accent,fontWeight:600}}>{fmt(p.layer1Summary?.total||0)}</span>
          <span style={{fontSize:9,color:C.dim}}>Non-negotiable</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {/* Executive Tier */}
          <div style={{background:C.bgAlt,borderRadius:0,padding:12,borderTop:`3px solid ${C.violet}`}}>
            <div style={{fontSize:10,fontWeight:700,color:C.violet,marginBottom:6}}>Executive</div>
            {Object.entries(p.tierTables?.EXEC_TIERS||{}).map(([key,tier])=>{
              const isA=(inputs.executiveTier||"fullVP")===key;
              return(<button key={key} onClick={()=>setInputs(pr=>({...pr,executiveTier:key}))}
                style={{display:"block",width:"100%",padding:"5px 8px",marginBottom:3,borderRadius:0,textAlign:"left",
                  border:`1px solid ${isA?C.violet:C.borderMid}`,background:isA?`${C.violet}12`:"transparent",cursor:"pointer",fontFamily:"'TWK Everett',sans-serif"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:9,fontWeight:isA?700:500,color:isA?C.violet:C.muted}}>{tier.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:isA?C.violet:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{fmt(tier.cost)}</span>
                </div>
              </button>);
            })}
            <div style={{marginTop:4,fontSize:8,color:C.dim}}>{(p.fixedMktgItems?.find(f=>f.layer==="executive")?.pctOfRev||0).toFixed(1)}% of rev — derived</div>
          </div>
          {/* PMM Tier */}
          <div style={{background:C.bgAlt,borderRadius:0,padding:12,borderTop:`3px solid ${C.blue}`}}>
            <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:6}}>Product & Market Strategy</div>
            {Object.entries(p.tierTables?.PMM_TIERS||{}).map(([key,tier])=>{
              const isA=(inputs.pmmTier||"full")===key;
              return(<button key={key} onClick={()=>setInputs(pr=>({...pr,pmmTier:key}))}
                style={{display:"block",width:"100%",padding:"5px 8px",marginBottom:3,borderRadius:0,textAlign:"left",
                  border:`1px solid ${isA?C.blue:C.borderMid}`,background:isA?`${C.blue}12`:"transparent",cursor:"pointer",fontFamily:"'TWK Everett',sans-serif"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:9,fontWeight:isA?700:500,color:isA?C.blue:C.muted}}>{tier.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:isA?C.blue:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{fmt(tier.cost)}</span>
                </div>
              </button>);
            })}
            {(inputs.pmmTier||"full")==="none"&&s.targetARR>=10000000&&
              <div style={{marginTop:4,padding:4,background:`${C.red}12`,borderRadius:0,fontSize:8,color:C.red,fontWeight:600}}>⚠ Positioning risk above $10M</div>}
          </div>
          {/* MarTech Tier */}
          <div style={{background:C.bgAlt,borderRadius:0,padding:12,borderTop:`3px solid ${C.dim}`}}>
            <div style={{fontSize:10,fontWeight:700,color:C.dim,marginBottom:6}}>MarTech Infrastructure</div>
            {Object.entries(p.tierTables?.MARTECH_TIERS||{}).map(([key,tier])=>{
              const isA=(inputs.coreMarTechTier||"standard")===key;
              return(<button key={key} onClick={()=>setInputs(pr=>({...pr,coreMarTechTier:key}))}
                style={{display:"block",width:"100%",padding:"5px 8px",marginBottom:3,borderRadius:0,textAlign:"left",
                  border:`1px solid ${isA?C.dim:C.borderMid}`,background:isA?`${C.dim}12`:"transparent",cursor:"pointer",fontFamily:"'TWK Everett',sans-serif"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:9,fontWeight:isA?700:500,color:isA?C.dim:C.muted}}>{tier.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:isA?C.dim:C.dim,fontFamily:"'Chivo Mono',monospace"}}>{fmt(tier.cost)}</span>
                </div>
              </button>);
            })}
            <div style={{marginTop:4,fontSize:8,color:C.dim}}>Performance tools are variable — in motions.</div>
          </div>
        </div>
      </div>

      {/* SCALABLE PROGRAMS (Layer 2) */}
      <div style={{padding:14,background:C.bg,borderRadius:0,border:`1px dashed ${C.borderMid}`,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:4,height:14,background:C.amber,borderRadius:0}}/>
          <span style={{fontSize:10,fontWeight:700,color:C.amber,textTransform:"uppercase",letterSpacing:"0.05em"}}>Scalable Programs</span>
          <span style={{fontSize:9,padding:"2px 8px",borderRadius:0,background:`${C.amber}12`,color:C.amber,fontWeight:600}}>{fmt(p.layer2Summary?.total||0)}</span>
          <span style={{fontSize:9,color:C.dim}}>Elastic — design choices</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:12}}>
          <div style={{padding:10,background:C.bgAlt,borderRadius:0}}>
            {[{key:"revEngineOps",label:"RevEngine Ops",color:C.amber},{key:"brandContent",label:"Brand & Content",color:C.green},{key:"prAr",label:"PR / AR",color:C.violet}].map(item=>{
              const emb=inputs.elasticMktgBreakdown||{revEngineOps:35,brandContent:40,prAr:25};
              return(<div key={item.key} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:9,fontWeight:600,color:item.color}}>{item.label}</span>
                  <span style={{fontSize:9,color:item.color,fontFamily:"'Chivo Mono',monospace"}}>{emb[item.key]||0}%</span>
                </div>
                <input type="range" min={5} max={70} value={emb[item.key]||0}
                  onChange={e=>setInputs(pr=>({...pr,elasticMktgBreakdown:{...(pr.elasticMktgBreakdown||emb),[item.key]:parseInt(e.target.value)}}))}
                  style={{width:"100%",accentColor:item.color}}/>
              </div>);
            })}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {(fixedItems||[]).filter(fi=>fi.layerType===2).map((fi,i)=>{
              const colors=[C.amber,C.green,C.violet];
              const hs = fi.belowMinViable ? "at-risk" : fi.amount < fi.floor * 1.2 ? "thin" : "stable";
              const hc = hs==="at-risk"?C.red:hs==="thin"?C.amber:C.green;
              const ghostCaps = {revEngineOps:["Lifecycle automation","Lead scoring","Campaign ops"],brandContent:["Case studies","Content velocity","Video production"],prAr:["Analyst coverage","Thought leadership","Press"]};
              const ghosts = fi.belowMinViable ? (ghostCaps[fi.layer]||[]) : [];
              return(<div key={fi.name} style={{padding:10,background:C.bgAlt,borderRadius:0,borderLeft:`3px solid ${colors[i]}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:10,fontWeight:700,color:colors[i]}}>{fi.name}</span>
                  <span style={{fontSize:7,padding:"1px 5px",borderRadius:0,background:`${hc}15`,color:hc,fontWeight:600}}>{hs==="at-risk"?"At Risk":hs==="thin"?"Thin":"Stable"}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(fi.amount)}</div>
                <div style={{fontSize:8,color:C.dim,marginTop:2}}>{fi.pctOfRev?.toFixed(1)}% of rev</div>
                {ghosts.length>0 && <div style={{marginTop:4}}>{ghosts.map(g=>(<div key={g} style={{fontSize:7,color:`${C.muted}60`,fontStyle:"italic"}}>○ {g}</div>))}<div style={{fontSize:7,color:C.dim,marginTop:1}}>Capability gaps at current funding</div></div>}
              </div>);
            })}
          </div>
        </div>
      </div>

      {/* Gravity Simulator — interactive ARR slider */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase"}}>Gravity Simulator</span>
          <span style={{fontSize:10,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>${simArr}M ARR</span>
        </div>
        <input type="range" min={2} max={50} value={simArr} onChange={e=>setSimArr(parseInt(e.target.value))}
          style={{width:"100%",accentColor:C.accent,marginBottom:8}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
          {[3,5,10,20,40,simArr].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b).slice(0,6).map(pt=>{
            const infra = p.fixedMktgActual || p.floorTotal;
            const pct = infra / (pt * 1000000) * 100;
            const isYou = Math.abs(s.targetARR / 1000000 - pt) < 1;
            return(<div key={pt} style={{padding:6,background:isYou?`${C.accent}12`:C.bg,borderRadius:0,textAlign:"center",border:isYou?`1px solid ${C.accent}30`:"1px solid transparent"}}>
              <div style={{fontSize:8,color:isYou?C.accent:C.dim,fontWeight:isYou?700:400}}>{isYou?"▸ ":""}${pt}M</div>
              <div style={{fontSize:14,fontWeight:700,color:pct>15?C.red:pct>8?C.amber:C.green,fontFamily:"'Chivo Mono',monospace"}}>{pct.toFixed(1)}%</div>
              <div style={{fontSize:7,color:C.dim}}>{pct>12?"heavy":pct>6?"moderate":"lift wins"}</div>
            </div>);
          })}
        </div>
      </div>

      <div style={{marginTop:10,padding:8,background:`${C.violet}08`,borderRadius:0,border:`1px solid ${C.violet}12`}}>
        <div style={{fontSize:9,color:C.muted,lineHeight:1.6}}>
          <strong style={{color:C.violet}}>Structural Core is dollars, not percentages.</strong> $455K VP = 15% at $3M but 1.1% at $40M.
          Scalable Programs are elastic — redistribute as strategy shifts. This is a physics simulator, not a compliance check.
        </div>
      </div>
    </Card>
  </div>);
}

// ════════════════════════════════════════════════════════════
// TARGET TRACKER
// ════════════════════════════════════════════════════════════
function TargetTrackerPage({model,inputs,onInfoClick}){
  const[view,setView]=useState("quarterly");
  const{summary:s,quarterlyTargets,glideslope,monthly}=model;
  const annT=s.newARRNeeded,annP=monthly[11]?.cumulativeNewARR||0,annG=annP-annT;
  const isSplit=inputs.revenueMode==="split";
  const mktgPct=inputs.mktgSourcedPct;
  return(<div>
    <Header title="Target Tracker" sub="ARR targets + pipeline targets by source and stage" icon={Target} moduleId="targets" onInfoClick={onInfoClick}/>
    {isSplit&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
      <Card style={{borderLeft:`3px solid ${C.accent}`}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>New Logo</div><div style={{fontSize:22,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.newLogoARR)}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.dealsNeeded)} deals × {fmt(inputs.avgDealSize)}</div></Card>
      <Card style={{borderLeft:`3px solid ${C.violet}`}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Expansion</div><div style={{fontSize:22,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace"}}>{fmt(s.expansionARR)}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.expansionDeals)} deals × {fmt(inputs.expansionAvgDeal)} • {inputs.expansionSqoToWon}% close</div></Card>
    </div>}
    <div style={{display:"flex",gap:8,marginBottom:24}}>
      {["quarterly","pipeline","annual"].map(v=>(<button key={v} onClick={()=>setView(v)} style={{padding:"8px 18px",borderRadius:0,border:`1px solid ${view===v?C.accent:C.borderMid}`,background:view===v?C.accentDim:"transparent",color:view===v?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,textTransform:"capitalize",fontFamily:"'TWK Everett',sans-serif"}}>{v}</button>))}
    </div>

    {/* ── PIPELINE VIEW ── */}
    {view==="pipeline"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:20}}>
        <Metric label="Annual Pipe Target" value={fmt(s.pipelineRequired)} sub={`${inputs.pipelineCoverage}% coverage`} color={C.accent}/>
        <Metric label="Mktg-Sourced" value={`${mktgPct}%`} sub={fmt(s.pipelineRequired*(mktgPct/100))} color={C.green}/>
        <Metric label="AE-Sourced" value={`${100-mktgPct}%`} sub={fmt(s.pipelineRequired*((100-mktgPct)/100))} color={C.violet}/>
        <Metric label="Stage 2 (Forecastable)" value={fmt(s.stage2Pipeline)} sub={`${fN(s.sqosNeeded)} SQOs`} color={C.amber}/>
      </div>

      {/* Quarterly pipeline targets table */}
      <Card style={{marginBottom:18}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly Pipeline Targets by Source</h3>
        <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead><tr>{["","Deals","SQOs","Mktg SQOs","AE SQOs","Stage 2 Pipe","Stage 1 Pipe","Total Pipe","Mktg Pipe","AE Pipe","Coverage"].map(h=><th key={h} style={{textAlign:"right",padding:"8px 10px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
          <tbody>{quarterlyTargets.map((q,i)=>(
            <tr key={q.quarter}>
              <td style={{padding:"10px",fontWeight:700,color:C.chart[i],fontSize:13,textAlign:"right"}}>{q.quarter}</td>
              <td style={{padding:"10px",color:C.text,fontFamily:"'Chivo Mono',monospace",textAlign:"right",fontWeight:600}}>{fN(q.dealsTarget)}</td>
              <td style={{padding:"10px",color:C.text,fontFamily:"'Chivo Mono',monospace",textAlign:"right",fontWeight:600}}>{fN(q.sqoTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fN(q.mktgSqoTarget)}</td>
              <td style={{padding:"10px",color:C.violet,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fN(q.aeSqoTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'Chivo Mono',monospace",textAlign:"right",fontWeight:600}}>{fmt(q.stage2Target)}</td>
              <td style={{padding:"10px",color:C.amber,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(q.stage1Target)}</td>
              <td style={{padding:"10px",color:C.accent,fontFamily:"'Chivo Mono',monospace",textAlign:"right",fontWeight:700}}>{fmt(q.pipeTarget)}</td>
              <td style={{padding:"10px",color:C.green,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(q.mktgPipeTarget)}</td>
              <td style={{padding:"10px",color:C.violet,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{fmt(q.aePipeTarget)}</td>
              <td style={{padding:"10px",textAlign:"right"}}><span style={{padding:"3px 8px",borderRadius:0,fontSize:10,fontWeight:700,background:q.coverageActual>=inputs.coverageGreen?C.greenDim:q.coverageActual>=inputs.coverageYellow?C.amberDim:C.redDim,color:q.coverageActual>=inputs.coverageGreen?C.green:q.coverageActual>=inputs.coverageYellow?C.amber:C.red}}>{q.coverageActual.toFixed(0)}%</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>

      {/* Pipeline charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Pipeline by Source (Quarterly)</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="mktgPipeTarget" stackId="pipe" fill={C.green} radius={[0,0,0,0]} name="Marketing Sourced" opacity={0.8}/>
            <Bar dataKey="aePipeTarget" stackId="pipe" fill={C.violet} radius={[4,4,0,0]} name="AE Sourced" opacity={0.8}/>
          </BarChart></ResponsiveContainer>
        </Card>
        <Card>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Stage 1 vs Stage 2 Targets</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="stage1Target" fill={C.amberDim} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Stage 1 (Discovery)"/>
            <Bar dataKey="stage2Target" fill={C.greenDim} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Stage 2 (Forecastable)"/>
          </BarChart></ResponsiveContainer>
        </Card>
      </div>

      {/* SQO sourcing breakdown */}
      <Card style={{marginTop:16}}>
        <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly SQO Targets by Source</h3>
        <ResponsiveContainer width="100%" height={240}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Bar dataKey="mktgSqoTarget" stackId="sqo" fill={C.green} name="Mktg SQOs" opacity={0.85}/>
          <Bar dataKey="aeSqoTarget" stackId="sqo" fill={C.violet} radius={[4,4,0,0]} name="AE SQOs" opacity={0.85}/>
        </BarChart></ResponsiveContainer>
      </Card>
    </div>)}

    {/* ── ANNUAL VIEW ── */}
    {view==="annual"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:24}}>
        <Metric label="Annual Target" value={fmt(annT)} color={C.amber}/><Metric label="Projected" value={fmt(annP)} color={C.accent}/><Metric label="Gap" value={fmt(annG)} color={annG>=0?C.green:C.red}/><Metric label="Attainment" value={`${(annP/annT*100).toFixed(0)}%`} color={annP>=annT?C.green:C.red}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Stage 1 vs Stage 2 Pipeline</h3>
          <ResponsiveContainer width="100%" height={280}><ComposedChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="stage1Pipe" fill={C.amberDim} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Stage 1"/><Bar dataKey="stage2Pipe" fill={C.greenDim} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Stage 2"/>
          </ComposedChart></ResponsiveContainer></Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Cumulative New ARR vs Target</h3>
          <ResponsiveContainer width="100%" height={280}><ComposedChart data={glideslope}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="cumulativeNewARR" stroke={C.green} fill={C.greenDim} strokeWidth={2} name="Cumulative"/><Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2} strokeDasharray="8 4" dot={false} name="Target"/>
          </ComposedChart></ResponsiveContainer></Card>
      </div>
    </div>)}

    {/* ── QUARTERLY VIEW ── */}
    {view==="quarterly"&&(<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {quarterlyTargets.map((q,i)=>(<Card key={q.quarter} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.chart[i],marginBottom:4}}>{q.quarter}</div><div style={{fontSize:9,color:C.dim,marginBottom:6}}>{q.seasonalPct}% of annual</div><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>Target</div><div style={{fontSize:16,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{fmt(q.target)}</div><div style={{height:1,background:C.borderMid,margin:"10px 0"}}/><div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>Projected</div><div style={{fontSize:16,fontWeight:700,color:q.actual>=q.target?C.green:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fmt(q.actual)}</div><div style={{marginTop:8,padding:"4px 12px",borderRadius:0,display:"inline-block",fontSize:10,fontWeight:700,background:q.gap>=0?C.greenDim:C.redDim,color:q.gap>=0?C.green:C.red}}>{q.pctOfTarget.toFixed(0)}%</div></Card>))}
      </div>
      <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Quarterly: Target vs Projected</h3>
        <ResponsiveContainer width="100%" height={280}><BarChart data={quarterlyTargets}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="quarter" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
          <Bar dataKey="target" fill={C.amberDim} stroke={C.amber} strokeWidth={1} radius={[4,4,0,0]} name="Target"/><Bar dataKey="actual" fill={C.greenDim} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="Projected"/>
        </BarChart></ResponsiveContainer></Card>
    </div>)}

    <Card style={{marginTop:18}}>
      <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Pipeline Quality Rules</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{padding:16,background:C.bg,borderRadius:0,border:`1px solid ${C.amber}22`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Shield size={14} style={{color:C.amber}}/><span style={{fontSize:12,fontWeight:700,color:C.amber}}>Stage 1 — Discovery</span></div><div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Non-forecastable. Amount ≥ {inputs.stage1MinPct}% of ADS ({fmt(model.summary.stage1MinAmount)}). Tracks early engagement without inflating forecast.</div></div>
        <div style={{padding:16,background:C.bg,borderRadius:0,border:`1px solid ${C.green}22`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><Shield size={14} style={{color:C.green}}/><span style={{fontSize:12,fontWeight:700,color:C.green}}>Stage 2 — SQO (Forecastable)</span></div><div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>Board-safe pipeline. AE manually promoted. Discovery held, buyer confirmed, realistic amount. No auto-promotion.</div></div>
      </div>
    </Card>
  </div>);
}

// ════════════════════════════════════════════════════════════
// REMAINING PAGES (Sales, Funnel, Channels, Pipeline, Velocity, Ramp, P&L, Glideslope, QBR, Weekly)
// ════════════════════════════════════════════════════════════
function SalesPage({model,inputs,setInputs,onInfoClick}){
  const{summary:s,monthly}=model;
  return(<div><Header title="Sales Model" sub="AE capacity, quota, attrition, and pipeline sourcing" icon={Users} moduleId="sales" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>Drivers</h3>
        <Input label="AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/><Input label="Quota / AE" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/><Input label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo" min={1} max={12}/><Input label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/><Input label="SDRs/AE" value={inputs.sdrsPerAe} onChange={v=>setInputs(p=>({...p,sdrsPerAe:v}))} step={0.5}/><div style={{height:1,background:C.borderMid,margin:"10px 0"}}/><Input label="SQO→Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%" min={1} max={100}/><Input label="Avg Deal" value={inputs.avgDealSize} onChange={v=>setInputs(p=>({...p,avgDealSize:v}))} prefix="$" step={5000}/><Input label="Mktg Sourced" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
      </Card>
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          <Metric label="AE Capacity" value={fmt(inputs.aeCount*inputs.aeQuota)} sub={`${inputs.aeCount} AEs`} color={C.accent}/>
          <Metric label="Attrition Loss" value={fmt(s.totalAttrLoss)} sub={`${inputs.aeAttritionRate}% annual`} color={s.totalAttrLoss>0?C.red:C.green}/>
          <Metric label="Deals to Close" value={fN(s.dealsNeeded)} sub={`${fN(s.mktgSQOs)} mktg + ${fN(s.aeSelfSourcedSQOs)} AE SQOs`} color={C.green}/>
          <Metric label="Attainment Req'd" value={`${s.attainmentRequired.toFixed(0)}%`} color={s.attainmentRequired<=100?C.green:C.red}/>
        </div>
        {/* Pipeline Sourcing Split */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Pipeline Sourcing</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{padding:14,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:"0.04em"}}>Marketing Sourced</div>
              <div style={{fontSize:26,fontWeight:700,color:C.text,marginTop:4}}>{inputs.mktgSourcedPct}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.mktgSQOs)} SQOs → {fN(s.mktgInquiriesNeeded)} inquiries</div>
            </div>
            <div style={{padding:14,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",letterSpacing:"0.04em"}}>AE Self-Sourced</div>
              <div style={{fontSize:26,fontWeight:700,color:C.text,marginTop:4}}>{100-inputs.mktgSourcedPct}%</div>
              <div style={{fontSize:10,color:C.muted,marginTop:4}}>{fN(s.aeSelfSourcedSQOs)} SQOs (outbound, referral, partner)</div>
            </div>
          </div>
        </Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Capacity vs New ARR</h3>
          <ResponsiveContainer width="100%" height={300}><ComposedChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="fullCapacity" fill={C.blueDim} stroke={C.blue} strokeWidth={1} radius={[4,4,0,0]} name="Capacity"/><Bar dataKey="monthlyNewARR" fill={C.greenDim} stroke={C.green} strokeWidth={1} radius={[4,4,0,0]} name="New ARR"/><Line type="monotone" dataKey="pipeline" stroke={C.amber} strokeWidth={2} dot={false} name="SQO Pipeline"/>
          </ComposedChart></ResponsiveContainer></Card>
      </div>
    </div>
  </div>);
}

function FunnelPage({model,inputs,setInputs,onInfoClick}){
  const{stages,monthly,phaseShiftedFunnel,summary:s}=model;
  return(<div><Header title="Marketing Funnel" sub="Inverse model — marketing-sourced pipeline with phase-shifted timeline" icon={Megaphone} moduleId="marketing" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.06em"}}>Lifecycle Gates</h3>
        <Input label="Inquiry → MQL" value={inputs.inquiryToMqlRate} onChange={v=>setInputs(p=>({...p,inquiryToMqlRate:v}))} suffix="%"/><Input label="MQL → SQL" value={inputs.mqlToSqlRate} onChange={v=>setInputs(p=>({...p,mqlToSqlRate:v}))} suffix="%"/><Input label="SQL → Meeting" value={inputs.sqlToMeetingRate} onChange={v=>setInputs(p=>({...p,sqlToMeetingRate:v}))} suffix="%"/><Input label="Meeting → SQO" value={inputs.meetingToSqoRate} onChange={v=>setInputs(p=>({...p,meetingToSqoRate:v}))} suffix="%"/><Input label="SQO → Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%"/>
        <div style={{height:1,background:C.borderMid,margin:"10px 0"}}/>
        <Input label="Mktg Sourced %" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
        <Input label="SQO Lead Time" value={inputs.sqoLeadQuarters} onChange={v=>setInputs(p=>({...p,sqoLeadQuarters:v}))} suffix="Qtrs" min={1} max={4}/>
        <Input label="MQL Lead Time" value={inputs.mqlLeadQuarters} onChange={v=>setInputs(p=>({...p,mqlLeadQuarters:v}))} suffix="Qtrs" min={1} max={3}/>
        <div style={{marginTop:12,padding:12,background:C.bg,borderRadius:0,textAlign:"center"}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase"}}>Mktg Inquiry-to-Close</div><div style={{fontSize:28,fontWeight:700,color:C.accent}}>{fP(s.effectiveFunnelYield)}</div><div style={{fontSize:10,color:C.dim,marginTop:4}}>{fN(s.mktgInquiriesNeeded)} mktg inquiries needed</div></div>
      </Card>
      <div>
        {/* Funnel waterfall — now shows mktg-sourced counts */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:20}}>
          {stages.map((st,i)=>(<div key={st.name} style={{position:"relative"}}><div style={{background:`${C.chart[i]}10`,border:`1px solid ${C.chart[i]}25`,borderRadius:0,padding:"14px 8px",textAlign:"center"}}><div style={{fontSize:8,fontWeight:700,color:C.chart[i],textTransform:"uppercase",letterSpacing:"0.04em"}}>{st.name}</div><div style={{fontSize:20,fontWeight:700,color:C.text,marginTop:5}}>{fN(st.count)}</div>{st.mktgCount!=null&&st.mktgCount!==st.count&&<div style={{fontSize:9,color:C.accent,marginTop:2}}>mktg: {fN(st.mktgCount)}</div>}<div style={{fontSize:8,color:C.dim,marginTop:2}}>{st.owner}</div>{i<stages.length-1&&<div style={{fontSize:9,color:C.muted,marginTop:3}}>{st.nextRate}%→</div>}</div>{i<stages.length-1&&<div style={{position:"absolute",right:-6,top:"50%",transform:"translateY(-50%)",zIndex:2}}><ChevronRight size={12} style={{color:C.dim}}/></div>}</div>))}
        </div>

        {/* Phase-Shifted Funnel Timeline */}
        {phaseShiftedFunnel && phaseShiftedFunnel.length > 0 && (
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0}}>Phase-Shifted Pipeline Timeline</h3>
              <Badge label={`${inputs.sqoLeadQuarters}Q SQO + ${inputs.mqlLeadQuarters}Q MQL lead`} status="neutral"/>
            </div>
            <div style={{fontSize:10,color:C.dim,marginBottom:12}}>
              When activities must happen to support quarterly deal targets. SQOs needed {inputs.sqoLeadQuarters}Q before close; MQLs needed {inputs.mqlLeadQuarters}Q before SQO creation.
            </div>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
              <thead><tr>{["Quarter","Deals Close","SQOs Needed","Mktg SQOs","AE SQOs","MQLs Needed"].map(h=><th key={h} style={{textAlign:"right",padding:"8px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`1px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
              <tbody>{phaseShiftedFunnel.map((q,i)=>(
                <tr key={q.quarter} style={{background:q.isCurrentYear?"transparent":C.bg}}>
                  <td style={{padding:"8px",fontWeight:700,color:q.isCurrentYear?C.accent:C.dim,textAlign:"right"}}>{q.quarter}</td>
                  <td style={{padding:"8px",color:q.closingDeals>0?C.green:C.dim,fontWeight:700,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{q.closingDeals>0?fN(q.closingDeals):"-"}</td>
                  <td style={{padding:"8px",color:q.sqosNeeded>0?C.amber:C.dim,fontWeight:600,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{q.sqosNeeded>0?fN(q.sqosNeeded):"-"}</td>
                  <td style={{padding:"8px",color:q.mktgSqos>0?C.accent:C.dim,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{q.mktgSqos>0?fN(q.mktgSqos):"-"}</td>
                  <td style={{padding:"8px",color:q.aeSqos>0?C.violet:C.dim,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{q.aeSqos>0?fN(q.aeSqos):"-"}</td>
                  <td style={{padding:"8px",color:q.mqlsNeeded>0?C.red:C.dim,fontWeight:600,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{q.mqlsNeeded>0?fN(q.mqlsNeeded):"-"}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        )}

        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Monthly Volume</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="monthlyInquiries" fill={C.chart[0]} radius={[3,3,0,0]} name="Inquiries" opacity={0.85}/><Bar dataKey="monthlyMQLs" fill={C.chart[1]} radius={[3,3,0,0]} name="MQLs" opacity={0.85}/><Bar dataKey="monthlySQLs" fill={C.chart[2]} radius={[3,3,0,0]} name="SQLs" opacity={0.85}/><Bar dataKey="monthlyMeetings" fill={C.chart[3]} radius={[3,3,0,0]} name="Meetings" opacity={0.85}/><Bar dataKey="monthlySQOs" fill={C.chart[4]} radius={[3,3,0,0]} name="SQOs" opacity={0.85}/><Bar dataKey="monthlyDeals" fill={C.chart[5]} radius={[3,3,0,0]} name="Won" opacity={0.85}/>
          </BarChart></ResponsiveContainer></Card>
      </div>
    </div>
  </div>);
}

const MOTION_COLORS = { create: C.green, convert: C.amber, accelerate: C.red };
const MOTION_BADGES = { create: "🟩 CREATE", convert: "🟨 CONVERT", accelerate: "🟥 ACCELERATE" };

function ChannelsPage({model,inputs,setInputs,onInfoClick}){
  const{motions:mot, summary:s}=model;
  const[activeMotion,setActiveMotion]=useState("create");
  const totalBudget = mot.createBudget + mot.convertBudget + mot.accelBudget;

  // Motion allocation updater
  const uMA=(key,val)=>setInputs(p=>({...p,motionAllocation:{...(p.motionAllocation||{create:45,convert:30,accelerate:25}),[key]:val}}));
  // Channel updater within a motion
  const uMC=(motion,idx,field,val)=>setInputs(p=>{
    const mc={...(p.motionChannels||{})};
    const arr=[...(mc[motion]||[])];
    arr[idx]={...arr[idx],[field]:val};
    mc[motion]=arr;
    return{...p,motionChannels:mc};
  });

  return(<div><Header title="Revenue Motions" sub="How demand is created, converted, and accelerated" icon={Layers} moduleId="channels" onInfoClick={onInfoClick}/>

    {/* Motion toggle */}
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      {[
        {key:"create",label:"Demand Creation",budget:mot.createBudget,icon:"🟩",desc:"Net-new pipeline"},
        {key:"convert",label:"Demand Conversion",budget:mot.convertBudget,icon:"🟨",desc:"Qualification throughput"},
        {key:"accelerate",label:"Deal Acceleration",budget:mot.accelBudget,icon:"🟥",desc:"Velocity & win rate"},
      ].map(m=>{
        const isActive=activeMotion===m.key;
        const color=MOTION_COLORS[m.key];
        return(<button key={m.key} onClick={()=>setActiveMotion(m.key)} style={{flex:1,padding:"14px 16px",borderRadius:0,
          border:`2px solid ${isActive?color:C.borderMid}`,background:isActive?`${color}10`:"transparent",cursor:"pointer",textAlign:"left",fontFamily:"'TWK Everett',sans-serif"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:isActive?color:C.text}}>{m.icon} {m.label}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.desc}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:16,fontWeight:700,color,fontFamily:"'Chivo Mono',monospace"}}>{fmt(m.budget)}</div>
              <div style={{fontSize:9,color:C.dim}}>{totalBudget>0?(m.budget/totalBudget*100).toFixed(0):0}%</div>
            </div>
          </div>
        </button>);
      })}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20}}>
      {/* Left: allocation + channel inputs */}
      <div>
        <Card style={{marginBottom:14}}>
          <h3 style={{fontSize:10,fontWeight:700,color:C.dim,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Motion Budget Split</h3>
          {["create","convert","accelerate"].map(key=>{
            const val=(inputs.motionAllocation||{create:45,convert:30,accelerate:25})[key];
            return(<div key={key} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:600,color:MOTION_COLORS[key]}}>{key==="create"?"Creation":key==="convert"?"Conversion":"Acceleration"}</span>
                <span style={{fontSize:11,color:MOTION_COLORS[key],fontFamily:"'Chivo Mono',monospace"}}>{val}%</span>
              </div>
              <input type="range" min={5} max={70} value={val} onChange={e=>uMA(key,parseInt(e.target.value))} style={{width:"100%",accentColor:MOTION_COLORS[key]}}/>
            </div>);
          })}
        </Card>

        {/* Channel inputs for active motion */}
        <Card>
          <h3 style={{fontSize:10,fontWeight:700,color:MOTION_COLORS[activeMotion],margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>
            {activeMotion==="create"?"Creation":activeMotion==="convert"?"Conversion":"Acceleration"} Channels
          </h3>
          {(mot[activeMotion]?.channels||[]).map((ch,i)=>(
            <div key={ch.name} style={{marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${C.borderMid}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:11,fontWeight:600,color:C.text}}>{ch.name}</span>
                <span style={{fontSize:9,padding:"2px 6px",borderRadius:0,background:`${MOTION_COLORS[activeMotion]}15`,color:MOTION_COLORS[activeMotion],fontWeight:600}}>{ch.intent}</span>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:9,color:C.dim}}>Mix %</span>
                <input type="range" min={0} max={60} value={ch.pct} onChange={e=>uMC(activeMotion,i,"pct",parseInt(e.target.value))} style={{flex:1,accentColor:MOTION_COLORS[activeMotion]}}/>
                <span style={{fontSize:10,color:C.accent,fontFamily:"'Chivo Mono',monospace",width:30,textAlign:"right"}}>{ch.pct}%</span>
              </div>
              {activeMotion==="create" && <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:C.dim}}>CPL $</span>
                <input type="number" value={ch.cpl} onChange={e=>uMC(activeMotion,i,"cpl",parseInt(e.target.value)||1)} style={{width:55,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"2px 5px",color:C.text,fontSize:10,fontFamily:"'Chivo Mono',monospace"}}/>
              </div>}
              {activeMotion==="convert" && <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:C.dim}}>$/SQL</span>
                <input type="number" value={ch.costPerSql} onChange={e=>uMC(activeMotion,i,"costPerSql",parseInt(e.target.value)||1)} style={{width:55,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"2px 5px",color:C.text,fontSize:10,fontFamily:"'Chivo Mono',monospace"}}/>
              </div>}
              {activeMotion==="accelerate" && <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:C.dim}}>$/Acct</span>
                <input type="number" value={ch.costPerAccount} onChange={e=>uMC(activeMotion,i,"costPerAccount",parseInt(e.target.value)||1)} style={{width:55,background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"2px 5px",color:C.text,fontSize:10,fontFamily:"'Chivo Mono',monospace"}}/>
              </div>}
            </div>
          ))}
        </Card>
      </div>

      {/* Right: output tables by motion */}
      <div>
        {/* DEMAND CREATION */}
        {activeMotion==="create" && <Card style={{marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:MOTION_COLORS.create,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>🟩 Demand Creation — Revenue Impact</h3>
          <div style={{fontSize:10,color:C.muted,marginBottom:12}}>What creates net-new demand?</div>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead><tr>{["Channel","Spend","Inquiries","CPL","MQLs","Pipeline","CAC (create)","ROI"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
            <tbody>
              {mot.create.channels.map((c,i)=><tr key={c.name}>
                <td style={{padding:"7px",textAlign:"right",fontWeight:600,color:C.text}}>{c.name}</td>
                {[fmt(c.spend),fN(c.inquiries),fmt(c.cpl),fN(c.mqls),fmt(c.sqos*inputs.avgDealSize),fmt(c.cac)].map((v,j)=>
                  <td key={j} style={{padding:"7px",color:C.muted,fontFamily:"'Chivo Mono',monospace",textAlign:"right"}}>{v}</td>)}
                <td style={{padding:"7px",fontWeight:700,fontFamily:"'Chivo Mono',monospace",textAlign:"right",color:c.roi>5?C.green:c.roi>2?C.amber:C.red}}>{c.roi.toFixed(1)}x</td>
              </tr>)}
              <tr style={{borderTop:`2px solid ${C.borderMid}`,fontWeight:700}}>
                <td style={{padding:"7px",textAlign:"right",color:MOTION_COLORS.create}}>Total</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.create.totals.spend)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.create.totals.inquiries)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.create.totals.blendedCPL)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.create.totals.mqls)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.create.totals.pipeline)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.create.totals.cacCreation)}</td>
                <td style={{padding:"7px"}}/>
              </tr>
            </tbody>
          </table></div>
        </Card>}

        {/* DEMAND CONVERSION */}
        {activeMotion==="convert" && <Card style={{marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:MOTION_COLORS.convert,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>🟨 Demand Conversion — Throughput Engine</h3>
          <div style={{fontSize:10,color:C.muted,marginBottom:12}}>What turns interest into real pipeline? No revenue yet — this is a throughput engine.</div>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead><tr>{["Function","Cost","SQLs Processed","SQOs Created","Cost/SQO","Capacity Util"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
            <tbody>
              {mot.convert.channels.map((c,i)=><tr key={c.name}>
                <td style={{padding:"7px",textAlign:"right",fontWeight:600,color:C.text}}>{c.name}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(c.spend)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fN(c.sqlsProcessed)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fN(c.sqosCreated)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(c.costPerSqo)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:c.capacityUtil>80?C.green:c.capacityUtil>50?C.amber:C.red}}>{c.capacityUtil.toFixed(0)}%</td>
              </tr>)}
              <tr style={{borderTop:`2px solid ${C.borderMid}`,fontWeight:700}}>
                <td style={{padding:"7px",textAlign:"right",color:MOTION_COLORS.convert}}>Total</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.convert.totals.spend)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.convert.totals.sqlsProcessed)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.convert.totals.sqosCreated)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.convert.totals.costPerSqo)}</td>
                <td style={{padding:"7px"}}/>
              </tr>
            </tbody>
          </table></div>
        </Card>}

        {/* DEAL ACCELERATION */}
        {activeMotion==="accelerate" && <Card style={{marginBottom:14}}>
          <h3 style={{fontSize:11,fontWeight:700,color:MOTION_COLORS.accelerate,margin:0,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>🟥 Deal Acceleration — Velocity & Win Rate</h3>
          <div style={{fontSize:10,color:C.muted,marginBottom:12}}>What collapses time and risk? No CPL. No fake attribution.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            <div style={{padding:10,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.dim}}>Accounts Touched</div>
              <div style={{fontSize:18,fontWeight:700,color:MOTION_COLORS.accelerate,fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.accelerate.totals.accountsTouched)}</div>
            </div>
            <div style={{padding:10,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.dim}}>Opps Influenced</div>
              <div style={{fontSize:18,fontWeight:700,color:MOTION_COLORS.accelerate,fontFamily:"'Chivo Mono',monospace"}}>{fN(mot.accelerate.totals.oppsInfluenced)}</div>
            </div>
            <div style={{padding:10,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.dim}}>Avg Days Reduced</div>
              <div style={{fontSize:18,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace"}}>{mot.accelerate.totals.daysReduced}</div>
            </div>
            <div style={{padding:10,background:C.bg,borderRadius:0,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.dim}}>Rev Pulled Forward</div>
              <div style={{fontSize:18,fontWeight:700,color:C.green,fontFamily:"'Chivo Mono',monospace"}}>{fmt(mot.accelerate.totals.revenuePulledForward)}</div>
            </div>
          </div>
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
            <thead><tr>{["Program","Spend","Accounts","Opps Influenced","Days Reduced","Win Rate Δ","Intent"].map(h=><th key={h} style={{textAlign:"right",padding:"7px",color:C.dim,fontWeight:600,fontSize:9,textTransform:"uppercase",borderBottom:`2px solid ${C.borderMid}`}}>{h}</th>)}</tr></thead>
            <tbody>
              {mot.accelerate.channels.map((c,i)=><tr key={c.name}>
                <td style={{padding:"7px",textAlign:"right",fontWeight:600,color:C.text}}>{c.name}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fmt(c.spend)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fN(c.accountsTouched)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.muted}}>{fN(c.oppsInfluenced)}</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.green}}>{c.avgDaysReduced}d</td>
                <td style={{padding:"7px",textAlign:"right",fontFamily:"'Chivo Mono',monospace",color:C.green}}>+{c.winRateDelta}%</td>
                <td style={{padding:"7px",textAlign:"right",fontSize:9,color:C.dim}}>{c.intent}</td>
              </tr>)}
            </tbody>
          </table></div>
          <div style={{marginTop:12,padding:10,background:`${MOTION_COLORS.accelerate}08`,borderRadius:0,border:`1px solid ${MOTION_COLORS.accelerate}15`}}>
            <div style={{fontSize:11,color:C.text}}>
              <strong style={{color:MOTION_COLORS.accelerate}}>CFO-grade:</strong> We spent {fmt(mot.accelerate.totals.spend)} to influence {fN(mot.accelerate.totals.oppsInfluenced)} opportunities, 
              pull {fmt(mot.accelerate.totals.revenuePulledForward)} of revenue forward by {mot.accelerate.totals.daysReduced} days, 
              and lift win rate by +{mot.accelerate.totals.winRateLift}%.
            </div>
          </div>
        </Card>}
      </div>
    </div>
  </div>);
}

function PipelinePage({model,inputs,onInfoClick}){
  const{stages,summary:s,pnl:p,channels}=model;
  const totalChannelSpend = channels.reduce((sum,c) => sum + c.spend, 0);
  const blendedCPL = s.inquiriesNeeded > 0 ? totalChannelSpend / s.inquiriesNeeded : 0;
  // Cost to generate each stage volume from demand gen spend
  const stageCosts = stages.map((st,i) => {
    const costPer = st.count > 0 ? totalChannelSpend / st.count : 0;
    return { ...st, costPer, totalCost: i === 0 ? totalChannelSpend : costPer * st.count };
  });
  // Budget context
  const demandGenBudget = p.variableMktg;
  const afterFixed = p.totalMktgBudget - p.fixedMktg;
  const fixedPctActual = p.totalMktgBudget > 0 ? p.fixedMktg / p.totalMktgBudget * 100 : 0;

  return(<div><Header title="Pipeline" sub="Lifecycle waterfall — volume, cost per stage, budget context" icon={GitBranch} moduleId="pipeline" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
      <Metric label="SQO Pipeline" value={fmt(s.stage2Pipeline)} sub="Forecastable" color={C.green}/>
      <Metric label="Stage 1 Pipeline" value={fmt(s.stage1Pipeline)} sub="Non-forecastable" color={C.amber}/>
      <Metric label="Funnel Yield" value={`${(s.effectiveFunnelYield*100).toFixed(2)}%`} sub={`${Math.round(1/s.effectiveFunnelYield)}:1 inq/deal`} color={C.accent}/>
      <Metric label="Demand Gen Budget" value={fmt(demandGenBudget)} sub={`${inputs.variableMktgPct}% of rev`} color={C.blue}/>
      <Metric label="Blended CPL" value={fmt(blendedCPL)} sub="Channel spend ÷ inquiries" color={C.chart[0]}/>
    </div>

    {/* Budget flow: total → fixed absorbed → demand gen → what it buys */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Budget → Pipeline Flow</h3>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {[
          {label:"Total Mktg", value:p.totalMktgBudget, color:C.accent, sub:`${(p.totalMktgBudget/p.totalRevenue*100).toFixed(0)}% rev`},
          {label:"Fixed Absorbed", value:p.fixedMktg, color:C.violet, sub:`${fixedPctActual.toFixed(0)}% overhead`, negative:true},
          {label:"Demand Gen", value:afterFixed, color:C.amber, sub:"variable budget"},
          {label:"Martech Tax", value:p.martechSpend, color:C.blue, sub:`${inputs.martechPctOfVariable||25}%`, negative:true},
          {label:"Channel Spend", value:p.programmaticBudget, color:C.green, sub:"buys inquiries"},
        ].map((step,i,arr)=>(
          <div key={step.label} style={{display:"flex",alignItems:"center",flex:1,gap:0}}>
            <div style={{flex:1,padding:12,background:`${step.color}08`,borderRadius:0,border:`1px solid ${step.color}20`,textAlign:"center",position:"relative"}}>
              {step.negative && <div style={{position:"absolute",top:4,right:8,fontSize:9,color:C.red,fontWeight:700}}>−</div>}
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",fontWeight:700}}>{step.label}</div>
              <div style={{fontSize:16,fontWeight:700,color:step.color,fontFamily:"'Chivo Mono',monospace",marginTop:4}}>{fmt(step.value)}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{step.sub}</div>
            </div>
            {i<arr.length-1 && <div style={{padding:"0 4px",color:C.dim,fontSize:14}}>→</div>}
          </div>
        ))}
      </div>
      {p.fixedMktgIsFloorBound && (
        <div style={{marginTop:10,padding:8,background:`${C.amber}08`,borderRadius:0,border:`1px solid ${C.amber}15`}}>
          <span style={{fontSize:10,color:C.amber,fontWeight:600}}>⚠ Floor-bound:</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:6}}>
            Headcount floor ({fmt(p.floorTotal)}) exceeds formula overhead. VP alone = {((p.leadershipInMktg||455000)/p.totalRevenue*100).toFixed(1)}% of revenue. 
            Only {fmt(p.programmaticBudget)} reaches channel spend — {(p.programmaticBudget/p.totalMktgBudget*100).toFixed(0)}% of total marketing budget actually buys pipeline.
          </span>
        </div>
      )}
    </Card>

    {/* Funnel waterfall with cost per stage */}
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.04em"}}>Funnel Waterfall — Volume & Unit Economics</h3>
      {stageCosts.map((st,i)=>{
        const w = stages[0].count > 0 ? (st.count/stages[0].count)*100 : 0;
        return(<div key={st.name} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:4}}>
            <div>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>{st.name}</span>
              <span style={{fontSize:9,color:C.dim,marginLeft:8}}>{st.question} • {st.owner}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:14,fontWeight:700,color:C.chart[i],fontFamily:"'Chivo Mono',monospace"}}>{fN(st.count)}</span>
              <span style={{fontSize:10,color:C.muted,marginLeft:10}}>{fmt(st.costPer)}/ea</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1,height:28,background:C.bg,borderRadius:0,overflow:"hidden",position:"relative"}}>
              <motion.div initial={{width:0}} animate={{width:`${Math.max(w,2)}%`}} transition={{duration:0.6,delay:i*0.08}}
                style={{height:"100%",background:`linear-gradient(90deg,${C.chart[i]},${C.chart[i]}66)`,borderRadius:0,display:"flex",alignItems:"center",paddingLeft:10}}>
                <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>{w.toFixed(0)}%</span>
              </motion.div>
            </div>
            <div style={{width:80,textAlign:"right",fontSize:10,color:C.dim,fontFamily:"'Chivo Mono',monospace"}}>
              {i===0 ? fmt(totalChannelSpend) : ""}
            </div>
          </div>
          {i<stages.length-1&&<div style={{fontSize:9,color:C.dim,textAlign:"right",marginTop:2}}>{st.nextRate}% → {stages[i+1].name}</div>}
        </div>);
      })}
    </Card>

    {/* Unit economics summary */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Cost to Generate Pipeline</div>
        {[
          {label:"Per Inquiry", value: blendedCPL, bench:"$80-150 cyber"},
          {label:"Per MQL", value: s.mqlsNeeded > 0 ? totalChannelSpend / s.mqlsNeeded : 0, bench:"$250-500 mid-market"},
          {label:"Per SQL", value: s.sqlsNeeded > 0 ? totalChannelSpend / s.sqlsNeeded : 0, bench:"$600-1200"},
          {label:"Per Meeting", value: s.meetingsNeeded > 0 ? totalChannelSpend / s.meetingsNeeded : 0, bench:"$800-1500"},
          {label:"Per SQO", value: s.sqosNeeded > 0 ? totalChannelSpend / s.sqosNeeded : 0, bench:"$8K-15K cyber"},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.borderMid}`}}>
            <div><span style={{fontSize:11,color:C.text}}>{r.label}</span><span style={{fontSize:8,color:C.dim,marginLeft:6}}>{r.bench}</span></div>
            <span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(r.value)}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Funnel Efficiency</div>
        {[
          {label:"Inquiry → Deal", value:`${(s.effectiveFunnelYield*100).toFixed(2)}%`, desc:`${Math.round(1/s.effectiveFunnelYield)}:1 ratio`},
          {label:"MQL → Deal", value:`${((s.dealsNeeded/s.mqlsNeeded)*100).toFixed(1)}%`, desc:`${Math.round(s.mqlsNeeded/s.dealsNeeded)}:1`},
          {label:"SQO → Deal", value:`${inputs.sqoToWonRate}%`, desc:`${Math.round(100/inputs.sqoToWonRate)}:1`},
          {label:"Mktg Sourced", value:`${inputs.mktgSourcedPct}%`, desc:`${fN(s.mktgSQOs)} mktg SQOs`},
          {label:"AE Sourced", value:`${100-inputs.mktgSourcedPct}%`, desc:`${fN(s.aeSelfSourcedSQOs)} AE SQOs`},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.borderMid}`}}>
            <span style={{fontSize:11,color:C.text}}>{r.label}</span>
            <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{r.value}</span><span style={{fontSize:9,color:C.dim,marginLeft:6}}>{r.desc}</span></div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Budget Reality Check</div>
        {[
          {label:"Total Mktg Budget", value:fmt(p.totalMktgBudget), color:C.accent},
          {label:"Absorbed by Overhead", value:fmt(p.fixedMktg), color:C.violet},
          {label:"Available for Demand", value:fmt(afterFixed), color:C.amber},
          {label:"Buys Inquiries", value:fN(s.mktgInquiriesNeeded), color:C.chart[0]},
          {label:"Yields Deals", value:fN(s.dealsNeeded), color:C.green},
        ].map(r=>(
          <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.borderMid}`}}>
            <span style={{fontSize:11,color:C.text}}>{r.label}</span>
            <span style={{fontSize:12,fontWeight:700,color:r.color,fontFamily:"'Chivo Mono',monospace"}}>{r.value}</span>
          </div>
        ))}
      </Card>
    </div>
  </div>);
}

function VelocityPage({model,inputs,setInputs,onInfoClick}){
  const{velocityStages,summary:s}=model;const totalDays=s.totalCycleDays;
  return(<div><Header title="Pipeline Velocity" sub="Stage-level time analysis" icon={Clock} moduleId="velocity" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
      <Metric label="Total Cycle" value={`${totalDays} days`} sub={`${Math.round(totalDays/7)} weeks`} color={C.accent}/><Metric label="Daily Velocity" value={fmt(s.velocityPerDay)} sub="Rev per day" color={C.green}/><Metric label="Stage 2 Pipeline" value={fmt(s.stage2Pipeline)} sub="Board-safe" color={C.violet}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:24}}>
      <Card><h3 style={{fontSize:12,fontWeight:700,color:C.accent,margin:0,marginBottom:16,textTransform:"uppercase",letterSpacing:"0.06em"}}>Stage Duration (days)</h3>
        <Input label="Stage 1→2 (Discovery→SQO)" value={inputs.velStage1to2} onChange={v=>setInputs(p=>({...p,velStage1to2:v}))} suffix="days" min={1}/><Input label="Stage 2→3 (Tech)" value={inputs.velStage2to3} onChange={v=>setInputs(p=>({...p,velStage2to3:v}))} suffix="days" min={1}/><Input label="Stage 3→4 (Biz Case)" value={inputs.velStage3to4} onChange={v=>setInputs(p=>({...p,velStage3to4:v}))} suffix="days" min={1}/><Input label="Stage 4→5 (Legal)" value={inputs.velStage4to5} onChange={v=>setInputs(p=>({...p,velStage4to5:v}))} suffix="days" min={1}/><Input label="Stage 5→Close" value={inputs.velStage5toClose} onChange={v=>setInputs(p=>({...p,velStage5toClose:v}))} suffix="days" min={1}/>
        <div style={{marginTop:12,padding:12,background:C.bg,borderRadius:0,textAlign:"center"}}><div style={{fontSize:10,color:C.dim,textTransform:"uppercase"}}>Total Cycle</div><div style={{fontSize:22,fontWeight:700,color:C.accent,marginTop:4}}>{totalDays} days</div></div>
      </Card>
      <div>
        <Card style={{marginBottom:18}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:16}}>Stage Duration Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={velocityStages} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis type="number" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis dataKey="name" type="category" stroke={C.dim} fontSize={10} width={160} tickLine={false}/><Tooltip content={<TT/>}/>
            <Bar dataKey="days" radius={[0,6,6,0]} name="Days">{velocityStages.map((_,i)=><Cell key={i} fill={C.chart[i]}/>)}</Bar>
          </BarChart></ResponsiveContainer></Card>
        <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:12}}>Velocity Diagnostic</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{label:"High conv + long time",signal:"Process friction",color:C.amber,fix:"Streamline approvals"},{label:"Short time + low conv",signal:"Premature promotion",color:C.red,fix:"Tighten stage entry"},{label:"High conv + short time",signal:"Healthy velocity",color:C.green,fix:"Scale this motion"},{label:"Low conv + long time",signal:"Dead pipeline",color:C.red,fix:"Kill faster"}].map(r=>(
              <div key={r.label} style={{padding:12,background:C.bg,borderRadius:0,border:`1px solid ${r.color}22`}}><div style={{fontSize:11,fontWeight:700,color:r.color,marginBottom:4}}>{r.signal}</div><div style={{fontSize:10,color:C.muted,marginBottom:4}}>{r.label}</div><div style={{fontSize:10,color:C.dim}}>→ {r.fix}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>);
}

function RampPage({model,inputs,setInputs,onInfoClick}){return(<div><Header title="Seller Ramp" sub="AE productivity curve with attrition" icon={TrendingUp} moduleId="sellerRamp" onInfoClick={onInfoClick}/><div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:24}}><Card><Input label="AEs" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/><Input label="Quota" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/><Input label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo" min={1} max={12}/><Input label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/>
    <div style={{height:1,background:C.borderMid,margin:"10px 0"}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <div style={{padding:8,background:C.bg,borderRadius:0,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>Ramp Loss</div><div style={{fontSize:13,fontWeight:700,color:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fmt(model.summary.totalRampLoss)}</div></div>
      <div style={{padding:8,background:C.bg,borderRadius:0,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>Attrition Loss</div><div style={{fontSize:13,fontWeight:700,color:C.red,fontFamily:"'Chivo Mono',monospace"}}>{fmt(model.summary.totalAttrLoss)}</div></div>
    </div>
    {inputs.aeAttritionRate > 0 && <div style={{marginTop:8,fontSize:9,color:C.muted}}>Eff. AEs by Dec: {model.sellerRamp[11]?.effectiveAEs}</div>}
  </Card>
  <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Ramp Curve {inputs.aeAttritionRate > 0 ? "(incl. attrition)" : ""}</h3><ResponsiveContainer width="100%" height={300}><ComposedChart data={model.sellerRamp}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={11} tickLine={false}/><YAxis yAxisId="l" stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><YAxis yAxisId="r" orientation="right" stroke={C.dim} fontSize={11} tickFormatter={v=>`${(v*100).toFixed(0)}%`} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/><Bar yAxisId="l" dataKey="totalCapacity" fill={C.blueDim} stroke={C.blue} strokeWidth={1} radius={[4,4,0,0]} name="Capacity"/><Bar yAxisId="l" dataKey="attrLoss" fill={C.redDim} stroke={C.red} strokeWidth={1} radius={[4,4,0,0]} name="Attrition Loss"/><Line yAxisId="r" type="monotone" dataKey="rampPct" stroke={C.accent} strokeWidth={2.5} dot={false} name="Ramp%"/></ComposedChart></ResponsiveContainer></Card></div></div>);}

// ─── P&L: Dual-Axis Cost Model ───
function PnLPage({model,inputs,setInputs,onInfoClick}){
  const{pnl:p,summary:s}=model;

  // Functional P&L waterfall
  const funcItems=[
    {l:"Revenue",v:p.totalRevenue,c:C.accent,b:1},
    {l:"COGS",v:-p.cogsAmount,c:C.red,i:1},
    {l:"Gross Profit",v:p.grossProfit,c:C.green,b:1},
    {l:"---"},
    {l:"G&A",v:-p.gAndA,c:C.red,i:1,pct:inputs.gAndAPct},
    {l:"R&D",v:-p.rAndD,c:C.red,i:1,pct:inputs.rAndDPct},
    {l:"Sales OPEX",v:-p.salesOpex,c:C.red,i:1,pct:inputs.salesOpexPct},
    {l:"Marketing",v:-p.totalMktgBudget,c:C.red,i:1},
    {l:"Total OpEx",v:-p.totalOpex,c:C.amber,b:1},
    {l:"---2"},
    {l:"Op Income",v:p.operatingIncome,c:p.operatingIncome>=0?C.green:C.red,b:1}
  ];

  // Behavioral breakdown
  const behavItems=[
    {l:"Fixed Sales Comp",v:p.fixedSalesComp,c:C.violet},
    {l:"Fixed Marketing",v:p.fixedMktg,c:C.violet},
    {l:"G&A (fixed)",v:p.gAndA,c:C.violet},
    {l:"R&D (fixed)",v:p.rAndD,c:C.violet},
    {l:"---"},
    {l:"Total Fixed",v:p.totalFixedCosts,c:C.violet,b:1},
    {l:"---2"},
    {l:"Variable Sales Comp",v:p.variableSalesComp,c:C.amber},
    {l:"Variable Marketing",v:p.variableMktg,c:C.amber},
    {l:"---3"},
    {l:"Total Variable",v:p.totalVariableCosts,c:C.amber,b:1},
  ];

  const budgetPie=[
    {name:"Fixed",value:p.totalFixedCosts,fill:C.violet},
    {name:"Variable",value:p.totalVariableCosts,fill:C.amber}
  ];

  // S&M health indicator
  const sAndMColor = p.sAndMHealth === "burn_risk" ? C.red : p.sAndMHealth === "underinvest" ? C.amber : C.green;
  const sAndMLabel = p.sAndMHealth === "burn_risk" ? "BURN RISK" : p.sAndMHealth === "underinvest" ? "UNDERINVEST" : "HEALTHY";

  return(<div><Header title="P&L" sub="Dual-axis cost model — Fixed/Variable × Functional" icon={DollarSign} moduleId="pnl" onInfoClick={onInfoClick}/>
    <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:24}}>
      <Card>
        <div style={{fontSize:9,fontWeight:700,color:C.accent,textTransform:"uppercase",marginBottom:8}}>Functional (% of Rev)</div>
        <Input compact label="Gross Margin" value={inputs.grossMargin} onChange={v=>setInputs(p=>({...p,grossMargin:v}))} suffix="%"/>
        <Input compact label="G&A" value={inputs.gAndAPct} onChange={v=>setInputs(p=>({...p,gAndAPct:v}))} suffix="%" step={1}/>
        <Input compact label="R&D" value={inputs.rAndDPct} onChange={v=>setInputs(p=>({...p,rAndDPct:v}))} suffix="%" step={1}/>
        <Input compact label="Sales OPEX" value={inputs.salesOpexPct} onChange={v=>setInputs(p=>({...p,salesOpexPct:v}))} suffix="%" step={1}/>
        <Input compact label="Variable Mktg" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
        <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
        <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",marginBottom:8}}>Behavioral Splits</div>
        <Input compact label="Sales Variable %" value={inputs.salesVariablePct} onChange={v=>setInputs(p=>({...p,salesVariablePct:v}))} suffix="%" step={5}/>
        <Input compact label="Fixed Mktg %" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={5}/>
        <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
        <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:8}}>Retention</div>
        <Input compact label="NRR" value={inputs.nrrPercent} onChange={v=>setInputs(p=>({...p,nrrPercent:v}))} suffix="%"/>
        <Input compact label="Churn" value={inputs.churnRate} onChange={v=>setInputs(p=>({...p,churnRate:v}))} suffix="%" step={0.5}/>
      </Card>
      <div>
        {/* Top metrics */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
          <Metric label="Op Margin" value={`${(p.opMargin*100).toFixed(1)}%`} color={p.operatingIncome>=0?C.green:C.red}/>
          <Metric label="Contribution" value={`${(p.contributionMarginPct*100).toFixed(1)}%`} sub={fmt(p.contributionMargin)} color={C.accent}/>
          <Metric label="Breakeven Rev" value={fmt(p.breakEvenRevenue)} color={C.amber}/>
          <Metric label="Rule of 40" value={s.rule40.toFixed(0)} color={s.rule40>=40?C.green:C.red}/>
          <Metric label="Total S&M" value={`${p.totalSAndMPct.toFixed(0)}%`} sub={<span style={{color:sAndMColor}}>{sAndMLabel}</span>} color={sAndMColor}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
          {/* Functional P&L */}
          <Card>
            <h3 style={{fontSize:11,fontWeight:700,color:C.accent,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Functional View</h3>
            {funcItems.map((it,i)=>{if(it.l?.startsWith("---"))return<div key={i} style={{height:1,background:C.borderMid,margin:"3px 0"}}/>;return(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:0,background:it.b?C.bg:"transparent"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>{it.i&&<div style={{width:14}}/>}<span style={{fontSize:12,fontWeight:it.b?700:400,color:it.b?C.text:C.muted}}>{it.l}</span>{it.pct!=null&&<span style={{fontSize:9,color:C.dim}}>({it.pct}%)</span>}</div>
              <span style={{fontSize:13,fontWeight:it.b?700:500,color:it.c,fontFamily:"'Chivo Mono',monospace"}}>{it.v<0?`(${fmt(Math.abs(it.v))})`:fmt(it.v)}</span>
            </div>);})}
          </Card>

          {/* Behavioral view */}
          <Card>
            <h3 style={{fontSize:11,fontWeight:700,color:C.violet,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Behavioral View (Fixed / Variable)</h3>
            {behavItems.map((it,i)=>{if(it.l?.startsWith("---"))return<div key={i} style={{height:1,background:C.borderMid,margin:"3px 0"}}/>;return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",borderRadius:0,background:it.b?C.bg:"transparent"}}>
              <span style={{fontSize:12,fontWeight:it.b?700:400,color:it.b?C.text:C.muted}}>{it.l}</span>
              <span style={{fontSize:13,fontWeight:it.b?700:500,color:it.c,fontFamily:"'Chivo Mono',monospace"}}>{fmt(it.v)}</span>
            </div>);})}
            <div style={{marginTop:12}}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart><Pie data={budgetPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                  {budgetPie.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                </Pie><Tooltip formatter={v=>fmt(v)}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",justifyContent:"center",gap:20}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.dim}}>Fixed</div><div style={{fontSize:14,fontWeight:700,color:C.violet,fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.totalFixedCosts)}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:C.dim}}>Variable</div><div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.totalVariableCosts)}</div></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Benchmark Deltas */}
        {p.benchDeltas && p.benchDeltas.length > 0 && (
        <Card style={{marginBottom:18}}>
          <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.04em"}}>Delta from Benchmark (B2B Cyber Mid-Market)</h3>
          {p.benchDeltas.map((b,i)=>{
            const pctPos = b.benchHigh > b.benchLow ? ((b.actual - b.benchLow) / (b.benchHigh - b.benchLow)) * 100 : 50;
            const barColor = b.position === "within" ? C.green : b.position === "above" ? C.amber : C.blue;
            return(<div key={b.key} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:C.text}}>{b.label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,fontWeight:700,color:barColor,fontFamily:"'Chivo Mono',monospace"}}>{b.actual.toFixed(1)}%</span>
                  <span style={{fontSize:9,color:C.dim}}>vs {b.benchMid}% mid</span>
                  <span style={{fontSize:10,fontWeight:600,color:b.delta>0?C.amber:C.blue,fontFamily:"'Chivo Mono',monospace"}}>{b.deltaLabel}</span>
                </div>
              </div>
              <div style={{position:"relative",height:16,background:C.bg,borderRadius:0,overflow:"hidden"}}>
                {/* Benchmark range */}
                <div style={{position:"absolute",left:0,right:0,top:0,bottom:0,background:`linear-gradient(90deg, ${C.blueDim} 0%, ${C.greenDim} 30%, ${C.greenDim} 70%, ${C.amberDim} 100%)`,borderRadius:0}}/>
                {/* Mid marker */}
                <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.dim,zIndex:2}}/>
                {/* Actual position */}
                <div style={{position:"absolute",left:`${Math.max(0,Math.min(100,pctPos))}%`,top:1,bottom:1,width:10,marginLeft:-5,background:barColor,borderRadius:0,zIndex:3,border:`1px solid ${barColor}`}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                <span style={{fontSize:8,color:C.dim}}>{b.benchLow}%</span>
                <span style={{fontSize:8,color:C.dim}}>{b.benchHigh}%</span>
              </div>
            </div>);
          })}
          {/* CP-SQO benchmark */}
          <div style={{marginTop:8,padding:10,background:C.bg,borderRadius:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:9,color:C.dim,textTransform:"uppercase"}}>CP-SQO Actual vs Benchmark</div>
              <div style={{fontSize:16,fontWeight:700,color:p.cpSqoRatio<=1?C.green:p.cpSqoRatio<=1.5?C.amber:C.red,fontFamily:"'Chivo Mono',monospace"}}>{fmt(p.actualCpSqo)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.dim}}>Benchmark: {fmt(inputs.cpSqoBenchmark)}</div>
              <div style={{fontSize:13,fontWeight:700,color:p.cpSqoRatio<=1?C.green:p.cpSqoRatio<=1.5?C.amber:C.red}}>{p.cpSqoRatio.toFixed(1)}×</div></div>
          </div>
        </Card>)}
      </div>
    </div>
  </div>);
}

function GlideslopePage({model,inputs,setInputs,onInfoClick}){
  const gs=model.glideslope;const isEven=inputs.seasonalityMode==="even";
  const ny = model.numYears || 1;
  const y1End = gs[11];
  const y2End = ny > 1 ? gs[23] : null;
  return(<div><Header title="Glideslope" sub={ny>1?`${ny}-Year Planning Horizon — ${isEven?"Linear":"Seasonal"} targets`:(isEven?"Linear target (even distribution)":"Seasonal target (NORAM B2B pattern)")} icon={Target} moduleId="glideslope" onInfoClick={onInfoClick}/>
    <HorizonPlannerCard model={model} inputs={inputs} mobile={false}/>
    {/* Year summary cards */}
    <div style={{display:"grid",gridTemplateColumns:ny>1?"repeat(6,1fr)":"repeat(4,1fr)",gap:12,marginBottom:20}}>
      <Metric label="Y1 Exit" value={fmt(y1End?.totalARR)} color={C.accent}/>
      <Metric label="Y1 Target" value={fmt(y1End?.targetARR)} color={C.amber}/>
      <Metric label="Y1 Gap" value={fmt(y1End?.gapToTarget)} color={y1End?.gapToTarget>=0?C.green:C.red}/>
      {ny>1&&y2End&&<Metric label="Y2 Exit" value={fmt(y2End?.totalARR)} color={C.violet}/>}
      {ny>1&&y2End&&<Metric label="Y2 Target" value={fmt(y2End?.targetARR)} color={C.amber}/>}
      <Metric label="Seasonality" value={inputs.seasonalityMode.toUpperCase()} sub={isEven?"Flat":"Weighted"} color={C.dim}/>
    </div>
    {/* Year targets table */}
    {ny>1&&model.yearTargets&&(
    <Card style={{marginBottom:18}}>
      <h3 style={{fontSize:11,fontWeight:700,color:C.dim,margin:0,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.04em"}}>Multi-Year Plan</h3>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${ny},1fr)`,gap:12}}>
        {model.yearTargets.map((yt,i)=>(
          <div key={yt.label} style={{padding:14,background:C.bg,borderRadius:0,borderLeft:`3px solid ${i===0?C.accent:C.violet}`}}>
            <div style={{fontSize:14,fontWeight:700,color:i===0?C.accent:C.violet,marginBottom:8}}>{yt.label}</div>
            {[{l:"Start ARR",v:fmt(yt.startARR)},{l:"Target ARR",v:fmt(yt.targetARR)},{l:"New ARR Needed",v:fmt(yt.newARRNeeded)},{l:"Growth",v:`${yt.growthRate.toFixed(0)}%`},{l:"Deals",v:fN(yt.dealsNeeded)},{l:"SQOs",v:fN(yt.sqosNeeded)}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid ${C.borderMid}`}}>
                <span style={{fontSize:10,color:C.muted}}>{r.l}</span>
                <span style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{r.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        <div style={{display:"flex",gap:12}}>
          <Input compact label="Y2 Growth %" value={inputs.y2GrowthRate} onChange={v=>setInputs(p=>({...p,y2GrowthRate:v}))} suffix="%" step={5}/>
          <Input compact label="Years" value={inputs.planningYears} onChange={v=>setInputs(p=>({...p,planningYears:v}))} suffix="" step={1} min={1} max={3}/>
        </div>
      </div>
    </Card>)}
    <Card style={{marginBottom:18}}><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:6}}>Monthly Seasonal Weights</h3>
      <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60,marginBottom:14}}>
        {model.monthWeights.map((w,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <span style={{fontSize:8,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{(w*100).toFixed(0)}%</span>
          <div style={{width:"100%",background:C.accentDim,borderRadius:0,height:`${Math.max(w*100*8,4)}px`,border:`1px solid ${C.accent}44`}}/>
          <span style={{fontSize:8,color:C.dim}}>{MONTHS[i]}</span>
        </div>))}
      </div>
    </Card>
    <Card><ResponsiveContainer width="100%" height={360}><ComposedChart data={gs}><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="month" stroke={C.dim} fontSize={9} tickLine={false} interval={ny>1?1:0} angle={ny>1?-45:0} textAnchor={ny>1?"end":"middle"} height={ny>1?60:30}/><YAxis stroke={C.dim} fontSize={11} tickFormatter={v=>fmt(v)} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/>
      <Area type="monotone" dataKey="totalARR" stroke={C.accent} fill={C.accentDim} strokeWidth={2} name="Projected"/>
      <Line type="monotone" dataKey="targetARR" stroke={C.amber} strokeWidth={2.5} strokeDasharray="8 4" dot={false} name="Seasonal Target"/>
      {!isEven&&<Line type="monotone" dataKey="evenTarget" stroke={C.dim} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Linear Target"/>}
      {ny>1&&<ReferenceLine x="Jan Y2" stroke={C.violet} strokeWidth={2} strokeDasharray="4 4" label={{value:"Y2",position:"top",fill:C.violet,fontSize:11}}/>}
    </ComposedChart></ResponsiveContainer></Card>
  </div>);
}

function QBRPage({model,inputs,onInfoClick}){const isSplit=inputs.revenueMode==="split";const ny=model.numYears||1;const[yr,setYr]=useState(0);
  const qbr=model.qbrData.filter(q=>q.yearIndex===yr);
  return(<div><Header title="QBR Metrics" sub={ny>1?`Quarterly operating scorecard — Y${yr+1}`:"Quarterly operating scorecard"} icon={BarChart3} moduleId="qbr" onInfoClick={onInfoClick}/>
    {ny>1&&<div style={{display:"flex",gap:8,marginBottom:16}}>
      {Array.from({length:ny},(_,i)=>(<button key={i} onClick={()=>setYr(i)} style={{padding:"6px 16px",borderRadius:0,border:`1px solid ${yr===i?C.accent:C.borderMid}`,background:yr===i?C.accentDim:"transparent",color:yr===i?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600}}>{`Y${i+1}`}</button>))}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>{qbr.map((q,i)=><Card key={q.quarter}><div style={{fontSize:16,fontWeight:700,color:C.chart[i],marginBottom:10}}>{q.quarter}</div>{[{l:"Revenue",v:fmt(q.revenue)},{l:"New ARR",v:fmt(q.newARR)},isSplit&&{l:"New Logo",v:fmt(q.newLogoARR)},isSplit&&{l:"Expansion",v:fmt(q.expansionARR)},{l:"Won",v:fN(q.deals)},{l:"Inquiries",v:fN(q.inquiries)},{l:"MQLs",v:fN(q.mqls)},{l:"SQLs",v:fN(q.sqls)},{l:"Meetings",v:fN(q.meetings)},{l:"SQOs",v:fN(q.sqos)},{l:"Pipeline",v:fmt(q.pipeline)},{l:"Stage 2",v:fmt(q.stage2Pipe)}].filter(Boolean).map(m=><div key={m.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.borderMid}`}}><span style={{fontSize:10,color:C.muted}}>{m.l}</span><span style={{fontSize:11,fontWeight:600,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{m.v}</span></div>)}</Card>)}</div></div>);}

function WeeklyPage({model,onInfoClick}){const w=model.weeklySimplified;return(<div><Header title="Weekly Tracker" sub="Weekly lifecycle targets" icon={Calendar} moduleId="weekly" onInfoClick={onInfoClick}/><div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}><Metric label="Inquiries/wk" value={fN(w[0]?.inquiries)} color={C.chart[0]}/><Metric label="MQLs/wk" value={fN(w[0]?.mqls)} color={C.chart[1]}/><Metric label="SQLs/wk" value={fN(w[0]?.sqls)} color={C.chart[2]}/><Metric label="Meetings/wk" value={fN(w[0]?.meetings)} color={C.chart[3]}/><Metric label="SQOs/wk" value={fN(w[0]?.sqos)} color={C.chart[4]}/></div>
  <Card><h3 style={{fontSize:13,fontWeight:600,color:C.muted,margin:0,marginBottom:14}}>Cumulative: Inquiries → SQLs → SQOs</h3><ResponsiveContainer width="100%" height={280}><AreaChart data={w}><defs><linearGradient id="wI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.25}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient><linearGradient id="wQ" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.violet} stopOpacity={0.25}/><stop offset="95%" stopColor={C.violet} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.borderMid}/><XAxis dataKey="weekLabel" stroke={C.dim} fontSize={10} interval={3} tickLine={false}/><YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false}/><Tooltip content={<TT/>}/><Area type="monotone" dataKey="cumulativeInquiries" stroke={C.blue} fill="url(#wI)" strokeWidth={2} name="Inquiries"/><Area type="monotone" dataKey="cumulativeSQOs" stroke={C.violet} fill="url(#wQ)" strokeWidth={2} name="SQOs"/></AreaChart></ResponsiveContainer></Card></div>);}

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// NAV SECTION (collapsible sidebar group)
// ════════════════════════════════════════════════════════════
function NavSection({section,items,page,setPage}){
  const hasActive = items.some(n=>n.id===page);
  const[open,setOpen]=useState(hasActive || !section); // auto-open if contains active page or is top-level

  // Auto-open when user navigates to an item in this section
  const prevActive = items.some(n=>n.id===page);
  if(prevActive && !open) setOpen(true);

  return(<div style={{marginBottom:section?4:0}}>
    {section && (
      <button onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
        padding:"6px 10px",marginTop:8,border:"none",background:"transparent",cursor:"pointer",fontFamily:"'TWK Everett',sans-serif"}}>
        <span style={{fontSize:9,fontWeight:700,color:hasActive?C.accent:C.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>{section}</span>
        <span style={{fontSize:10,color:C.dim,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.15s"}}>▾</span>
      </button>
    )}
    {(open || !section) && items.map(n=>{
      const I=n.icon, a=page===n.id;
      return(
        <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",
          padding:section?"7px 10px 7px 18px":"8px 10px",marginBottom:1,border:"none",borderRadius:0,
          background:a?C.accentDim:"transparent",color:a?C.accent:C.muted,cursor:"pointer",fontSize:12,
          fontWeight:a?600:400,textAlign:"left",transition:"all 0.15s",fontFamily:"'TWK Everett',sans-serif"}}
          onMouseEnter={e=>{if(!a){e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.text}}}
          onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.muted}}}>
          <I size={13}/>{n.label}
        </button>
      );
    })}
  </div>);
}

// ════════════════════════════════════════════════════════════
// ONBOARDING WIZARD — "A contract with reality"
// Sets the physics before anyone touches a slider.
// ════════════════════════════════════════════════════════════

// Preset profiles that snap inputs to reality based on answers
const ONBOARDING_PRESETS = {
  // Sales motion × Buyer segment → default inputs
  motionBuyer: {
    "sales-led_smb":      { avgDealSize: 25000, salesCycleWeeks: 6, aeQuota: 500000, sqoToWonRate: 35, meetingToSqoRate: 55, sdrsPerAe: 2 },
    "sales-led_mid":      { avgDealSize: 60000, salesCycleWeeks: 12, aeQuota: 750000, sqoToWonRate: 30, meetingToSqoRate: 50, sdrsPerAe: 1.5 },
    "sales-led_enterprise":{ avgDealSize: 150000, salesCycleWeeks: 24, aeQuota: 1200000, sqoToWonRate: 25, meetingToSqoRate: 40, sdrsPerAe: 1 },
    "plg_smb":            { avgDealSize: 15000, salesCycleWeeks: 4, aeQuota: 400000, sqoToWonRate: 40, meetingToSqoRate: 60, sdrsPerAe: 0.5, mktgSourcedPct: 75 },
    "plg_mid":            { avgDealSize: 40000, salesCycleWeeks: 8, aeQuota: 600000, sqoToWonRate: 35, meetingToSqoRate: 55, sdrsPerAe: 1, mktgSourcedPct: 65 },
    "plg_enterprise":     { avgDealSize: 100000, salesCycleWeeks: 16, aeQuota: 900000, sqoToWonRate: 28, meetingToSqoRate: 45, sdrsPerAe: 1, mktgSourcedPct: 55 },
    "hybrid_smb":         { avgDealSize: 20000, salesCycleWeeks: 5, aeQuota: 450000, sqoToWonRate: 38, meetingToSqoRate: 55, sdrsPerAe: 1.5, mktgSourcedPct: 60 },
    "hybrid_mid":         { avgDealSize: 50000, salesCycleWeeks: 10, aeQuota: 700000, sqoToWonRate: 32, meetingToSqoRate: 50, sdrsPerAe: 1.5, mktgSourcedPct: 55 },
    "hybrid_enterprise":  { avgDealSize: 120000, salesCycleWeeks: 20, aeQuota: 1000000, sqoToWonRate: 26, meetingToSqoRate: 42, sdrsPerAe: 1, mktgSourcedPct: 45 },
  },
  // Growth intent → cost structure
  growthIntent: {
    efficiency: { grossMargin: 80, gAndAPct: 8, rAndDPct: 18, salesOpexPct: 22, variableMktgPct: 7 },
    growth:     { grossMargin: 78, gAndAPct: 10, rAndDPct: 20, salesOpexPct: 25, variableMktgPct: 9 },
    capture:    { grossMargin: 75, gAndAPct: 12, rAndDPct: 22, salesOpexPct: 30, variableMktgPct: 12 },
  },
  // Funding stage
  funding: {
    bootstrapped: { fundingStage: "bootstrapped" },
    seed:         { fundingStage: "seed" },
    seriesA:      { fundingStage: "seriesA" },
    seriesB:      { fundingStage: "seriesB" },
    seriesC:      { fundingStage: "seriesC" },
  },
  // Entry point → mktg sourced
  entryPoint: {
    inbound:   { mktgSourcedPct: 65 },
    outbound:  { mktgSourcedPct: 30 },
    partner:   { mktgSourcedPct: 40 },
    expansion: { mktgSourcedPct: 25 },
  },
};

const ONBOARDING_STEPS = [
  { id: "welcome", title: "OpptyCon", sub: "Before we model revenue, we need to declare how your company actually behaves — on a bad Tuesday, not in a board deck." },
  { id: "role", title: "Who are you?", sub: "We'll route you to a pane of glass tuned to your seat. You can change views any time from the left nav." },
  { id: "motion", title: "GTM Operating Model", sub: "How do you actually acquire and close customers?" },
  { id: "scale", title: "Current Scale", sub: "Where are you now?" },
  { id: "capacity", title: "Capacity Constraints", sub: "Models assume infinite elasticity. Let's kill that fantasy." },
  { id: "finance", title: "Financial Guardrails", sub: "CFO-grade constraints that bound the model." },
  { id: "intent", title: "Growth Intent", sub: "This changes the math. Be honest." },
  { id: "review", title: "Your Operating Profile", sub: "Here's the contract with reality. Everything downstream is tuning, not debate." },
];

function OnboardingWizard({onComplete}){
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState({
    role: "ceo",
    salesMotion: "sales-led",
    buyerSegment: "mid",
    entryPoint: "inbound",
    fundingStage: "seriesB",
    startingARR: 3000000,
    targetARR: 10000000,
    aeCount: 8,
    aeRampMonths: 6,
    maxOppsPerAE: 25,
    maxMeetingsPerSDR: 15,
    growthIntent: "growth",
    grossMargin: 78,
    maxCACPayback: 24,
    pipelineCoverage: 3,
    slipPct: 20,
  });
  const u=(k,v)=>setAnswers(p=>({...p,[k]:v}));
  const canNext = step < ONBOARDING_STEPS.length - 1;
  const canBack = step > 0;
  const currentStep = ONBOARDING_STEPS[step];

  // Build final overrides from answers
  const buildOverrides=()=>{
    const key = `${answers.salesMotion}_${answers.buyerSegment}`;
    const motionDefaults = ONBOARDING_PRESETS.motionBuyer[key] || {};
    const intentDefaults = ONBOARDING_PRESETS.growthIntent[answers.growthIntent] || {};
    const fundingDefaults = ONBOARDING_PRESETS.funding[answers.fundingStage] || {};
    const entryDefaults = ONBOARDING_PRESETS.entryPoint[answers.entryPoint] || {};
    return {
      ...motionDefaults,
      ...intentDefaults,
      ...fundingDefaults,
      ...entryDefaults,
      startingARR: answers.startingARR,
      targetARR: answers.targetARR,
      aeCount: answers.aeCount,
      aeRampMonths: answers.aeRampMonths,
      grossMargin: answers.grossMargin,
      _persona: answers.role,  // routed by handleOnboardComplete; not consumed by engine
    };
  };

  const ChoiceGrid=({options,value,onChange,columns=3})=>(
    <div style={{display:"grid",gridTemplateColumns:`repeat(${columns},1fr)`,gap:10}}>
      {options.map(o=>{
        const isActive=value===o.value;
        return(<button key={o.value} onClick={()=>onChange(o.value)} style={{padding:"16px 14px",borderRadius:0,
          border:`2px solid ${isActive?C.accent:C.borderMid}`,background:isActive?C.accentDim:"transparent",
          cursor:"pointer",textAlign:"left",fontFamily:"'TWK Everett',sans-serif",transition:"all 0.15s"}}>
          <div style={{fontSize:13,fontWeight:700,color:isActive?C.accent:C.text}}>{o.label}</div>
          {o.desc&&<div style={{fontSize:10,color:C.muted,marginTop:4,lineHeight:1.4}}>{o.desc}</div>}
        </button>);
      })}
    </div>
  );

  const NumberInput=({label,value,onChange,prefix,suffix,step:s=1,desc})=>(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:4}}>{label}</div>
      {desc&&<div style={{fontSize:10,color:C.dim,marginBottom:6}}>{desc}</div>}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:C.bg,borderRadius:0,border:`1px solid ${C.borderMid}`}}>
        {prefix&&<span style={{color:C.dim,fontSize:13}}>{prefix}</span>}
        <input type="number" value={value} step={s} onChange={e=>onChange(parseFloat(e.target.value)||0)}
          style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:14,fontFamily:"'Chivo Mono',monospace"}}/>
        {suffix&&<span style={{color:C.dim,fontSize:11}}>{suffix}</span>}
      </div>
    </div>
  );

  const renderStep=()=>{
    switch(currentStep.id){
      case "welcome": return(
        <div style={{textAlign:"center",maxWidth:500,margin:"0 auto"}}>
          <div style={{fontSize:48,marginBottom:16}}>⚡</div>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:24}}>
            This wizard asks 6 questions that determine 80% of your model. Everything after this is tuning.
          </p>
          <p style={{fontSize:12,color:C.dim,lineHeight:1.6}}>
            Answers should describe how your company actually behaves — not how it wants to behave in a deck.
            Models lie when inputs are aspirational. Let's start with physics.
          </p>
        </div>
      );
      case "role": return(<div>
        <div style={{marginBottom:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
          The model is the same across personas — the framing changes. Pick the view you'll spend most of your time in.
          The full 17-module nav is always available from the left sidebar.
        </div>
        <ChoiceGrid columns={2} value={answers.role} onChange={v=>u("role",v)} options={[
          {value:"ceo",label:"CEO",desc:"Plan confidence + biggest threat + investment posture."},
          {value:"cfo",label:"CFO",desc:"Unit economics + burn + S&M as % of revenue band."},
          {value:"cro",label:"CRO / VP Sales",desc:"Capacity, quarterly coverage, hire timing, SDR engine."},
          {value:"cmo",label:"CMO / VP Marketing",desc:"Monthly demand, CAC variants, channel concentration, motion mix."},
          {value:"vc",label:"VC / Investor",desc:"Efficiency metrics, glideslope credibility, investability."},
          {value:"board",label:"Board Member",desc:"Quarterly waterfall, biggest miss, attainment, assumptions."},
          {value:"revops",label:"RevOps / Operator",desc:"Funnel diagnostic, channel CAC, capacity decomposition, leverage points."},
          {value:"dashboard",label:"None of the above",desc:"Default Command Center — the full executive dashboard."},
        ]}/>
      </div>);
      case "motion": return(<div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Sales Motion</div>
          <ChoiceGrid value={answers.salesMotion} onChange={v=>u("salesMotion",v)} options={[
            {value:"plg",label:"Product-Led",desc:"Free/trial → self-serve → expand. Humans enter late."},
            {value:"sales-led",label:"Sales-Led",desc:"AE-driven from first contact. SDRs qualify, AEs close."},
            {value:"hybrid",label:"Hybrid",desc:"PLG for SMB, sales-assisted for mid-market and up."},
          ]}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Primary Buyer</div>
          <ChoiceGrid value={answers.buyerSegment} onChange={v=>u("buyerSegment",v)} options={[
            {value:"smb",label:"SMB",desc:"< $50K ACV, short cycles, volume play."},
            {value:"mid",label:"Mid-Market",desc:"$50-150K ACV, 3-6 month cycles, committee buys."},
            {value:"enterprise",label:"Enterprise",desc:"> $150K ACV, 6-12+ month cycles, procurement."},
          ]}/>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Primary Entry Point</div>
          <ChoiceGrid columns={4} value={answers.entryPoint} onChange={v=>u("entryPoint",v)} options={[
            {value:"inbound",label:"Inbound",desc:"Marketing drives demand."},
            {value:"outbound",label:"Outbound",desc:"SDRs/AEs prospect."},
            {value:"partner",label:"Partner",desc:"Channel-sourced."},
            {value:"expansion",label:"Expansion",desc:"Land & expand."},
          ]}/>
        </div>
      </div>);
      case "scale": return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <NumberInput label="Starting ARR" value={answers.startingARR} onChange={v=>u("startingARR",v)} prefix="$" step={500000} desc="Current annual recurring revenue"/>
          <NumberInput label="Target ARR" value={answers.targetARR} onChange={v=>u("targetARR",v)} prefix="$" step={500000} desc="Where you need to be at year-end"/>
        </div>
        <div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Funding Stage</div>
            <ChoiceGrid columns={2} value={answers.fundingStage} onChange={v=>u("fundingStage",v)} options={[
              {value:"bootstrapped",label:"Bootstrapped"},
              {value:"seed",label:"Seed"},
              {value:"seriesA",label:"Series A"},
              {value:"seriesB",label:"Series B"},
              {value:"seriesC",label:"Series C+"},
            ]}/>
          </div>
          <div style={{padding:12,background:`${C.accent}08`,borderRadius:0,border:`1px solid ${C.accent}15`}}>
            <div style={{fontSize:10,color:C.dim,marginBottom:4}}>Implied Growth Rate</div>
            <div style={{fontSize:20,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>
              {answers.startingARR>0?((answers.targetARR-answers.startingARR)/answers.startingARR*100).toFixed(0):0}%
            </div>
          </div>
        </div>
      </div>);
      case "capacity": return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <NumberInput label="AE Count" value={answers.aeCount} onChange={v=>u("aeCount",v)} desc="Current quota-carrying AEs" step={1}/>
          <NumberInput label="AE Ramp (months)" value={answers.aeRampMonths} onChange={v=>u("aeRampMonths",v)} suffix="months" desc="Months to full productivity" step={1}/>
        </div>
        <div>
          <NumberInput label="Max Active Opps per AE" value={answers.maxOppsPerAE} onChange={v=>u("maxOppsPerAE",v)} desc="Before quality degrades. Be honest." step={1}/>
          <NumberInput label="Max Meetings per SDR/week" value={answers.maxMeetingsPerSDR} onChange={v=>u("maxMeetingsPerSDR",v)} suffix="/wk" desc="Actual throughput, not target." step={1}/>
          <div style={{padding:10,background:C.bg,borderRadius:0,marginTop:8}}>
            <div style={{fontSize:10,color:C.dim}}>These are not preferences — they're physics.</div>
          </div>
        </div>
      </div>);
      case "finance": return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <NumberInput label="Target Gross Margin" value={answers.grossMargin} onChange={v=>u("grossMargin",v)} suffix="%" desc="SaaS benchmark: 75-85%" step={1}/>
          <NumberInput label="Max CAC Payback" value={answers.maxCACPayback} onChange={v=>u("maxCACPayback",v)} suffix="months" desc="Enterprise: 18-30 mo. SMB: 6-12 mo." step={1}/>
        </div>
        <div>
          <NumberInput label="Target Pipeline Coverage" value={answers.pipelineCoverage} onChange={v=>u("pipelineCoverage",v)} suffix="x" desc="SQO pipeline ÷ target. Healthy: 3-4x." step={0.5}/>
          <NumberInput label="Expected Pipeline Slip %" value={answers.slipPct} onChange={v=>u("slipPct",v)} suffix="%" desc="What % slips quarter to quarter? This calibrates optimism." step={5}/>
        </div>
      </div>);
      case "intent": return(<div>
        <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>What are you optimizing for?</div>
        <ChoiceGrid columns={3} value={answers.growthIntent} onChange={v=>u("growthIntent",v)} options={[
          {value:"efficiency",label:"Efficiency",desc:"Protect margins. Prove unit economics. PE-ready."},
          {value:"growth",label:"Growth",desc:"Invest in GTM. Acceptable burn for market position."},
          {value:"capture",label:"Market Capture",desc:"Win at all costs. Speed > margin. Land grab."},
        ]}/>
        <div style={{marginTop:20,padding:14,background:C.bg,borderRadius:0,border:`1px solid ${C.borderMid}`}}>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            {answers.growthIntent==="efficiency"&&"Efficiency mode tightens all cost ratios. The model will flag any spend that doesn't directly produce pipeline. Expect 35-45% S&M as a % of revenue."}
            {answers.growthIntent==="growth"&&"Growth mode balances burn against progress. The model allows higher S&M ratios (45-55% of rev) in exchange for pipeline velocity. Standard for Series A-B."}
            {answers.growthIntent==="capture"&&"Market capture mode removes most guardrails. S&M can exceed 55% of revenue. The model will warn but not block. Use this when market timing matters more than margins."}
          </div>
        </div>
      </div>);
      case "review": {
        const overrides = buildOverrides();
        const motionLabel = {plg:"Product-Led",["sales-led"]:"Sales-Led",hybrid:"Hybrid"}[answers.salesMotion];
        const buyerLabel = {smb:"SMB",mid:"Mid-Market",enterprise:"Enterprise"}[answers.buyerSegment];
        const intentLabel = {efficiency:"Efficiency",growth:"Growth",capture:"Market Capture"}[answers.growthIntent];
        return(<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {label:"Operating Mode",value:`${motionLabel} × ${buyerLabel}`,color:C.accent},
              {label:"Growth Intent",value:intentLabel,color:answers.growthIntent==="capture"?C.red:answers.growthIntent==="growth"?C.amber:C.green},
              {label:"Funding Stage",value:answers.fundingStage.replace("series","Series "),color:C.violet},
            ].map(b=>(<div key={b.label} style={{padding:14,background:C.bg,borderRadius:0,border:`1px solid ${C.borderMid}`}}>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.05em"}}>{b.label}</div>
              <div style={{fontSize:15,fontWeight:700,color:b.color,marginTop:4}}>{b.value}</div>
            </div>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {label:"Starting ARR",value:fmt(answers.startingARR)},
              {label:"Target ARR",value:fmt(answers.targetARR)},
              {label:"Avg Deal Size",value:fmt(overrides.avgDealSize||60000)},
              {label:"Sales Cycle",value:`${overrides.salesCycleWeeks||12} weeks`},
              {label:"AE Count",value:answers.aeCount},
              {label:"AE Quota",value:fmt(overrides.aeQuota||750000)},
              {label:"Win Rate",value:`${overrides.sqoToWonRate||30}%`},
              {label:"Mktg Sourced",value:`${overrides.mktgSourcedPct||50}%`},
            ].map(b=>(<div key={b.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.bg,borderRadius:0}}>
              <span style={{fontSize:11,color:C.muted}}>{b.label}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.text,fontFamily:"'Chivo Mono',monospace"}}>{b.value}</span>
            </div>))}
          </div>
          <div style={{padding:12,background:`${C.green}08`,borderRadius:0,border:`1px solid ${C.green}20`}}>
            <div style={{fontSize:11,color:C.green,fontWeight:600,marginBottom:4}}>These defaults anchor the model.</div>
            <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>Everything can be tuned later in Global Drivers. But these values represent your declared operating reality — change them when reality changes, not when someone doesn't like the output.</div>
          </div>
        </div>);
      }
      default: return null;
    }
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'TWK Everett',sans-serif",color:C.text,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      
      <div style={{width:"100%",maxWidth:720,padding:window.innerWidth<768?"20px 16px":"40px 32px"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src={LOGO_URL} alt="NetherOps" style={{height:32,marginBottom:6,filter:C.bg==='#0F0F0F'?"invert(1) hue-rotate(180deg)":"brightness(1.1)"}} onError={e=>{e.target.style.display='none'}}/>
          <div style={{fontSize:9,color:C.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>OpptyCon</div>
        </div>

        {/* Progress bar */}
        <div style={{display:"flex",gap:4,marginBottom:32}}>
          {ONBOARDING_STEPS.map((_,i)=>(
            <div key={i} style={{flex:1,height:3,borderRadius:0,background:i<=step?C.accent:C.borderMid,transition:"all 0.3s"}}/>
          ))}
        </div>

        {/* Step header */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:9,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </div>
          <h1 style={{fontSize:24,fontWeight:700,color:C.text,margin:0,marginBottom:4}}>{currentStep.title}</h1>
          <p style={{fontSize:13,color:C.muted,margin:0}}>{currentStep.sub}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button onClick={()=>canBack&&setStep(step-1)} style={{padding:"10px 20px",borderRadius:0,border:`1px solid ${C.borderMid}`,
            background:"transparent",color:canBack?C.text:C.dim,cursor:canBack?"pointer":"default",fontSize:12,fontWeight:600,
            fontFamily:"'TWK Everett',sans-serif",opacity:canBack?1:0.3}}>
            Back
          </button>
          {step===ONBOARDING_STEPS.length-1 ? (
            <button onClick={()=>onComplete(buildOverrides())} style={{padding:"10px 28px",borderRadius:0,border:"none",
              background:C.accent,color:"#111",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'TWK Everett',sans-serif"}}>
              Launch Engine →
            </button>
          ) : (
            <button onClick={()=>setStep(step+1)} style={{padding:"10px 24px",borderRadius:0,border:"none",
              background:C.accentDim,color:C.accent,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'TWK Everett',sans-serif"}}>
              Continue →
            </button>
          )}
        </div>

        {/* Skip link */}
        {step===0&&<div style={{textAlign:"center",marginTop:16}}>
          <button onClick={()=>onComplete({})} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:11,fontFamily:"'TWK Everett',sans-serif",textDecoration:"underline"}}>
            Skip — use default inputs
          </button>
        </div>}
      </div>
    </div>
  );
}

export default function App(){
  const[gated,setGated]=useState(!hasAlphaAccess());
  const[onboarded,setOnboarded]=useState(false);
  const[page,setPage]=useState("dashboard");
  const[drivers,setDrivers]=useState(false);
  const[infoPanel,setInfoPanel]=useState(null);
  const[inputs,setInputs]=useState(DEFAULT_INPUTS);
  const[navOpen,setNavOpen]=useState(false);
  const[themeMode,setThemeMode]=useState(()=>{
    if(typeof window!=='undefined'){const saved=localStorage.getItem('opptycon-theme');if(saved)return saved;return window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}return'dark';
  });
  useEffect(()=>{
    setC(themeMode);
    const ds = document.documentElement.style;
    ds.background = C.bg;
    ds.color = C.text;
    /* Map OpptyCon tokens onto the --house-* aliases the shared
       <heretics-house-map> reads. Brand split holds — accent is OpptyCon's
       (lime on dark, violet on light), not MIS red. */
    ds.setProperty('--house-bg', C.bg);
    ds.setProperty('--house-ink', C.text);
    ds.setProperty('--house-mut', C.muted);
    ds.setProperty('--house-faint', C.dim);
    ds.setProperty('--house-line', C.borderMid);
    ds.setProperty('--house-accent', C.accent);
  },[themeMode]);
  const toggleTheme=()=>{
    const next=themeMode==='dark'?'light':'dark';
    setThemeMode(next);
    localStorage.setItem('opptycon-theme',next);
    /* Push to the shared ecosystem theme key so sibling properties inherit. */
    if (typeof window.heretics_pushTheme === 'function') window.heretics_pushTheme(next);
  };
  const mobile=useMediaQuery("(max-width:768px)");
  const tablet=useMediaQuery("(max-width:1024px)");
  const model=useMemo(()=>computeModel(inputs),[inputs]);
  const onInfoClick=(moduleId)=>setInfoPanel(prev=>prev===moduleId?null:moduleId);
  const pp={model,inputs,setInputs,onInfoClick,mobile,tablet,themeMode};
  const pages={dashboard:<DashboardPage {...pp}/>,cfo:<CFOPage {...pp}/>,ceo:<CEOPage {...pp}/>,cro:<CROPage {...pp}/>,cmo:<CMOPage {...pp}/>,vc:<VCPage {...pp}/>,pe:<PEPage {...pp}/>,board:<BoardPage {...pp}/>,revops:<RevOpsPage {...pp}/>,targets:<TargetTrackerPage {...pp}/>,funnelHealth:<FunnelHealthPage {...pp}/>,marketingPlan:<MarketingPlanPage {...pp}/>,sales:<SalesPage {...pp}/>,marketing:<FunnelPage {...pp}/>,channels:<ChannelsPage {...pp}/>,mktgBudget:<MarketingBudgetPage {...pp}/>,sandmBudget:<SandMBudgetPage {...pp}/>,cacBreakdown:<CACBreakdownPage {...pp}/>,pipeline:<PipelinePage {...pp}/>,velocity:<VelocityPage {...pp}/>,sellerRamp:<RampPage {...pp}/>,aeHiringPlan:<AeHiringPlanPage {...pp}/>,pnl:<PnLPage {...pp}/>,glideslope:<GlideslopePage {...pp}/>,qbr:<QBRPage {...pp}/>,weekly:<WeeklyPage {...pp}/>,spine:<SpinePage {...pp}/>,phase0:<CRMReadinessPage {...pp}/>,fieldAudit:<FieldAuditPage {...pp}/>,data:<DataIngestionPage onDataImported={()=>setInputs(prev=>({...prev}))} mobile={mobile}/>,architecture:<ArchitectureDiagram/>};

  const handleOnboardComplete=(overrides)=>{
    const{_persona, ...modelInputs} = overrides || {};
    setInputs(prev=>({...prev,...modelInputs}));
    if (_persona) setPage(_persona);  // route to the persona view (or dashboard if "dashboard")
    setOnboarded(true);
  };
  const navTo=(pg)=>{setPage(pg);if(mobile)setNavOpen(false);};

  if(gated) return <AlphaGate onAccessGranted={()=>setGated(false)}/>;
  if(!onboarded) return <OnboardingWizard onComplete={handleOnboardComplete}/>;

  return(<div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:C.bg,fontFamily:"'TWK Everett',sans-serif",color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>

    {/* Site back link */}
    <div style={{
      position:"sticky", top:0, zIndex:200,
      padding:"0 20px", height:36,
      display:"flex", alignItems:"center",
      background: C.surface,
      borderBottom:`1px solid ${C.borderMid}`,
      flexShrink:0
    }}>
      <a href="https://netherops.com" style={{
        fontFamily:"'Chivo Mono',monospace",
        fontSize:10, fontWeight:500,
        letterSpacing:"0.04em",
        color: C.muted,
        textDecoration:"none",
        display:"flex", alignItems:"center", gap:6
      }}>
        ← netherops
      </a>
      <span style={{
        marginLeft:"auto",
        fontFamily:"'Chivo Mono',monospace",
        fontSize:9, fontWeight:600,
        letterSpacing:"0.08em",
        textTransform:"uppercase",
        color: C.accent
      }}>
        opptycon
      </span>
      <button onClick={toggleTheme} style={{marginLeft:8,background:'transparent',border:`1px solid ${C.borderMid}`,borderRadius:4,padding:'2px 8px',cursor:'pointer',fontFamily:"'Chivo Mono',monospace",fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',color:C.dim,display:'flex',alignItems:'center',gap:4}}>
        {themeMode==='dark'?<Sun size={10}/>:<Moon size={10}/>}{themeMode==='dark'?'Light':'Dark'}
      </button>
    </div>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>

    {/* Mobile engine bar */}
    {mobile && (
      <div style={{position:"fixed",top:48,left:0,right:0,height:44,background:C.bgAlt,borderBottom:`1px solid ${C.borderMid}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",zIndex:100}}>
        <button onClick={()=>setNavOpen(!navOpen)} style={{background:"transparent",border:"none",color:C.text,cursor:"pointer",padding:4}}>
          <Layers size={18}/>
        </button>
        <div style={{fontSize:9,color:C.dim,letterSpacing:"0.06em",textTransform:"uppercase"}}>OpptyCon</div>
        <button onClick={()=>setDrivers(!drivers)} style={{background:"transparent",border:"none",color:drivers?C.violet:C.muted,cursor:"pointer",padding:4}}>
          <Settings size={16}/>
        </button>
      </div>
    )}

    {/* Sidebar — desktop: fixed, mobile: overlay */}
    {(!mobile || navOpen) && (
      <>
        {mobile && <div onClick={()=>setNavOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:149}}/>}
        <aside style={{width:mobile?260:220,height:"100vh",background:C.bgAlt,borderRight:`1px solid ${C.borderMid}`,display:"flex",flexDirection:"column",flexShrink:0,
          ...(mobile?{position:"fixed",left:0,top:0,zIndex:150}:{})}}>
          <div style={{padding:"16px 16px 20px"}}>
            <img src={LOGO_URL} alt="NetherOps" style={{height:28,marginBottom:6,filter:mode==='dark'?"invert(1) hue-rotate(180deg)":"brightness(1.1)"}} onError={e=>{e.target.style.display='none'}}/>
            <div style={{fontSize:9,color:C.dim,letterSpacing:"0.08em",textTransform:"uppercase"}}>OpptyCon</div>
          </div>
          <nav style={{flex:1,padding:"0 6px",overflowY:"auto"}}>
            {NAV_SECTIONS.map((sec,si)=>(
              <NavSection key={si} section={sec.section} items={sec.items} page={page} setPage={navTo}/>
            ))}
          </nav>
          <div style={{padding:"8px 6px",borderTop:`1px solid ${C.borderMid}`}}>
            <button onClick={()=>{setDrivers(!drivers);if(mobile)setNavOpen(false);}} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",border:"none",borderRadius:0,background:drivers?C.violetDim:"transparent",color:drivers?C.violet:C.muted,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"'TWK Everett',sans-serif"}}>
              <Settings size={13}/>Global Drivers
            </button>
            <button onClick={()=>setOnboarded(false)} style={{display:"flex",alignItems:"center",gap:7,width:"100%",padding:"8px 10px",border:"none",borderRadius:0,background:"transparent",color:C.dim,cursor:"pointer",fontSize:10,fontWeight:500,fontFamily:"'TWK Everett',sans-serif"}}>
              Re-run Setup
            </button>
          </div>
          <div style={{padding:"6px 12px 10px",borderTop:`1px solid ${C.borderMid}`}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              {[{id:"legal:privacy",label:"Privacy"},{id:"legal:terms",label:"Terms"},{id:"legal:security",label:"Security"},{id:"legal:disclaimer",label:"Disclaimer"}].map(l=>(
                <button key={l.id} onClick={()=>navTo(l.id)} style={{background:"transparent",border:"none",color:C.dim,cursor:"pointer",fontSize:8,fontFamily:"'TWK Everett',sans-serif",padding:0,textDecoration:"underline"}}>{l.label}</button>
              ))}
            </div>
            <div style={{textAlign:"center",fontSize:7,color:C.dim,marginTop:4}}>© 2026 NetherOps. All rights reserved.</div>
          </div>
        </aside>
      </>
    )}

    <div style={{flex:1,display:"flex",overflow:"hidden",marginTop:mobile?44:0}}>
      <main style={{flex:1,overflowY:"auto",padding:mobile?"16px 12px 80px":tablet?"20px 20px 60px":"24px 32px 60px"}}>
        <AnimatePresence mode="wait"><motion.div key={page} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}>
          {pages[page]}
        </motion.div></AnimatePresence>
      </main>

      <AnimatePresence>{drivers&&(
        <>
        {mobile && <div onClick={()=>setDrivers(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:199}}/>}
        <motion.aside initial={{width:0,opacity:0}} animate={{width:mobile?"100%":280,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.2}}
          style={{height:"100%",borderLeft:mobile?"none":`1px solid ${C.borderMid}`,background:C.bgAlt,overflow:"hidden",flexShrink:0,
            ...(mobile?{position:"fixed",right:0,top:0,zIndex:200,width:"100%",maxWidth:320}:{})}}>
          <div style={{width:mobile?320:280,padding:"20px 16px",overflowY:"auto",height:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontSize:10,fontWeight:700,color:C.violet,margin:0,textTransform:"uppercase",letterSpacing:"0.08em"}}>Model Drivers</h3>
              {mobile && <button onClick={()=>setDrivers(false)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer"}}><X size={18}/></button>}
            </div>

            {/* Target Mode Toggle */}
            {/* Plan start date — anchors all calendar labels (workstream D) */}
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Plan Start Date</div>
            <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"7px 11px",marginBottom:6,gap:6}}>
              <input type="date" value={inputs.planStartDate||""} onChange={e=>setInputs(p=>({...p,planStartDate:e.target.value}))}
                style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"'Chivo Mono',monospace",width:"100%",colorScheme:themeMode==="dark"?"dark":"light"}}/>
            </div>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Target Date (when targetARR must land)</div>
            <div style={{display:"flex",alignItems:"center",background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"7px 11px",marginBottom:13,gap:6}}>
              <input type="date" value={inputs.targetDate||""} onChange={e=>setInputs(p=>({...p,targetDate:e.target.value}))}
                style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:13,fontFamily:"'Chivo Mono',monospace",width:"100%",colorScheme:themeMode==="dark"?"dark":"light"}}/>
            </div>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Target Mode</div>
            <SegmentToggle options={[{value:"absolute",label:"$ ARR"},{value:"growthRate",label:"% Growth"}]} value={inputs.targetMode} onChange={v=>setInputs(p=>({...p,targetMode:v}))}/>
            <div style={{marginTop:8}}/>
            {inputs.targetMode==="absolute"?(
              <Input compact label="Target ARR" value={inputs.targetARR} onChange={v=>setInputs(p=>({...p,targetARR:v}))} prefix="$" step={100000}/>
            ):(
              <Input compact label="Growth Rate" value={inputs.targetGrowthRate} onChange={v=>setInputs(p=>({...p,targetGrowthRate:v}))} suffix="%" step={5}/>
            )}
            <Input compact label="Starting ARR" value={inputs.startingARR} onChange={v=>setInputs(p=>({...p,startingARR:v}))} prefix="$" step={100000}/>
            {inputs.targetMode==="growthRate"&&<div style={{padding:8,background:C.bg,borderRadius:0,marginBottom:8}}><div style={{fontSize:9,color:C.dim}}>Implied Target</div><div style={{fontSize:14,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{fmt(model.summary.targetARR)}</div></div>}
            <Input compact label="Avg Deal" value={inputs.avgDealSize} onChange={v=>setInputs(p=>({...p,avgDealSize:v}))} prefix="$" step={5000}/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.violet,textTransform:"uppercase",marginBottom:6}}>Planning Horizon</div>
            <Input compact label="Years" value={inputs.planningYears} onChange={v=>setInputs(p=>({...p,planningYears:Math.min(3,Math.max(1,v))}))} suffix="yr" step={1}/>
            {inputs.planningYears>1&&<Input compact label="Y2 Growth" value={inputs.y2GrowthRate} onChange={v=>setInputs(p=>({...p,y2GrowthRate:v}))} suffix="%" step={5}/>}

            {/* Revenue Mode Toggle */}
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Revenue Motion</div>
            <SegmentToggle options={[{value:"blended",label:"Blended"},{value:"split",label:"Logo + Expand"}]} value={inputs.revenueMode} onChange={v=>setInputs(p=>({...p,revenueMode:v}))}/>
            {inputs.revenueMode==="split"&&<div style={{marginTop:8}}>
              <Input compact label="New Logo %" value={inputs.newLogoPct} onChange={v=>setInputs(p=>({...p,newLogoPct:v}))} suffix="%" min={10} max={100} step={5}/>
              <Input compact label="Expansion ADS" value={inputs.expansionAvgDeal} onChange={v=>setInputs(p=>({...p,expansionAvgDeal:v}))} prefix="$" step={5000}/>
              <Input compact label="Expansion Close %" value={inputs.expansionSqoToWon} onChange={v=>setInputs(p=>({...p,expansionSqoToWon:v}))} suffix="%"/>
              <Input compact label="Expansion Cycle" value={inputs.expansionCycleWeeks} onChange={v=>setInputs(p=>({...p,expansionCycleWeeks:v}))} suffix="wk"/>
            </div>}

            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Lifecycle</div>
            <Input compact label="Inquiry→MQL" value={inputs.inquiryToMqlRate} onChange={v=>setInputs(p=>({...p,inquiryToMqlRate:v}))} suffix="%"/>
            <Input compact label="MQL→SQL" value={inputs.mqlToSqlRate} onChange={v=>setInputs(p=>({...p,mqlToSqlRate:v}))} suffix="%"/>
            <Input compact label="SQL→Meeting" value={inputs.sqlToMeetingRate} onChange={v=>setInputs(p=>({...p,sqlToMeetingRate:v}))} suffix="%"/>
            <Input compact label="Meeting→SQO" value={inputs.meetingToSqoRate} onChange={v=>setInputs(p=>({...p,meetingToSqoRate:v}))} suffix="%"/>
            <Input compact label="SQO→Won" value={inputs.sqoToWonRate} onChange={v=>setInputs(p=>({...p,sqoToWonRate:v}))} suffix="%"/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Pipeline Lead Time</div>
            <Input compact label="SQO→Close lag" value={inputs.sqoLeadQuarters} onChange={v=>setInputs(p=>({...p,sqoLeadQuarters:v}))} suffix="Qtrs" min={1} max={4}/>
            <Input compact label="MQL→SQO lag" value={inputs.mqlLeadQuarters} onChange={v=>setInputs(p=>({...p,mqlLeadQuarters:v}))} suffix="Qtrs" min={1} max={3}/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Sales</div>
            <Input compact label="AEs Today" value={inputs.currentAeCount} onChange={v=>setInputs(p=>({...p,currentAeCount:v}))} min={0}/>
            <Input compact label="AEs (target)" value={inputs.aeCount} onChange={v=>setInputs(p=>({...p,aeCount:v}))} min={1}/>
            <Input compact label="Quota" value={inputs.aeQuota} onChange={v=>setInputs(p=>({...p,aeQuota:v}))} prefix="$" step={25000}/>
            <QuotaBenchmarks C={C} currentQuota={inputs.aeQuota} onPick={(v)=>setInputs(p=>({...p,aeQuota:v}))}/>
            <Input compact label="Realistic Attain" value={inputs.realisticAeAttainment} onChange={v=>setInputs(p=>({...p,realisticAeAttainment:v}))} suffix="%" min={50} max={100} step={5}/>
            <Input compact label="Ramp" value={inputs.aeRampMonths} onChange={v=>setInputs(p=>({...p,aeRampMonths:v}))} suffix="mo"/>
            <Input compact label="Hire Lead" value={inputs.aeTimeToHire} onChange={v=>setInputs(p=>({...p,aeTimeToHire:v}))} suffix="mo" min={0} max={6}/>
            <Input compact label="Attrition" value={inputs.aeAttritionRate} onChange={v=>setInputs(p=>({...p,aeAttritionRate:v}))} suffix="% yr" step={5}/>
            <Input compact label="Mktg-Sourced %" value={inputs.mktgSourcedPct} onChange={v=>setInputs(p=>({...p,mktgSourcedPct:v}))} suffix="%" min={10} max={100} step={5}/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Economics</div>
            <Input compact label="NRR" value={inputs.nrrPercent} onChange={v=>setInputs(p=>({...p,nrrPercent:v}))} suffix="%"/>
            <Input compact label="Gross Margin" value={inputs.grossMargin} onChange={v=>setInputs(p=>({...p,grossMargin:v}))} suffix="%"/>
            <Input compact label="Churn" value={inputs.churnRate} onChange={v=>setInputs(p=>({...p,churnRate:v}))} suffix="%" step={0.5}/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Cost Structure (% Rev)</div>
            <Input compact label="G&A" value={inputs.gAndAPct} onChange={v=>setInputs(p=>({...p,gAndAPct:v}))} suffix="%" step={1}/>
            <Input compact label="R&D" value={inputs.rAndDPct} onChange={v=>setInputs(p=>({...p,rAndDPct:v}))} suffix="%" step={1}/>
            <Input compact label="Sales OPEX" value={inputs.salesOpexPct} onChange={v=>setInputs(p=>({...p,salesOpexPct:v}))} suffix="%" step={1}/>
            <Input compact label="Var Mktg" value={inputs.variableMktgPct} onChange={v=>setInputs(p=>({...p,variableMktgPct:v}))} suffix="%" step={1}/>
            <Input compact label="Sales Var %" value={inputs.salesVariablePct} onChange={v=>setInputs(p=>({...p,salesVariablePct:v}))} suffix="%" step={5}/>
            <Input compact label="Fixed Mktg %" value={inputs.fixedMktgPct} onChange={v=>setInputs(p=>({...p,fixedMktgPct:v}))} suffix="%" step={5}/>
            <div style={{height:1,background:C.borderMid,margin:"8px 0"}}/>
            <div style={{fontSize:9,fontWeight:700,color:C.dim,textTransform:"uppercase",marginBottom:6}}>Seasonality</div>
            <SegmentToggle options={[{value:"even",label:"Even"},{value:"noram",label:"NORAM"},{value:"custom",label:"Custom"}]} value={inputs.seasonalityMode} onChange={v=>setInputs(p=>({...p,seasonalityMode:v}))}/>
            {inputs.seasonalityMode==="custom"&&<div style={{marginTop:8}}>
              <div style={{fontSize:8,color:C.dim,marginBottom:4}}>Monthly weights (relative — auto-normalized)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
                {MONTHS.map((m,i)=>(
                  <div key={m} style={{textAlign:"center"}}>
                    <div style={{fontSize:8,color:C.dim}}>{m}</div>
                    <input type="number" value={inputs.seasonalWeights[i]} min={1} max={20} step={1}
                      onChange={e=>{const nw=[...inputs.seasonalWeights];nw[i]=parseInt(e.target.value)||1;setInputs(p=>({...p,seasonalWeights:nw}));}}
                      style={{width:"100%",background:C.bg,border:`1px solid ${C.borderMid}`,borderRadius:0,padding:"3px 2px",color:C.text,fontSize:10,fontFamily:"'Chivo Mono',monospace",textAlign:"center"}}/>
                  </div>
                ))}
              </div>
            </div>}
            {inputs.seasonalityMode!=="custom"&&<div style={{marginTop:6}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2}}>
                {QUARTERS.map((q,qi)=>{const qw=model.monthWeights.slice(qi*3,qi*3+3).reduce((s,w)=>s+w,0);return(
                  <div key={q} style={{textAlign:"center",padding:"4px 0",background:C.bg,borderRadius:0}}>
                    <div style={{fontSize:8,color:C.dim}}>{q}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.accent,fontFamily:"'Chivo Mono',monospace"}}>{(qw*100).toFixed(0)}%</div>
                  </div>
                );})}
              </div>
            </div>}

          </div>
        </motion.aside>
        </>
      )}</AnimatePresence>
    </div>
    {/* Info panel overlay */}
    <AnimatePresence>
      {infoPanel && <DocPanel moduleId={infoPanel} onClose={()=>setInfoPanel(null)}/>}
    </AnimatePresence>
    {/* Legal overlay */}
    <AnimatePresence>
      {page.startsWith("legal:")&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setPage("dashboard")}>
          <motion.div initial={{y:20}} animate={{y:0}} style={{width:640,maxHeight:"80vh",background:C.bgAlt,borderRadius:0,border:`1px solid ${C.borderMid}`,overflow:"hidden"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.borderMid}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700,color:C.text}}>
                {page==="legal:privacy"?"Privacy Notice":page==="legal:terms"?"Terms of Use":page==="legal:security"?"Security Overview":"Financial Modeling Disclaimer"}
              </div>
              <button onClick={()=>setPage("dashboard")} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer"}}><X size={16}/></button>
            </div>
            <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"calc(80vh - 60px)",fontSize:12,color:C.muted,lineHeight:1.8}}>
              {page==="legal:privacy"&&<div>
                <p>NetherOps does not collect, store, or process personal data through this application.</p>
                <p>This application does not require account creation, does not request personal information, and does not store user inputs.</p>
                <p>No financial, operational, or CRM data entered into this application is transmitted to or retained by NetherOps.</p>
                <p>Standard server logs may be generated by the hosting provider for infrastructure and uptime monitoring purposes only.</p>
                <p>This application does not use user inputs to train machine learning models or artificial intelligence systems.</p>
              </div>}
              {page==="legal:terms"&&<div>
                <p>This application is provided for informational and demonstration purposes only.</p>
                <p>All projections, calculations, and modeling outputs are illustrative and depend entirely on user-provided assumptions.</p>
                <p>NetherOps makes no representations or warranties regarding the accuracy, completeness, or suitability of outputs for business decision-making.</p>
                <p>Users are solely responsible for validating assumptions and making independent business, financial, or operational decisions.</p>
                <p>To the fullest extent permitted by law, NetherOps shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of this application.</p>
                <p>All content, design, modeling logic, calculations, and visual frameworks contained in this application are proprietary intellectual property of NetherOps. Reproduction, redistribution, or commercial use without written permission is prohibited.</p>
                <p>Use of this application constitutes acceptance of these terms.</p>
              </div>}
              {page==="legal:security"&&<div>
                <p>This version of NetherOps does not persist user data.</p>
                <p>No user accounts, CRM integrations, or external system connections are enabled in this environment.</p>
                <p>The application is served over encrypted HTTPS connections.</p>
                <p>No proprietary business data is stored or processed by this application.</p>
                <p style={{marginTop:16,fontWeight:600,color:C.text}}>Intended Use</p>
                <p>This application is intended for strategic modeling and scenario planning by revenue and finance professionals. It is not a substitute for audited financial statements, formal budgeting systems, or legally binding forecasting tools.</p>
              </div>}
              {page==="legal:disclaimer"&&<div>
                <p>The outputs generated by this application are mathematical simulations based on user-defined inputs and preset assumptions.</p>
                <p>They do not constitute financial advice, investment advice, accounting guidance, or strategic consulting.</p>
                <p>Forecasts and projections are inherently uncertain and subject to market, operational, and execution variability.</p>
                <p>Past performance assumptions do not guarantee future results.</p>
              </div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  </div>);
}
