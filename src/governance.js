// ─── Governed Revenue Architecture — Spine Governance Engine ───
// Post-processes computeModel() output into structured verdicts.
// Each verdict: { id, domain, layer, severity, signal, diagnosis, recommendation, metrics, affectedModules, cascadeTo }
//
// Usage:
//   import { evaluateSpine } from './governance';
//   const verdicts = evaluateSpine(model, inputs);

// ─── SEVERITY LEVELS ───
const SEV = { critical: 0, warning: 1, healthy: 2, info: 3 };

// ─── HELPERS ───
const fmt = (n) => {
  if (n == null || isNaN(n)) return "$0";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (a >= 1e6) return `${s}$${(a/1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}$${(a/1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
};
const pct = (n, d=1) => `${n.toFixed(d)}%`;

// ════════════════════════════════════════════════════════════════
// DOMAIN EVALUATORS
// Each returns an array of verdicts for its governance domain.
// ════════════════════════════════════════════════════════════════

// ─── 1. P&L CONSTRAINTS (Governance Layer) ───
function evaluatePnL(model, inputs) {
  const { summary: s, pnl } = model;
  const verdicts = [];

  // Burn risk: S&M > 60% of revenue
  if (s.totalSAndMPct > 60) {
    verdicts.push({
      id: "pnl.burn_risk", domain: "pnl", layer: "governance", severity: "critical",
      signal: `S&M spend at ${pct(s.totalSAndMPct)} of revenue — exceeds 60% burn threshold`,
      diagnosis: `Total S&M of ${fmt(s.totalSAndM)} against ${fmt(s.totalRevenue)} revenue puts the company in burn territory. At this ratio, you're spending more on go-to-market than the business can sustain without continuous funding.`,
      recommendation: `Reduce salesOpexPct or variableMktgPct. Target total S&M ≤ 50% for growth stage. Current gap: ${fmt(s.totalSAndM - s.totalRevenue * 0.5)}.`,
      affectedModules: ["pnl", "sandmBudget", "mktgBudget"],
      cascadeTo: ["coverage", "attribution"],
      metrics: { current: s.totalSAndMPct, threshold: 60, target: 45, unit: "% of rev" },
      trigger: "cac_breach",
    });
  }

  // Underinvestment: S&M < 30% of revenue
  if (s.totalSAndMPct < 30 && s.totalSAndMPct > 0) {
    verdicts.push({
      id: "pnl.underinvest", domain: "pnl", layer: "governance", severity: "warning",
      signal: `S&M spend at ${pct(s.totalSAndMPct)} of revenue — below 30% growth threshold`,
      diagnosis: `At ${pct(s.totalSAndMPct)}, you're spending like a mature company but targeting ${pct(s.growthRate)} growth. Either the growth target is unrealistic or the GTM is underfunded.`,
      recommendation: `For ${pct(s.growthRate)} growth, benchmark S&M at 40-50% of revenue. Current shortfall: ${fmt(s.totalRevenue * 0.4 - s.totalSAndM)}.`,
      affectedModules: ["pnl", "sandmBudget"],
      cascadeTo: ["coverage", "attribution"],
      metrics: { current: s.totalSAndMPct, threshold: 30, target: 45, unit: "% of rev" },
    });
  }

  // CAC payback exceeds target
  const cacTarget = inputs.cacPaybackTarget || 24;
  if (s.cacPayback > cacTarget * 1.5) {
    verdicts.push({
      id: "pnl.cac_ceiling_critical", domain: "pnl", layer: "governance", severity: "critical",
      signal: `CAC payback at ${s.cacPayback.toFixed(1)} months — ${pct((s.cacPayback / cacTarget - 1) * 100)} over ${cacTarget}mo target`,
      diagnosis: `It takes ${s.cacPayback.toFixed(1)} months to recover acquisition cost. At this rate, you need ${Math.ceil(s.cacPayback / 12)} years of retention just to break even on a customer.`,
      recommendation: `Improve funnel yield (current Inquiry→Won: ${pct(s.inquiryToWonRate, 2)}), increase deal size, or reduce channel spend. Biggest lever: improving SQO→Won from ${inputs.sqoToWonRate}%.`,
      affectedModules: ["cacBreakdown", "channels", "funnelHealth"],
      cascadeTo: ["attribution"],
      metrics: { current: s.cacPayback, threshold: cacTarget * 1.5, target: cacTarget, unit: "months" },
      trigger: "cac_breach",
    });
  } else if (s.cacPayback > cacTarget) {
    verdicts.push({
      id: "pnl.cac_ceiling_warn", domain: "pnl", layer: "governance", severity: "warning",
      signal: `CAC payback at ${s.cacPayback.toFixed(1)} months — above ${cacTarget}mo target`,
      diagnosis: `Payback period is ${(s.cacPayback - cacTarget).toFixed(1)} months over target. Not critical yet, but trending in the wrong direction erodes unit economics.`,
      recommendation: `Monitor funnel yield and channel ROI. Target reduction: ${(s.cacPayback - cacTarget).toFixed(1)} months.`,
      affectedModules: ["cacBreakdown", "funnelHealth"],
      cascadeTo: ["attribution"],
      metrics: { current: s.cacPayback, threshold: cacTarget, target: cacTarget, unit: "months" },
    });
  }

  // Rule of 40
  if (s.rule40 < 40 && s.growthRate > 0) {
    verdicts.push({
      id: "pnl.rule40", domain: "pnl", layer: "governance", severity: "warning",
      signal: `Rule of 40 score: ${s.rule40.toFixed(0)} (growth ${pct(s.growthRate)} + margin ${pct(s.opMargin * 100)})`,
      diagnosis: `Below the Rule of 40 threshold. Growth of ${pct(s.growthRate)} doesn't compensate for ${pct(s.opMargin * 100)} operating margin.`,
      recommendation: `Either increase growth rate or improve margins. Gap to close: ${(40 - s.rule40).toFixed(0)} points.`,
      affectedModules: ["pnl", "glideslope"],
      metrics: { current: s.rule40, threshold: 40, target: 40, unit: "score" },
    });
  }

  // Contribution margin negative
  if (s.contributionMarginPct < 0) {
    verdicts.push({
      id: "pnl.contribution_neg", domain: "pnl", layer: "governance", severity: "critical",
      signal: `Negative contribution margin: ${pct(s.contributionMarginPct * 100)}`,
      diagnosis: `Variable costs exceed gross profit. Every new deal makes the company poorer. This is a structural problem, not a scale problem.`,
      recommendation: `Fix unit economics before scaling. Either increase deal size, improve gross margin, or reduce variable S&M spend.`,
      affectedModules: ["pnl"],
      cascadeTo: ["coverage", "attribution"],
      metrics: { current: s.contributionMarginPct * 100, threshold: 0, target: 30, unit: "%" },
    });
  }

  // Floor-bound warnings
  if (s.salesIsFloorBound) {
    verdicts.push({
      id: "pnl.sales_floor", domain: "pnl", layer: "governance", severity: "warning",
      signal: `Sales budget is headcount floor-bound — actual cost ${fmt(s.salesHeadcountFloor)} exceeds formula ${fmt(s.salesOpex)}`,
      diagnosis: `The people you've hired cost more than the % model allocates. Either revenue needs to grow to absorb headcount cost, or headcount needs to shrink.`,
      recommendation: `Close the ${fmt(s.salesFloorDelta)} gap by increasing revenue (preferred) or reducing AE count from ${inputs.aeCount}.`,
      affectedModules: ["sandmBudget", "sales"],
      metrics: { current: s.salesHeadcountFloor, threshold: s.salesOpex, unit: "$" },
    });
  }

  if (s.fixedMktgIsFloorBound) {
    verdicts.push({
      id: "pnl.mktg_floor", domain: "pnl", layer: "governance", severity: "info",
      signal: `Marketing fixed budget is structural floor-bound — minimum viable team costs exceed formula allocation`,
      diagnosis: `This is expected at early stages. The structural floor (exec + PMM + martech + min ops) sets a minimum regardless of revenue %.`,
      recommendation: `This resolves as revenue grows. No action needed unless floor exceeds 25% of total revenue.`,
      affectedModules: ["mktgBudget"],
      metrics: { current: s.floorPctOfRev, threshold: 25, unit: "% of rev" },
    });
  }

  // Leadership cost load
  if (s.leadershipPctOfRev > 15) {
    verdicts.push({
      id: "pnl.leadership_load", domain: "pnl", layer: "governance", severity: "warning",
      signal: `Leadership cost at ${pct(s.leadershipPctOfRev)} of revenue — above 15% threshold`,
      diagnosis: `${s.activeLeadership.length} leadership roles consuming ${fmt(s.totalLeadershipCost)}. At ${fmt(s.totalRevenue)} revenue, this is top-heavy.`,
      recommendation: `Consider deferring VP Ops or VP Product until revenue supports the layer. Or use fractional/advisory for non-critical roles.`,
      affectedModules: ["sandmBudget", "pnl"],
      metrics: { current: s.leadershipPctOfRev, threshold: 15, target: 10, unit: "% of rev" },
    });
  }

  return verdicts;
}

