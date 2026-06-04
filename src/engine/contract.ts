// ─────────────────────────────────────────────────────────────────────────────
// OpptyCon engine — INPUT/OUTPUT CONTRACT (Layer 0)
//
// The canonical, source-agnostic data shapes. The engine consumes a normalized
// object and does NOT know or care whether the numbers came from a human typing
// into the UI (today), a one-time CSV seed exported from Salesforce by a RevOps
// operator (Layer 1), or an OAuth connector pulling live from SFDC/HubSpot
// (Layer 2). All three produce the SAME shape. That equivalence is the contract.
//
// TWO INPUT TYPES, deliberately:
//   • ResolvedInputs — plain numbers. This is what `computeModel` consumes, and
//     it is byte-for-byte the shape the engine has always consumed. The golden
//     tests pin it. The math never changed.
//   • ModelInputs    — the AUTHORING shape. Assumption-class fields may be a
//     `Ranged` band instead of a point value (§3a, false-precision firewall).
//     `runBanded` projects ModelInputs down to ResolvedInputs three times.
//
// This split is the one place the handoff's "ModelInputs carries Ranged" intent
// is reconciled with the "keep computeModel monolithic / byte-identical" decision:
// the Ranged tier sits ABOVE the unchanged core, not inside it.
// ─────────────────────────────────────────────────────────────────────────────

// ── Ranged-input primitives (§3a) ────────────────────────────────────────────

/** A genuinely-uncertain, high-impact assumption. Drives banded output. */
export interface Ranged {
  low: number;
  mid: number; // the headline value — what the UI shows as "the number"
  high: number;
  /** Provenance label, honest about certainty: "operator estimate" | "user-set" | "CRM-derived". */
  source?: string;
}

/** Known cold or user-chosen. Decisive by design. */
export type Point = number;

/** Lift a Point to a degenerate Ranged (low=mid=high). */
export const point = (n: number): Ranged => ({ low: n, mid: n, high: n });

/** Type guard: is this top-level value a Ranged band (vs a plain number or a structural object)? */
export function isRanged(v: unknown): v is Ranged {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as Ranged).low === 'number' &&
    typeof (v as Ranged).mid === 'number' &&
    typeof (v as Ranged).high === 'number'
  );
}

/** A banded numeric output. Output precision honestly reflects input certainty. */
export interface Banded {
  low: number;
  mid: number; // headline
  high: number;
}

/**
 * Direction-of-badness for each ranged assumption (§3a). "Pessimistic" is NOT
 * always the numeric minimum: lower conversion is bad, but lower cost-per-rep is
 * GOOD. The projector uses this so optimistic/pessimistic scenarios are coherent.
 * Keyed by ResolvedInputs field name. A field absent here is never treated as a
 * banded assumption (it stays a Point).
 */
export const RANGED_FIELD_DIRECTIONS: Record<string, 'higherIsBetter' | 'higherIsWorse'> = {
  // Conversion / efficiency — higher pushes the plan favorably
  inquiryToMqlRate: 'higherIsBetter',
  mqlToSqlRate: 'higherIsBetter',
  sqlToMeetingRate: 'higherIsBetter',
  meetingToSqoRate: 'higherIsBetter',
  sqoToWonRate: 'higherIsBetter',
  expansionSqoToWon: 'higherIsBetter',
  realisticAeAttainment: 'higherIsBetter',
  nrrPercent: 'higherIsBetter',
  avgDealSize: 'higherIsBetter',
  // Cost / friction / leakage — higher is worse for the plan
  aeOTE: 'higherIsWorse',
  sdrOTE: 'higherIsWorse',
  aeAttritionRate: 'higherIsWorse',
  churnRate: 'higherIsWorse',
  cpSqoBenchmark: 'higherIsWorse',
  salesCycleWeeks: 'higherIsWorse',
  aeTimeToHire: 'higherIsWorse',
  aeRampMonths: 'higherIsWorse',
};

/** The field names that may be authored as a `Ranged` band in ModelInputs. */
export type RangedFieldKey = keyof typeof RANGED_FIELD_DIRECTIONS;

// ── Structural sub-objects ────────────────────────────────────────────────────

export interface ElasticMktgBreakdown { revEngineOps: number; brandContent: number; prAr: number; }
export interface SalesBudgetBreakdown { aeComp: number; sdrComp: number; seOverlay: number; salesTools: number; enablement: number; travel: number; }
export interface LeadershipRoles { vpSales: boolean; vpMarketing: boolean; vpCS: boolean; vpOps: boolean; vpProduct: boolean; }
export interface MotionAllocation { create: number; convert: number; accelerate: number; }
/** Channel rows differ by motion (cpl | costPerSql | costPerAccount); kept permissive. */
export type MotionChannel = { name: string; pct: number; intent?: string } & Record<string, number | string>;
export interface MotionChannels { create: MotionChannel[]; convert: MotionChannel[]; accelerate: MotionChannel[]; }

// ── ResolvedInputs — what computeModel consumes (plain numbers; byte-identical) ─

