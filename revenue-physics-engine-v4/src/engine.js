// ─── Revenue Physics Engine ─── Core Calculation Model ───
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
  // Fixed marketing itemization (% of fixed marketing budget)
  fixedMktgBreakdown: {
    leadership: 30,         // VP/Dir Marketing, CMO allocation
    revops: 20,             // RevOps / MOps headcount
    contentStaff: 25,       // Brand, content, design staff
    baselineTools: 25,      // CRM/MAP/analytics licenses (non-scaling baseline)
  },

  // CAC benchmarks
  cpSqoBenchmark: 12000,    // Cost per SQO benchmark (mid-market cyber $8K-15K)
  cacPaybackTarget: 24,     // Target CAC payback months (enterprise cyber 18-30)

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
  channelMix: { "Paid Search":25, "Content/SEO":20, "Events":15, "ABM":20, "Partner":10, "Outbound":10 },
  channelCPL: { "Paid Search":150, "Content/SEO":45, "Events":300, "ABM":200, "Partner":80, "Outbound":120 },
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

export function computeModel(inputs) {
  const {
    targetMode, targetARR: inputTargetARR, startingARR, targetGrowthRate,
    planningYears, y2GrowthRate, y2ConversionLift,
    avgDealSize,
    inquiryToMqlRate, mqlToSqlRate, sqlToMeetingRate, meetingToSqoRate, sqoToWonRate,
    channelMix, channelCPL, aeCount, aeRampMonths, aeQuota, sdrsPerAe,
    aeAttritionRate, mktgSourcedPct, sqoLeadQuarters, mqlLeadQuarters,
    grossMargin, gAndAPct, rAndDPct, salesOpexPct, variableMktgPct,
    salesVariablePct, fixedMktgPct, martechPctOfVariable, fixedMktgBreakdown,
    cpSqoBenchmark, cacPaybackTarget, costBenchmarks,
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
    { stage: "Inquiry→MQL", rate: inquiryToMqlRate, status: scoreFunnel(inquiryToMqlRate, funnelBenchmarks.inquiryToMqlRate), bench: funnelBenchmarks.inquiryToMqlRate },
    { stage: "MQL→SQL", rate: mqlToSqlRate, status: scoreFunnel(mqlToSqlRate, funnelBenchmarks.mqlToSqlRate), bench: funnelBenchmarks.mqlToSqlRate },
    { stage: "SQL→Meeting", rate: sqlToMeetingRate, status: scoreFunnel(sqlToMeetingRate, funnelBenchmarks.sqlToMeetingRate), bench: funnelBenchmarks.sqlToMeetingRate },
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
  const MONTH_LABELS = Array.from({length: totalMonths}, (_, i) => {
    const yi = Math.floor(i / 12);
    return yi === 0 ? MONTHS[i % 12] : `${MONTHS[i % 12]} Y${yi + 1}`;
  });

  // Per-year targets
  const yearTargets = [];
  let yrStartARR = retainedARR;
  let yrTargetARR = targetARR;
  for (let y = 0; y < numYears; y++) {
    if (y === 0) {
      yrStartARR = retainedARR;
      yrTargetARR = targetARR;
    } else {
      // Y2+ starts from prior year's exit ARR, grows by y2GrowthRate
      yrStartARR = yearTargets[y-1].exitARR;
      const yGrowth = y2GrowthRate || 60;
      yrTargetARR = yrStartARR * (1 + yGrowth / 100);
    }
    const yrNewARRNeeded = Math.max(0, yrTargetARR - yrStartARR);
    const yrDeals = Math.ceil(yrNewARRNeeded / avgDealSize);
    const convLift = y > 0 ? (y2ConversionLift || 0) / 100 : 0;
    const yrSqoWon = Math.min(95, sqoToWonRate + convLift * 100);
    const yrSqos = Math.ceil(yrDeals / (yrSqoWon / 100));
    yearTargets.push({
      year: y + 1, label: `Y${y + 1}`,
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
      quarter: QUARTERS[Math.floor(mi12/3)], quarterLabel: `${yi===0?"":"Y"+(yi+1)+" "}${QUARTERS[Math.floor(mi12/3)]}`,
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

  // ── Channels with CAC decomposition (marketing-sourced pipeline only)
  const channels = Object.entries(channelMix).map(([name, pct]) => {
    const inq = Math.round(mktgInquiriesNeeded * (pct / 100)); // only mktg-sourced inquiries
    const cpl = channelCPL[name] || 100;
    const spend = inq * cpl;
    const mqls = Math.round(inq * (inquiryToMqlRate / 100));
    const sqls = Math.round(mqls * (mqlToSqlRate / 100));
    const mtgs = Math.round(sqls * (sqlToMeetingRate / 100));
    const sqos = Math.round(mtgs * (meetingToSqoRate / 100));
    const deals = Math.round(sqos * (sqoToWonRate / 100));
    const rev = deals * avgDealSize;
    const cac = deals > 0 ? spend / deals : 0;
    const costPerMql = mqls > 0 ? spend / mqls : 0;
    const costPerSql = sqls > 0 ? spend / sqls : 0;
    const costPerSqo = sqos > 0 ? spend / sqos : 0;
    const costPerMeeting = mtgs > 0 ? spend / mtgs : 0;
    return { name, pct, channelInquiries: inq, cpl, spend, mqls, sqls, meetings: mtgs, sqos, deals, revenue: rev,
      roi: spend > 0 ? rev / spend : 0, cac, costPerMql, costPerSql, costPerSqo, costPerMeeting,
      cacPayback: cac > 0 ? cac / (avgDealSize / 12) : 0,
      ltvCac: cac > 0 ? (churnRate > 0 ? avgDealSize / (churnRate / 100) : avgDealSize * 10) / cac : 0,
    };
  });
  const totalMarketingSpend = channels.reduce((s,c) => s + c.spend, 0);

  // ── CAC Breakdown (programmatic)
  const blendedCAC = dealsNeeded > 0 ? totalMarketingSpend / dealsNeeded : 0;
  const totalDealsAllMotions = dealsNeeded + expansionDeals;
  const fullyLoadedCAC = totalDealsAllMotions > 0 ? totalMarketingSpend / totalDealsAllMotions : 0;
  const programmaticChannels = ["Paid Search", "ABM"];
  const contentChannels = ["Content/SEO"];
  const eventChannels = ["Events"];
  const outboundChannels = ["Outbound", "Partner"];
  const sumSpend = (names) => channels.filter(c => names.includes(c.name)).reduce((s,c) => s + c.spend, 0);
  const cacBreakdown = {
    programmatic: { spend: sumSpend(programmaticChannels), label: "Programmatic (Paid + ABM)" },
    content: { spend: sumSpend(contentChannels), label: "Content & SEO" },
    events: { spend: sumSpend(eventChannels), label: "Events & Field" },
    outbound: { spend: sumSpend(outboundChannels), label: "Outbound & Partner" },
    sdrCost: { spend: aeCount * sdrsPerAe * 85000, label: "SDR Fully Loaded" },
  };
  const totalAcquisitionCost = Object.values(cacBreakdown).reduce((s,c) => s + c.spend, 0);
  Object.values(cacBreakdown).forEach(c => {
    c.pctOfTotal = totalAcquisitionCost > 0 ? c.spend / totalAcquisitionCost * 100 : 0;
    c.perDeal = dealsNeeded > 0 ? c.spend / dealsNeeded : 0;
  });

  // Seller ramp with attrition
  const sellerRamp = MONTHS.map((m, i) => {
    const mn = i+1, rp = Math.min(1, mn/Math.max(1,aeRampMonths));
    // Attrition reduces effective headcount over time (cumulative loss)
    const attrFactor = Math.pow(1 - monthlyAttrRate, mn);
    const effectiveAEs = aeCount * attrFactor;
    const raes = Math.round(effectiveAEs * rp * 10) / 10;
    const eq = (aeQuota/12)*rp, tc = raes*(aeQuota/12), fq = aeCount*(aeQuota/12);
    const attrLoss = (aeCount - effectiveAEs) * (aeQuota/12);
    return { month:m, monthNum:mn, rampPct:rp, effectiveQuota:eq, totalCapacity:tc, fullQuota:fq,
      capacityLoss:fq-tc, effectiveAEs: Math.round(effectiveAEs*10)/10, attrFactor, attrLoss };
  });
  const totalRampLoss = sellerRamp.reduce((s,r) => s + r.capacityLoss, 0);
  const totalAttrLoss = sellerRamp.reduce((s,r) => s + r.attrLoss, 0);

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

  // Marketing: total = variable demand gen + fixed marketing overhead
  // Variable marketing is a % of revenue; fixed marketing is a % of total mktg budget
  // We solve: totalMktg = variableMktg / (1 - fixedMktgPct/100)
  const variableMktg = totalRevenue * (variableMktgPct / 100);
  const formulaFixedMktg = fixedMktgPct > 0 ? variableMktg / (1 - fixedMktgPct / 100) - variableMktg : 0;

  // ── Fixed Marketing Floor: headcount-based minimum
  // VP Marketing comp is a step function, not a curve.
  // At $3M ARR the VP alone is 13% of revenue; at $40M it's 1%.
  // Model the actual cost floor based on team composition at each stage.
  const mktgLeadershipComp = 425000;  // VP Mktg all-in (OTE $350K + benefits + equity ~$75K)
  const revopsComp = 165000;           // RevOps/MOps hire (fully loaded)
  const contentComp = 135000;          // Content/brand person (fully loaded)
  const baselineTooling = 85000;       // CRM/MAP/analytics baseline licenses

  // Team scales with ARR: minimum viable at every stage
  // <$5M: VP + fractional ops + baseline tools
  // $5-15M: VP + RevOps + content + tools
  // $15-30M: VP + 2 RevOps + 2 content + Sr tools
  // $30M+: VP + Dir + 3 RevOps + 3 content + full stack
  const arrForScale = targetARR;
  let mktgHeadcountFloor;
  if (arrForScale < 5000000) {
    mktgHeadcountFloor = {
      label: "Seed/Early ($0-5M)",
      leadership: mktgLeadershipComp,
      revops: revopsComp * 0.5,    // fractional / part-time
      content: contentComp * 0.5,   // fractional
      tools: baselineTooling * 0.7, // starter stack
    };
  } else if (arrForScale < 15000000) {
    mktgHeadcountFloor = {
      label: "Growth ($5-15M)",
      leadership: mktgLeadershipComp,
      revops: revopsComp,
      content: contentComp,
      tools: baselineTooling,
    };
  } else if (arrForScale < 30000000) {
    mktgHeadcountFloor = {
      label: "Scale ($15-30M)",
      leadership: mktgLeadershipComp + 180000, // + Dir
      revops: revopsComp * 2,
      content: contentComp * 2,
      tools: baselineTooling * 1.5,
    };
  } else {
    mktgHeadcountFloor = {
      label: "Enterprise ($30M+)",
      leadership: mktgLeadershipComp + 180000 + 150000, // VP + Dir + Mgr
      revops: revopsComp * 3,
      content: contentComp * 3,
      tools: baselineTooling * 2.5,
    };
  }
  const floorTotal = mktgHeadcountFloor.leadership + mktgHeadcountFloor.revops + mktgHeadcountFloor.content + mktgHeadcountFloor.tools;
  const floorPctOfRev = totalRevenue > 0 ? floorTotal / totalRevenue * 100 : 0;

  // Use the HIGHER of formula-based or floor-based fixed marketing
  const fixedMktg = Math.max(formulaFixedMktg, floorTotal);
  const fixedMktgIsFloorBound = floorTotal > formulaFixedMktg;
  const effectiveFixedMktgPct = (variableMktg + fixedMktg) > 0 ? fixedMktg / (variableMktg + fixedMktg) * 100 : 0;
  const totalMktgBudget = variableMktg + fixedMktg;

  // ── Marketing Budget Decomposition
  // Variable marketing splits: programmatic (channel spend) vs martech
  const martechPct = (martechPctOfVariable || 25) / 100;
  const martechSpend = variableMktg * martechPct;           // intent data, enrichment, MAP overage, syndication
  const programmaticBudget = variableMktg * (1 - martechPct); // paid media, events, content syndication — what flows through channels

  // Fixed marketing itemization — uses actual headcount floor when floor-bound
  const fmb = fixedMktgBreakdown || { leadership: 30, revops: 20, contentStaff: 25, baselineTools: 25 };
  const fixedMktgItems = fixedMktgIsFloorBound ? [
    { name: "Marketing Leadership", pct: Math.round(mktgHeadcountFloor.leadership / fixedMktg * 100), amount: mktgHeadcountFloor.leadership, desc: "VP/Dir Mktg (step function — doesn't scale with ARR)" },
    { name: "RevOps / MOps", pct: Math.round(mktgHeadcountFloor.revops / fixedMktg * 100), amount: mktgHeadcountFloor.revops, desc: "Ops headcount, analytics" },
    { name: "Content & Brand Staff", pct: Math.round(mktgHeadcountFloor.content / fixedMktg * 100), amount: mktgHeadcountFloor.content, desc: "Writers, designers, brand" },
    { name: "Baseline Tooling", pct: Math.round(mktgHeadcountFloor.tools / fixedMktg * 100), amount: mktgHeadcountFloor.tools, desc: "CRM/MAP/analytics licenses" },
  ] : [
    { name: "Marketing Leadership", pct: fmb.leadership, amount: fixedMktg * (fmb.leadership / 100), desc: "VP/Dir Mktg, CMO allocation" },
    { name: "RevOps / MOps", pct: fmb.revops, amount: fixedMktg * (fmb.revops / 100), desc: "Ops headcount, analytics" },
    { name: "Content & Brand Staff", pct: fmb.contentStaff, amount: fixedMktg * (fmb.contentStaff / 100), desc: "Writers, designers, brand" },
    { name: "Baseline Tooling", pct: fmb.baselineTools, amount: fixedMktg * (fmb.baselineTools / 100), desc: "CRM/MAP/analytics licenses" },
  ];

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

  // Multi-year quarterly labels
  const allQuarters = [];
  for (let y = 0; y < numYears; y++) {
    QUARTERS.forEach((q, qi) => allQuarters.push({
      label: numYears > 1 ? `Y${y+1} ${q}` : q,
      yearIndex: y, quarterIndex: qi, globalQi: y * 4 + qi,
    }));
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
    return { week:w+1, weekLabel:`W${w+1}`, month:MONTHS[mi],
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

  return {
    summary: { targetARR, startingARR, retainedARR, newARRNeeded, dealsNeeded,
      sqosNeeded, meetingsNeeded, sqlsNeeded, mqlsNeeded, inquiriesNeeded,
      pipelineRequired, totalRevenue, grossProfit, operatingIncome, totalMarketingSpend,
      blendedCAC, fullyLoadedCAC, cacPayback, ltv, ltvCac, rule40, magicNumber, burnMultiple, growthRate, opMargin,
      attainmentRequired, steadyStateQuota, totalRampLoss, effectiveFunnelYield,
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
      martechSpend, programmaticBudget, fixedMktgItems,
      programmaticCAC, martechLoadedCAC, fullyBurdenedCAC, blendedAllInCAC,
      // Fixed marketing floor
      fixedMktgIsFloorBound, effectiveFixedMktgPct, mktgHeadcountFloor, floorTotal, floorPctOfRev,
      // Marketing-sourced split
      mktgSQOs, aeSelfSourcedSQOs, mktgMeetingsNeeded, mktgSqlsNeeded, mktgMqlsNeeded, mktgInquiriesNeeded, mktgPct,
      // Attrition
      totalAttrLoss,
    },
    monthly, channels, sellerRamp, stages, yearTargets, numYears,
    pnl: { totalRevenue, grossProfit, grossMargin, cogsAmount,
      gAndA, rAndD, salesOpex, totalMktgBudget, fixedMktg, variableMktg,
      fixedSalesComp, variableSalesComp,
      totalSAndM, totalSAndMPct, totalOpex,
      totalFixedCosts, totalVariableCosts,
      operatingIncome, opMargin, contributionMargin, contributionMarginPct, breakEvenRevenue,
      sAndMHealth, burnRisk, underinvestRisk, benchDeltas, actualCpSqo, cpSqoRatio,
      martechSpend, programmaticBudget, fixedMktgItems,
      programmaticCAC, martechLoadedCAC, fullyBurdenedCAC, blendedAllInCAC,
      fixedMktgIsFloorBound, effectiveFixedMktgPct, mktgHeadcountFloor, floorTotal, floorPctOfRev },
    glideslope, qbrData, weeklySimplified, velocityStages, quarterlyTargets,
    funnelHealth, cacBreakdown, monthWeights, seasonalityMode, phaseShiftedFunnel,
  };
}