// ─── 2. STAGE DEFINITIONS (Governance Layer) ───
function evaluateStages(model, inputs) {
  const { summary: s, funnelHealth, velocityStages } = model;
  const verdicts = [];

  // Overall funnel grade
  if (s.funnelGrade === "D") {
    verdicts.push({
      id: "stage.funnel_d", domain: "stage", layer: "governance", severity: "critical",
      signal: `Funnel health grade: D — multiple stages below benchmarks`,
      diagnosis: `${funnelHealth.filter(f => f.status === "bad").length} of ${funnelHealth.length} stages are underperforming. The funnel is structurally broken.`,
      recommendation: `Focus on the worst-performing stage first. Fixing one bottleneck has cascading effects on all downstream stages.`,
      affectedModules: ["funnelHealth", "marketing", "pipeline"],
      cascadeTo: ["attribution", "forecast"],
    });
  } else if (s.funnelGrade === "C") {
    verdicts.push({
      id: "stage.funnel_c", domain: "stage", layer: "governance", severity: "warning",
      signal: `Funnel health grade: C — several stages need improvement`,
      diagnosis: `Funnel is functional but leaving revenue on the table. Each 5-point improvement in a weak stage compounds through the entire funnel.`,
      recommendation: `Identify the stage with highest volume × lowest conversion — that's your highest-leverage fix.`,
      affectedModules: ["funnelHealth"],
      cascadeTo: ["attribution"],
    });
  }

  // Individual stage bottlenecks
  funnelHealth.filter(f => f.status === "bad").forEach(f => {
    verdicts.push({
      id: `stage.bottleneck_${f.stage.replace(/[→\s]/g, '_').toLowerCase()}`,
      domain: "stage", layer: "governance", severity: "warning",
      signal: `${f.stage} at ${f.rate}% — below "good" threshold of ${f.bench.good}%`,
      diagnosis: `This stage is the weakest link. At ${f.rate}% vs ${f.bench.good}% good benchmark, you're losing ${Math.round((1 - f.rate / f.bench.good) * 100)}% of potential yield at this gate.`,
      recommendation: `Investigate qualification criteria, handoff process, and buyer experience at this stage. Target: ${f.bench.good}% minimum.`,
      affectedModules: ["funnelHealth"],
      metrics: { current: f.rate, threshold: f.bench.good, target: f.bench.great, unit: "%" },
    });
  });

  // Compression: Inquiry→Won < 0.5%
  if (s.inquiryToWonRate < 0.5) {
    verdicts.push({
      id: "stage.compression_critical", domain: "stage", layer: "governance", severity: "critical",
      signal: `Inquiry→Won compression at ${pct(s.inquiryToWonRate, 2)} — extremely low overall yield`,
      diagnosis: `Less than 1 in 200 inquiries becomes a customer. This means either lead quality is poor, qualification gates are too loose (letting bad leads through), or closing ability is weak.`,
      recommendation: `This is a systemic issue, not a single-stage fix. Review ICP definition, lead scoring criteria, and stage-by-stage leakage.`,
      affectedModules: ["funnelHealth", "marketing", "pipeline"],
      cascadeTo: ["attribution", "coverage"],
    });
  }

  // Velocity: total cycle > 120 days
  if (s.totalCycleDays > 120) {
    verdicts.push({
      id: "stage.velocity_slow", domain: "stage", layer: "governance", severity: "warning",
      signal: `Total sales cycle at ${s.totalCycleDays} days — above 120-day threshold`,
      diagnosis: `Long cycles tie up AE capacity and delay revenue recognition. At ${s.totalCycleDays} days, each AE can only work ~${Math.floor(365 / s.totalCycleDays * 3)} deals concurrently.`,
      recommendation: `Identify the slowest stage (likely Stage 3→4 Business Case or Stage 4→5 Legal). Each day reduced adds capacity.`,
      affectedModules: ["velocity", "pipeline"],
      cascadeTo: ["coverage"],
      metrics: { current: s.totalCycleDays, threshold: 120, target: 90, unit: "days" },
    });
  }

  // Meeting show rate
  if (s.meetingShowRate < 70) {
    verdicts.push({
      id: "stage.show_rate", domain: "stage", layer: "governance", severity: "warning",
      signal: `Meeting show rate at ${s.meetingShowRate}% — below 70% threshold`,
      diagnosis: `${100 - s.meetingShowRate}% of scheduled meetings don't happen. This wastes AE and SDR capacity and inflates the apparent funnel.`,
      recommendation: `Implement same-day confirmation, calendar reminders, and SDR pre-call value delivery. Target: 80%+.`,
      affectedModules: ["funnelHealth"],
      metrics: { current: s.meetingShowRate, threshold: 70, target: 85, unit: "%" },
    });
  }

  return verdicts;
}

