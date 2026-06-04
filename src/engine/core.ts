// ─── NetherOps OpptyCon ─── Core Calculation Model ───
// PURE, framework-free. (inputs) => outputs. No React/DOM/window/storage. Math is
// byte-identical to the pre-extraction engine.js — pinned by the golden tests.
import type { ResolvedInputs, ModelOutputs } from './contract';
// Canonical lifecycle (contact-level):
//   Inquiry → MQL → SQL → Meeting Held → SQO (Stage 2) → Closed Won
//
// Opportunity stages:
//   Stage 1 = Discovery / Unqualified (amount ≥ 10% ADS, non-forecastable)
//   Stage 2 = SQO / Qualified (AE-promoted, forecastable, board-safe)

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const QUARTERS = ["Q1","Q2","Q3","Q4"];
export { MONTHS, QUARTERS };

export const DEFAULT_INPUTS = {
  // ── Plan start date — anchors all calendar labels (months/quarters/years)
  // Defaults to the first of the current month so labels feel like real time.
  planStartDate: (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  })(),
  // ── Target date — when the plan needs to land. Drives horizon projection
  // and lever-ladder math. Defaults to 12 months from plan start.
  targetDate: (() => {
    const d = new Date();
    const t = new Date(d.getFullYear(), d.getMonth() + 12, 1);
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01`;
  })(),
  // Target mode: "absolute" or "growthRate"
  targetMode: "absolute",
  targetARR: 10000000, startingARR: 3000000, targetGrowthRate: 100,
  planningYears: 2,          // 1-3 year planning horizon
  y2GrowthRate: 60,          // Year 2 growth rate over Y1 exit ARR (%)
  y2ConversionLift: 5,       // Y2 conversion rate improvement (% pts added to each stage)
  avgDealSize: 60000, salesCycleWeeks: 12,
  // Lifecycle gates
  inquiryToMqlRate: 30, mqlToSqlRate: 40, sqlToMeetingRate: 75,
  meetingToSqoRate: 50, sqoToWonRate: 30,
  stage1MinPct: 10,
  // Sales capacity
  aeCount: 8, aeRampMonths: 6, aeQuota: 750000, sdrsPerAe: 1.5,
  aeAttritionRate: 10,       // annual AE attrition % (turnover)
  // AE Hiring Plan — distinguishes TODAY (nameplate roster) from TARGET (aeCount above)
  // currentAeCount = roster you have on day-zero. aeCount above is the target needed
  // to land the plan. The hiring schedule bridges the two with realistic ramp+lead-time.
  currentAeCount: 6,         // AEs on payroll TODAY (vs. aeCount which is target)
  aeTimeToHire: 2,           // months from open req → onboarded (sourcing+interview+notice)
  realisticAeAttainment: 75, // % of $aeQuota a productive AE actually books (60-85 typical cyber)
  hiringPlanMode: 'frontload',// 'frontload' | 'linear' | 'custom'
  mktgSourcedPct: 50,        // % of pipeline sourced from marketing (rest is AE self-sourced)
  // Phase-shifted funnel (pipeline lead time)
  sqoLeadQuarters: 2,        // SQOs needed this many quarters before close (sales cycle lag)
  mqlLeadQuarters: 1,        // MQLs needed this many quarters before SQO creation
  // ── Cost Model: Dual-axis (Fixed/Variable × Functional)
  // Axis 1: Behavioral — how costs scale
  // Axis 2: Functional — where costs sit (G&A, R&D, Sales, Marketing)

  // Functional cost buckets (% of revenue)
  grossMargin: 78,
  gAndAPct: 10,             // G&A: Finance, Legal, HR, Exec, IT (benchmark 8-12%)
  rAndDPct: 20,             // R&D / Product (benchmark 15-25%, cyber skews higher)
  salesOpexPct: 25,         // Sales OPEX: comp, tools, enablement (benchmark 20-30%)
  variableMktgPct: 9,       // Variable marketing: demand gen (benchmark 6-12%)

  // Behavioral splits within functions
  salesVariablePct: 50,     // Variable % of Sales OPEX (commissions, SPIFs) — benchmark 40-60%
  fixedMktgPct: 30,         // Fixed % of Total Marketing spend (staff, tools, brand) — benchmark 20-35%

  // ── Marketing Budget Decomposition
  // Variable marketing sub-splits (% of variable marketing budget)
  martechPctOfVariable: 25, // Martech (intent data, enrichment, MAP overage, syndication) as % of variable mktg
  // Fixed marketing infrastructure — THREE-LAYER MODEL
  // Layer 1: Structural Floors (dollar-based, tier-selected, NOT % sliders)
  //   - Executive: headcount tier selector
  //   - PMM: enterprise motion requires it at $10M+
  //   - Core MarTech: minimum viable stack
  // Layer 2: Scalable Infrastructure (elastic % of remaining fixed budget)
  //   - Revenue Engine Ops, Brand/Content, PR/AR
  // Layer 3: Variable (handled in motions, not here)

  // Layer 1 tier selectors
  executiveTier: "fullVP",       // founder | fractional | fullVP | cmoPlusVP
  pmmTier: "full",               // none | fractional | full | team
  coreMarTechTier: "standard",   // starter | standard | enterprise

  // Layer 2 elastic allocation (% of remaining fixed budget AFTER Layer 1 floors)
  elasticMktgBreakdown: {
    revEngineOps: 35,            // Demand Gen, Lifecycle, Marketing Ops
    brandContent: 40,            // Creative, content, web, design
    prAr: 25,                    // PR/AR, agency retainer
  },

  // CAC benchmarks
  cpSqoBenchmark: 12000,    // Cost per SQO benchmark (mid-market cyber $8K-15K)
  cacPaybackTarget: 24,     // Target CAC payback months (enterprise cyber 18-30)

  // ── Sales Budget Decomposition (within salesOpexPct)
  // These are % of Sales OPEX — must sum to 100
  salesBudgetBreakdown: {
    aeComp: 55,              // AE total comp (base + OTE variable) — typically largest line
    sdrComp: 20,             // SDR/BDR comp
    seOverlay: 10,           // SE / Solutions Engineer overlay
    salesTools: 8,           // CRM seats, outbound tools, ZoomInfo, Gong
    enablement: 4,           // Training, onboarding, SKO
    travel: 3,               // Field travel, customer dinners
  },
  // Comp benchmarks (fully loaded per head)
  aeOTE: 280000,             // AE OTE mid-market cyber ($250-320K)
  aeBenefitsLoad: 1.25,      // Benefits multiplier (1.2-1.3x)
  sdrOTE: 95000,             // SDR OTE ($85-110K)
  sdrBenefitsLoad: 1.22,     // SDR benefits load

  // ── Leadership Cost Layer (all execs, not just marketing)
  // Funding stage drives comp expectations: VC-backed demands market-rate "proven operators"
  fundingStage: "seriesB",   // seed | seriesA | seriesB | seriesC | bootstrapped
  // Leadership roles present (toggle on/off)
  leadershipRoles: {
    vpSales: true,           // VP Sales / CRO
    vpMarketing: true,       // VP Marketing / CMO
    vpCS: true,              // VP CS / CCO
    vpOps: false,            // VP Ops / COO (often not hired until $15M+)
    vpProduct: false,        // VP Product (often under R&D, not S&M — but board wants it)
  },

  // Benchmark ranges for delta display (not editable, reference only)
  costBenchmarks: {
    gAndAPct: { low: 8, mid: 10, high: 12, label: "G&A" },
    rAndDPct: { low: 15, mid: 20, high: 25, label: "R&D" },
    salesOpexPct: { low: 20, mid: 25, high: 30, label: "Sales OPEX" },
    variableMktgPct: { low: 6, mid: 9, high: 12, label: "Variable Marketing" },
    totalSAndMPct: { low: 35, mid: 45, high: 55, label: "Total S&M" },
    burnRiskThreshold: 60,   // S&M > 60% → burn risk
    underinvestThreshold: 30, // S&M < 30% → underinvestment
  },
  // Retention
  nrrPercent: 110, existingCustomers: 50, churnRate: 8,
  pipelineCoverage: 300,
  // Pipeline coverage thresholds
  coverageGreen: 350, coverageYellow: 250, coverageRed: 150,
  // Velocity baselines (median days per stage)
  velStage1to2: 15, velStage2to3: 10, velStage3to4: 30, velStage4to5: 20, velStage5toClose: 14,
  // Channel
  // ── Revenue Motions (replaces flat channelMix)
  // Every dollar gets TWO tags: Motion (CREATE/CONVERT/ACCELERATE) + Intent
  motionAllocation: { create: 45, convert: 30, accelerate: 25 }, // must sum to 100
  
  // Channels INSIDE each motion (can appear in multiple motions)
  motionChannels: {
    create: [
      { name: "Paid Search", pct: 30, cpl: 150, intent: "Net-new demand" },
      { name: "Content / SEO", pct: 25, cpl: 45, intent: "Net-new demand" },
      { name: "Events (ToF)", pct: 15, cpl: 300, intent: "Net-new demand" },
      { name: "Cold Outbound", pct: 20, cpl: 120, intent: "Net-new demand" },
      { name: "Content Syndication", pct: 10, cpl: 85, intent: "Net-new demand" },
    ],
    convert: [
      { name: "SDR Labor", pct: 50, costPerSql: 800, intent: "Qualification" },
      { name: "AI Qualification", pct: 15, costPerSql: 120, intent: "Qualification" },
      { name: "Partner Handoff", pct: 20, costPerSql: 400, intent: "Qualification" },
      { name: "Inbound Routing", pct: 15, costPerSql: 60, intent: "Qualification" },
    ],
    accelerate: [
      { name: "ABM Ads", pct: 30, costPerAccount: 500, intent: "Coverage / stage progression" },
      { name: "Paid Social (Coverage)", pct: 20, costPerAccount: 300, intent: "Coverage / awareness" },
      { name: "Field Events (Late)", pct: 25, costPerAccount: 1200, intent: "Stage progression" },
      { name: "Exec Programs", pct: 15, costPerAccount: 2000, intent: "Deal rescue" },
      { name: "SDR/AE Assist", pct: 10, costPerAccount: 400, intent: "Stage progression" },
    ],
  },
  // Acceleration impact assumptions
  accelDaysReduced: 30,       // avg days pulled forward per account
  accelWinRateLift: 5,        // win rate % pts improvement for accelerated deals
  accelAccountsCoverage: 60,  // % of SQOs that get acceleration treatment
  // Funnel health benchmarks
  funnelBenchmarks: {
    inquiryToMqlRate: { good: 25, great: 40 },
    mqlToSqlRate: { good: 30, great: 50 },
    sqlToMeetingRate: { good: 60, great: 80 },
    meetingToSqoRate: { good: 40, great: 60 },
    sqoToWonRate: { good: 20, great: 35 },
  },
  // Seasonality (monthly weights — must sum to ~100)
  // NORAM B2B SaaS default: Q4 heaviest, Q3 lightest (summer), Q1 slow start, Q2 strong
  seasonalityMode: "noram",  // "even" | "noram" | "custom"
  // Monthly weights: Jan–Dec. Normalized at compute time so they don't need to sum perfectly.
  seasonalWeights: [6, 7, 9, 9, 10, 9, 6, 5, 9, 10, 11, 9],
  // Presets (not editable, used when mode != custom)
  // even:  [8.33 × 12]
  // noram: [6, 7, 9, 9, 10, 9, 6, 5, 9, 10, 11, 9]  — reflects NORAM B2B buying patterns

  // New Logo vs Expansion split
  revenueMode: "blended", // "blended" | "split"
  newLogoPct: 70,         // % of new ARR from new logos
  expansionAvgDeal: 30000, // avg expansion deal size
  expansionSqoToWon: 50,   // expansion close rate (typically higher)
  expansionCycleWeeks: 6,  // shorter cycle
};

export function computeModel(inputs: ResolvedInputs): ModelOutputs {
  const {
    targetMode, targetARR: inputTargetARR, startingARR, targetGrowthRate,
    planningYears, y2GrowthRate, y2ConversionLift,
    avgDealSize,
    inquiryToMqlRate, mqlToSqlRate, sqlToMeetingRate, meetingToSqoRate, sqoToWonRate,
    motionAllocation, motionChannels, accelDaysReduced, accelWinRateLift, accelAccountsCoverage,
    aeCount, aeRampMonths, aeQuota, sdrsPerAe,
    aeAttritionRate, mktgSourcedPct, sqoLeadQuarters, mqlLeadQuarters,
    currentAeCount, aeTimeToHire, realisticAeAttainment, hiringPlanMode,
    grossMargin, gAndAPct, rAndDPct, salesOpexPct, variableMktgPct,
    salesVariablePct, fixedMktgPct, martechPctOfVariable,
    executiveTier, pmmTier, coreMarTechTier, elasticMktgBreakdown,
    cpSqoBenchmark, cacPaybackTarget, costBenchmarks,
    salesBudgetBreakdown, aeOTE, aeBenefitsLoad, sdrOTE, sdrBenefitsLoad,
    fundingStage, leadershipRoles,
    nrrPercent, churnRate, pipelineCoverage, stage1MinPct,
    coverageGreen, coverageYellow, coverageRed,
    velStage1to2, velStage2to3, velStage3to4, velStage4to5, velStage5toClose,
    funnelBenchmarks,
    revenueMode, newLogoPct, expansionAvgDeal, expansionSqoToWon, expansionCycleWeeks,
  } = inputs;

  // ── Target resolution: absolute vs growth rate
  const targetARR = targetMode === "growthRate"
    ? startingARR * (1 + targetGrowthRate / 100)
    : inputTargetARR;
  const growthRate = startingARR > 0 ? (targetARR - startingARR) / startingARR * 100 : 0;

  const retainedARR = startingARR * (nrrPercent / 100);
  const newARRNeeded = Math.max(0, targetARR - retainedARR);

  // ── New Logo vs Expansion split
  const newLogoPctN = revenueMode === "split" ? newLogoPct / 100 : 1;
  const expansionPctN = revenueMode === "split" ? 1 - newLogoPctN : 0;

  const newLogoARR = newARRNeeded * newLogoPctN;
  const expansionARR = newARRNeeded * expansionPctN;

  // New logo math (full funnel)
  const dealsNeeded = Math.ceil(newLogoARR / avgDealSize);
  const sqosNeeded = Math.ceil(dealsNeeded / (sqoToWonRate / 100));
  const meetingsNeeded = Math.ceil(sqosNeeded / (meetingToSqoRate / 100));
  const sqlsNeeded = Math.ceil(meetingsNeeded / (sqlToMeetingRate / 100));
  const mqlsNeeded = Math.ceil(sqlsNeeded / (mqlToSqlRate / 100));
  const inquiriesNeeded = Math.ceil(mqlsNeeded / (inquiryToMqlRate / 100));

  // Expansion math (simpler funnel)
  const expansionDeals = revenueMode === "split" ? Math.ceil(expansionARR / expansionAvgDeal) : 0;
  const expansionSQOs = revenueMode === "split" ? Math.ceil(expansionDeals / (expansionSqoToWon / 100)) : 0;

  // ── Marketing-sourced funnel split
  // Only mktgSourcedPct of pipeline flows through the full marketing funnel
  // The rest is AE self-sourced (outbound, referral, partner) — bypasses MQL/SQL
  const mktgPct = (mktgSourcedPct || 50) / 100;
  const mktgSQOs = Math.ceil(sqosNeeded * mktgPct);
  const aeSelfSourcedSQOs = sqosNeeded - mktgSQOs;
  // Marketing funnel math only applies to marketing-sourced pipeline
  const mktgMeetingsNeeded = Math.ceil(mktgSQOs / (meetingToSqoRate / 100));
  const mktgSqlsNeeded = Math.ceil(mktgMeetingsNeeded / (sqlToMeetingRate / 100));
  const mktgMqlsNeeded = Math.ceil(mktgSqlsNeeded / (mqlToSqlRate / 100));
  const mktgInquiriesNeeded = Math.ceil(mktgMqlsNeeded / (inquiryToMqlRate / 100));

  // Attrition rate (used by both monthly loop and seller ramp)
  const monthlyAttrRate = (aeAttritionRate || 0) / 100 / 12;

  const pipelineRequired = sqosNeeded * avgDealSize * (pipelineCoverage / 100);
  const effectiveFunnelYield = (inquiryToMqlRate/100)*(mqlToSqlRate/100)*(sqlToMeetingRate/100)*(meetingToSqoRate/100)*(sqoToWonRate/100);

  // ── Compression Metrics (Engine Output)
  const inquiryToSqoRate = (inquiryToMqlRate/100)*(mqlToSqlRate/100)*(sqlToMeetingRate/100)*(meetingToSqoRate/100) * 100;
  const inquiryToWonRate = effectiveFunnelYield * 100;

  // Meeting definition: "Held" not "Scheduled"
  // Internal: SQL → Meeting Set → Meeting Held (default 80% show rate)
  const meetingShowRate = inputs.meetingShowRate || 80;
  const sqlToMeetingSetRate = sqlToMeetingRate / (meetingShowRate / 100);
  const meetingsSetNeeded = Math.ceil(meetingsNeeded / (meetingShowRate / 100));
  const mktgMeetingsSetNeeded = Math.ceil(mktgMeetingsNeeded / (meetingShowRate / 100));

  // Stage 1 / Stage 2 pipeline
  const stage1MinAmount = avgDealSize * (stage1MinPct / 100);
  const stage1Pipeline = meetingsNeeded * stage1MinAmount;
  const stage2Pipeline = sqosNeeded * avgDealSize;

  // ── Pipeline coverage health
  const actualCoverage = pipelineCoverage;
  const coverageHealth = actualCoverage >= coverageGreen ? "good" : actualCoverage >= coverageYellow ? "warning" : "bad";

  // Velocity
  const totalCycleDays = velStage1to2 + velStage2to3 + velStage3to4 + velStage4to5 + velStage5toClose;
  const velocityPerDay = stage2Pipeline > 0 ? (stage2Pipeline * (sqoToWonRate/100)) / totalCycleDays : 0;

  const velocityStages = [
    { name: "Stage 1→2 (Discovery→SQO)", days: velStage1to2, owner: "AE promotes" },
    { name: "Stage 2→3 (Tech Validation)", days: velStage2to3, owner: "SE / AE" },
    { name: "Stage 3→4 (Business Case / EB)", days: velStage3to4, owner: "AE" },
    { name: "Stage 4→5 (Legal / Procurement)", days: velStage4to5, owner: "AE + Legal" },
    { name: "Stage 5→Close", days: velStage5toClose, owner: "AE" },
  ];

  // ── Funnel Health Scoring
  const scoreFunnel = (rate, bench) => rate >= bench.great ? "great" : rate >= bench.good ? "good" : "bad";
  const funnelHealth = funnelBenchmarks ? [
    { stage: "Inquiry→MQL", rate: inquiryToMqlRate, status: scoreFunnel(inquiryToMqlRate, funnelBenchmarks.inquiryToMqlRate), bench: funnelBenchmarks.inquiryToMqlRate,
      def: "Inquiry = net new identifiable prospect created in system" },
    { stage: "MQL→SQL", rate: mqlToSqlRate, status: scoreFunnel(mqlToSqlRate, funnelBenchmarks.mqlToSqlRate), bench: funnelBenchmarks.mqlToSqlRate },
    { stage: "SQL→Meeting (Held)", rate: sqlToMeetingRate, status: scoreFunnel(sqlToMeetingRate, funnelBenchmarks.sqlToMeetingRate), bench: funnelBenchmarks.sqlToMeetingRate,
      def: "First live sales conversation held, not scheduled. Show rate applied internally." },
    { stage: "Meeting→SQO", rate: meetingToSqoRate, status: scoreFunnel(meetingToSqoRate, funnelBenchmarks.meetingToSqoRate), bench: funnelBenchmarks.meetingToSqoRate },
    { stage: "SQO→Won", rate: sqoToWonRate, status: scoreFunnel(sqoToWonRate, funnelBenchmarks.sqoToWonRate), bench: funnelBenchmarks.sqoToWonRate },
  ] : [];
  const overallFunnelScore = funnelHealth.filter(f => f.status === "great").length * 2 + funnelHealth.filter(f => f.status === "good").length;
  const maxFunnelScore = funnelHealth.length * 2;
  const funnelGrade = overallFunnelScore >= maxFunnelScore * 0.8 ? "A" : overallFunnelScore >= maxFunnelScore * 0.6 ? "B" : overallFunnelScore >= maxFunnelScore * 0.4 ? "C" : "D";

  // ── Seasonality weights
  const EVEN_WEIGHTS = [8.33,8.33,8.33,8.33,8.33,8.33,8.33,8.33,8.33,8.33,8.33,8.33];
  const NORAM_WEIGHTS = [6, 7, 9, 9, 10, 9, 6, 5, 9, 10, 11, 9]; // NORAM B2B SaaS
  const seasonalityMode = inputs.seasonalityMode || "noram";
  const rawWeights = seasonalityMode === "even" ? EVEN_WEIGHTS
    : seasonalityMode === "noram" ? NORAM_WEIGHTS
    : (inputs.seasonalWeights || NORAM_WEIGHTS);
  const wSum = rawWeights.reduce((s,w) => s + w, 0);
  const monthWeights = rawWeights.map(w => w / wSum); // normalized to sum to 1.0
  // Cumulative weights for glideslope
  const cumWeights = monthWeights.reduce((acc, w, i) => { acc.push((acc[i - 1] || 0) + w); return acc; }, []);

  // Phase-shift lead times
  const sqoLead = sqoLeadQuarters || 2;
  const mqlLead = mqlLeadQuarters || 1;

  // ── Multi-year planning
  const numYears = Math.min(3, Math.max(1, planningYears || 2));
  const totalMonths = numYears * 12;

  // ── Calendar anchoring (workstream D)
  // planStartDate (YYYY-MM-DD) anchors all month/quarter/year labels in calendar time.
  // Quarter NUMBERING stays plan-aligned (Q1 = first 3 months of plan), but the LABEL
  // shows the actual months covered.
  // Determinism: the engine must NOT read the wall clock — same inputs → same
  // outputs, always (golden tests depend on this). planStartDate is required by the
  // contract; if a caller omits it we anchor to a fixed epoch rather than `new Date()`.
  // (UI "default to this month" lives in DEFAULT_INPUTS, outside the pure core.)
  const planStart = inputs.planStartDate || '2025-01-01';
  const [psYearStr, psMonthStr] = planStart.split('-');
  const startYear = parseInt(psYearStr, 10);
  const startMonthIdx = parseInt(psMonthStr, 10) - 1;
  function calMonthAt(planMonthIndex) {
    const abs = startMonthIdx + planMonthIndex;
    return { monthIdx: ((abs % 12) + 12) % 12, year: startYear + Math.floor(abs / 12) };
  }
  function calMonthLabel(planMonthIndex) {
    const { monthIdx, year } = calMonthAt(planMonthIndex);
    return `${MONTHS[monthIdx]} '${String(year).slice(-2)}`;
  }
  function calQuarterLabel(planMonthIndex) {
    const yi = Math.floor(planMonthIndex / 12);
    const qi = Math.floor((planMonthIndex % 12) / 3);
    const qStart = yi * 12 + qi * 3;
    const startCal = calMonthAt(qStart);
    const endCal = calMonthAt(qStart + 2);
    const yearTag = startCal.year === endCal.year
      ? `'${String(startCal.year).slice(-2)}`
      : `'${String(startCal.year).slice(-2)}-'${String(endCal.year).slice(-2)}`;
    return `Q${qi+1} (${MONTHS[startCal.monthIdx]}-${MONTHS[endCal.monthIdx]} ${yearTag})`;
  }
  function calYearLabel(yi) {
    const ys = calMonthAt(yi * 12);
    const ye = calMonthAt(yi * 12 + 11);
    return `Y${yi+1} (${MONTHS[ys.monthIdx]} '${String(ys.year).slice(-2)}-${MONTHS[ye.monthIdx]} '${String(ye.year).slice(-2)})`;
  }

  const MONTH_LABELS = Array.from({length: totalMonths}, (_, i) => calMonthLabel(i));

  // Per-year targets — back-solve from targetARR (the END of the plan).
  // For multi-year plans, the FINAL year exits at targetARR. Earlier years are
  // derived by walking backwards through Y2Growth so the year sequence
  // interpolates correctly to the target.
  //
  // Example: 2-year plan, $5M start, $20M target, Y2Growth=60%
  //   Y2 exits at $20M (the target)
  //   Y1 exits at $20M / 1.60 = $12.5M
  //   Y1 new = $12.5M - $5M = $7.5M; Y2 new = $20M - $12.5M = $7.5M
  //   Total new = $15M (matches summary.newARRNeeded — no over-count)
  //
  // Prior logic set Y1 target = full targetARR and grew Y2 past it ($32M),
  // which over-counted plan totals and made quarterly math hot.
  const yGrowthPct = (y2GrowthRate || 60) / 100;
  const yearExits = new Array(numYears);
  yearExits[numYears - 1] = targetARR;
  for (let y = numYears - 2; y >= 0; y--) {
    yearExits[y] = yearExits[y + 1] / (1 + yGrowthPct);
  }

  const yearTargets = [];
  for (let y = 0; y < numYears; y++) {
    const yrStartARR = y === 0 ? retainedARR : yearExits[y - 1];
    const yrTargetARR = yearExits[y];
    const yrNewARRNeeded = Math.max(0, yrTargetARR - yrStartARR);
    const yrDeals = Math.ceil(yrNewARRNeeded / avgDealSize);
    const convLift = y > 0 ? (y2ConversionLift || 0) / 100 : 0;
    const yrSqoWon = Math.min(95, sqoToWonRate + convLift * 100);
    const yrSqos = Math.ceil(yrDeals / (yrSqoWon / 100));
    yearTargets.push({
      year: y + 1, label: calYearLabel(y), shortLabel: `Y${y + 1}`,
      startARR: yrStartARR, targetARR: yrTargetARR,
      exitARR: yrTargetARR, // projected exit = target (model assumes on-target)
      newARRNeeded: yrNewARRNeeded, dealsNeeded: yrDeals,
      sqosNeeded: yrSqos, sqoToWon: yrSqoWon,
      growthRate: yrStartARR > 0 ? (yrTargetARR - yrStartARR) / yrStartARR * 100 : 0,
    });
  }

  // Monthly (multi-year, seasonally weighted, attrition-adjusted)
  let runningNewARR = 0;
  const monthly = MONTH_LABELS.map((m, i) => {
    const yi = Math.floor(i / 12); // year index (0, 1, 2)
    const mi12 = i % 12; // month within year (0-11)
    const mn = i + 1; // absolute month number
    const yt = yearTargets[yi];
    const sw = monthWeights[mi12]; // seasonal weight (repeats each year)
    // Ramp: AEs fully ramped after Y1, reset attrition per year
    const monthInYear = mi12 + 1;
    const rf = yi === 0 ? Math.min(1, monthInYear / Math.max(1, aeRampMonths)) : 1; // fully ramped after Y1
    const attrFactor = Math.pow(1 - monthlyAttrRate, monthInYear); // resets each year (rehire)
    const effectiveAEs = aeCount * attrFactor;
    const raes = Math.round(effectiveAEs * rf * 10) / 10;
    const cap = raes * (aeQuota / 12);
    const inq = Math.round(yt.newARRNeeded / avgDealSize / (sqoToWonRate/100) / (meetingToSqoRate/100) / (sqlToMeetingRate/100) / (mqlToSqlRate/100) / (inquiryToMqlRate/100) * sw);
    const mmql = Math.round(inq * (inquiryToMqlRate / 100));
    const msql = Math.round(mmql * (mqlToSqlRate / 100));
    const mmtg = Math.round(msql * (sqlToMeetingRate / 100));
    const msqo = Math.round(mmtg * (meetingToSqoRate / 100));
    const md = Math.round(msqo * (sqoToWonRate / 100));
    const mnarr = md * avgDealSize;
    const mExpDeals = Math.round((yi === 0 ? expansionDeals : Math.ceil(yt.newARRNeeded * expansionPctN / expansionAvgDeal)) * sw);
    const mExpARR = revenueMode === "split" ? mExpDeals * expansionAvgDeal : 0;
    const mTotalNewARR = mnarr + mExpARR;
    // Running ARR resets at year boundary
    if (mi12 === 0 && yi > 0) runningNewARR = 0;
    runningNewARR += mTotalNewARR;
    const cnarr = runningNewARR;
    const tarr = yt.startARR + cnarr;
    return { month: m, monthNum: mn, monthInYear, yearIndex: yi, yearLabel: `Y${yi+1}`,
      quarter: calQuarterLabel(i), quarterLabel: calQuarterLabel(i), quarterShort: `Q${Math.floor(mi12/3)+1}`,
      rampedAEs: raes, rampFactor: rf, fullCapacity: cap, seasonalWeight: sw,
      monthlyInquiries: inq, monthlyMQLs: mmql, monthlySQLs: msql,
      monthlyMeetings: mmtg, monthlySQOs: msqo, monthlyDeals: md,
      monthlyNewARR: mnarr, monthlyExpDeals: mExpDeals, monthlyExpARR: mExpARR,
      monthlyTotalNewARR: mTotalNewARR,
      cumulativeNewARR: cnarr, totalARR: tarr,
      monthlyRevenue: tarr / 12, pipeline: msqo * avgDealSize * (pipelineCoverage / 100),
      stage1Pipe: mmtg * stage1MinAmount, stage2Pipe: msqo * avgDealSize,
      newLogoARR: mnarr, expansionNewARR: mExpARR,
      yearTargetARR: yt.targetARR, yearStartARR: yt.startARR, yearNewARRNeeded: yt.newARRNeeded,
    };
  });


  // Seller ramp with attrition (Y1 only — uses calendar months from planStartDate)
  const sellerRamp = MONTHS.map((m, i) => { const calLabel = calMonthLabel(i);
    const mn = i+1, rp = Math.min(1, mn/Math.max(1,aeRampMonths));
    // Attrition reduces effective headcount over time (cumulative loss)
    const attrFactor = Math.pow(1 - monthlyAttrRate, mn);
    const effectiveAEs = aeCount * attrFactor;
    const raes = Math.round(effectiveAEs * rp * 10) / 10;
    const eq = (aeQuota/12)*rp, tc = raes*(aeQuota/12), fq = aeCount*(aeQuota/12);
    const attrLoss = (aeCount - effectiveAEs) * (aeQuota/12);
    return { month:calLabel, monthShort:m, monthNum:mn, rampPct:rp, effectiveQuota:eq, totalCapacity:tc, fullQuota:fq,
      capacityLoss:fq-tc, effectiveAEs: Math.round(effectiveAEs*10)/10, attrFactor, attrLoss };
  });
  const totalRampLoss = sellerRamp.reduce((s,r) => s + r.capacityLoss, 0);
  const totalAttrLoss = sellerRamp.reduce((s,r) => s + r.attrLoss, 0);

  // ──────────────────────────────────────────────────────────
  // AE HIRING PLAN — bridges currentAeCount (today) with aeCount (target)
  // Models cohorts: each cohort = AEs hired in a given month.
  // Productive capacity per month = Σ cohort.count × min(1, monthsSinceHire / rampMonths)
  // Required productive AEs = monthlyNewARR / (aeQuota × realisticAttainment / 12)
  // ──────────────────────────────────────────────────────────
  const startNameplate = currentAeCount || aeCount; // fallback: assume current = target
  const targetNameplate = aeCount;
  const hiresNeeded = Math.max(0, targetNameplate - startNameplate);
  const horizonMonths = monthly.length;
  const ramp = Math.max(1, aeRampMonths || 6);
  const realAtt = (realisticAeAttainment || 75) / 100;
  const monthlyQuotaPerAE = aeQuota / 12;

  // Distribute hires across the planning window
  // 'frontload' = 60% in first third, 30% middle, 10% last (gives ramp room)
  // 'linear'    = even distribution
  // Lead time pushes the FIRST hire by aeTimeToHire months (req-open to onboarded)
  const hireSchedule = new Array(horizonMonths).fill(0);
  if (hiresNeeded > 0) {
    const leadOffset = Math.min(horizonMonths - 1, aeTimeToHire || 0);
    const hiringWindow = Math.max(1, Math.floor(horizonMonths * 0.6) - leadOffset);
    if (hiringPlanMode === 'linear') {
      // even distribution
      const perMonth = hiresNeeded / hiringWindow;
      let remaining = hiresNeeded;
      for (let m = leadOffset; m < leadOffset + hiringWindow && remaining > 0; m++) {
        const h = Math.min(remaining, Math.ceil(perMonth));
        hireSchedule[m] = h;
        remaining -= h;
      }
    } else {
      // frontload: 60/30/10 across three thirds of the hiring window
      const third = Math.max(1, Math.floor(hiringWindow / 3));
      const w1 = Math.round(hiresNeeded * 0.6);
      const w2 = Math.round(hiresNeeded * 0.3);
      const w3 = hiresNeeded - w1 - w2;
      const distribute = (count, start, len) => {
        if (count <= 0 || len <= 0) return;
        const perMo = Math.ceil(count / len);
        let rem = count;
        for (let m = start; m < Math.min(horizonMonths, start + len) && rem > 0; m++) {
          const h = Math.min(rem, perMo);
          hireSchedule[m] += h;
          rem -= h;
        }
      };
      distribute(w1, leadOffset, third);
      distribute(w2, leadOffset + third, third);
      distribute(w3, leadOffset + 2 * third, hiringWindow - 2 * third);
    }
  }

  // Build cohorts: day-zero cohort starts ramped (assume on-payroll AEs are productive)
  // New hire cohorts ramp from month-of-hire over rampMonths
  const aeHiringPlan = monthly.map((mo, mi) => {
    // Nameplate = starting + cumulative hires through this month
    let cumulativeHires = 0;
    for (let j = 0; j <= mi; j++) cumulativeHires += hireSchedule[j];
    const nameplate = startNameplate + cumulativeHires;

    // Productive: day-zero cohort fully ramped; each new cohort at its own ramp%
    let productive = startNameplate; // existing AEs assumed productive
    for (let j = 0; j <= mi; j++) {
      const cohortSize = hireSchedule[j];
      if (cohortSize === 0) continue;
      const monthsSinceHire = mi - j;
      const rampPct = Math.min(1, (monthsSinceHire + 0.5) / ramp); // +0.5 = mid-month
      productive += cohortSize * rampPct;
    }

    // Required productive = monthly new ARR / (quota × realistic attainment / 12)
    const monthlyTarget = mo.monthlyNewARR || mo.newLogoARR || 0;
    const productivePerAE = monthlyQuotaPerAE * realAtt;
    const requiredProductive = productivePerAE > 0 ? monthlyTarget / productivePerAE : 0;
    const gap = productive - requiredProductive; // positive = surplus, negative = deficit

    // Comp burn this month (nameplate × fully-loaded / 12)
    const aeFullyLoadedMonthly = ((aeOTE || 280000) * (aeBenefitsLoad || 1.25)) / 12;
    const monthlyAeComp = nameplate * aeFullyLoadedMonthly;

    return {
      monthIndex: mi,
      monthShort: mo.month,
      monthLong: mo.calLabel || mo.month,
      hiresThisMonth: hireSchedule[mi],
      cumulativeHires,
      nameplate: Math.round(nameplate * 10) / 10,
      productive: Math.round(productive * 10) / 10,
      requiredProductive: Math.round(requiredProductive * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      monthlyAeComp,
      gapStatus: gap >= 0 ? 'surplus' : gap >= -1 ? 'tight' : 'deficit',
    };
  });

  // Summary across the plan
  const aeHiringSummary = (() => {
    const peakGapEntry = aeHiringPlan.reduce((worst, m) => m.gap < worst.gap ? m : worst, { gap: Infinity });
    const peakRequired = aeHiringPlan.reduce((m, x) => Math.max(m, x.requiredProductive), 0);
    const totalComp = aeHiringPlan.reduce((s, m) => s + m.monthlyAeComp, 0);
    const monthsInDeficit = aeHiringPlan.filter(m => m.gap < 0).length;
    const finalNameplate = aeHiringPlan[aeHiringPlan.length - 1]?.nameplate || targetNameplate;
    const finalProductive = aeHiringPlan[aeHiringPlan.length - 1]?.productive || 0;
    // First month productive ≥ required (the "in the green" date)
    const firstMonthGreen = aeHiringPlan.find(m => m.gap >= 0)?.monthLong || null;
    return {
      startNameplate, targetNameplate, hiresNeeded,
      peakRequired: Math.round(peakRequired * 10) / 10,
      peakGap: peakGapEntry.gap === Infinity ? 0 : peakGapEntry.gap,
      peakGapMonth: peakGapEntry.monthLong || null,
      monthsInDeficit,
      finalNameplate, finalProductive,
      totalComp,
      firstMonthGreen,
      hiringPlanMode: hiringPlanMode || 'frontload',
      aeTimeToHire: aeTimeToHire || 0,
      realisticAttainment: realAtt * 100,
    };
  })();

  // Stages
  // Stages (show both total and marketing-sourced)
  const stages = [
    { name:"Inquiries", count:inquiriesNeeded, mktgCount:mktgInquiriesNeeded, nextRate:inquiryToMqlRate, owner:"Marketing", question:"CPL earned" },
    { name:"MQLs", count:mqlsNeeded, mktgCount:mktgMqlsNeeded, nextRate:mqlToSqlRate, owner:"Inbound BDR", question:"Fit + intent gate" },
    { name:"SQLs", count:sqlsNeeded, mktgCount:mktgSqlsNeeded, nextRate:sqlToMeetingRate, owner:"BDR / SDR", question:"Two-way contact" },
    { name:"Meetings Held", count:meetingsNeeded, mktgCount:mktgMeetingsNeeded, nextRate:meetingToSqoRate, owner:"AE", question:"Discovery done" },
    { name:"SQOs", count:sqosNeeded, mktgCount:mktgSQOs, nextRate:sqoToWonRate, owner:"AE", question:`${Math.round(mktgPct*100)}% mktg / ${Math.round((1-mktgPct)*100)}% AE sourced` },
    { name:"Closed Won", count:dealsNeeded, mktgCount:dealsNeeded, nextRate:100, owner:"AE", question:"Revenue" },
  ];

  // ── P&L: Dual-axis cost model (Y1 only for annual P&L)
  const y1Monthly = monthly.filter(m => m.yearIndex === 0);
  const totalRevenue = y1Monthly.reduce((s,m) => s+m.monthlyRevenue, 0);
  const grossProfit = totalRevenue*(grossMargin/100);
  const cogsAmount = totalRevenue - grossProfit;

  // ── Functional view (where costs sit)
  const gAndA = totalRevenue * (gAndAPct / 100);
  const rAndD = totalRevenue * (rAndDPct / 100);
  const salesOpex = totalRevenue * (salesOpexPct / 100);

  // ── Sales Budget Decomposition
  const sbb = salesBudgetBreakdown || { aeComp: 55, sdrComp: 20, seOverlay: 10, salesTools: 8, enablement: 4, travel: 3 };
  
  // Headcount-based comp floor (actual cost to employ the team)
  const aeFullyLoaded = (aeOTE || 280000) * (aeBenefitsLoad || 1.25);  // $350K per AE
  const sdrFullyLoaded = (sdrOTE || 95000) * (sdrBenefitsLoad || 1.22); // $116K per SDR
  const sdrCount = Math.ceil(aeCount * (sdrsPerAe || 1.5));
  const aeCompFloor = aeCount * aeFullyLoaded;
  const sdrCompFloor = sdrCount * sdrFullyLoaded;
  const seCount = Math.max(1, Math.ceil(aeCount / 3)); // ~1 SE per 3 AEs
  const seFullyLoaded = 195000; // SE fully loaded ($155K base + benefits)
  const seCompFloor = seCount * seFullyLoaded;
  const salesHeadcountFloor = aeCompFloor + sdrCompFloor + seCompFloor;

  // Formula-based breakdown (% of salesOpex)
  const salesBudgetItems = [
    { name: "AE Comp", pctOfSales: sbb.aeComp,
      formula: salesOpex * (sbb.aeComp / 100), floor: aeCompFloor,
      amount: Math.max(salesOpex * (sbb.aeComp / 100), aeCompFloor),
      headcount: aeCount, perHead: aeFullyLoaded,
      desc: `${aeCount} AEs × ${Math.round(aeFullyLoaded/1000)}K loaded` },
    { name: "SDR/BDR Comp", pctOfSales: sbb.sdrComp,
      formula: salesOpex * (sbb.sdrComp / 100), floor: sdrCompFloor,
      amount: Math.max(salesOpex * (sbb.sdrComp / 100), sdrCompFloor),
      headcount: sdrCount, perHead: sdrFullyLoaded,
      desc: `${sdrCount} SDRs × ${Math.round(sdrFullyLoaded/1000)}K loaded` },
    { name: "SE / Overlay", pctOfSales: sbb.seOverlay,
      formula: salesOpex * (sbb.seOverlay / 100), floor: seCompFloor,
      amount: Math.max(salesOpex * (sbb.seOverlay / 100), seCompFloor),
      headcount: seCount, perHead: seFullyLoaded,
      desc: `${seCount} SEs × ${Math.round(seFullyLoaded/1000)}K loaded` },
    { name: "Sales Tools", pctOfSales: sbb.salesTools,
      formula: salesOpex * (sbb.salesTools / 100), floor: 0,
      amount: salesOpex * (sbb.salesTools / 100),
      desc: "CRM, outbound, Gong, ZoomInfo" },
    { name: "Enablement", pctOfSales: sbb.enablement,
      formula: salesOpex * (sbb.enablement / 100), floor: 0,
      amount: salesOpex * (sbb.enablement / 100),
      desc: "Training, onboarding, SKO" },
    { name: "Travel", pctOfSales: sbb.travel,
      formula: salesOpex * (sbb.travel / 100), floor: 0,
      amount: salesOpex * (sbb.travel / 100),
      desc: "Field travel, customer dinners" },
  ];
  salesBudgetItems.forEach(si => { si.isFloorBound = si.floor > 0 && si.floor > si.formula; });
  const salesBudgetActual = salesBudgetItems.reduce((s, si) => s + si.amount, 0);
  const salesIsFloorBound = salesHeadcountFloor > salesOpex;
  const salesFloorDelta = salesIsFloorBound ? salesHeadcountFloor - salesOpex : 0;
  
  // Sales comp split: base vs variable (for AEs)
  const aeBasePct = 100 - (salesVariablePct || 50); // if 50% variable, then 50% base
  const aeTotalBase = aeCompFloor * (aeBasePct / 100);
  const aeTotalVariable = aeCompFloor * (salesVariablePct / 100);
  const sdrTotalBase = sdrCompFloor * 0.7; // SDRs typically 70/30
  const sdrTotalVariable = sdrCompFloor * 0.3;
  const totalSalesFixedComp = aeTotalBase + sdrTotalBase + seCompFloor; // SEs are all fixed
  const totalSalesVariableComp = aeTotalVariable + sdrTotalVariable;

  // Marketing: total = variable demand gen + fixed marketing overhead
  const variableMktg = totalRevenue * (variableMktgPct / 100);
  const formulaFixedMktg = fixedMktgPct > 0 ? variableMktg / (1 - fixedMktgPct / 100) - variableMktg : 0;

  // ══ LEADERSHIP COST LAYER ══
  // Comp is a step function of funding stage, NOT revenue.
  // VC-backed at Series B demands market-rate "proven operators" even at $5M ARR.
  // Bootstrapped can defer hiring or use fractional/Sr Dir instead of VP.
  const stage = fundingStage || "seriesB";
  const lr = leadershipRoles || { vpSales: true, vpMarketing: true, vpCS: true, vpOps: false, vpProduct: false };
  
  // OTE bands by funding stage (mid-market cyber, fully loaded = OTE × 1.3 for benefits+equity)
  const LEADERSHIP_COMP = {
    bootstrapped: { vpSales: 275000, vpMarketing: 250000, vpCS: 200000, vpOps: 220000, vpProduct: 230000, load: 1.15 },
    seed:         { vpSales: 300000, vpMarketing: 275000, vpCS: 220000, vpOps: 240000, vpProduct: 250000, load: 1.20 },
    seriesA:      { vpSales: 340000, vpMarketing: 310000, vpCS: 260000, vpOps: 270000, vpProduct: 280000, load: 1.25 },
    seriesB:      { vpSales: 380000, vpMarketing: 350000, vpCS: 290000, vpOps: 300000, vpProduct: 310000, load: 1.30 },
    seriesC:      { vpSales: 420000, vpMarketing: 380000, vpCS: 320000, vpOps: 340000, vpProduct: 350000, load: 1.35 },
  };
  const compTable = LEADERSHIP_COMP[stage] || LEADERSHIP_COMP.seriesB;
  const loadFactor = compTable.load;

  const leadershipDetail = [
    { role: "VP Sales / CRO", enabled: lr.vpSales, ote: compTable.vpSales, loaded: Math.round(compTable.vpSales * loadFactor), 
      sitsIn: "Sales", desc: "Carries team quota, owns pipeline" },
    { role: "VP Marketing / CMO", enabled: lr.vpMarketing, ote: compTable.vpMarketing, loaded: Math.round(compTable.vpMarketing * loadFactor),
      sitsIn: "Marketing", desc: "Owns demand gen, brand, pipeline sourcing" },
    { role: "VP CS / CCO", enabled: lr.vpCS, ote: compTable.vpCS, loaded: Math.round(compTable.vpCS * loadFactor),
      sitsIn: "G&A", desc: "Owns NRR, expansion, churn" },
    { role: "VP Ops / COO", enabled: lr.vpOps, ote: compTable.vpOps, loaded: Math.round(compTable.vpOps * loadFactor),
      sitsIn: "G&A", desc: "RevOps, systems, process" },
    { role: "VP Product", enabled: lr.vpProduct, ote: compTable.vpProduct, loaded: Math.round(compTable.vpProduct * loadFactor),
      sitsIn: "R&D", desc: "Roadmap, threat landscape, compliance" },
  ];

  const activeLeadership = leadershipDetail.filter(l => l.enabled);
  const totalLeadershipCost = activeLeadership.reduce((s, l) => s + l.loaded, 0);
  const leadershipPctOfRev = totalRevenue > 0 ? totalLeadershipCost / totalRevenue * 100 : 0;
  // Where leadership sits in the P&L
  const leadershipInSales = activeLeadership.filter(l => l.sitsIn === "Sales").reduce((s, l) => s + l.loaded, 0);
  const leadershipInMktg = activeLeadership.filter(l => l.sitsIn === "Marketing").reduce((s, l) => s + l.loaded, 0);
  const leadershipInGA = activeLeadership.filter(l => l.sitsIn === "G&A").reduce((s, l) => s + l.loaded, 0);
  const leadershipInRD = activeLeadership.filter(l => l.sitsIn === "R&D").reduce((s, l) => s + l.loaded, 0);

  // ══ THREE-LAYER FIXED MARKETING MODEL ══
  // Layer 1: Structural Dollar Floors (tier-selected, NOT % sliders)
  // Layer 2: Scalable Infrastructure (elastic % of remaining budget)
  // Layer 3: Variable (handled in motions, not here)
  const arrForScale = targetARR;

  // ── LAYER 1: Structural Floors (dollar amounts, user picks tier)
  // Executive: step function of funding stage × tier selection
  const mktgLeadershipFromLayer = leadershipInMktg > 0 ? leadershipInMktg : Math.round(compTable.vpMarketing * loadFactor);
  const EXEC_TIERS = {
    founder:    { label: "Founder-Led",     cost: 0,         desc: "Founder handles mktg strategy directly" },
    fractional: { label: "Fractional CMO",  cost: Math.round(mktgLeadershipFromLayer * 0.4), desc: "Part-time / advisory (~40% of full VP)" },
    fullVP:     { label: "Full VP",         cost: mktgLeadershipFromLayer, desc: "Dedicated VP Marketing, fully loaded" },
    cmoPlusVP:  { label: "CMO + VP",        cost: mktgLeadershipFromLayer + 180000, desc: "CMO layer + operating VP" },
  };
  const execTier = executiveTier || "fullVP";
  const execCost = EXEC_TIERS[execTier]?.cost || mktgLeadershipFromLayer;

  // PMM: enterprise motion requires it at $10M+
  const PMM_TIERS = {
    none:       { label: "None",            cost: 0,      desc: "Founder/AE does positioning" },
    fractional: { label: "Fractional",      cost: 82500,  desc: "Contractor / part-time PMM" },
    full:       { label: "Full PMM",        cost: 165000, desc: "Dedicated PMM, fully loaded" },
    team:       { label: "PMM Team",        cost: 330000, desc: "Sr PMM + competitive analyst" },
  };
  const pmmTierKey = pmmTier || "full";
  const pmmCost = PMM_TIERS[pmmTierKey]?.cost || 165000;

  // Core MarTech: minimum viable stack (CRM, MAP, attribution, CMS)
  const MARTECH_TIERS = {
    starter:    { label: "Starter",         cost: 60000,  desc: "Basic CRM + MAP + analytics" },
    standard:   { label: "Standard",        cost: 85000,  desc: "CRM + MAP + attribution + CMS" },
    enterprise: { label: "Enterprise",      cost: 145000, desc: "Full stack + ABM platform + intent" },
  };
  const mtTierKey = coreMarTechTier || "standard";
  const mtCost = MARTECH_TIERS[mtTierKey]?.cost || 85000;

  // Layer 1 total (structural floors — cannot be slider-optimized)
  const layer1Total = execCost + pmmCost + mtCost;

  // ── Minimum viable Layer 2 floors (must be defined before fixedMktg)
  const revOpsMinViable = 155000;  // 1 DG/MOps hire
  const contentMinViable = 135000; // 1 content person
  const prArMinViable = arrForScale > 15000000 ? 95000 : 0;

  // fixedMktg = MAX(formula, Layer 1 + minimum viable Layer 2)
  // Layer 1 is non-negotiable. Layer 2 must fund at least min viable ops+content.
  const minViableLayer2 = revOpsMinViable + contentMinViable + prArMinViable;
  const structuralFloor = layer1Total + minViableLayer2;
  const fixedMktg = Math.max(formulaFixedMktg, structuralFloor);
  const fixedMktgIsFloorBound = structuralFloor > formulaFixedMktg;
  const effectiveFixedMktgPct = (variableMktg + fixedMktg) > 0 ? fixedMktg / (variableMktg + fixedMktg) * 100 : 0;
  const totalMktgBudget = variableMktg + fixedMktg;

  // ── LAYER 2: Scalable Infrastructure (elastic, % of remaining after Layer 1)
  const emb = elasticMktgBreakdown || { revEngineOps: 35, brandContent: 40, prAr: 25 };
  const embTotal = emb.revEngineOps + emb.brandContent + emb.prAr;
  const actualLayer2Budget = Math.max(0, fixedMktg - layer1Total);
  const actualRevOps = embTotal > 0 ? actualLayer2Budget * (emb.revEngineOps / embTotal) : 0;
  const actualBrandContent = embTotal > 0 ? actualLayer2Budget * (emb.brandContent / embTotal) : 0;
  const actualPrAr = embTotal > 0 ? actualLayer2Budget * (emb.prAr / embTotal) : 0;

  const floorTotal = fixedMktg;
  const floorPctOfRev = totalRevenue > 0 ? fixedMktg / totalRevenue * 100 : 0;

  // Headcount floor object (backward compat)
  const mktgHeadcountFloor = {
    label: arrForScale < 5000000 ? "Seed/Early ($0-5M)" : arrForScale < 15000000 ? "Growth ($5-15M)" : arrForScale < 30000000 ? "Scale ($15-30M)" : "Enterprise ($30M+)",
    executive: execCost, pmm: pmmCost, infraTools: mtCost,
    revEngineOps: actualRevOps, brandContent: actualBrandContent, prAr: actualPrAr,
  };

  // ── Marketing Budget Decomposition
  // Variable marketing splits: programmatic (channel spend) vs martech
  const martechPct = (martechPctOfVariable || 25) / 100;
  const martechSpend = variableMktg * martechPct;           // intent data, enrichment, MAP overage, syndication
  const programmaticBudget = variableMktg * (1 - martechPct); // paid media, events, content syndication — what flows through channels

  // ══ REVENUE MOTIONS ══
  // Three motions: CREATE (net-new demand), CONVERT (qualification), ACCELERATE (deal velocity)
  const ma = motionAllocation || { create: 45, convert: 30, accelerate: 25 };
  const mc = motionChannels || {};
  const programmaticForMotions = programmaticBudget; // same as variableMktg × (1-martechPct)
  
  // Motion budget splits
  const maPctTotal = ma.create + ma.convert + ma.accelerate;
  const createBudget = programmaticForMotions * (ma.create / maPctTotal);
  const convertBudget = programmaticForMotions * (ma.convert / maPctTotal);
  const accelBudget = programmaticForMotions * (ma.accelerate / maPctTotal);

  // ── DEMAND CREATION: buys net-new inquiries
  const createChannels = (mc.create || []).map(ch => {
    const spend = createBudget * (ch.pct / 100);
    const inq = ch.cpl > 0 ? Math.round(spend / ch.cpl) : 0;
    const mqls = Math.round(inq * (inquiryToMqlRate / 100));
    const sqls = Math.round(mqls * (mqlToSqlRate / 100));
    const mtgs = Math.round(sqls * (sqlToMeetingRate / 100));
    const sqos = Math.round(mtgs * (meetingToSqoRate / 100));
    const deals = Math.round(sqos * (sqoToWonRate / 100));
    const rev = deals * avgDealSize;
    return { ...ch, motion: "CREATE", spend, inquiries: inq, mqls, sqls, meetings: mtgs, sqos, deals, revenue: rev,
      cac: deals > 0 ? spend / deals : 0, roi: spend > 0 ? rev / spend : 0 };
  });
  const createTotals = {
    spend: createChannels.reduce((s,c) => s + c.spend, 0),
    inquiries: createChannels.reduce((s,c) => s + c.inquiries, 0),
    mqls: createChannels.reduce((s,c) => s + c.mqls, 0),
    sqls: createChannels.reduce((s,c) => s + c.sqls, 0),
    sqos: createChannels.reduce((s,c) => s + c.sqos, 0),
    deals: createChannels.reduce((s,c) => s + c.deals, 0),
    pipeline: createChannels.reduce((s,c) => s + c.sqos, 0) * avgDealSize,
    revenue: createChannels.reduce((s,c) => s + c.revenue, 0),
  };
  createTotals.blendedCPL = createTotals.inquiries > 0 ? createTotals.spend / createTotals.inquiries : 0;
  createTotals.cacCreation = createTotals.deals > 0 ? createTotals.spend / createTotals.deals : 0;

  // ── DEMAND CONVERSION: turns interest into real pipeline (SDR, AI, Partner)
  const convertChannels = (mc.convert || []).map(ch => {
    const spend = convertBudget * (ch.pct / 100);
    const sqlsProcessed = ch.costPerSql > 0 ? Math.round(spend / ch.costPerSql) : 0;
    const sqosCreated = Math.round(sqlsProcessed * (meetingToSqoRate / 100)); // SQLs that become SQOs
    const costPerSqo = sqosCreated > 0 ? spend / sqosCreated : 0;
    const capacityUtil = mktgSqlsNeeded > 0 ? Math.min(100, sqlsProcessed / mktgSqlsNeeded * 100) : 0;
    return { ...ch, motion: "CONVERT", spend, sqlsProcessed, sqosCreated, costPerSqo, capacityUtil };
  });
  const convertTotals = {
    spend: convertChannels.reduce((s,c) => s + c.spend, 0),
    sqlsProcessed: convertChannels.reduce((s,c) => s + c.sqlsProcessed, 0),
    sqosCreated: convertChannels.reduce((s,c) => s + c.sqosCreated, 0),
  };
  convertTotals.costPerSqo = convertTotals.sqosCreated > 0 ? convertTotals.spend / convertTotals.sqosCreated : 0;

  // ── DEAL ACCELERATION: collapses time and risk on active opps
  const accelCovPct = (accelAccountsCoverage || 60) / 100;
  const accelTargetAccounts = Math.round(sqosNeeded * accelCovPct);
  const accelChannels = (mc.accelerate || []).map(ch => {
    const spend = accelBudget * (ch.pct / 100);
    const accountsTouched = ch.costPerAccount > 0 ? Math.round(spend / ch.costPerAccount) : 0;
    const oppsInfluenced = Math.min(accountsTouched, accelTargetAccounts);
    return { ...ch, motion: "ACCELERATE", spend, accountsTouched, oppsInfluenced,
      avgDaysReduced: accelDaysReduced || 30, winRateDelta: accelWinRateLift || 5 };
  });
  const accelTotals = {
    spend: accelChannels.reduce((s,c) => s + c.spend, 0),
    accountsTouched: accelChannels.reduce((s,c) => s + c.accountsTouched, 0),
    oppsInfluenced: Math.min(accelChannels.reduce((s,c) => s + c.oppsInfluenced, 0), accelTargetAccounts),
  };
  // Revenue pulled forward = accelerated deals × avg deal size × (improved win rate - base win rate)
  const accelAdditionalWins = Math.round(accelTotals.oppsInfluenced * ((accelWinRateLift || 5) / 100));
  accelTotals.revenuePulledForward = accelAdditionalWins * avgDealSize;
  accelTotals.daysReduced = accelDaysReduced || 30;
  accelTotals.winRateLift = accelWinRateLift || 5;

  // ── Legacy channels array (for backward compatibility with Pipeline page, CAC, etc.)
  const channels = createChannels.map(c => ({
    name: c.name, pct: c.pct, channelInquiries: c.inquiries, cpl: c.cpl, spend: c.spend,
    mqls: c.mqls, sqls: c.sqls, meetings: c.meetings, sqos: c.sqos, deals: c.deals,
    revenue: c.revenue, roi: c.roi, cac: c.cac,
    costPerMql: c.mqls > 0 ? c.spend / c.mqls : 0,
    costPerSql: c.sqls > 0 ? c.spend / c.sqls : 0,
    costPerSqo: c.sqos > 0 ? c.spend / c.sqos : 0,
    costPerMeeting: c.meetings > 0 ? c.spend / c.meetings : 0,
    cacPayback: c.cac > 0 ? c.cac / (avgDealSize / 12) : 0,
    ltvCac: c.cac > 0 ? (churnRate > 0 ? avgDealSize / (churnRate / 100) : avgDealSize * 10) / c.cac : 0,
  }));
  const totalMarketingSpend = channels.reduce((s,c) => s + c.spend, 0);

  // ── CAC Breakdown (motion-based)
  const blendedCAC = dealsNeeded > 0 ? totalMarketingSpend / dealsNeeded : 0;
  const totalDealsAllMotions = dealsNeeded + expansionDeals;
  const fullyLoadedCAC = totalDealsAllMotions > 0 ? totalMarketingSpend / totalDealsAllMotions : 0;
  const cacBreakdown = {
    creation: { spend: createTotals.spend, label: "Demand Creation" },
    conversion: { spend: convertTotals.spend, label: "Demand Conversion" },
    acceleration: { spend: accelTotals.spend, label: "Deal Acceleration" },
    sdrCost: { spend: aeCount * sdrsPerAe * 85000, label: "SDR Fully Loaded" },
  };
  const totalAcquisitionCost = Object.values(cacBreakdown).reduce((s,c) => s + c.spend, 0);
  Object.values(cacBreakdown).forEach(c => {
    c.pctOfTotal = totalAcquisitionCost > 0 ? c.spend / totalAcquisitionCost * 100 : 0;
    c.perDeal = dealsNeeded > 0 ? c.spend / dealsNeeded : 0;
  });

  // Fixed marketing itemization — THREE-LAYER MODEL
  // Layer 1 items: dollar floors from tier selectors (structural commitments)
  // Layer 2 items: elastic allocation of remaining budget (design choices)
  const fixedMktgItems = [
    // LAYER 1: Structural Floors
    { name: "Executive Layer", amount: execCost, floor: execCost, formula: execCost,
      isFloorBound: true, layer: "executive", layerType: 1,
      tier: execTier, tierLabel: EXEC_TIERS[execTier]?.label,
      desc: EXEC_TIERS[execTier]?.desc || "VP/CMO",
      pctOfRev: totalRevenue > 0 ? execCost / totalRevenue * 100 : 0 },
    { name: "Product & Market Strategy", amount: pmmCost, floor: pmmCost, formula: pmmCost,
      isFloorBound: true, layer: "pmm", layerType: 1,
      tier: pmmTierKey, tierLabel: PMM_TIERS[pmmTierKey]?.label,
      desc: PMM_TIERS[pmmTierKey]?.desc || "PMM",
      pctOfRev: totalRevenue > 0 ? pmmCost / totalRevenue * 100 : 0 },
    { name: "MarTech Infrastructure", amount: mtCost, floor: mtCost, formula: mtCost,
      isFloorBound: true, layer: "infraTools", layerType: 1,
      tier: mtTierKey, tierLabel: MARTECH_TIERS[mtTierKey]?.label,
      desc: MARTECH_TIERS[mtTierKey]?.desc || "Core stack",
      pctOfRev: totalRevenue > 0 ? mtCost / totalRevenue * 100 : 0 },
    // LAYER 2: Elastic Infrastructure
    { name: "Revenue Engine Ops", amount: actualRevOps, floor: revOpsMinViable,
      formula: actualRevOps, isFloorBound: actualRevOps < revOpsMinViable,
      layer: "revEngineOps", layerType: 2,
      belowMinViable: actualRevOps < revOpsMinViable,
      desc: "Demand Gen, Lifecycle, Marketing Ops",
      pctOfRev: totalRevenue > 0 ? actualRevOps / totalRevenue * 100 : 0 },
    { name: "Brand & Content Production", amount: actualBrandContent, floor: contentMinViable,
      formula: actualBrandContent, isFloorBound: actualBrandContent < contentMinViable,
      layer: "brandContent", layerType: 2,
      belowMinViable: actualBrandContent < contentMinViable,
      desc: "Creative, content, web, design",
      pctOfRev: totalRevenue > 0 ? actualBrandContent / totalRevenue * 100 : 0 },
    { name: "PR / AR", amount: actualPrAr, floor: prArMinViable,
      formula: actualPrAr, isFloorBound: false,
      layer: "prAr", layerType: 2,
      belowMinViable: prArMinViable > 0 && actualPrAr < prArMinViable,
      desc: "AR relationships, agency retainer, thought leadership",
      pctOfRev: totalRevenue > 0 ? actualPrAr / totalRevenue * 100 : 0 },
  ];
  const fixedMktgActual = fixedMktgItems.reduce((s, fi) => s + fi.amount, 0);
  fixedMktgItems.forEach(fi => { fi.pct = fixedMktgActual > 0 ? Math.round(fi.amount / fixedMktgActual * 100) : 0; });

  // Layer summaries for UI
  const layer1Summary = { total: layer1Total, pctOfRev: totalRevenue > 0 ? layer1Total / totalRevenue * 100 : 0, label: "Structural Floors" };
  const layer2Summary = { total: actualRevOps + actualBrandContent + actualPrAr, pctOfRev: totalRevenue > 0 ? (actualRevOps + actualBrandContent + actualPrAr) / totalRevenue * 100 : 0, label: "Scalable Infrastructure" };

  // Tier tables for UI
  const tierTables = { EXEC_TIERS, PMM_TIERS, MARTECH_TIERS };

  // CAC variants
  const programmaticCAC = dealsNeeded > 0 ? totalMarketingSpend / dealsNeeded : 0; // channel spend only
  const martechLoadedCAC = dealsNeeded > 0 ? (totalMarketingSpend + martechSpend) / dealsNeeded : 0; // + martech
  const fullyBurdenedCAC = dealsNeeded > 0 ? totalMktgBudget / dealsNeeded : 0; // all marketing including fixed overhead
  const blendedAllInCAC = (dealsNeeded + expansionDeals) > 0 ? totalMktgBudget / (dealsNeeded + expansionDeals) : 0;

  // Total S&M (classic SaaS lens)
  const totalSAndM = salesOpex + totalMktgBudget;
  const totalSAndMPct = totalRevenue > 0 ? totalSAndM / totalRevenue * 100 : 0;
  const totalOpex = gAndA + rAndD + salesOpex + totalMktgBudget;

  // ── Behavioral view (how costs scale)
  // Fixed costs: G&A + R&D + fixed portion of sales + fixed marketing
  const fixedSalesComp = salesOpex * (1 - salesVariablePct / 100);
  const variableSalesComp = salesOpex * (salesVariablePct / 100);

  const totalFixedCosts = gAndA + rAndD + fixedSalesComp + fixedMktg;
  const totalVariableCosts = variableSalesComp + variableMktg;

  const operatingIncome = grossProfit - totalOpex;
  const opMargin = totalRevenue > 0 ? operatingIncome / totalRevenue : 0;

  const contributionMargin = grossProfit - totalVariableCosts;
  const contributionMarginPct = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;
  const breakEvenRevenue = contributionMarginPct > 0 ? totalFixedCosts / contributionMarginPct : 0;

  // ── S&M health flags
  const burnRisk = totalSAndMPct > (costBenchmarks?.burnRiskThreshold || 60);
  const underinvestRisk = totalSAndMPct < (costBenchmarks?.underinvestThreshold || 30);
  const sAndMHealth = burnRisk ? "burn_risk" : underinvestRisk ? "underinvest" : "healthy";

  // ── Benchmark deltas (show distance from benchmark, not good/bad)
  const benchDeltas = costBenchmarks ? Object.entries(costBenchmarks).filter(([k]) => k.endsWith("Pct")).map(([key, bench]) => {
    const actuals = { gAndAPct, rAndDPct, salesOpexPct, variableMktgPct, totalSAndMPct };
    const actual = actuals[key] || 0;
    return { key, label: bench.label, actual, benchLow: bench.low, benchMid: bench.mid, benchHigh: bench.high,
      delta: actual - bench.mid, deltaLabel: actual > bench.mid ? `+${(actual-bench.mid).toFixed(1)}%` : `${(actual-bench.mid).toFixed(1)}%`,
      position: actual < bench.low ? "below" : actual > bench.high ? "above" : "within" };
  }) : [];

  // ── Cost-per-SQO actual vs benchmark
  const actualCpSqo = totalMarketingSpend > 0 && sqosNeeded > 0 ? totalMarketingSpend / sqosNeeded : 0;
  const cpSqoRatio = cpSqoBenchmark > 0 ? actualCpSqo / cpSqoBenchmark : 0;

  // Unit economics
  const cacPayback = blendedCAC > 0 ? blendedCAC / (avgDealSize / 12) : 0;
  const ltv = churnRate > 0 ? avgDealSize / (churnRate / 100) : avgDealSize * 10;
  const ltvCac = blendedCAC > 0 ? ltv / blendedCAC : 0;
  const rule40 = growthRate + (opMargin * 100);
  const magicNumber = totalSAndM > 0 ? newARRNeeded / totalSAndM : 0;
  const burnMultiple = operatingIncome < 0 ? Math.abs(operatingIncome) / newARRNeeded : 0;

  // Glideslope (multi-year, seasonal target line)
  const glideslope = monthly.map((m,i) => {
    const yi = m.yearIndex;
    const mi12 = i % 12;
    const yt = yearTargets[yi];
    const seasonalTarget = yt.startARR + yt.newARRNeeded * cumWeights[mi12];
    const evenTarget = yt.startARR + (yt.newARRNeeded/12)*(mi12+1);
    return { ...m, targetARR: seasonalTarget, gapToTarget: m.totalARR - seasonalTarget, evenTarget };
  });

  // Multi-year quarterly labels (calendar-anchored)
  const allQuarters = [];
  for (let y = 0; y < numYears; y++) {
    for (let qi = 0; qi < 4; qi++) {
      const planMonthIdx = y * 12 + qi * 3;
      allQuarters.push({
        label: calQuarterLabel(planMonthIdx),
        shortLabel: numYears > 1 ? `Y${y+1} Q${qi+1}` : `Q${qi+1}`,
        yearIndex: y, quarterIndex: qi, globalQi: y * 4 + qi,
      });
    }
  }

  // QBR (multi-year)
  const qbrData = allQuarters.map(aq => {
    const qm = monthly.filter(m => m.yearIndex === aq.yearIndex && Math.floor((m.monthNum - 1 - aq.yearIndex * 12) / 3) === aq.quarterIndex);
    return { quarter: aq.label, yearIndex: aq.yearIndex, quarterIndex: aq.quarterIndex, globalQi: aq.globalQi,
      revenue:qm.reduce((s,m)=>s+m.monthlyRevenue,0), newARR:qm.reduce((s,m)=>s+m.monthlyTotalNewARR,0),
      newLogoARR:qm.reduce((s,m)=>s+m.newLogoARR,0), expansionARR:qm.reduce((s,m)=>s+m.expansionNewARR,0),
      deals:qm.reduce((s,m)=>s+m.monthlyDeals,0), inquiries:qm.reduce((s,m)=>s+m.monthlyInquiries,0),
      mqls:qm.reduce((s,m)=>s+m.monthlyMQLs,0), sqls:qm.reduce((s,m)=>s+m.monthlySQLs,0),
      meetings:qm.reduce((s,m)=>s+m.monthlyMeetings,0), sqos:qm.reduce((s,m)=>s+m.monthlySQOs,0),
      pipeline:qm.reduce((s,m)=>s+m.pipeline,0), capacity:qm.reduce((s,m)=>s+m.fullCapacity,0),
      stage1Pipe:qm.reduce((s,m)=>s+m.stage1Pipe,0), stage2Pipe:qm.reduce((s,m)=>s+m.stage2Pipe,0),
    };
  });

  // Weekly (Y1 only — operational cadence)
  let wCumInq=0, wCumSql=0, wCumSqo=0;
  const weeklySimplified = Array.from({length:52},(_,w) => {
    const mi = Math.min(11, Math.floor(w/4.33));
    const ww = monthWeights[mi] * 12 / 4.33;
    const wi=Math.round(inquiriesNeeded/52 * ww * 4.33), wm=Math.round(wi*(inquiryToMqlRate/100)), ws=Math.round(wm*(mqlToSqlRate/100));
    const wmtg=Math.round(ws*(sqlToMeetingRate/100)), wsqo=Math.round(wmtg*(meetingToSqoRate/100));
    wCumInq+=wi; wCumSql+=ws; wCumSqo+=wsqo;
    return { week:w+1, weekLabel:`W${w+1}`, month:calMonthLabel(mi), monthShort:MONTHS[mi],
      inquiries:wi, mqls:wm, sqls:ws, meetings:wmtg, sqos:wsqo, pipeline:wsqo*avgDealSize,
      cumulativeInquiries:wCumInq, cumulativeSQLs:wCumSql, cumulativeSQOs:wCumSqo };
  });

  const steadyStateQuota = aeCount*aeQuota;
  const attainmentRequired = steadyStateQuota>0 ? newARRNeeded/steadyStateQuota*100 : 0;

  // Quarterly seasonal weights
  const qWeights = [0,1,2,3].map(qi => {
    const qMonths = [qi*3, qi*3+1, qi*3+2];
    return qMonths.reduce((s,mi) => s + monthWeights[mi], 0);
  });

  // Quarterly targets (multi-year with pipeline targets)
  const quarterlyTargets = allQuarters.map(aq => {
    const yi = aq.yearIndex, qi = aq.quarterIndex;
    const yt = yearTargets[yi];
    const qTarget = yt.newARRNeeded * qWeights[qi];
    const qActual = qbrData[aq.globalQi].newARR;
    const qDeals = yt.dealsNeeded * qWeights[qi];
    const qSqos = Math.ceil(qDeals / (sqoToWonRate / 100));
    const qMktgSqos = Math.ceil(qSqos * mktgPct);
    const qAeSqos = qSqos - qMktgSqos;
    const qStage2Target = qSqos * avgDealSize;
    const qStage1Target = Math.ceil(qSqos / (meetingToSqoRate / 100)) * (avgDealSize * (stage1MinPct / 100));
    const qTotalPipeTarget = qStage2Target * (pipelineCoverage / 100);
    const qMktgPipeTarget = qMktgSqos * avgDealSize * (pipelineCoverage / 100);
    const qAePipeTarget = qAeSqos * avgDealSize * (pipelineCoverage / 100);
    const qStage2Actual = qbrData[aq.globalQi].stage2Pipe;
    const qStage1Actual = qbrData[aq.globalQi].stage1Pipe;
    const qCoverage = qTarget > 0 ? qbrData[aq.globalQi].pipeline / qTarget * 100 : 0;
    // Phase-shifted: what MQL gen in THIS quarter feeds
    const feedsCloseQi = aq.globalQi + (sqoLeadQuarters || 2) + (mqlLeadQuarters || 1);
    const feedsQ = feedsCloseQi < allQuarters.length ? allQuarters[feedsCloseQi] : null;
    const feedsLabel = feedsQ ? feedsQ.label : "Beyond horizon";
    return { quarter: aq.label, yearIndex: yi, quarterIndex: qi, globalQi: aq.globalQi,
      target: qTarget, actual: qActual, gap: qActual - qTarget,
      pctOfTarget: qTarget>0?(qActual/qTarget*100):0, seasonalPct: (qWeights[qi]*100).toFixed(0),
      pipeTarget: qTotalPipeTarget, mktgPipeTarget: qMktgPipeTarget, aePipeTarget: qAePipeTarget,
      stage2Target: qStage2Target, stage1Target: qStage1Target,
      stage2Actual: qStage2Actual, stage1Actual: qStage1Actual,
      sqoTarget: qSqos, mktgSqoTarget: qMktgSqos, aeSqoTarget: qAeSqos,
      coverageActual: qCoverage, dealsTarget: Math.round(qDeals),
      feedsCloseIn: feedsLabel, yearLabel: `Y${yi+1}`,
    };
  });

  // Phase-shifted funnel (multi-year: all quarters in planning horizon)
  const phaseShiftedFunnel = allQuarters.map(aq => {
    const yi = aq.yearIndex, qi = aq.quarterIndex;
    const yt = yearTargets[yi];
    const qw = qWeights[qi];
    const closingDeals = yt.dealsNeeded * qw;
    // SQOs needed for deals closing sqoLead quarters later
    const sqoTargetGqi = aq.globalQi + sqoLead;
    let sqoForDeals = 0;
    if (sqoTargetGqi < allQuarters.length) {
      const tgtAq = allQuarters[sqoTargetGqi];
      sqoForDeals = yearTargets[tgtAq.yearIndex].dealsNeeded * qWeights[tgtAq.quarterIndex];
    }
    const sqosForQ = sqoForDeals > 0 ? Math.ceil(sqoForDeals / (sqoToWonRate / 100)) : 0;
    const mktgSqosForQ = Math.ceil(sqosForQ * mktgPct);
    // MQLs needed for SQOs mqlLead quarters later
    const mqlTargetGqi = aq.globalQi + mqlLead;
    let mqlForSqos = 0;
    if (mqlTargetGqi < allQuarters.length) {
      const mqlSqoGqi = mqlTargetGqi + sqoLead;
      if (mqlSqoGqi < allQuarters.length) {
        const tgtAq2 = allQuarters[mqlSqoGqi];
        mqlForSqos = yearTargets[tgtAq2.yearIndex].dealsNeeded * qWeights[tgtAq2.quarterIndex];
      }
    }
    const sqosForMql = mqlForSqos > 0 ? Math.ceil(mqlForSqos / (sqoToWonRate / 100)) : 0;
    const mktgSqosForMql = Math.ceil(sqosForMql * mktgPct);
    const mqlsForQ = mktgSqosForMql > 0 ? Math.ceil(mktgSqosForMql / (meetingToSqoRate / 100) / (sqlToMeetingRate / 100) / (mqlToSqlRate / 100)) : 0;
    return {
      quarter: aq.label, globalQi: aq.globalQi, yearIndex: yi,
      closingDeals: Math.round(closingDeals),
      sqosNeeded: sqosForQ, mktgSqos: mktgSqosForQ, aeSqos: sqosForQ - mktgSqosForQ,
      mqlsNeeded: mqlsForQ, isCurrentYear: yi === 0,
    };
  }).filter(q => q.closingDeals > 0 || q.sqosNeeded > 0 || q.mqlsNeeded > 0);

  // ── INVERSE MARKETING PLAN (Kellogg-style waterfall) ────────────────
  // Take target ARR → derive required inputs at each stage. Run sensitivity
  // analysis showing how a ±5pp shift in any single conversion rate changes
  // the inquiry requirement at the top of the funnel. Built as a dedicated
  // shape for the Marketing Plan view, distinct from the existing
  // phaseShiftedFunnel which serves CRO View's quarterly coverage.
  const inverseMarketingPlan = (() => {
    function recomputeFunnel(rates) {
      const sqos = dealsNeeded > 0 ? Math.ceil(dealsNeeded / (rates.sqoToWonRate / 100)) : 0;
      const meet = sqos > 0 ? Math.ceil(sqos / (rates.meetingToSqoRate / 100)) : 0;
      const sqls = meet > 0 ? Math.ceil(meet / (rates.sqlToMeetingRate / 100)) : 0;
      const mqls = sqls > 0 ? Math.ceil(sqls / (rates.mqlToSqlRate / 100)) : 0;
      const inq  = mqls > 0 ? Math.ceil(mqls / (rates.inquiryToMqlRate / 100)) : 0;
      return { sqos, meetings: meet, sqls, mqls, inquiries: inq };
    }

    const baseRates = { inquiryToMqlRate, mqlToSqlRate, sqlToMeetingRate, meetingToSqoRate, sqoToWonRate };
    const base = recomputeFunnel(baseRates);

    // Waterfall stages — top-down for visual rendering (Inquiry → Won)
    const stages = [
      { key: "inquiry", label: "Inquiries", count: base.inquiries, conversion: inquiryToMqlRate, conversionLabel: "Inquiry → MQL", owner: "Marketing", description: "Raw top-of-funnel — captured leads, all sources" },
      { key: "mql",     label: "MQLs",      count: base.mqls,      conversion: mqlToSqlRate,    conversionLabel: "MQL → SQL",     owner: "Marketing → BDR", description: "Fit + behavior signal — marketing-qualified" },
      { key: "sql",     label: "SQLs",      count: base.sqls,      conversion: sqlToMeetingRate, conversionLabel: "SQL → Meeting", owner: "BDR / SDR",        description: "Intent confirmed — BDR-qualified, meeting candidate" },
      { key: "meeting", label: "Meetings",  count: base.meetings,  conversion: meetingToSqoRate, conversionLabel: "Meeting → SQO", owner: "AE / SDR",         description: "Held discovery — fit + need confirmed in conversation" },
      { key: "sqo",     label: "SQOs",      count: base.sqos,      conversion: sqoToWonRate,    conversionLabel: "SQO → Won",     owner: "AE close",         description: "Pipeline-stage opportunity — accepted by sales" },
      { key: "won",     label: "Wins",      count: dealsNeeded,    conversion: null,             conversionLabel: null,            owner: "AE close",         description: `${dealsNeeded} deals × $${(avgDealSize/1000).toFixed(0)}K = $${(newARRNeeded/1e6).toFixed(1)}M new ARR` },
    ];

    // Sensitivity — ±5pp on each conversion rate, impact on required inquiries at top
    const sensitivities = [
      { key: "sqoToWonRate",    label: "SQO → Won",     baseRate: sqoToWonRate },
      { key: "meetingToSqoRate", label: "Meeting → SQO", baseRate: meetingToSqoRate },
      { key: "sqlToMeetingRate", label: "SQL → Meeting", baseRate: sqlToMeetingRate },
      { key: "mqlToSqlRate",    label: "MQL → SQL",     baseRate: mqlToSqlRate },
      { key: "inquiryToMqlRate", label: "Inquiry → MQL", baseRate: inquiryToMqlRate },
    ].map(s => {
      const minus5 = { ...baseRates, [s.key]: Math.max(1, s.baseRate - 5) };
      const plus5  = { ...baseRates, [s.key]: Math.min(99, s.baseRate + 5) };
      const m5 = recomputeFunnel(minus5);
      const p5 = recomputeFunnel(plus5);
      return {
        stage: s.label,
        baseRate: s.baseRate,
        // POSITIVE means MORE inquiries needed (worse outcome)
        impactMinus5pp: m5.inquiries - base.inquiries,
        impactPlus5pp:  p5.inquiries - base.inquiries,
        minus5Inquiries: m5.inquiries,
        plus5Inquiries:  p5.inquiries,
      };
    });

    // Quarterly distribution — apply seasonal weights across all quarters in horizon
    const quarterly = allQuarters.map(aq => {
      const yt = yearTargets[aq.yearIndex];
      const qShare = qWeights[aq.quarterIndex];
      const qDeals = Math.round(yt.dealsNeeded * qShare);
      const qSqos = Math.round(yt.sqosNeeded * qShare);
      // Re-derive earlier stages from quarter's SQO requirement
      const qMeet = qSqos > 0 ? Math.ceil(qSqos / (meetingToSqoRate / 100)) : 0;
      const qSqls = qMeet > 0 ? Math.ceil(qMeet / (sqlToMeetingRate / 100)) : 0;
      const qMqls = qSqls > 0 ? Math.ceil(qSqls / (mqlToSqlRate / 100)) : 0;
      const qInq  = qMqls > 0 ? Math.ceil(qMqls / (inquiryToMqlRate / 100)) : 0;
      return {
        quarter: aq.label, yearIndex: aq.yearIndex, quarterIndex: aq.quarterIndex,
        globalQi: aq.globalQi, isCurrentYear: aq.yearIndex === 0,
        seasonalPct: (qShare * 100).toFixed(0),
        wins: qDeals, sqos: qSqos, meetings: qMeet, sqls: qSqls, mqls: qMqls, inquiries: qInq,
      };
    });

    return {
      stages,         // top-down waterfall
      sensitivities,  // ±5pp impact per stage
      quarterly,      // per-quarter distribution
      base,           // headline totals
      inputs: {
        targetARR, startingARR, retainedARR, newARRNeeded, dealsNeeded,
        avgDealSize, numYears,
        rates: baseRates,
      },
    };
  })();


  // ── Time-horizon planner (workstream F) ────────────────────────────
  // The engine BACK-SOLVES from targetARR — so projected ARR always matches
  // the target by design. This planner asks a different question: given the
  // user's targetARR + targetDate, can the CURRENT BENCH actually produce
  // that velocity? It's a feasibility check on capacity, not a forecast.
  let horizonPlanner = null;
  if (inputs.targetDate) {
    const tdYearStr = inputs.targetDate.split('-')[0];
    const tdMonthStr = inputs.targetDate.split('-')[1];
    const tdYear = parseInt(tdYearStr, 10);
    const tdMonth = parseInt(tdMonthStr, 10) - 1;
    const monthsToTarget = (tdYear - startYear) * 12 + (tdMonth - startMonthIdx);
    if (monthsToTarget > 0 && monthsToTarget <= totalMonths) {
      const horizonTarget = targetARR;
      const newARRRequired = Math.max(0, horizonTarget - retainedARR);
      const velocityRequired = newARRRequired / monthsToTarget; // $/month
      // What the current bench CAN produce (independent of target):
      const realisticAttainment = (realisticAeAttainment || 75) / 100; // single source of truth: user-set realistic attainment (matches aeHiringPlan); 0 falls back to 75
      const aeMonthlyCapacity = (aeCount * aeQuota * realisticAttainment) / 12;
      const horizonAchievable = aeMonthlyCapacity * monthsToTarget;
      const cumulativeGap = newARRRequired - horizonAchievable;
      const monthlyGap = velocityRequired - aeMonthlyCapacity;
      const onTrackPct = velocityRequired > 0 ? (aeMonthlyCapacity / velocityRequired) * 100 : 100;
      const verdict = onTrackPct >= 100 ? "achievable" :
                      onTrackPct >= 85  ? "stretch" :
                      onTrackPct >= 65  ? "behind" : "unrealistic";

      // Lever ladder — what minimum change to ONE lever closes the cumulative gap?
      // Only computed when cumulativeGap > 0.
      let levers = null;
      if (cumulativeGap > 0) {
        // Lever 1: AE count (how many MORE AEs make achievable = required)
        const aesNeeded = Math.ceil((velocityRequired * 12) / (aeQuota * realisticAttainment));
        const aeGap = Math.max(0, aesNeeded - aeCount);
        // Lever 2: Deal size lift (a higher avgDealSize multiplies AE output linearly)
        const liftMultiplier = aeMonthlyCapacity > 0 ? velocityRequired / aeMonthlyCapacity : null;
        const dealSizeLiftPct = liftMultiplier !== null ? (liftMultiplier - 1) * 100 : null;
        const dealSizeNeeded = liftMultiplier !== null ? avgDealSize * liftMultiplier : null;
        // Lever 3: Attainment % (raising team-wide attainment scales output linearly)
        const attainmentNeeded = aeMonthlyCapacity > 0 ? realisticAttainment * (velocityRequired / aeMonthlyCapacity) * 100 : null;
        // Lever 4: Mktg/inquiry volume — same linear scaling, but expressed as inquiry-volume increase
        const inquiryLiftPct = dealSizeLiftPct;
        levers = {
          ae: { current: aeCount, needed: aesNeeded, gap: aeGap, label: "+AEs" },
          dealSize: { current: avgDealSize, needed: dealSizeNeeded, liftPct: dealSizeLiftPct, label: "+Deal size" },
          attainment: { current: realisticAttainment * 100, needed: attainmentNeeded, label: "+Attainment" },
          inquiryVolume: { liftPct: inquiryLiftPct, label: "+Inquiry volume" },
        };
      }

      horizonPlanner = {
        targetDate: inputs.targetDate,
        monthsToTarget,
        horizonTarget,
        newARRRequired,
        velocityRequired,
        aeMonthlyCapacity,
        horizonAchievable,
        cumulativeGap,
        monthlyGap,
        onTrackPct,
        verdict,
        realisticAttainment: realisticAttainment * 100,
        levers,
      };
    } else if (monthsToTarget <= 0) {
      horizonPlanner = { error: "target_in_past", monthsToTarget };
    } else {
      horizonPlanner = { error: "target_beyond_horizon", monthsToTarget, plannedMonths: totalMonths };
    }
  }

    return {
    summary: { targetARR, startingARR, retainedARR, newARRNeeded, dealsNeeded,
      sqosNeeded, meetingsNeeded, sqlsNeeded, mqlsNeeded, inquiriesNeeded,
      pipelineRequired, totalRevenue, grossProfit, operatingIncome, totalMarketingSpend,
      blendedCAC, fullyLoadedCAC, cacPayback, ltv, ltvCac, rule40, magicNumber, burnMultiple, growthRate, opMargin,
      attainmentRequired, steadyStateQuota, totalRampLoss, effectiveFunnelYield,
      // Compression metrics (Engine Output)
      inquiryToSqoRate, inquiryToWonRate,
      costPerSqo: sqosNeeded > 0 ? totalMarketingSpend / sqosNeeded : 0,
      costPerWon: dealsNeeded > 0 ? totalMarketingSpend / dealsNeeded : 0,
      requiredInquiries: inquiriesNeeded,
      // Meeting held/set tracking
      meetingShowRate, sqlToMeetingSetRate, meetingsSetNeeded, mktgMeetingsSetNeeded,
      stage1MinAmount, stage1Pipeline, stage2Pipeline, totalCycleDays, velocityPerDay,
      coverageHealth, totalAcquisitionCost,
      newLogoARR, expansionARR, expansionDeals, expansionSQOs,
      // New cost model
      totalFixedCosts, totalVariableCosts, totalOpex,
      gAndA, rAndD, salesOpex, totalMktgBudget, fixedMktg, variableMktg,
      fixedSalesComp, variableSalesComp,
      totalSAndM, totalSAndMPct, sAndMHealth, burnRisk, underinvestRisk,
      actualCpSqo, cpSqoRatio,
      contributionMargin, contributionMarginPct, breakEvenRevenue,
      funnelGrade, overallFunnelScore, maxFunnelScore,
      // Marketing budget decomposition
      martechSpend, programmaticBudget, fixedMktgItems, fixedMktgActual, layer1Summary, layer2Summary, tierTables, formulaFixedMktg,
      programmaticCAC, martechLoadedCAC, fullyBurdenedCAC, blendedAllInCAC,
      // Fixed marketing floor
      fixedMktgIsFloorBound, effectiveFixedMktgPct, mktgHeadcountFloor, floorTotal, floorPctOfRev,
      // Sales budget
      salesBudgetItems, salesBudgetActual, salesIsFloorBound, salesFloorDelta, salesHeadcountFloor,
      totalSalesFixedComp, totalSalesVariableComp, aeCompFloor, sdrCompFloor, seCompFloor,
      aeCount, sdrCount, seCount, aeFullyLoaded, sdrFullyLoaded, seFullyLoaded,
      // Leadership layer
      leadershipDetail, activeLeadership, totalLeadershipCost, leadershipPctOfRev,
      leadershipInSales, leadershipInMktg, leadershipInGA, leadershipInRD,
      fundingStage: stage, compTable, loadFactor,
      // Marketing-sourced split
      mktgSQOs, aeSelfSourcedSQOs, mktgMeetingsNeeded, mktgSqlsNeeded, mktgMqlsNeeded, mktgInquiriesNeeded, mktgPct,
      // Attrition
      totalAttrLoss,
    },
    monthly, channels, sellerRamp, stages, yearTargets, numYears, horizonPlanner, inverseMarketingPlan,
    aeHiringPlan, aeHiringSummary,
    // Revenue Motions
    motions: {
      allocation: ma, createBudget, convertBudget, accelBudget,
      create: { channels: createChannels, totals: createTotals },
      convert: { channels: convertChannels, totals: convertTotals },
      accelerate: { channels: accelChannels, totals: accelTotals },
    },
    pnl: { totalRevenue, grossProfit, grossMargin, cogsAmount,
      gAndA, rAndD, salesOpex, totalMktgBudget, fixedMktg, variableMktg,
      fixedSalesComp, variableSalesComp,
      totalSAndM, totalSAndMPct, totalOpex,
      totalFixedCosts, totalVariableCosts,
      operatingIncome, opMargin, contributionMargin, contributionMarginPct, breakEvenRevenue,
      sAndMHealth, burnRisk, underinvestRisk, benchDeltas, actualCpSqo, cpSqoRatio,
      martechSpend, programmaticBudget, fixedMktgItems, fixedMktgActual, layer1Summary, layer2Summary, tierTables, formulaFixedMktg,
      programmaticCAC, martechLoadedCAC, fullyBurdenedCAC, blendedAllInCAC,
      fixedMktgIsFloorBound, effectiveFixedMktgPct, mktgHeadcountFloor, floorTotal, floorPctOfRev,
      salesBudgetItems, salesBudgetActual, salesIsFloorBound, salesFloorDelta, salesHeadcountFloor,
      totalSalesFixedComp, totalSalesVariableComp, aeCompFloor, sdrCompFloor, seCompFloor,
      aeCount: inputs.aeCount, sdrCount, seCount, aeFullyLoaded, sdrFullyLoaded, seFullyLoaded,
      leadershipDetail, activeLeadership, totalLeadershipCost, leadershipPctOfRev,
      leadershipInSales, leadershipInMktg, leadershipInGA, leadershipInRD,
      fundingStage: stage, compTable, loadFactor },
    glideslope, qbrData, weeklySimplified, velocityStages, quarterlyTargets,
    funnelHealth, cacBreakdown, monthWeights, seasonalityMode, phaseShiftedFunnel,
  };
}
