# OpptyCon Persona + Data-Input Audit

> **Status:** v1 first draft. Read top-to-bottom, then edit inline. The audit feeds five
> workstream specs (see §3); none of those should be started until §1 and §2 are honest.
>
> Reads the current alpha (`engine.js` `DEFAULT_INPUTS` + 17 nav modules) against the question
> *"who is this for and what do they actually need to put in for it to work?"* The honest
> answer right now is: an experienced RevOps lead with clean CRM data. Everyone else bounces.
>
> Last touched 2026-05-22 (Claude Code first-draft pass).

---

## 1. Persona Inventory — first-5-minute questions

The questions each role *actually asks* in their first five minutes with the app. If the answer
isn't visible (or isn't on a path they can find without RevOps training), the persona bounces.

The current nav forces all roles through the same 17-module surface, so the implicit answer
right now is "go figure out which modules apply to you." The pane-of-glass spec for each
persona is the curated subset + ordering + language that answers these questions on landing.

### CEO

| # | The first-5-min question | Where the answer currently lives (or doesn't) |
|---|---|---|
| 1 | *Will we hit the number?* | Dashboard → "New ARR Gap" + Glideslope (good, but spread across 2 modules) |
| 2 | *What's the single biggest thing breaking the plan?* | Governance Spine ranks verdicts by severity — closest thing, but buried in nav and named "spine" |
| 3 | *How much money will we burn, and is it affordable?* | P&L → Op margin + Rule of 40 (computed, but no "burn vs runway" framing) |
| 4 | *Where am I over-investing vs under-investing?* | S&M Budget + benchmark band visualization — present but takes orienting |
| 5 | *If I had one more million dollars, where would it go?* | **Not modeled.** No "marginal $ allocator" view. |

### CFO

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *Is unit economics sustainable?* (LTV:CAC, CAC payback, Magic Number) | Dashboard tile row (clearest CFO surface today) |
| 2 | *Burn rate at plan vs revenue projection?* | P&L → Op margin (computed; not framed as monthly burn) |
| 3 | *S&M as % of revenue — growth band or burn?* | Dashboard implicit; explicit in S&M Budget benchmark display |
| 4 | *If Y1 misses by 20%, what happens to Y2 cash?* | **Not modeled.** No sensitivity / variance view. |
| 5 | *Gross margin trajectory?* | Set as static input; not modeled over the horizon |

### CRO / VP Sales

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *Do I have enough ramped quota capacity to hit the number?* | Sales Model + Seller Ramp; well-modeled but split across 2 modules |
| 2 | *Pipeline coverage by quarter — where are the gaps?* | Target Tracker (quarterly) + Forecast agent verdicts |
| 3 | *How many AEs am I short, and when?* | Coverage agent recommends a count; ramp-aware hire timing is implicit, not surfaced |
| 4 | *SDR:AE ratio constraining outbound?* | Coverage agent flags it if <1.0 |
| 5 | *Attainment realism — what's the implied % per AE?* | ICP governance verdict surfaces this when >100% |

### CMO / VP Marketing

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *How many inquiries / MQLs per month does the plan need from me?* | Funnel Health + Marketing Funnel; computation correct, but visualization is funnel-shaped, not calendar-shaped |
| 2 | *CAC payback at current motion mix?* | CAC Breakdown — present, 4 variants from optimistic to all-in (this is a real strength) |
| 3 | *Channel concentration risk?* | Attribution agent verdict if any CREATE channel >40% |
| 4 | *Fixed/variable split healthy for our stage?* | Mktg Budget benchmark display |
| 5 | *Right CREATE/CONVERT/ACCELERATE split?* | Revenue Motions — has the framework; no "recommended for our stage" defaults |

### VC / Investor

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *Rule of 40 + Magic Number — efficient or burning?* | Dashboard (the right surface; clear) |
| 2 | *Multi-year glideslope credible?* | Glideslope + Forecast agent's Y2 feasibility check |
| 3 | *CAC payback months — investable?* | CAC Breakdown — clearest VC surface |
| 4 | *Funding need to hit the plan?* | **Not modeled.** No "cash to plan" or "months of runway implied" view. |
| 5 | *Marketing-led or sales-led business?* | Mktg-sourced % is an input, not a framing tile |