// ─── 3. ICP GOVERNANCE (Governance Layer) ───
function evaluateICP(model, inputs) {
  const { summary: s } = model;
  const verdicts = [];

  // Attainment required > 120% (plan demands more than team can deliver)
  if (s.attainmentRequired > 120) {
    verdicts.push({
      id: "icp.attainment_unrealistic", domain: "icp", layer: "governance", severity: "critical",
      signal: `Required team attainment: ${pct(s.attainmentRequired)} — plan demands >120% of quota capacity`,
      diagnosis: `The plan needs ${fmt(s.newARRNeeded)} new ARR but total quota capacity is ${fmt(s.steadyStateQuota)}. After ramp loss of ${fmt(s.totalRampLoss)}, this requires superhuman performance.`,
      recommendation: `Either hire ${Math.ceil((s.newARRNeeded - s.steadyStateQuota * 0.8) / (inputs.aeQuota * 0.8))} more AEs, increase deal size from ${fmt(inputs.avgDealSize)}, or reduce the ARR target.`,
      affectedModules: ["sales", "sellerRamp", "dashboard"],
      cascadeTo: ["coverage", "forecast"],
      metrics: { current: s.attainmentRequired, threshold: 120, target: 85, unit: "% attainment" },
      trigger: "coverage_gap",
    });
  } else if (s.attainmentRequired > 100) {
    verdicts.push({
      id: "icp.attainment_stretch", domain: "icp", layer: "governance", severity: "warning",
      signal: `Required team attainment: ${pct(s.attainmentRequired)} — above 100% of quota`,
      diagnosis: `The plan works only if the average AE exceeds quota. Historically, ~40-50% of AEs hit quota. This plan has no margin for error.`,
      recommendation: `Add capacity buffer: either +${Math.ceil((s.attainmentRequired - 85) / 100 * inputs.aeCount)} AEs or increase deal size by ${pct((s.attainmentRequired / 85 - 1) * 100)}.`,
      affectedModules: ["sales", "dashboard"],
      cascadeTo: ["coverage"],
      metrics: { current: s.attainmentRequired, threshold: 100, target: 85, unit: "% attainment" },
    });
  }

  // Quota coverage (steady-state quota vs target)
  const quotaCoverage = s.steadyStateQuota > 0 ? s.newARRNeeded / s.steadyStateQuota * 100 : 0;
  if (quotaCoverage > 100 && s.attainmentRequired <= 120) {
    // Only fire if attainment verdict didn't already cover this
    // (avoid redundant verdicts)
  }

  return verdicts;
}

