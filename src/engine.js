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
  // P&L — now with fixed/variable split
  grossMargin: 78, sAndMPercent: 45, rAndDPercent: 25, gAndAPercent: 12,
  fixedCostBase: 2000000, // annual fixed costs (rent, base salaries, infra)
  variableCostPct: 65,    // % of total opex that is variable (commissions, usage, contractors)
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
    avgDealSize,
    inquiryToMqlRate, mqlToSqlRate, sqlToMeetingRate, meetingToSqoRate, sqoToWonRate,
    channelMix, channelCPL, aeCount, aeRampMonths, aeQuota, sdrsPerAe,
    aeAttritionRate, mktgSourcedPct, sqoLeadQuarters, mqlLeadQuarters,
    grossMargin, sAndMPercent, rAndDPercent, gAndAPercent,
    fixedCostBase, variableCostPct,
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

  // ── Phase-shifted funnel (pipeline lead time)
  // SQOs needed N quarters before deals close; MQLs needed M quarters before SQOs created
  // This creates a timeline showing WHEN pipeline activities must happen
  const sqoLead = sqoLeadQuarters || 2;
  const mqlLead = mqlLeadQuarters || 1;
  const totalLeadQuarters = sqoLead + mqlLead; // total lead from MQL gen to close

  // Quarterly deal targets (seasonal)
  const qDealTargets = [0,1,2,3].map(qi => {
    const qw = [qi*3, qi*3+1, qi*3+2].reduce((s,mi) => s + monthWeights[mi], 0);
    return dealsNeeded * qw;
  });

  // Phase-shifted: when do we need SQOs? sqoLead quarters before close
  // When do we need MQLs? mqlLead quarters before SQOs
  // We model 8 quarters (current year Q1-Q4 + next year Q1-Q4) to show full timeline
  const phaseShiftedFunnel = Array.from({length:8}, (_, qi) => {
    const qLabel = qi < 4 ? QUARTERS[qi] : `${QUARTERS[qi-4]}'`;
    const closingDeals = qi < 4 ? qDealTargets[qi] : 0;
    // SQOs needed for deals closing sqoLead quarters later
    const sqoForQi = (qi + sqoLead) < 4 ? qDealTargets[qi + sqoLead] : 0;
    const sqosForQ = sqoForQi > 0 ? Math.ceil(sqoForQi / (sqoToWonRate / 100)) : 0;
    const mktgSqosForQ = Math.ceil(sqosForQ * mktgPct);
    // MQLs needed for SQOs mqlLead quarters later
    const mqlTargetQi = qi + mqlLead;
    const sqoTarget = (mqlTargetQi + sqoLead) < 4 ? qDealTargets[mqlTargetQi + sqoLead] : 0;
    const sqosForMql = sqoTarget > 0 ? Math.ceil(sqoTarget / (sqoToWonRate / 100)) : 0;
    const mktgSqosForMql = Math.ceil(sqosForMql * mktgPct);
    const mqlsForQ = mktgSqosForMql > 0 ? Math.ceil(mktgSqosForMql / (meetingToSqoRate / 100) / (sqlToMeetingRate / 100) / (mqlToSqlRate / 100)) : 0;
    return {
      quarter: qLabel, quarterIndex: qi,
      closingDeals: Math.round(closingDeals),
      sqosNeeded: sqosForQ, mktgSqos: mktgSqosForQ, aeSqos: sqosForQ - mktgSqosForQ,
      mqlsNeeded: mqlsForQ,
      isCurrentYear: qi < 4,
    };
  }).filter(q => q.closingDeals > 0 || q.sqosNeeded > 0 || q.mqlsNeeded > 0);

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

  // Monthly (seasonally weighted, attrition-adjusted)
  let runningNewARR = 0;
  const monthly = MONTHS.map((m, i) => {
    const mn = i + 1;
    const sw = monthWeights[i]; // this month's share of annual volume
    const rf = Math.min(1, mn / Math.max(1, aeRampMonths));
    const attrFactor = Math.pow(1 - monthlyAttrRate, mn);
    const effectiveAEs = aeCount * attrFactor;
    const raes = Math.round(effectiveAEs * rf * 10) / 10;
    const cap = raes * (aeQuota / 12); // capacity uses attrition-adjusted headcount
    const mi = Math.round(inquiriesNeeded * sw);
    const mmql = Math.round(mi * (inquiryToMqlRate / 100));
    const msql = Math.round(mmql * (mqlToSqlRate / 100));
    const mmtg = Math.round(msql * (sqlToMeetingRate / 100));
    const msqo = Math.round(mmtg * (meetingToSqoRate / 100));
    const md = Math.round(msqo * (sqoToWonRate / 100));
    const mnarr = md * avgDealSize;
    // Expansion deals also seasonal
    const mExpDeals = Math.round(expansionDeals * sw);
    const mExpARR = mExpDeals * expansionAvgDeal;
    const mTotalNewARR = mnarr + mExpARR;
    runningNewARR += mTotalNewARR;
    const cnarr = runningNewARR;
    const tarr = retainedARR + cnarr;
    return { month: m, monthNum: mn, quarter: QUARTERS[Math.floor(i/3)],
      rampedAEs: raes, rampFactor: rf, fullCapacity: cap, seasonalWeight: sw,
      monthlyInquiries: mi, monthlyMQLs: mmql, monthlySQLs: msql,
      monthlyMeetings: mmtg, monthlySQOs: msqo, monthlyDeals: md,
      monthlyNewARR: mnarr, monthlyExpDeals: mExpDeals, monthlyExpARR: mExpARR,
      monthlyTotalNewARR: mTotalNewARR,
      cumulativeNewARR: cnarr, totalARR: tarr,
      monthlyRevenue: tarr / 12, pipeline: msqo * avgDealSize * (pipelineCoverage / 100),
      stage1Pipe: mmtg * stage1MinAmount, stage2Pipe: msqo * avgDealSize,
      newLogoARR: mnarr, expansionNewARR: mExpARR,
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
  const monthlyAttrRate = (aeAttritionRate || 0) / 100 / 12; // monthly probability of losing a rep
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

  // ── P&L with fixed/variable split
  const totalRevenue = monthly.reduce((s,m) => s+m.monthlyRevenue, 0);
  const grossProfit = totalRevenue*(grossMargin/100);
  const sAndM = totalRevenue*(sAndMPercent/100), rAndD = totalRevenue*(rAndDPercent/100), gAndA = totalRevenue*(gAndAPercent/100);
  const totalOpex = sAndM+rAndD+gAndA;
  const variableCosts = totalOpex * (variableCostPct / 100);
  const fixedCosts = fixedCostBase;
  const totalCosts = variableCosts + fixedCosts;
  const operatingIncome = grossProfit - totalCosts;
  const opMargin = totalRevenue > 0 ? operatingIncome / totalRevenue : 0;

  const contributionMargin = totalRevenue - variableCosts - (totalRevenue * (1 - grossMargin/100));
  const contributionMarginPct = totalRevenue > 0 ? contributionMargin / totalRevenue : 0;
  const breakEvenRevenue = contributionMarginPct > 0 ? fixedCosts / contributionMarginPct : 0;

  // Unit economics
  const cacPayback = blendedCAC > 0 ? blendedCAC / (avgDealSize / 12) : 0;
  const ltv = churnRate > 0 ? avgDealSize / (churnRate / 100) : avgDealSize * 10;
  const ltvCac = blendedCAC > 0 ? ltv / blendedCAC : 0;
  const rule40 = growthRate + (opMargin * 100);
  const magicNumber = sAndM > 0 ? newARRNeeded / sAndM : 0;
  const burnMultiple = operatingIncome < 0 ? Math.abs(operatingIncome) / newARRNeeded : 0;

  // Glideslope (seasonal target line)
  const glideslope = monthly.map((m,i) => {
    const seasonalTarget = retainedARR + newARRNeeded * cumWeights[i];
    return { ...m, targetARR: seasonalTarget, gapToTarget: m.totalARR - seasonalTarget,
      evenTarget: retainedARR + (newARRNeeded/12)*(i+1) };
  });

  // QBR
  const qbrData = QUARTERS.map((q,qi) => {
    const qm = monthly.filter((_,i) => Math.floor(i/3)===qi);
    return { quarter:q, revenue:qm.reduce((s,m)=>s+m.monthlyRevenue,0), newARR:qm.reduce((s,m)=>s+m.monthlyTotalNewARR,0),
      newLogoARR:qm.reduce((s,m)=>s+m.newLogoARR,0), expansionARR:qm.reduce((s,m)=>s+m.expansionNewARR,0),
      deals:qm.reduce((s,m)=>s+m.monthlyDeals,0), inquiries:qm.reduce((s,m)=>s+m.monthlyInquiries,0),
      mqls:qm.reduce((s,m)=>s+m.monthlyMQLs,0), sqls:qm.reduce((s,m)=>s+m.monthlySQLs,0),
      meetings:qm.reduce((s,m)=>s+m.monthlyMeetings,0), sqos:qm.reduce((s,m)=>s+m.monthlySQOs,0),
      pipeline:qm.reduce((s,m)=>s+m.pipeline,0), capacity:qm.reduce((s,m)=>s+m.fullCapacity,0),
      stage1Pipe:qm.reduce((s,m)=>s+m.stage1Pipe,0), stage2Pipe:qm.reduce((s,m)=>s+m.stage2Pipe,0),
    };
  });

  // Weekly (seasonally weighted)
  let wCumInq=0, wCumSql=0, wCumSqo=0;
  const weeklySimplified = Array.from({length:52},(_,w) => {
    const mi = Math.min(11, Math.floor(w/4.33));
    const ww = monthWeights[mi] * 12 / 4.33; // weekly share based on month weight
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

  const quarterlyTargets = QUARTERS.map((_,qi) => {
    const qTarget = newARRNeeded * qWeights[qi]; // seasonal quarterly target
    const qActual = qbrData[qi].newARR;
    return { quarter: QUARTERS[qi], target: qTarget, actual: qActual, gap: qActual - qTarget, pctOfTarget: qTarget>0?(qActual/qTarget*100):0, seasonalPct: (qWeights[qi]*100).toFixed(0) };
  });

  return {
    summary: { targetARR, startingARR, retainedARR, newARRNeeded, dealsNeeded,
      sqosNeeded, meetingsNeeded, sqlsNeeded, mqlsNeeded, inquiriesNeeded,
      pipelineRequired, totalRevenue, grossProfit, operatingIncome, totalMarketingSpend,
      blendedCAC, fullyLoadedCAC, cacPayback, ltv, ltvCac, rule40, magicNumber, burnMultiple, growthRate, opMargin,
      attainmentRequired, steadyStateQuota, totalRampLoss, effectiveFunnelYield,
      stage1MinAmount, stage1Pipeline, stage2Pipeline, totalCycleDays, velocityPerDay,
      coverageHealth, totalAcquisitionCost,
      newLogoARR, expansionARR, expansionDeals, expansionSQOs,
      variableCosts, fixedCosts: fixedCostBase, totalCosts,
      contributionMargin, contributionMarginPct, breakEvenRevenue,
      funnelGrade, overallFunnelScore, maxFunnelScore,
      // Marketing-sourced split
      mktgSQOs, aeSelfSourcedSQOs, mktgMeetingsNeeded, mktgSqlsNeeded, mktgMqlsNeeded, mktgInquiriesNeeded, mktgPct,
      // Attrition
      totalAttrLoss,
    },
    monthly, channels, sellerRamp, stages,
    pnl: { totalRevenue, grossProfit, grossMargin, sAndM, rAndD, gAndA, totalOpex,
      variableCosts, fixedCosts: fixedCostBase, totalCosts,
      operatingIncome, opMargin, contributionMargin, contributionMarginPct, breakEvenRevenue },
    glideslope, qbrData, weeklySimplified, velocityStages, quarterlyTargets,
    funnelHealth, cacBreakdown, monthWeights, seasonalityMode, phaseShiftedFunnel,
  };
}
