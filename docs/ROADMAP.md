# ROADMAP & COHERENCE AUDIT — OpptyCon vs the NetherOps doctrine

> **What this doc is for.** Compare what `netherops.com/doctrine/`, `/spine-v4`, and
> `/agent-specs` *claim* the framework does to what OpptyCon *actually delivers* today.
> Surface the bidirectional gaps. Recommend whether to trim the site or build the product —
> and in what order.
>
> Status: v1 first draft. Mark up inline. Decisions belong in commits and the open-items
> list at the end.
>
> Last touched 2026-05-22 (Claude Code first-draft pass after shipping six audit workstreams).

---

## 1. Where OpptyCon is today

The deployed product as of 2026-05-22, after the day's shipping run:

### 1a. Core modeling engine

What the engine actually computes (`src/engine.js`, ~1,130 lines):

- Per-month / per-quarter / per-year ARR trajectory (1–3 year horizon)
- 6-stage funnel: Inquiry → MQL → SQL → Meeting Held → SQO → Closed Won
- Phase-shifted lead times (SQO lead quarters, MQL lead quarters)
- AE ramp + attrition + capacity coverage math
- Marketing-sourced vs AE-sourced split
- Dual-axis cost model (functional × behavioral)
- Marketing budget decomposition (3-layer: structural floors, elastic, motion-allocated)
- Sales budget decomposition (AE / SDR / SE comp, tools, enablement, travel)
- Leadership cost layer by funding stage
- Three-motion model (CREATE / CONVERT / ACCELERATE) with channels inside each
- New logo vs expansion split (blended or split mode)
- NORAM seasonality + calendar-anchored labels
- Time-horizon planner with lever ladder (just shipped)

### 1b. Persona views (workstream A)

Curated entry views for 7 personas: CFO, CEO, CRO, CMO, VC, Board, RevOps. Each answers
the 5 first-5-min questions from `PERSONA-AND-DATA-AUDIT.md §1`.

### 1c. Module nav (existing)

| Section | Modules |
|---|---|
| Persona Views | CFO · CEO · CRO · CMO · VC · Board · RevOps |
| Revenue | Target Tracker · Glideslope · QBR Metrics · Weekly Tracker |
| Pipeline | Funnel Health · Pipeline · Marketing Funnel · Velocity |
| GTM Economics | S&M Budget · Mktg Budget · Revenue Motions · CAC Breakdown · Sales Model · Seller Ramp |
| Finance | P&L |
| System | **Phase 0 — CRM Readiness** · Governance Spine · Data Sources · Architecture |

### 1d. Governance ("Spine") — what's actually evaluated

`src/governance.js` evaluates **six domains** and emits prioritized verdicts:

1. **P&L** (governance layer) — burn risk, underinvest, CAC ceiling, Rule of 40, contribution margin, floor-bound flags, leadership cost load
2. **Stage Definitions** (governance layer) — funnel grade, bottleneck stages, compression, velocity, show rate
3. **ICP Governance** (governance layer) — attainment realism, quota coverage
4. **Coverage Agent** (agent layer) — ramp gap, attrition impact, deal load, SDR ratio
5. **Attribution Agent** (agent layer) — CREATE motion ROI, ACCELERATE coverage, channel concentration, mktg-sourced %
6. **Forecast Agent** (agent layer) — multi-year feasibility, quarterly coverage

Output: prioritized verdicts (critical / warning / healthy / info) + system health rollup + per-node health for the architecture diagram.

### 1e. Cross-cutting features shipped today

- **Onboarding wizard** routes by role → persona view (workstream B)
- **Data Confidence Callout** flags when too many hard-to-measure inputs are still at defaults (workstream C v1)
- **Calendar-anchored labels** — every month/quarter/year shows real dates (workstream D)
- **Horizon Planner** — time-bounded feasibility + lever ladder (workstream F)
- **Phase 0 CRM Readiness diagnostic** — A-F grade across 15 hygiene questions (workstream E)

---

## 2. What the netherops.com doctrine claims

Pulled from `doctrine/index.html` (1,196 LOC), `spine-v4.html` (1,116 LOC), `agent-specs.html` (451 LOC).

### 2a. The doctrine page (`/doctrine/`)

Claims a **seven-layer control system**:

1. Economic Model (set point)
2. ICP Governance
3. Pipeline Architecture
4. Stage Definitions
5. Agent Layer
6. Execution Systems
7. Attribution & Feedback

Plus **five vertical enforcement agents**: P&L Agent · Stage Gate Agent · Coverage Agent · Attribution Agent · Orchestration Agent.

Plus **seven acquisition motions**: Inbound Content · Inbound Paid · Outbound Signal-Led · Outbound Account-Based · Partner & Channel · Product-Led · Community & Events.