// ─── 4. COVERAGE AGENT (Agent Layer) ───
function evaluateCoverage(model, inputs) {
  const { summary: s, sellerRamp, monthly } = model;
  const verdicts = [];

  // Ramp-adjusted capacity gap
  const y1Months = monthly.filter(m => m.yearIndex === 0);
  const avgRampedAEs = y1Months.reduce((s, m) => s + m.rampedAEs, 0) / 12;
  const avgCapacity = avgRampedAEs * inputs.aeQuota;
  const capacityRatio = avgCapacity / s.newARRNeeded;

  if (capacityRatio < 0.8) {
    verdicts.push({
      id: "coverage.ramp_gap", domain: "coverage", layer: "agent", severity: "critical",
      signal: `Ramp-adjusted capacity covers only ${pct(capacityRatio * 100)} of target — critical gap`,
      diagnosis: `${inputs.aeCount} AEs with ${inputs.aeRampMonths}-month ramp average only ${avgRampedAEs.toFixed(1)} effective AEs across Y1. That's ${fmt(avgCapacity)} capacity against ${fmt(s.newARRNeeded)} needed.`,
      recommendation: `Options: (1) hire ${Math.ceil((s.newARRNeeded / 0.85 - avgCapacity) / inputs.aeQuota)} more AEs pre-ramp, (2) reduce ramp from ${inputs.aeRampMonths} months, (3) front-load marketing to compensate.`,
      affectedModules: ["sales", "sellerRamp", "targets"],
      cascadeTo: ["forecast"],
      metrics: { current: capacityRatio * 100, threshold: 80, target: 115, unit: "% coverage" },
      trigger: "coverage_gap",
    });
  }

  // Attrition impact
  const attrPctCapacity = s.totalAttrLoss > 0 && s.steadyStateQuota > 0 
    ? s.totalAttrLoss / s.steadyStateQuota * 100 : 0;
  if (inputs.aeAttritionRate > 15) {
    verdicts.push({
      id: "coverage.attrition_high", domain: "coverage", layer: "agent", severity: "warning",
      signal: `AE attrition at ${inputs.aeAttritionRate}% — eroding ${fmt(s.totalAttrLoss)} in annual capacity`,
      diagnosis: `High attrition creates a compounding problem: each departing AE takes pipeline knowledge and requires a new ramp cycle. At ${inputs.aeAttritionRate}%, you're losing ${(inputs.aeAttritionRate / 100 * inputs.aeCount).toFixed(1)} AEs/year.`,
      recommendation: `Address retention (comp, territory, leadership). Each point of attrition reduction saves ~${fmt(inputs.aeQuota * 0.5 * inputs.aeCount * 0.01)} in capacity.`,
      affectedModules: ["sellerRamp", "sales"],
      metrics: { current: inputs.aeAttritionRate, threshold: 15, target: 10, unit: "% annual" },
    });
  }

  // Deal load per AE
  const dealsPerAE = s.dealsNeeded / Math.max(1, inputs.aeCount);
  if (dealsPerAE > 15) {
    verdicts.push({
      id: "coverage.deal_load", domain: "coverage", layer: "agent", severity: "warning",
      signal: `${dealsPerAE.toFixed(0)} deals per AE per year — high load for ${fmt(inputs.avgDealSize)} deal size`,
      diagnosis: `At ${s.totalCycleDays || 90} day cycles, each AE juggles ~${Math.ceil(dealsPerAE * (s.totalCycleDays || 90) / 365)} active deals simultaneously. Quality of engagement drops above ~4 concurrent enterprise deals.`,
      recommendation: `Either add AEs or increase deal size to reduce deal volume. ${dealsPerAE > 20 ? "This is critical — AEs will cherry-pick and abandon lower-probability deals." : ""}`,
      affectedModules: ["sales"],
      metrics: { current: dealsPerAE, threshold: 15, target: 10, unit: "deals/AE/yr" },
    });
  }

  // SDR ratio
  if (inputs.sdrsPerAe < 1.0) {
    verdicts.push({
      id: "coverage.sdr_ratio", domain: "coverage", layer: "agent", severity: "warning",
      signal: `SDR:AE ratio at ${inputs.sdrsPerAe}:1 — below 1:1 minimum for outbound-dependent models`,
      diagnosis: `With mktg-sourced at ${inputs.mktgSourcedPct}%, ${100 - inputs.mktgSourcedPct}% of pipeline must come from AE self-sourcing and SDR outbound. At ${inputs.sdrsPerAe} SDRs per AE, outbound capacity is constrained.`,
      recommendation: `Increase SDR:AE ratio to at least 1.5:1, or shift mktgSourcedPct higher to reduce outbound dependency.`,
      affectedModules: ["sales"],
      metrics: { current: inputs.sdrsPerAe, threshold: 1.0, target: 1.5, unit: "SDR:AE" },
    });
  }

  return verdicts;
}

