# OpptyCon Production Audit — Summary

**Audit anchor:** `opptycon` @ commit `3ba29d5` (2026-06-02). All verdicts reflect this state of the source; where the code disagrees with `docs/ROADMAP.md` (dated 2026-05-22/23), **the code wins** and the drift is flagged.

**Method:** every capability classified REAL (computed from inputs) / PARTIAL (computes on constants or only a subset) / UI-ONLY (renders static values) / ABSENT (claimed, not in code), with a file + function/line citation for each. Detail in the three companion docs.

**Stack reality:** React 18 + Vite + Tailwind, **client-side compute**. Single math core: `src/engine.js` → `computeModel(inputs)`. Only server-side code is one Netlify function, `adapter-hubspot.js` (a read-only HubSpot *data adapter*) + a `noindex-staging` edge function. No autonomous services, schedulers, jobs, or auth backend.

## Headline (5 bullets)

1. **The engine is real and unusually deep.** The multi-year glideslope genuinely **back-solves** from a target exit ARR (`engine.js` L384–408); the inverse marketing waterfall recomputes a 5-stage funnel with real **±5pp sensitivity** (L1130–1212); the AE hiring plan is a true cohort-ramp **capacity bridge** (L471–590); the 3-motion mix computes per-channel ROI/CAC (L794–867). This is a working revenue model, not a mockup.

2. **All six governance domains are REAL.** P&L, Stage Definitions, ICP, Coverage, Attribution, Forecast each compute critical/warning/healthy verdicts by thresholding engine outputs against inputs (`governance.js` L28–432) — not static strings.

3. **The "Agent Layer" (spine layer 05) is the biggest overclaim — it is naming, not autonomy.** The "Coverage / Attribution / Forecast Agents" are three synchronous verdict functions (`governance.js` L266/332/396) run once per render in a `useMemo`. Nothing schedules, acts, writes back, or routes. There is **no Orchestration agent in the code at all**, and the diagram literally labels the ring "Autonomous Decision" (`ArchitectureDiagram.jsx` L35).

4. **Three doctrine anchor-claims are ABSENT (confirmed by grep, zero matches):** provenance logging (the roadmap's own "largest unbuilt claim"), dual-probability `P_base × P_accel` (the model is single-probability — `sqoToWonRate`; acceleration is a flat +5pp lift), and the ICP layer's SPI / Revenue Density metrics.

5. **Smaller overclaims to tighten:** "dual-axis cost model" is PARTIAL (fixed vs variable S&M are both % of revenue, so they scale identically — `engine.js` L962–966); coverage "enforcement" only *flags*, never constrains the target; and "8 persona views, 5 questions each" is loose — only **CRO, CMO, RevOps, PE** carry real per-persona math, the other four mostly relabel the shared `summary`, several render 3–4 live questions + stubs, and **PE is unreachable from onboarding**.

## Corrected spine-page sentence

Replace *"most of its spine runs in OpptyCon today"* with one of:

> **OpptyCon models the economic, pipeline, and stage layers of the spine today and runs six live governance checks against your inputs — surfacing the verdicts the agent layer is meant to enforce. Autonomous enforcement, provenance logging, and dual-probability are specified but not yet built.**

Tighter variant:

> **Today OpptyCon computes the spine's economics and governance and shows you where each domain breaches threshold; it governs by surfacing verdicts, not yet by autonomous enforcement.**

## Layer-by-layer at a glance

| Spine layer | Status |
|---|---|
| 01 Economic Model | **REAL** |
| 02 ICP Governance | **PARTIAL** (attainment verdicts real; SPI/Revenue Density absent) |
| 03 Pipeline Architecture | **REAL** (the 3-motion model it actually claims) |
| 04 Stage Definitions | **REAL** single-probability; dual-probability **ABSENT** |
| 05 Agent Layer | **UI-ONLY / naming** (verdict functions labeled "agent") |
| 06 Execution Systems | **PARTIAL** (reads actuals; never runs/acts) |
| 07 Attribution & Feedback | **PARTIAL** (variance/drift + suggestions; no latency metrics, no closed loop) |

See: `OPPTYCON-AUDIT-engine-reality.md` · `OPPTYCON-AUDIT-persona-inventory.md` · `OPPTYCON-AUDIT-doctrine-coverage.md`.