### Operating Board Member

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *Where are we vs plan — quarterly waterfall?* | QBR Metrics — exists, the right surface |
| 2 | *Biggest leading-indicator miss?* | Governance Spine top-severity verdict |
| 3 | *Quota attainment trend?* | Sales Model — single number, not a trend |
| 4 | *Underinvesting in growth or burning toward death?* | S&M benchmark band — answers this if you know to look |
| 5 | *Are the assumptions defensible?* | DocPanel explains each module's assumptions (this is a strength) |

### VP RevOps / Head of GTM (current default persona)

| # | The first-5-min question | Where it lives |
|---|---|---|
| 1 | *Where's the funnel breaking and by how much?* | Funnel Health — the heart of the app |
| 2 | *Cost per SQO / cost per Won by channel?* | Pipeline + CAC Breakdown |
| 3 | *Gap between theoretical and effective capacity?* | Seller Ramp |
| 4 | *Where is the model floor-bound (headcount cost > formula)?* | Floor-bound flags in S&M / Mktg Budget |
| 5 | *Where's the next 5pp of conversion improvement going to come from?* | Stage governance verdicts surface worst stages |

### What this tells us

- The model **answers the questions correctly** for most personas — the problem is **discovery**.
  Each persona has 3-5 questions that map to 3-5 different modules they have to find.
- The CEO and CFO are the most under-served by the current surface. Their questions live
  scattered, and the framing (e.g. "burn rate," "marginal $ allocator," "cash to plan")
  isn't the framing the app uses.
- The VC has the closest fit (Dashboard tiles are basically VC tiles).
- The VP RevOps gets nearly everything — confirms the app is built by/for that persona today.
- Three questions are **not modeled at all**: marginal $ allocator (CEO), variance / sensitivity
  (CFO), funding need / runway (VC). These are real gaps, not just surface issues.

---

## 2. Data-Input Audit — what the app demands vs what teams have

Every input in `DEFAULT_INPUTS` (`engine.js`), tagged:

- 🟢 **Most teams have it cleanly** — finance or HR can answer in a slack ping
- 🟡 **Teams *think* they have it but it's often wrong** — definition fights, denominator confusion,
  attribution disputes, allocation-rule disagreements
- 🔴 **Most teams don't have it at all** — never measured, doesn't fit their CRM, or only the most
  mature orgs track it

The 🟡 and 🔴 buckets are where the alpha is bouncing users today.

### Targets & growth

| Input | Bucket | Honest note |
|---|---|---|
| `targetARR` / `targetMode` / `targetGrowthRate` | 🟢 | Boards set these |
| `startingARR` | 🟢 | Finance knows |
| `planningYears` | 🟢 | Choice, not data |
| `y2GrowthRate`, `y2ConversionLift` | 🔴 | Most teams don't think this granularly past Y1 |

### Deals & cycle

| Input | Bucket | Note |
|---|---|---|
| `avgDealSize` | 🟡 | New-logo vs expansion vs renewal often mashed together; median vs mean confusion |
| `salesCycleWeeks` | 🟡 | Usually a marketing-friendly approximation, not an honest median from CRM |

### Funnel conversion (the 5 rates) — the biggest 🟡 cluster

| Input | Bucket | Note |
|---|---|---|
| `inquiryToMqlRate` | 🟡 | "Inquiry" means different things at different companies; many don't track at all |
| `mqlToSqlRate` | 🟡 | MQL/SQL definitions inconsistent — fight between marketing & sales |
| `sqlToMeetingRate` | 🟡 | Show-rate confusion (set vs held) inflates the number |
| `meetingToSqoRate` | 🟡 | SQO/Stage 2 definitions vary; many teams promote too loosely |
| `sqoToWonRate` | 🟢🟡 | Easier to compute, but cohorting (which won deals from which SQO month) is wrong at most teams |
| `meetingShowRate` | 🔴 | Most teams don't separate set from held |
| `stage1MinPct` | 🔴 | "Discovery minimum amount" is a discipline most teams don't enforce |