export interface ResolvedInputs {
  // Calendar anchors (YYYY-MM-DD). REQUIRED — the engine no longer falls back to
  // the wall clock, which is what makes computeModel deterministic and testable.
  planStartDate: string;
  targetDate: string;
  // Target
  targetMode: string;            // "absolute" | "growthRate"
  targetARR: number; startingARR: number; targetGrowthRate: number;
  planningYears: number; y2GrowthRate: number; y2ConversionLift: number;
  avgDealSize: number; salesCycleWeeks: number;
  // Funnel conversion gates
  inquiryToMqlRate: number; mqlToSqlRate: number; sqlToMeetingRate: number;
  meetingToSqoRate: number; sqoToWonRate: number; stage1MinPct: number;
  // Sales capacity
  aeCount: number; aeRampMonths: number; aeQuota: number; sdrsPerAe: number; aeAttritionRate: number;
  currentAeCount: number; aeTimeToHire: number; realisticAeAttainment: number; hiringPlanMode: string;
  mktgSourcedPct: number;
  // Phase-shift lead times
  sqoLeadQuarters: number; mqlLeadQuarters: number;
  // Functional cost buckets
  grossMargin: number; gAndAPct: number; rAndDPct: number; salesOpexPct: number; variableMktgPct: number;
  salesVariablePct: number; fixedMktgPct: number; martechPctOfVariable: number;
  // Marketing fixed-budget tiers
  executiveTier: string; pmmTier: string; coreMarTechTier: string;
  elasticMktgBreakdown: ElasticMktgBreakdown;
  // CAC benchmarks
  cpSqoBenchmark: number; cacPaybackTarget: number;
  // Sales budget decomposition + comp benchmarks
  salesBudgetBreakdown: SalesBudgetBreakdown;
  aeOTE: number; aeBenefitsLoad: number; sdrOTE: number; sdrBenefitsLoad: number;
  // Leadership layer
  fundingStage: string; leadershipRoles: LeadershipRoles;
  costBenchmarks: Record<string, unknown>;
  // Retention / coverage / velocity
  nrrPercent: number; existingCustomers: number; churnRate: number;
  pipelineCoverage: number; coverageGreen: number; coverageYellow: number; coverageRed: number;
  velStage1to2: number; velStage2to3: number; velStage3to4: number; velStage4to5: number; velStage5toClose: number;
  // Motions
  motionAllocation: MotionAllocation; motionChannels: MotionChannels;
  accelDaysReduced: number; accelWinRateLift: number; accelAccountsCoverage: number;
  funnelBenchmarks: Record<string, unknown>;
  // Seasonality
  seasonalityMode: string; seasonalWeights: number[];
  // Revenue mode
  revenueMode: string; newLogoPct: number; expansionAvgDeal: number; expansionSqoToWon: number; expansionCycleWeeks: number;
  // Forward-compat: tolerate extra keys without widening the typed surface to `any`.
  [extra: string]: unknown;
}

/**
 * ModelInputs — the AUTHORING contract. Identical to ResolvedInputs except the
 * assumption-class fields may carry a `Ranged` band. UI, CSV seed, and the future
 * connector all build THIS. `runBanded`/`resolveInputs` collapse it to numbers.
 */
export type ModelInputs =
  Omit<ResolvedInputs, RangedFieldKey> &
  { [K in RangedFieldKey]: number | Ranged };

// ── Outputs ───────────────────────────────────────────────────────────────────

/** Headline metrics. Numeric fields are real numbers; embedded tables kept as `unknown` (rendered by the UI, walked structurally by runBanded). */
export interface Summary {
  targetARR: number; startingARR: number; retainedARR: number; newARRNeeded: number; dealsNeeded: number;
  sqosNeeded: number; meetingsNeeded: number; sqlsNeeded: number; mqlsNeeded: number; inquiriesNeeded: number;
  pipelineRequired: number; totalRevenue: number; grossProfit: number; operatingIncome: number; totalMarketingSpend: number;
  blendedCAC: number; fullyLoadedCAC: number; cacPayback: number; ltv: number; ltvCac: number;
  rule40: number; magicNumber: number; burnMultiple: number; growthRate: number; opMargin: number;
  attainmentRequired: number; steadyStateQuota: number; totalRampLoss: number; effectiveFunnelYield: number;
  totalSAndM: number; totalSAndMPct: number; contributionMargin: number; breakEvenRevenue: number;
  funnelGrade: string; overallFunnelScore: number;
  [field: string]: number | string | unknown;
}

export interface ModelOutputs {
  summary: Summary;
  monthly: Array<Record<string, number | string>>;
  channels: unknown[];
  sellerRamp: Array<Record<string, number>>;
  stages: unknown[];
  yearTargets: Array<Record<string, number>>;
  numYears: number;
  horizonPlanner: Record<string, unknown>;
  inverseMarketingPlan: Record<string, unknown>;
  aeHiringPlan: Array<Record<string, number>>;
  aeHiringSummary: Record<string, number>;
  motions: Record<string, unknown>;
  pnl: Record<string, unknown>;
  glideslope: Array<Record<string, number>>;
  qbrData: unknown[];
  weeklySimplified: unknown[];
  velocityStages: unknown[];
  quarterlyTargets: unknown[];
  funnelHealth: unknown[];
  cacBreakdown: Record<string, unknown>;
  monthWeights: number[];
  seasonalityMode: string;
  phaseShiftedFunnel: unknown[];
  [extra: string]: unknown;
}