Plus a Revenue Thermostat metaphor, Identity Graph concept, Sovereignty Map, Motion Map, OpptyCon-as-engine framing.

### 2b. Spine-v4 (the deeper framework)

Claims significantly more than the doctrine page:

- **Dual probability model** — P_base (structural readiness) × P_accel (behavioral acceleration) drives motion routing across four quadrants
- **Expanded agent set — 11 agents**: Attribution & Learning · Qualification · Motion · Partner · Field Acceleration · Customer Health · Territory Allocation · Orchestration · Product Intelligence · Marketing Narrative · Signal & Intent
- **7 motion domains** (not the 3 of OpptyCon): Inbound/PLG · Outbound · ABM · Partner/Channel · Field Acceleration · Customer Expansion · Churn Control
- **BDR bifurcation** — Cold Exploration vs Signal-Enabled Interception as distinct execution tracks
- **Pod architecture** — Territory + Pod mapping with APS, motion track, narrative package
- **Customer Health Agent** — health score · churn probability · expansion probability, feeding back into ICP recalibration and P&L
- **Velocity as a diagnostic metric** (not just progress tracking) — friction detection from stage-static vs weak-stage-motion patterns

### 2c. Agent-specs (the build queue)

Claims a **control plane** built on four primitives:

1. **Identity** — canonical IDs, deduplication, parent mapping
2. **Permissions** — role × domain × environment
3. **Provenance** — every decision logs inputs, weights, model version, tool calls, output
4. **Approvals** — human gates for high-impact actions

Plus **10 agents in the registry** with a phased build (read-only → recommend → write):

| Phase | Agents |
|---|---|
| A | Identity & Hygiene · Provenance & Audit |
| B | Signal & Scoring · Routing & SLA |
| C | P&L / Unit Economics · Forecast / Stage Ledger |
| D | Motion Orchestration · Content / Positioning |
| E | Experimentation · Security / Governance |

### 2d. Sovereignty Map (`/sovereignty-map`)

Claims a **sovereignty principle**: *"Control lives where judgment occurs, not where data flows."*

Four verdict categories per layer: **Never Vendor · Build · Hybrid · Vendor Acceptable**.

A 5-layer **Sovereignty Stack** with explicit build-vs-buy verdicts:

| Layer | Build verdict | Reason |
|---|---|---|
| L01 — Revenue Feedback & Reweighting | Build | Strategic; correction logic must be internal |
| L02 — Orchestration & Velocity | Hybrid | Vendor infra OK; routing logic proprietary |
| Telemetry Ingestion | Hybrid | Raw signal can come from vendors |
| L03 — Signal Interpretation Engine | Build | Core IP — probability weighting + decay constants |
| L04 — ICP Economic Clustering | Build | Proprietary Revenue Density math |
| L05 — P&L Economic Gravity | Never Vendor | Internal truth — ARR/CAC/LTV decisions live here |

Plus a **Portfolio Engine** framing: single company vs portfolio-level architecture with central adjudication core + per-asset tooling variation.

### 2e. Split-Funnel Map (`/split-funnel-map`)

Claims **seven acquisition lanes** (different from the doctrine page's seven motions, different from OpptyCon's three motions — a *third* taxonomy):

| Lane | Name | Behavior |
|---|---|---|
| L01 | Demand Capture | Inbound high-intent hand-raise (demo, contact, pricing) |
| L02 | Demand Conditioning | Content-driven, no explicit hand-raise (webinar, whitepaper) |
| L03 | Exploration Capital | Outbound cold, no signal trigger (BDR within ICP cluster) |
| L04 | Interception Capital | Signal-enabled, APS ≥ threshold (intent surge, trigger event) |
| L05 | Distribution Multiplied | Partner/channel co-sell, alliance, referral |
| L06 | Stakeholder Compression | Field acceleration, multi-thread, S2→Close compression |
| L07 | Revenue Density Motion | Expansion, cross-sell, upsell, renewal, churn prevention |

**Overlays** (applied across all lanes): Segment SPI Cluster · Geo/Territory · Pod Assignment · Capacity Limits. Principle: *"same channel, different KPI by lane."*

### 2f. Lexicon (`/lexicon`) — the canonical terminology source

This page is the **single biggest divergence** between doctrine and OpptyCon. It explicitly *retires* the terminology OpptyCon is built on.

