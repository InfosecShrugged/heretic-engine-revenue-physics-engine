# Governed Revenue Architecture — Spine Specification
## From Static Diagram to Live Governance

---

## What the Spine Is

The Architecture Diagram defines five concentric layers:
```
Market Interface → Execution Systems → Agent Layer → Governance Layer → Core Engine
```

The engine currently computes the **Core** — raw inverse-funnel math, cost models, 
glideslope projections. But the Governance, Agent, and Feedback layers are decorative.
They exist in the diagram but don't exist in the code.

The **Spine** makes them real. It's a post-processing layer that takes the engine's 
raw output and applies governance logic to produce **verdicts** — structured assessments 
of system health with actionable recommendations.

---

## Architecture

```
engine.js → computeModel(inputs) → raw model output
                                        ↓
governance.js → evaluateSpine(model, inputs) → verdicts[]
                                        ↓
SpinePage.jsx → renders governance verdicts as operating system
```

### Verdict Structure

Every verdict follows a consistent schema:

```javascript
{
  id: "coverage_gap_q3",           // unique, stable identifier
  domain: "coverage",              // which governance domain
  layer: "agent",                  // governance | agent | execution | market
  severity: "critical",            // critical | warning | healthy | info
  signal: "Pipeline coverage at 1.8x for Q3 — below 2.5x yellow threshold",
  diagnosis: "AE ramp lag compounds with seasonal Q3 dip. Marketing-sourced SQOs 
              need to carry 65% of pipeline, currently allocated at 50%.",
  recommendation: "Increase mktgSourcedPct to 65% or add 2 AEs in month 4 to 
                   close the ramp gap before Q3 pipeline freeze.",
  affectedModules: ["pipeline", "sales", "targets"],
  metrics: {
    current: 1.8,
    threshold: 2.5,
    target: 3.5,
    unit: "x coverage"
  },
  trigger: "coverage_gap",         // maps to TRIGGERS in ArchitectureDiagram
}
```

---

## Governance Domains

### 1. P&L Constraints (Governance Layer)
**Question**: Can we afford this plan?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| pnl.burn_risk | S&M % of revenue | > 60% | critical |
| pnl.underinvest | S&M % of revenue | < 30% | warning |
| pnl.cac_ceiling | CAC payback months | > target | warning/critical |
| pnl.rule40 | Growth + margin | < 40 | warning |
| pnl.floor_bound | Headcount floor > budget | triggered | warning |
| pnl.contribution | Contribution margin | < 0 | critical |
| pnl.leadership_load | Leadership % of rev | > 15% | warning |

### 2. Stage Definitions (Governance Layer)
**Question**: Are funnel gates healthy?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| stage.funnel_grade | Overall funnel grade | D or C | warning/critical |
| stage.compression | Inquiry→Won rate | < 0.5% | warning |
| stage.bottleneck | Any stage below "good" | triggered | warning |
| stage.show_rate | Meeting show rate | < 70% | warning |
| stage.velocity | Total cycle days | > 120 | warning |

### 3. ICP Governance (Governance Layer)
**Question**: Are we selling to the right people at the right price?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| icp.deal_size | Avg deal vs segment norm | < 50% of norm | warning |
| icp.attainment | Required attainment % | > 120% | critical |
| icp.quota_coverage | Quota vs target ARR | < 80% | warning |

### 4. Coverage Agent (Agent Layer)
**Question**: Do we have enough people to carry the number?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| coverage.ramp_gap | Ramp-adjusted capacity vs target | < 80% | critical |
| coverage.attrition | Annual attrition impact | > 15% capacity loss | warning |
| coverage.ae_load | Deals per AE per year | > 15 | warning |
| coverage.sdr_ratio | SDR:AE ratio | < 1.0 | warning |

### 5. Attribution Agent (Agent Layer)
**Question**: Is the marketing mix yielding efficiently?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| attribution.create_roi | CREATE motion ROI | < 2x | warning |
| attribution.convert_cost | CONVERT cost per SQO | > benchmark | warning |
| attribution.accel_coverage | ACCELERATE account coverage | < 40% | warning |
| attribution.mktg_source | Mktg-sourced % vs plan | off by > 15pts | warning |
| attribution.channel_concentration | Single channel > 40% of CREATE | triggered | warning |

### 6. Forecast Agent (Agent Layer)
**Question**: Will we hit the number?

| Rule ID | Rule | Threshold | Severity |
|---|---|---|---|
| forecast.glideslope | Current ARR vs seasonal target | > 10% behind | critical |
| forecast.q_coverage | Quarterly pipeline coverage | < 2.5x | warning |
| forecast.velocity_drag | Velocity below baseline | triggered | warning |
| forecast.multi_year | Y2 targets feasible given Y1 | growth > 100% | warning |

---

## Feedback Loops (How Verdicts Cascade)

The spine isn't a one-pass evaluator. Verdicts in one domain trigger re-evaluation 
in connected domains, following the FLOWS defined in ArchitectureDiagram.jsx:

```
P&L → Coverage: "Budget ceiling constrains headcount"
Stage → Attribution: "Poor MQL→SQL yield means CREATE spend is wasted"
ICP → Forecast: "Deal size below segment norm pushes up volume requirements"
Coverage → Salesforce: "Capacity signal — hire or redistribute"
Attribution → HubSpot: "Motion mix needs rebalancing"
Forecast → Clay: "Enrichment should prioritize high-velocity segments"
Feedback → P&L: "Recalibrate cost assumptions based on actual yield"
Feedback → Stage: "Adjust conversion benchmarks to observed reality"
```

### Implementation: Each verdict includes `cascadeTo` — a list of domains that 
should be re-evaluated when this verdict fires. The UI draws these as animated 
flow lines on the architecture diagram, making the governance spine visible.

---

## Spine Page Design

The Spine page is the top-level operating view. It shows:

1. **System Health Ring** — the architecture diagram, but now with live color-coding 
   based on verdict severity (green/yellow/red per node)
2. **Verdict Feed** — a prioritized list of governance verdicts, critical first
3. **Cascade Map** — when you click a verdict, the diagram animates the flow path 
   showing which nodes are affected
4. **Quick Actions** — each verdict links to the engine module where you can adjust 
   the input that resolves it

---

## Implementation Phases

### Phase 1: Governance Engine (governance.js) ← START HERE
- Post-processor that takes computeModel() output
- Evaluates all rules in all domains
- Returns verdicts[] sorted by severity
- No UI yet — just the logic

### Phase 2: Spine Page (SpinePage.jsx)
- New page in the engine nav
- Shows verdict feed + system health summary
- Links verdicts to affected modules

### Phase 3: Architecture Diagram Integration
- Color-code diagram nodes based on live verdict severity
- Animate cascade flows when verdicts fire
- Replace static diagram with governance-aware version

### Phase 4: Recommendation Engine
- Verdicts gain `suggestedInputChanges` — specific input adjustments
- "Apply fix" button that adjusts inputs directly
- Before/after delta preview

### Phase 5: Scenario Comparison
- Save current state as "baseline"
- Apply recommended changes
- Show side-by-side governance comparison