/** Same shape as ModelOutputs, with every numeric leaf replaced by a Banded {low,mid,high}. */
export type ModelOutputsBanded = Record<string, unknown>;

// ── CRM ingestion contract (Layer 1/2) ─────────────────────────────────────────

/**
 * The normalized shape a CRM data source maps INTO before it becomes ModelInputs.
 * A CSV row-set and a future SFDC/HubSpot API response both normalize to this,
 * then this maps to ModelInputs via the single shared mapper below. The connector
 * (Layer 2) is a new ACQUIRER of a CrmSnapshot, not a new PATH to ModelInputs —
 * that is the non-throwaway property the CSV importer (Layer 1) is built against.
 *
 * ⚠️ CUSTODY CONSTRAINT — DO NOT REMOVE. In Layer 0/1 a CrmSnapshot lives IN
 * MEMORY ONLY. It must never be written to localStorage, never persisted, never
 * leave the browser. The first convenience instinct later will be "just cache
 * their import so they don't re-upload" — that single line crosses into data
 * custody and drags the firewall / security-review burden in before anyone chose
 * to take it on. Persisting a CrmSnapshot is a deliberate Layer 2 decision, never
 * a Layer 1 convenience.
 */
export interface CrmSnapshot {
  /** Per-stage records: stage name → count and/or dollar value present in the CRM today. */
  stages?: Array<{ stage: string; count?: number; value?: number; conversionToNext?: number }>;
  /** Observed close/win rate (fraction 0–1 or pct — normalize in the mapper). */
  winRate?: number;
  /** Observed average deal size (ACV). */
  avgDealSize?: number;
  /** Current ARR / starting ARR baseline. */
  startingARR?: number;
  /** Net revenue retention (pct). */
  nrrPercent?: number;
  /** Segment / motion splits the CRM can attest to. */
  segments?: Array<{ name: string; share: number }>;
  /** Headcount reality (sellers on payroll today). */
  currentAeCount?: number;
  /** Anything else the source carries; mapper decides what it trusts. */
  [extra: string]: unknown;
}

/**
 * The ONE mapper both the CSV importer and the future OAuth connector reuse.
 * Pure + deterministic. Maps CRM reality → model parameters, leaving assumption-
 * class fields (cost-per-rep, etc.) to caller-supplied defaults — those are NOT
 * CRM fields. Fields the snapshot does not attest to are simply omitted, so the
 * caller layers them over `DEFAULT_INPUTS`.
 *
 * NOTE: returns a Partial — the snapshot only fills the fields the CRM knows.
 * The caller merges over defaults: `{ ...DEFAULT_INPUTS, ...crmSnapshotToModelInputs(snap) }`.
 */
export function crmSnapshotToModelInputs(snapshot: CrmSnapshot): Partial<ModelInputs> {
  const out: Partial<ModelInputs> = {};
  if (typeof snapshot.startingARR === 'number') out.startingARR = snapshot.startingARR;
  if (typeof snapshot.avgDealSize === 'number') out.avgDealSize = snapshot.avgDealSize;
  if (typeof snapshot.nrrPercent === 'number') out.nrrPercent = snapshot.nrrPercent;
  if (typeof snapshot.currentAeCount === 'number') out.currentAeCount = snapshot.currentAeCount;

  // Win rate → sqoToWonRate (normalize fraction → percent).
  if (typeof snapshot.winRate === 'number') {
    out.sqoToWonRate = snapshot.winRate <= 1 ? snapshot.winRate * 100 : snapshot.winRate;
  }

  // Stage conversions, when the CRM attests to them, seed the funnel gates.
  // Stage→field mapping is intentionally explicit, not positional, so a partial
  // snapshot never silently shifts the wrong rate.
  const byStage = new Map((snapshot.stages || []).map((s) => [String(s.stage).toLowerCase(), s]));
  const conv = (name: string): number | undefined => {
    const r = byStage.get(name)?.conversionToNext;
    if (typeof r !== 'number') return undefined;
    return r <= 1 ? r * 100 : r;
  };
  const inqMql = conv('inquiry'); if (inqMql !== undefined) out.inquiryToMqlRate = inqMql;
  const mqlSql = conv('mql'); if (mqlSql !== undefined) out.mqlToSqlRate = mqlSql;
  const sqlMtg = conv('sql'); if (sqlMtg !== undefined) out.sqlToMeetingRate = sqlMtg;
  const mtgSqo = conv('meeting'); if (mtgSqo !== undefined) out.meetingToSqoRate = mtgSqo;

  return out;
}