**Implication:** The model demands 5 numbers most teams either don't measure or measure wrong.
This is the #1 input-friction wall.

### Sales capacity

| Input | Bucket | Note |
|---|---|---|
| `aeCount`, `sdrsPerAe` | 🟢 | HR knows |
| `aeQuota` | 🟢🟡 | Number is known; gross-booking vs net-ARR confusion is the asterisk |
| `aeRampMonths` | 🟡 | Usually wishful (say 6, actually 9-12) |
| `aeAttritionRate` | 🟡 | Often understated; trailing-12 vs forward-looking confusion |
| `mktgSourcedPct` | 🟡 | Attribution wars — sales and marketing each claim their share; truth lives in the lift, not the credit |

### Phase-shift / lead times

| Input | Bucket | Note |
|---|---|---|
| `sqoLeadQuarters`, `mqlLeadQuarters` | 🔴 | Most teams have never explicitly modeled lead-time-to-revenue |

### Cost model (functional × behavioral)

| Input | Bucket | Note |
|---|---|---|
| `grossMargin` | 🟢 | Finance has it |
| `gAndAPct`, `rAndDPct`, `salesOpexPct`, `variableMktgPct` | 🟡 | Chart of accounts doesn't map cleanly to these buckets — allocation rules vary by company |
| `salesVariablePct`, `fixedMktgPct` | 🔴 | Most marketing teams can't easily split fixed vs variable on their own ledger |
| `martechPctOfVariable` | 🔴 | Finer slicing, rare |

### Marketing budget tiers (Layer 1 selectors)

| Input | Bucket | Note |
|---|---|---|
| `executiveTier`, `pmmTier`, `coreMarTechTier` | 🟢 | Choices, not data — these are well-designed (multi-choice, not free-form) |
| `elasticMktgBreakdown.{revEngineOps,brandContent,prAr}` | 🟡 | Most teams don't have a granular elastic-budget allocation defined |

### Headcount comp

| Input | Bucket | Note |
|---|---|---|
| `aeOTE`, `aeBenefitsLoad`, `sdrOTE`, `sdrBenefitsLoad` | 🟢 | HR has — defaults are good for cyber mid-market |
| `fundingStage`, `leadershipRoles.*` | 🟢 | Choices, not data |

### Retention

| Input | Bucket | Note |
|---|---|---|
| `nrrPercent` | 🟡 | NRR/GRR confusion at small companies; rolling vs trailing-12 timing confusion |
| `existingCustomers` | 🟢 | Easy |
| `churnRate` | 🟡 | Logo churn vs revenue churn vs gross-net — confused in many orgs |

### Pipeline coverage

| Input | Bucket | Note |
|---|---|---|
| `pipelineCoverage` | 🟢🟡 | Number is known; but it's often "all-stage" not Stage 2+ (defeats the purpose) |
| `coverageGreen/Yellow/Red` | 🟢 | Thresholds — conventions, not data |

### Velocity (5 stage durations)

| Input | Bucket | Note |
|---|---|---|
| `velStage1to2` through `velStage5toClose` | 🔴 | Very few teams track median time-in-stage; usually only total cycle, often inflated |

### Channel motions

| Input | Bucket | Note |
|---|---|---|
| `motionAllocation.{create,convert,accelerate}` | 🟡 | Most teams haven't reframed budget as CREATE/CONVERT/ACCELERATE; ledgers aren't built this way |
| `motionChannels.create[].cpl` | 🟡 | CPL by channel sometimes tracked; often only for paid media, not events/content/outbound |
| `motionChannels.convert[].costPerSql` | 🔴 | Cost-to-qualify is almost never measured by channel |
| `motionChannels.accelerate[].costPerAccount` | 🔴 | Almost no team measures ACCELERATE outcomes per-account |
| `accelDaysReduced`, `accelWinRateLift`, `accelAccountsCoverage` | 🔴 | These require an experiment culture most teams don't have |