**Replaced legacy terms** (the lexicon's own framing):

| Retired | What replaces it |
|---|---|
| **MQL** | APS (Account Probability Score) at threshold |
| **Funnel** | Acquisition Lanes + Stage Ledger |
| **Attribution** | Provenance + Learning Latency |
| **Awareness** | Demand Conditioning (Lane 02) |
| **Demand Gen** | Lane-specific capture motions |
| **Lead** | Contact (tied to Account via role mapping) |
| **CPL** | Cost per Lane Outcome (lane-specific KPI) |
| **ROI** | SPI delta + Revenue Density delta |

**New canonical terminology:**

- **SPI (Segment Profitability Index)** — 3-year gross margin return multiple per acquisition dollar, by segment. *The anchor metric.*
- **Revenue Density** — `(Win Rate × ACV × Margin × Retention) ÷ Sales Cycle Length`. Capital flows to high density.
- **P_base / P_accel** — structural readiness × behavioral velocity (the dual probability model)
- **Narrative Receptivity** — ICP dimension: category maturity × disruption tolerance × strategic influence
- **Account Atomicity** — all signal/routing decisions at account-level, not lead-level
- **Opportunity Integrity** — governed creation tied to buying groups
- **Learning Latency** — time from motion deployment to validated revenue lift
- **Correction Latency** — time from error detection to model reweighting
- **ABX** — account-based experience (the umbrella term)

**Operating principle (the lexicon's own one-liner):**
> *Channels execute. Motions coordinate. Agents govern. Segments prioritize. Economics decide.*

### 2g. Identity Graph (`/identity-graph`)

Claims an **atomic unit shift**: Account is the unit, not Lead/Contact.

**5 resolution domains**: Lead→Account · Lead→Contact · Contact→Opportunity · Account→Opportunity Integrity · Activity & Campaign Mapping.

**5 buying-group roles** (each weighted in APS): Economic Buyer · Technical Buyer · Champion · Influencer · Blocker.

**Account State lifecycle**: `Cold → Conditioning → Warming → Active → Expansion → Dormant`.

**Failure cascades** — when CRM hygiene breaks, what downstream agents see:
- Orphan leads → APS noise → false-positive routing
- Duplicate accounts → split history → understated probability
- No contact roles → buying group unknown → stage inflation → forecast miss
- Untagged campaigns → Learning Agent blind → cannot measure lane lift
- Territory misalignment → wrong pod assignment → capacity over/under-load
- Subsidiary unmapped → parent treated separately → ICP scoring fragmented

Principle: *"No agent operates on CRM primitives — they operate on the normalized graph."*

### 2h. Infrastructure (`/infrastructure`)

Claims an **8-layer infrastructure stack** that must exist before agent autonomy:

1. Canonical Data Layer (ID graph, dedupe policy)
2. Data Pipeline & Event Model (connectors, freshness)
3. Control Plane Services (RBAC, Policy Engine, Provenance Logging)
4. Tooling Layer (permissions, validation, rate limits, approvals, logging, fail-safe)
5. Human-in-the-Loop Workflow (queues, approvers, escalation)
6. Evaluation Harness (offline replay, golden datasets, metrics)
7. Observability & Incident Response (monitoring, alerts, kill switch, rollbacks)
8. Environment & Deployment Discipline (dev/staging/prod, versioning, CI/CD)

**MVP survival stack** (5 components): Identity Graph + dedupe · Event Schema · Tool Wrappers + permissions · Approval Workflow · Provenance + monitoring.

Principle: *"Infrastructure first, autonomy later. Treat agents like production software."*

### 2i. Provenance (`/provenance`)

Claims provenance is a **horizontal audit plane**, not a vertical layer. *"No autonomous action without provenance logging."*

**Five provenance domains** with specific schemas:

| Domain | Logs (excerpt) |
|---|---|
| **Signal Provenance (L04)** | sources[], weights{}, decay_constants, icp_modifiers, model_version, timestamp |
| **Model Provenance (L01)** | cohort_window, cluster_id, error_threshold, weight_delta, version_change, approver |
| **Routing Provenance (L02)** | threshold_active, capacity_state, agent_fired, account_state, territory_assigned, motion_track |
| **Economic Provenance (L06)** | spi_delta, cac_assumption, coverage_multiple, margin_constraint |
| **Vendor Provenance Boundary** | vendor_id, signal_type, raw_value, normalization, internal_weight |

**Promises:**
- Every probability score is decomposable
- Every routing decision is reconstructable
- Every correction event is explainable
- Every capital shift is traceable to economic logic

*"Provenance replaces attribution as the governing discipline."* Immutable, append-only.

### 2j. About page (`/about`)

Claims a **three-layer brand-to-product hierarchy**:

1. **Heretics** — the philosophy / orthodoxy challenge
2. **NetherOps** — the operations / governing methodology
3. **OpptyCon** — the engine / opportunity physics

Framing diagnoses: *"motion without clarity,"* *"hidden operational layer"* — between marketing, sales, ops, finance. Each function produces separate numbers; no shared layer governs them all.

Promise: *"makes the hidden layer explicit; analyzes flow of opportunity across the entire operating model."*

### 2k. OpptyCon LP + the five persona pages (`/opptycon/*`)

The OpptyCon landing page itself promises:

- **24+ months modeled** (multi-year horizon ✓)
- **3.2× coverage enforcement** (specific ratio — site-only, not defined elsewhere)
- **Dual cost axes** (functional × behavioral ✓)
- **ΔQ phase-shifted funnel** (notation specific to this page — Q4 spend → Q1 pipeline)
- **Multi-source pipeline split** (mktg-sourced vs sales-sourced ✓)
- **Attrition modeling with monthly weight distributions** (✓ in engine)

Tagline: *"Replaces narrative with mechanics. Planning becomes engineering, not theater."*

**Five marketing personas** with dedicated LPs:

| Site persona LP | Diagnosis framing | Promises |
|---|---|---|
| **Operators** (`/opptycon/operators/`) | *"Noble little disaster"* — disconnected systems, attribution theater, dirty inputs | Signal integrity, governed definitions, leakage identification by stage/source/time |
| **GTM Leaders** (`/opptycon/heads-of-gtm/`) | *"Hall of mirrors"* — unstable assumptions, budget pressure, neat-story expectations | Economic coherence, structural-constraint identification, governed decision-making (not reactive reporting) |
| **Finance** (`/opptycon/finance/`) | *"Costume drama disguised as forecasting"* — squishy attribution, inflated confidence | Testable assumptions, spend-to-return logic by motion/source/time, risk-point visibility |
| **Leadership** (`/opptycon/leadership/`) | *"Oldest executive disease"* — fragmented truth, no shared operational logic | Cross-functional alignment, structural-bottleneck identification, governed thresholds vs *"executive weather patterns"* |
| **Capital** (`/opptycon/capital/`) | *"Pricing conviction into incomplete information"* — polished data, operating collapse under scrutiny | Revenue-system maturity assessment, growth-durability signal, *"physics vs stagecraft"* comparison |

Persona-page voice signature: each opens with a sharp diagnosis (*"hall of mirrors,"* *"costume drama,"* *"executive weather patterns"*), lists 5 capabilities, lists 5-7 outcomes, ends with 5 things the persona *"can finally control."*

---

## 3. Gap analysis — bidirectional

### 3a. SITE PROMISES, OPPTYCON DOESN'T HAVE (over-promise)

Significantly larger than the v1 audit. Grouped by category for sanity:

**Agent / control-plane infrastructure (the agent-specs vision)**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| 11 agents (spine-v4) / 10 agents (agent-specs registry) | 6 governance domains (verdict engine, not agents) | 🔴 |
| Control plane primitives (Identity, Permissions, Provenance, Approvals) | Not in product | 🔴 Infrastructure gap |
| Read-only → recommend → write agent progression | Not in product | 🔴 |
| Provenance logging — 5 domains with schemas | Not in product | 🔴 The largest unbuilt claim |
| Approval workflow / human gates / kill switches | Not in product | 🔴 |
| Policy-as-code enforcement | Not in product | 🔴 |
| Evaluation harness (offline replay, golden datasets) | Not in product | 🔴 |
| 8-layer infrastructure stack | Not in product (it's a single React app) | 🟡 Aspirational frame |

**Probability & signal model (the spine-v4 dual-probability vision)**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| Dual probability model (P_base × P_accel) | Not in product | 🔴 |
| APS (Account Probability Score) at threshold | Not in product (still uses MQL gates) | 🔴 |
| Signal decay constants, decay λ | Not in product | 🔴 |
| Probability quadrants driving motion routing | Not in product | 🔴 |
| Signal & Intent Agent / Signal Provenance | Not in product | 🔴 |
| Confidence threshold + evidence per decision | Not in product | 🔴 |

**Account-atomic model (the identity-graph vision)**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| Account as atomic unit (not Lead/Contact) | OpptyCon models at deal-funnel level | 🔴 Framework mismatch |
| 5 buying-group roles weighted in APS | Not in product | 🔴 |
| Account State lifecycle (Cold → ... → Dormant) | Not in product | 🔴 |
| Identity Graph (canonical IDs, dedupe, parent mapping) | Not in product | 🔴 |
| Failure-cascade detection from CRM corruption | Phase 0 diagnostic partial coverage (self-assessment, not detection) | 🟡 |

**Acquisition / motion model — multiple competing taxonomies**

| Site source | Claims | OpptyCon |
|---|---|---|
| doctrine page | 7 acquisition motions (Inbound Content, Inbound Paid, etc.) | 3 motions (CREATE/CONVERT/ACCELERATE) |
| split-funnel-map | 7 acquisition LANES (Capture, Conditioning, Cold, Interception, etc.) | 3 motions |
| OpptyCon engine | 3 motions (CREATE/CONVERT/ACCELERATE) | same |

This is a **three-way taxonomy collision** — the doctrine page, the split-funnel-map page, and the product all use different categorizations of essentially the same thing. The doctrine's "motions" and split-funnel's "lanes" aren't equivalent either. 🔴 Severity: high.

**Customer-side: expansion + retention + health (the Customer Health Agent vision)**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| Customer Health Agent — health score, churn prob, expansion prob | Only NRR % + churn rate inputs | 🔴 |
| ICP recalibration via Customer Health feedback loop | Static ICP inputs only | 🔴 |
| Revenue Density Motion (Lane 07 — expansion/cross-sell/renewal) | Expansion is a top-level revenueMode toggle, not a modeled motion | 🔴 |
| Narrative Receptivity (ICP dimension) | Not in product | 🔴 |

**Territory / pod / capacity (the spine-v4 + split-funnel field-execution vision)**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| Territory + Pod architecture with APS-driven assignment | Single AE count input | 🔴 |
| BDR bifurcation: Cold Exploration vs Signal Interception | Single SDR ratio input | 🟡 |
| Capacity overlay across acquisition lanes | Capacity is a single AE-bench number | 🟡 |
| Field Acceleration Agent | Not in product | 🔴 |

**Economic anchor metrics**

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| SPI (Segment Profitability Index) — 3-yr gross margin return per acquisition $ | Not in product | 🔴 The anchor metric, missing |
| Revenue Density = `(Win Rate × ACV × Margin × Retention) ÷ Sales Cycle Length` | Not computed | 🔴 |
| Cost per Lane Outcome (lane-specific KPI) | CAC + CPL, not lane-specific | 🟡 |
| Learning Latency / Correction Latency | Not measured | 🔴 |
| Sovereignty Stack (build/hybrid/never-vendor verdicts by layer) | Not in product | 🟢 Sovereignty is a marketing/positioning concept, not modeled |

**OpptyCon LP-specific (the /opptycon/index claims)**

| Site claim | OpptyCon reality |
|---|---|
| "3.2× coverage enforcement" (specific number on LP) | Coverage default is 300%, threshold 250%/350% — the 3.2× number isn't anywhere in the product |
| "ΔQ phase-shifted funnel" notation | Phase-shift exists in engine but the ΔQ notation doesn't appear in UI |
| "Five vantage points" (Operators / GTM Leaders / Finance / Leadership / Capital) | Product has SEVEN persona views (CFO/CEO/CRO/CMO/VC/Board/RevOps) — **persona mismatch flagged below** |

### 3b. OPPTYCON HAS, SITE DOESN'T EXPLAIN (under-explain)

| OpptyCon feature | Site coverage | Severity |
|---|---|---|
| 7 Persona Views (CFO/CEO/CRO/CMO/VC/Board/RevOps) | Not mentioned | 🟢 Add to site |
| Phase 0 — CRM Readiness diagnostic | Not mentioned | 🟢 Add to site |
| Horizon Planner (time-bounded + lever ladder) | Not mentioned | 🟢 Add to site |
| Data Confidence Callout (silent default detection) | Not mentioned | 🟢 Add to site |
| Calendar-anchored labels | Not mentioned | 🟢 Add to site |
| 4 CAC variants (programmatic → all-in) | Not mentioned | 🟢 Add to site |
| Funnel Health grading (A-D) | Hinted at via Stage Gate Agent claim | 🟢 Sharpen on site |
| Glideslope with seasonality + NORAM weights | Hinted at via "time-aware modeling" claim | 🟢 Sharpen on site |
| Multi-year planning horizon (Y2 growth + conversion lift) | Hinted at via "24+ month" claim | 🟢 Sharpen on site |
| Onboarding wizard with role → persona routing | Not mentioned | 🟢 Add to site |

### 3b-bis. PERSONA MISMATCH — easy fix, visible everywhere

The site's OpptyCon LP advertises **five vantage points** with dedicated landing pages:
*Operators · GTM Leaders · Finance · Leadership · Capital*.

The product now ships **seven persona views**:
*CFO · CEO · CRO · CMO · VC · Board · RevOps*.

Approximate mapping:

| Site persona | OpptyCon view(s) | Mapping quality |
|---|---|---|
| Operators | **RevOps** | 1:1 ✓ |
| GTM Leaders | **CRO + CMO** (split into two) | 1:2 — site collapses two roles |
| Finance | **CFO** | 1:1 ✓ |
| Leadership | **CEO + Board** (split into two) | 1:2 — site collapses two roles |
| Capital | **VC** | 1:1 ✓ |

Three options to reconcile:

- **Split the site LPs to match product** — add a CMO LP (operationally distinct from CRO) and a Board LP (operationally distinct from CEO). Site goes from 5 → 7 LPs.
- **Collapse product views to match site** — merge CRO+CMO into "GTM Leaders," merge CEO+Board into "Leadership." Product goes from 7 → 5 views.
- **Bridge with a mapping table on each LP** — keep both, add a "this maps to N views in the product" callout. Lowest cost; honest.

I'd recommend **split the site LPs (5 → 7)** — the product's persona breakdown is more useful for buyers (CFOs and CEOs ask different questions; same for CMOs vs CROs). The audit doc that drove the persona views (`PERSONA-AND-DATA-AUDIT.md §1`) supports this split.

### 3d. THE TERMINOLOGY COLLISION (the biggest single find)

The `/lexicon` page explicitly **retires** the funnel-based terminology OpptyCon is built on:

| Retired by the doctrine | What OpptyCon uses today |
|---|---|
| **MQL** (retired) | Inquiry → MQL → SQL → SQO funnel is core to engine |
| **Funnel** (retired) | "Funnel Health" is a top-nav module |
| **Attribution** (retired in favor of Provenance) | "Attribution Agent" is one of 6 governance domains |
| **Demand Gen** (retired) | "Marketing Funnel" module exists |
| **Lead** (retired in favor of Account+Contact) | Engine logic uses lead/inquiry primitives |
| **CPL** (retired) | CPL is an input field per CREATE channel |
| **ROI** (retired) | ROI shown on Channel cohort table, CMO view |
| **Awareness** (retired in favor of Demand Conditioning) | Not used by OpptyCon — but doctrine uses awareness elsewhere |

This isn't "site over-promises something unbuilt." This is "site retires terminology the product is *built on*."

Three options to reconcile:

- **A. Doctrine wins** — retire funnel/MQL/attribution from OpptyCon. Rebuild the model on APS / Account / Lane / Provenance / SPI / Revenue Density. **Massive product change.** 6-12 months minimum, possibly longer. The 7 persona views, Phase 0, Horizon Planner, Data Confidence callout all reference the legacy terms and would need rebuilds.
- **B. Product wins** — update the lexicon to acknowledge that funnel/MQL/attribution remain in active use because the buyer's CRM is built on them. Treat doctrine's terminology as forward-looking *aspirational* (what we'd use in a fully-governed system); doctrine acknowledges current reality. **Site copy edit only.**
- **C. Bridge** — keep both, but the lexicon explicitly labels the old terms as "transitional" and explains what each new term replaces it with. Doctrine evolution path is documented. Product can adopt new terms over multiple quarters. **The honest middle.**

Path B is fastest. Path C is most honest. Path A is the doctrine taken to its conclusion, but probably impractical without changing what OpptyCon is *for*.

This is the single biggest decision in the audit — bigger than the 11-agents-vs-6-domains gap. The terminology collision is in every user's first 5 minutes with the property; the agent-architecture gap is invisible until you read the spine-v4 page.

### 3c. ALIGNED (site claim ↔ product reality match)

| What both have |
|---|
| 7-layer spine framing (loose alignment — OpptyCon's modules roughly map to the layers) |
| P&L Agent / governance domain ✓ |
| Stage Gate Agent / Stage Definitions governance ✓ |
| Coverage Agent ✓ |
| Attribution Agent ✓ |
| Phase-shifted funnel (sqoLeadQuarters, mqlLeadQuarters in OpptyCon) ✓ |
| Revenue Thermostat (visual concept in ArchitectureDiagram) ✓ |
| Marketing-sourced % attribution ✓ |
| CAC ceiling enforcement ✓ |

---

## 4. The strategic choice

Three honest paths. Pick one, decide what to ship in what order. Mixed is fine — but the
mix needs explicit decisions.

### Path A — Trim the site to match the product

**Move:** demote `spine-v4` and `agent-specs` from "current state" to "design intent."
Update `/doctrine` to describe what OpptyCon actually does today (6 domains, 3 motions,
phase-shifted modeling, persona views, Phase 0 hygiene). Keep the doctrine framing but
remove the unbuilt-as-fact claims (dual probability, 11 agents, BDR bifurcation, control
plane primitives, Customer Health Agent).

**Pros:** Site becomes honest immediately. Reduces buyer letdown when the product is
demoed. Lower risk on positioning conversations.

**Cons:** Loses the ambitious framing that makes the IP interesting. The 11-agent +
control-plane story is what differentiates NetherOps from another "GTM tool."

**Effort:** ~1-2 days of site copy work.

### Path B — Build OpptyCon to match the site

**Move:** treat the doctrine as the spec. Sequence the missing pieces: provenance logging
first (cheap, infrastructure), then Customer Health Agent (high value), then dual
probability model (research-y), etc.

**Pros:** Product catches up to the IP. Differentiation holds.

**Cons:** Big build queue. Probably 6-12 months of focused product work just to close the
gaps surfaced in §3a. Risk of marketing-driven-roadmap (build what the site says, not what
buyers ask for).

**Effort:** 6-12 months at current velocity.

### Path C — Reframe both: doctrine ↔ live product, doctrine ↔ design intent

**Move:** explicitly split the site into two tiers.

1. *"What OpptyCon does today"* — pages describing the live product (6 domains, 3 motions,
   persona views, Phase 0). This is what buyers see first.
2. *"The NetherOps Doctrine (design intent)"* — pages describing the full 11-agent, dual-
   probability, control-plane vision. Clearly labeled as the design horizon, not the
   shipped state.

Buyer journey: ship → doctrine → roadmap conversation. Marketing gets to keep the
ambitious framing; product doesn't carry it as a present-tense lie.

**Pros:** Honest AND ambitious. Buyer can see both the today-reality and the where-it's-
going vision. Frames the IP correctly. Standard pattern for any platform with a roadmap.

**Cons:** Requires the discipline to mark every page as one or the other. Easy to drift.

**Effort:** ~3-5 days of site reorganization + an ongoing labelling discipline.

---

## 5. Recommendation

**Path C, sequenced as:**

1. **Week 1 — Site reorganization (no product build).**
   - Split `/doctrine` into `/doctrine/today` (live product) and `/doctrine/design` (full vision)
   - On every spine-v4 / agent-specs / sovereignty-map / split-funnel-map / identity-graph /
     infrastructure / provenance claim, add a `📍 SHIPPED` / `🛠️ ROADMAP` / `🔬 RESEARCH`
     badge that grounds the reader
   - **Address §3d (terminology collision) explicitly** — pick Path B or C and update the
     `/lexicon` page. This is the single most pressing edit; the lexicon currently retires
     terminology the product is built on.
   - **Address §3b-bis (persona mismatch)** — site has 5 `/opptycon/*` LPs, product has 7
     persona views. Split site LPs to 7, or add mapping callouts. Recommended: split.
   - Add a `/roadmap` page that's the public version of this doc, kept current
2. **Weeks 2-4 — Highest-leverage doctrine-to-product builds.**
   - **Provenance logging** for every model decision (cheap, foundational, unlocks future agent work)
   - **Customer Health surface** — add NRR + churn-prob + expansion-prob as first-class
     inputs feeding into a "Retention & Expansion" view (the gap that's most felt by CFOs/CROs)
   - **Velocity as diagnostic** — promote the existing velocity module from "display" to
     "flag stalls vs benchmarks" (small change, big perception win)
3. **Months 2-3 — Bigger product moves (do these only if Weeks 2-4 land well).**
   - Dual probability model (P_base × P_accel) in the Pipeline module (research → MVP)
   - BDR bifurcation as a sales-org input (split SDR count into "cold prospecting" and
     "signal-interception" pools — feeds the Coverage agent and Pipeline math)
   - Identity Graph primitive (light version — canonical lead/account IDs in the data
     ingestion adapter)
   - **Resolve the motion-taxonomy collision** — doctrine says 7 motions, split-funnel says
     7 lanes, OpptyCon uses 3 motions. Pick one taxonomy and use it everywhere. Most
     pragmatic: align doctrine to product (3 motions); upgrade if/when segmentation
     supports lane-level KPIs.
   - **SPI + Revenue Density** as first-class computed metrics (lexicon names them the
     anchor metrics; product doesn't compute either)

The other big gaps from §3a (full 11-agent registry, 8-layer infrastructure stack,
Account-atomic refactor, Territory + Pod, Sovereignty stack adjudicator, full provenance
chain) are real product work — months 4+ or never. Their visibility on the site should be
behind the `🔬 RESEARCH` badges from Week 1, or moved to a separate `/research` section.

---

## 6. Why this matters (the read between the lines)

Look at the bidirectional pattern:

- The **site over-promises on the COMPONENT MODEL** (11 agents, 4 primitives, dual probability)
- The **product over-delivers on the USER EXPERIENCE** (7 persona views, Phase 0 diagnostic,
  Horizon Planner with lever ladder, calendar dates)

That's a coherent signal: the IP framing is RevOps-architect-centric (frameworks, agents,
control planes) while the product is becoming CFO/CEO/Board-centric (persona views, plain-
English question framing, gap callouts). The persona-view investment is making OpptyCon
useful to non-RevOps buyers — which is the right move for the GTM, but it's drifting from
the doctrine's framing.

Two ways to read that:

- **The doctrine is correct, the product is drifting.** Re-anchor to the doctrine; the
  current product-side work has been good but secondary.
- **The product is correct, the doctrine is dated.** Update the doctrine to reflect that
  the buyer is the CFO/CEO making operating decisions, not the RevOps architect building
  control planes.

The truth is probably between. The persona views are pure value-add — they don't conflict
with the doctrine, they translate it. The doctrine framing of agents + control plane is
still the right strategic IP — but it's a *strategic horizon*, not a *current product
state*, and labelling it accordingly is what makes the story honest.

---

## 7. Open items / decisions needed

These need a human call. None can be made from the audit alone.

- [ ] **Pick a path (A / B / C).** The audit recommends C; the user should commit.
- [ ] **Decide who maintains this doc.** A roadmap doc that goes stale is worse than no
      doc at all. Quarterly review at minimum, plus update on every meaningful product ship.
- [ ] **Decide on the `/roadmap` page format.** Public, gated, or internal-only?
- [ ] **Provenance logging scope.** Audit every model decision, or only governance verdicts?
      Storage: localStorage, IndexedDB, or backend service?
- [ ] **Customer Health surface scope.** Add new inputs + new module, or layer on top of
      the existing P&L / retention math?
- [ ] **What to do with the existing `/spine-v4` page.** Trim to claims that match v1.0 of
      the product, or keep as `/spine-v4-design` with badges?
- [ ] **Marketing positioning.** Does updating the doctrine page change how the property
      gets pitched in sales conversations? If yes, what's the new pitch?

---

## 6. Field Audit module — queued (2026-05-23)

**User input:** SFDC/MAP field best-practices spreadsheet, queued for inclusion as a new diagnostic module ([source data preserved at `docs/FIELD-AUDIT-SOURCE.md`](./FIELD-AUDIT-SOURCE.md)).

### What it is

A check-box-driven audit of attribution and pipeline field hygiene across SFDC + HubSpot. ~50 fields organized by object (Contact / Lead / Deal-Opportunity), with definitions, examples, and notes. Far more granular than the existing Phase 0 — CRM Readiness module (which is 15 macro questions).

### Why this fits

- **Cyber-specific value:** Cyber companies have notoriously bad field hygiene because long cycles + complex buying committees break standard attribution. Field audit names the silent problem.
- **Complements Phase 0:** Phase 0 = macro/governance maturity; Field Audit = field-level inventory + maturity. Different abstraction, both load-bearing.
- **Sets up Attribution Agent:** Field hygiene is the prerequisite to anything the Attribution Agent does. Building this surfaces the dependency.
- **Lead magnet:** A 50-field self-audit with an A-F grade per object = the kind of thing CMOs/RevOps share. Same flywheel as Phase 0.

### Build plan — staged

**v1 (1 week):**
- Field inventory loaded from `docs/FIELD-AUDIT-SOURCE.md`
- New module under System nav (or extend Phase 0 with a "Fields & Attribution" sub-tab — decision pending)
- For each field: user marks **Yes / Partial / No / Don't know**
- Weighted scoring per object (Contact, Deal, Lead-if-used)
- Output: A-F grade per object + overall, ranked list of "top 8 fields to add for biggest score jump"

**v1.1 (1 week later):**
- "What this costs you" layer — for each missing field, name the downstream consequence (e.g., "Without HIRO Date, you can't compute Stage 1 → Won probability — your pipeline coverage is directional only")
- Suggested workflows for each field (when to lock, when to update, source-of-truth rules)
- Export to PDF / send to inbox

**v1.2 (future):**
- Connect to live SFDC via ingestion adapter — auto-detect which fields exist, pre-fill answers
- Tie field gaps to specific OpptyCon metrics that become unreliable as a result

### Open decisions

- [ ] **Standalone module vs Phase 0 extension?** Recommendation: standalone (clearer story, easier to surface as a lead magnet). Phase 0 extension would shrink the module's apparent scope.
- [ ] **Public-facing name?** "Field Audit" is the working name. Alternatives: "Attribution Field Audit," "CRM Field Maturity," "Field Coverage Diagnostic."
- [ ] **Persona affinity?** RevOps + MarOps will use it directly. CMOs benefit from the output ("here's why your attribution is noise"). CFOs benefit from the "pipeline coverage is directional" callout. Lands on multiple persona dashboards.
- [ ] **Weight model?** Equal-weight all fields vs weighted by downstream impact. Recommendation: weighted (UTM fields differ in importance, e.g., First-Touch UTM Source > Last-Touch UTM Content for most companies).
- [ ] **Maturity tiers?** Same A-F as Phase 0, or simpler "Foundation / Operational / Advanced" tiers?

### Dependencies

- None for v1 (pure UI + scoring against `FIELD-AUDIT-SOURCE.md` data).
- v1.1 depends on writing the "consequence" copy per field.
- v1.2 depends on SFDC/HubSpot ingestion adapter (already on roadmap separately).

---

## 7. Audit doc + this doc — read together

`docs/PERSONA-AND-DATA-AUDIT.md` (the upstream audit) covers:
- Who each persona is and what they ask
- Which inputs are 🟢 / 🟡 / 🔴 (data quality)
- The five workstreams (A through E) for the product itself

**This doc** covers:
- The doctrine-product alignment gap
- The roadmap forward
- Path A / B / C choice

Together they're the strategic plane. Implementation lives in the engine + the persona
views + the Spine governance verdicts. Both docs should be touched whenever a major
direction call lands.