// ─── 5. ATTRIBUTION AGENT (Agent Layer) ───
function evaluateAttribution(model, inputs) {
  const { summary: s, motions } = model;
  const verdicts = [];

  // CREATE motion ROI
  if (motions.create.totals.deals > 0) {
    const createROI = motions.create.totals.revenue / motions.create.totals.spend;
    if (createROI < 2) {
      verdicts.push({
        id: "attribution.create_roi", domain: "attribution", layer: "agent", severity: "warning",
        signal: `CREATE motion ROI at ${createROI.toFixed(1)}x — below 2x threshold`,
        diagnosis: `Spending ${fmt(motions.create.totals.spend)} to generate ${fmt(motions.create.totals.revenue)} in new logo revenue. At <2x, demand creation is barely paying for itself.`,
        recommendation: `Audit channel mix. Kill channels with ROI < 1.5x and reallocate to top performers. Current highest CPL channels are the first to cut.`,
        affectedModules: ["channels"],
        metrics: { current: createROI, threshold: 2, target: 5, unit: "x ROI" },
      });
    }
  }

  // ACCELERATE coverage
  if (motions.accelerate.totals.oppsInfluenced > 0) {
    const accelCov = motions.accelerate.totals.oppsInfluenced / s.sqosNeeded * 100;
    if (accelCov < 40) {
      verdicts.push({
        id: "attribution.accel_coverage", domain: "attribution", layer: "agent", severity: "warning",
        signal: `ACCELERATE motion covering only ${pct(accelCov)} of SQOs — below 40% target`,
        diagnosis: `${motions.accelerate.totals.oppsInfluenced} of ${s.sqosNeeded} SQOs get acceleration treatment. The remaining ${s.sqosNeeded - motions.accelerate.totals.oppsInfluenced} deals progress at organic velocity.`,
        recommendation: `Increase accel budget allocation or improve per-account efficiency. Each additional covered deal has ${inputs.accelWinRateLift || 5}pp higher win rate.`,
        affectedModules: ["channels"],
        metrics: { current: accelCov, threshold: 40, target: 60, unit: "% of SQOs" },
      });
    }
  }

  // Channel concentration (single CREATE channel > 40%)
  const createChannels = motions.create.channels || [];
  const overConcentrated = createChannels.filter(c => c.pct > 40);
  if (overConcentrated.length > 0) {
    verdicts.push({
      id: "attribution.concentration", domain: "attribution", layer: "agent", severity: "warning",
      signal: `Channel concentration risk: ${overConcentrated.map(c => `${c.name} at ${c.pct}%`).join(", ")}`,
      diagnosis: `Over-reliance on a single channel creates fragility. If ${overConcentrated[0].name} CPL increases 30%, it blows up the whole CREATE budget.`,
      recommendation: `Diversify: no single CREATE channel should exceed 35%. Build a second primary channel before scaling the dominant one.`,
      affectedModules: ["channels"],
    });
  }

  // Mktg-sourced vs plan
  if (Math.abs(inputs.mktgSourcedPct - 50) > 15 && inputs.mktgSourcedPct < 35) {
    verdicts.push({
      id: "attribution.mktg_source_low", domain: "attribution", layer: "agent", severity: "warning",
      signal: `Marketing-sourced pipeline at ${inputs.mktgSourcedPct}% — heavy outbound dependency`,
      diagnosis: `Only ${inputs.mktgSourcedPct}% of pipeline comes from marketing. The remaining ${100 - inputs.mktgSourcedPct}% depends on AE/SDR outbound, which doesn't scale linearly.`,
      recommendation: `Invest in CREATE motion channels to shift mktg-sourced toward 50%+. Each % shift reduces per-deal AE effort.`,
      affectedModules: ["channels", "marketing"],
      cascadeTo: ["coverage"],
      metrics: { current: inputs.mktgSourcedPct, threshold: 35, target: 50, unit: "% mktg-sourced" },
    });
  }

  return verdicts;
}