### Seasonality

| Input | Bucket | Note |
|---|---|---|
| `seasonalityMode`, `seasonalWeights[]` | 🟢 | Presets cover most teams; custom is rare but easy |

### Revenue split

| Input | Bucket | Note |
|---|---|---|
| `revenueMode`, `newLogoPct` | 🟡 | Many teams don't cleanly separate new-logo from expansion in plan |
| `expansionAvgDeal`, `expansionSqoToWon`, `expansionCycleWeeks` | 🔴 | Expansion is usually modeled as a single number, not as its own funnel |

### Summary

- **~50 inputs total. Bucket counts:**
  - 🟢 ~18 (clean)
  - 🟡 ~17 (often-wrong)
  - 🔴 ~15 (don't have)
- **The 🔴 cluster is where the alpha quietly fails today** — defaults exist but users can't
  honestly validate or override them. They tend to accept the defaults, get a result that
  *might* be wrong, and don't know which way.

---

## 3. Implications for the five workstreams

What this audit unblocks for the planned work:

### A. Persona "pane of glass"
Each persona view needs to:
- Open with the 3-5 questions from §1 above as the *only* thing visible on landing
- Each question links to the module that answers it (curated, not the full 17-module nav)
- Use the persona's language (CFO sees "burn rate," not "S&M as %")
- Surface the 3 *not-modeled-at-all* gaps as explicit "coming soon" or "needs build" tiles —
  better to acknowledge a gap than to bury the question

### B. Onboarding / order of operations
- First-run: ask role → route to that persona view
- Inputs presented in the order each persona thinks about them, not the order `engine.js`
  declares them
- Every 🟡 or 🔴 input gets an "I don't have this — use a sensible default" affordance with
  the default visible and the implication of accepting it explained ("at this default,
  expect ±X% variance in result Y")

### C. Data realism (the deepest workstream)
Touches the model. Required moves:
- Every input must support a "confidence flag": low / medium / high
- 🔴 inputs default to "low confidence" and the result shows a confidence-banded range, not a
  point estimate
- "I don't know" must be a first-class input value — model uses defaults + flags downstream
  outputs as derived-from-defaults
- Outputs that depend on multiple 🔴 inputs should be visually marked as "directional, not
  forecast"

### D. Real dates instead of abstract quarters
- Add a `planStartDate` input (defaults to today, calendar picker)
- `MONTHS`, `QUARTERS`, year labels become bounded ranges anchored to `planStartDate`, not
  hard-coded `["Jan",...,"Dec"]` and `["Q1",...,"Q4"]`
- Quarter labels become e.g. "Q1 2026 (Mar-May)" so users don't have to translate
- This affects: `monthly` array generation, `yearTargets`, `quarterlyTargets`, all chart
  X-axes, governance verdicts that reference quarters

### E. Pre-engagement governance gap (rats-nest CRMs)
- Add a "Phase 0 — CRM hygiene" module before the modeling engine kicks in
- It answers: *can we trust our funnel numbers, or do we need to fix the source first?*
- Concrete checks: stage definition consistency, MQL→SQL handoff lag, lost-deal data quality,
  attribution-source completeness, set-vs-held tracking — each scored
- Output: a "data confidence" verdict that gates whether modeling output is forecast vs
  directional
- This addresses the user's flag that the current governance framework presumes clean source
  data that often doesn't exist

---

## 4. What this doc is NOT

- It's not a roadmap. Sequencing of A–E is in `STATE.md` / a separate planning doc.
- It's not a feature spec. Each workstream will need its own design doc with mocks and
  acceptance criteria.
- It's not a UX critique of the current visual design. The DS work is separate (see
  `DESIGN-SYSTEM.md`).
- It's an honest read of *who the current alpha actually works for* and *where input
  friction silently breaks the experience for everyone else*.
