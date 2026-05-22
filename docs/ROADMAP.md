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

---

## 3. Gap analysis — bidirectional

### 3a. SITE PROMISES, OPPTYCON DOESN'T HAVE (over-promise)

| Site claim | OpptyCon reality | Severity |
|---|---|---|
| Dual probability model (P_base × P_accel) | Not in product | 🔴 Big gap |
| 11 agents (spine-v4) / 10 agents (agent-specs) | 6 governance domains | 🔴 Big gap |
| 7 acquisition motions | 3 motions (CREATE / CONVERT / ACCELERATE) | 🟡 Different framing |
| BDR bifurcation (Cold Exploration vs Signal Interception) | Single SDR ratio input | 🟡 Conceptual gap |
| Territory + Pod architecture | Not in product | 🔴 Not represented |
| Customer Health Agent (health score, churn prob, expansion prob) | Only NRR % + churn rate inputs | 🔴 Big gap |
| ICP recalibration via Customer Health feedback | Static ICP inputs only | 🟡 Loop closure missing |
| Control plane primitives (Identity, Permissions, Provenance, Approvals) | Not in product | 🔴 Not built — infrastructure gap |
| Read-only → recommend → write agent progression | Not in product | 🔴 Not built |
| Identity Graph (deduplication, canonical IDs) | Not in product | 🔴 Not built |
| Provenance logging (inputs, weights, model version, evidence) | Not in product | 🔴 Not built |
| Velocity-as-diagnostic (friction detection patterns) | Velocity is rendered, not diagnosed | 🟡 Half-built |
| Motion Map (7 modes as distinct categories) | Mapped to 3-motion CREATE/CONVERT/ACCELERATE | 🟡 Framework mismatch |
| Signal & Intent Agent | Not in product | 🔴 Not built |
| Marketing Narrative Agent / Content & Positioning Agent | Not in product | 🔴 Not built |

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
   - On every spine-v4 / agent-specs claim, add a `📍 SHIPPED` / `🛠️ ROADMAP` / `🔬 RESEARCH`
     badge that grounds the reader
   - Add a `/roadmap` page that's the public version of this doc, kept current
2. **Weeks 2-4 — Highest-leverage doctrine-to-product builds.**
   - **Provenance logging** for every model decision (cheap, foundational, unlocks future agent work)
   - **Customer Health surface** — add NRR + churn-prob + expansion-prob as first-class
     inputs feeding into a "Retention & Expansion" view (the gap that's most felt by CFOs/CROs)
   - **Velocity as diagnostic** — promote the existing velocity module from "display" to
     "flag stalls vs benchmarks" (small change, big perception win)
3. **Months 2-3 — Bigger product moves (do these only if Weeks 2-4 land well).**
   - Dual probability model in the Pipeline module (research → MVP)
   - BDR bifurcation as a sales-org input (split SDR count into "cold prospecting" and
     "signal-interception" pools — feeds the Coverage agent and Pipeline math)
   - Identity Graph primitive (light version — canonical lead/account IDs in the data
     ingestion adapter)

The other big gaps from §3a (control plane primitives end-to-end, full 11-agent registry,
Territory + Pod) are real product work — months 4+. Their visibility on the site should be
behind the `🔬 RESEARCH` or `🛠️ ROADMAP` badges from Week 1.

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

## 8. Audit doc + this doc — read together

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