// ─── 6. FORECAST AGENT (Agent Layer) ───
function evaluateForecast(model, inputs) {
  const { summary: s, glideslope, quarterlyTargets, yearTargets } = model;
  const verdicts = [];

  // Multi-year feasibility: Y2 growth > 100% over Y1
  if (yearTargets.length > 1) {
    const y2 = yearTargets[1];
    if (y2.growthRate > 100) {
      verdicts.push({
        id: "forecast.y2_feasibility", domain: "forecast", layer: "agent", severity: "warning",
        signal: `Y2 requires ${pct(y2.growthRate)} growth over Y1 exit — historically rare above 100%`,
        diagnosis: `Y2 target of ${fmt(y2.targetARR)} from ${fmt(y2.startARR)} requires ${fmt(y2.newARRNeeded)} new ARR — ${pct(y2.growthRate / (yearTargets[0].growthRate || 100) * 100 - 100)} harder than Y1 in absolute terms.`,
        recommendation: `Either moderate y2GrowthRate or plan for proportional headcount and budget expansion. Y2 deal count: ${y2.dealsNeeded}.`,
        affectedModules: ["glideslope", "targets"],
        metrics: { current: y2.growthRate, threshold: 100, target: 60, unit: "% Y2 growth" },
      });
    }
  }

  // Quarterly pipeline coverage
  const weakQuarters = quarterlyTargets.filter(q => q.coverageActual < 250 && q.target > 0);
  if (weakQuarters.length > 0) {
    const worst = weakQuarters.reduce((w, q) => q.coverageActual < w.coverageActual ? q : w);
    verdicts.push({
      id: "forecast.q_coverage_gap", domain: "forecast", layer: "agent", severity: weakQuarters.length > 2 ? "critical" : "warning",
      signal: `${weakQuarters.length} quarter(s) below 2.5x pipeline coverage — worst: ${worst.quarter} at ${pct(worst.coverageActual)}`,
      diagnosis: `Pipeline coverage below 2.5x means the quarter depends on late-stage heroics. ${worst.quarter} has ${fmt(worst.stage2Actual || 0)} Stage 2 pipeline against ${fmt(worst.target)} target.`,
      recommendation: `Front-load pipeline generation for ${worst.quarter}. Need ${fmt((worst.target * 3.5) - (worst.stage2Actual || 0))} more Stage 2 pipeline.`,
      affectedModules: ["pipeline", "targets"],
      cascadeTo: ["coverage", "attribution"],
      metrics: { current: worst.coverageActual, threshold: 250, target: 350, unit: "% coverage" },
      trigger: "coverage_gap",
    });
  }

  return verdicts;
}

// ════════════════════════════════════════════════════════════════
// MAIN EVALUATOR
// ════════════════════════════════════════════════════════════════

export function evaluateSpine(model, inputs) {
  const allVerdicts = [
    ...evaluatePnL(model, inputs),
    ...evaluateStages(model, inputs),
    ...evaluateICP(model, inputs),
    ...evaluateCoverage(model, inputs),
    ...evaluateAttribution(model, inputs),
    ...evaluateForecast(model, inputs),
  ];

  // Sort: critical first, then warning, then healthy, then info
  allVerdicts.sort((a, b) => SEV[a.severity] - SEV[b.severity]);

  // Compute system-level health
  const criticalCount = allVerdicts.filter(v => v.severity === "critical").length;
  const warningCount = allVerdicts.filter(v => v.severity === "warning").length;
  const healthyCount = allVerdicts.filter(v => v.severity === "healthy").length;

  const systemHealth = criticalCount > 0 ? "critical"
    : warningCount > 3 ? "degraded"
    : warningCount > 0 ? "caution"
    : "healthy";

  // Domain-level health summary
  const domains = ["pnl", "stage", "icp", "coverage", "attribution", "forecast"];
  const domainHealth = {};
  domains.forEach(d => {
    const dv = allVerdicts.filter(v => v.domain === d);
    const hasCritical = dv.some(v => v.severity === "critical");
    const hasWarning = dv.some(v => v.severity === "warning");
    domainHealth[d] = hasCritical ? "critical" : hasWarning ? "warning" : "healthy";
  });

  // Map domain health to architecture diagram nodes
  const nodeHealth = {
    // Governance layer
    pnl: domainHealth.pnl,
    stage: domainHealth.stage,
    icp: domainHealth.icp,
    // Agent layer
    coverage: domainHealth.coverage,
    attribution: domainHealth.attribution,
    forecast: domainHealth.forecast,
    // Execution + Market (derived — healthy unless upstream is critical)
    salesforce: domainHealth.coverage === "critical" ? "warning" : "healthy",
    hubspot: domainHealth.attribution === "critical" ? "warning" : "healthy",
    clay: domainHealth.forecast === "critical" ? "warning" : "healthy",
    "6sense": "healthy",
    buyer: systemHealth === "critical" ? "warning" : "healthy",
    feedback: "healthy",
  };

  return {
    verdicts: allVerdicts,
    systemHealth,
    domainHealth,
    nodeHealth,
    counts: { critical: criticalCount, warning: warningCount, healthy: healthyCount, total: allVerdicts.length },
  };
}

// ─── SEVERITY COLORS (for UI) ───
export const SEVERITY_COLORS = {
  critical: { bg: "rgba(212, 46, 74, 0.10)", border: "#d42e4a", text: "#d42e4a", label: "CRITICAL" },
  warning: { bg: "rgba(192, 120, 0, 0.10)", border: "#c07800", text: "#c07800", label: "WARNING" },
  healthy: { bg: "rgba(45, 138, 86, 0.10)", border: "#2d8a56", text: "#2d8a56", label: "HEALTHY" },
  info: { bg: "rgba(37, 99, 235, 0.10)", border: "#2563eb", text: "#2563eb", label: "INFO" },
};

export const SYSTEM_HEALTH_COLORS = {
  critical: { bg: "#d42e4a", label: "CRITICAL — structural issues require immediate action" },
  degraded: { bg: "#c07800", label: "DEGRADED — multiple warnings accumulating" },
  caution: { bg: "#c07800", label: "CAUTION — minor issues to monitor" },
  healthy: { bg: "#2d8a56", label: "HEALTHY — all systems within governance thresholds" },
};
