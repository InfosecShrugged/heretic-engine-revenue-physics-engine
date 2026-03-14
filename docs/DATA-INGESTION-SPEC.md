# Revenue Physics Engine — Data Ingestion Architecture
## From Static Assumptions to Live Operating Data

---

## The Problem

The engine currently has ONE data path:

```
Manual inputs (sliders) → computeModel() → projections → governance verdicts
```

Every number is an assumption. The governance spine can flag "your plan requires 
139% attainment" but it can't say "you're tracking at 67% attainment through Q2" 
because it has no actuals.

---

## The Architecture

Three new layers, additive to existing code:

```
LAYER 1: ADAPTERS (adapters.js)
  Normalize external data → standard schema
  Sources: CSV upload, Google Sheets, HubSpot API, Salesforce API
  
LAYER 2: ACTUALS STORE (actuals.js)  
  Time-series observed data alongside plan
  Monthly/quarterly snapshots: actual leads, deals, pipeline, spend, ARR
  
LAYER 3: PLAN-vs-ACTUAL ENGINE (comparator.js)
  Merges plan projections with observed actuals
  Feeds enhanced verdicts to governance spine
  Surfaces drift, variance, and trend signals
```

Existing code is untouched. New layers sit alongside:

```
engine.js        → plan projections (unchanged)
governance.js    → verdicts (enhanced with actuals when available)
adapters.js      → NEW: normalize external data
actuals.js       → NEW: store + retrieve observed data
comparator.js    → NEW: plan vs actual analysis
```

---

## What Gets Ingested

The engine needs two categories of external data:

### Category 1: Actuals (what happened)
These are observed values that the plan projects. When actuals exist, 
the governance spine compares plan-vs-actual instead of plan-vs-benchmark.

| Data Point | Source | Frequency | Engine Maps To |
|---|---|---|---|
| Closed-won deals (count, ARR) | CRM | Monthly | monthly[].monthlyDeals, monthlyNewARR |
| Pipeline by stage ($, count) | CRM | Monthly | stage1Pipeline, stage2Pipeline |
| Inquiries generated | MAP/CRM | Monthly | monthly[].monthlyInquiries |
| MQLs | MAP | Monthly | monthly[].monthlyMQLs |
| SQLs | CRM | Monthly | monthly[].monthlySQLs |
| Meetings held | CRM | Monthly | monthly[].monthlyMeetings |
| SQOs created | CRM | Monthly | monthly[].monthlySQOs |
| AE headcount (active) | HRIS/CRM | Monthly | aeCount (actual vs plan) |
| Marketing spend (by channel) | Finance/MAP | Monthly | channel spend actuals |
| Total S&M spend | Finance | Quarterly | totalSAndM actual |
| Win rate (trailing) | CRM | Monthly | sqoToWonRate (observed) |
| Avg deal size (trailing) | CRM | Monthly | avgDealSize (observed) |
| Sales cycle days | CRM | Monthly | totalCycleDays (observed) |
| Current ARR | Finance/CRM | Monthly | totalARR (actual) |
| NRR / Churn | Finance | Quarterly | nrrPercent (observed) |

### Category 2: Signals (what's changing)
These don't replace engine inputs but inform governance verdicts.

| Signal | Source | What It Tells The Spine |
|---|---|---|
| Intent surge (account count) | 6sense/Bombora | Demand is building — CREATE allocation may need to shift |
| Pipeline velocity trend | CRM | Deals are moving faster/slower than planned |
| Win rate trend (3mo rolling) | CRM | Close performance trending up or down |
| Lead quality score trend | MAP | MQL→SQL conversion predicting future yield |
| Budget burn rate | Finance | Spend pacing vs plan |
| Rep activity (meetings/week) | CRM/Gong | Leading indicator of pipeline health |

---

## Adapter Interface

Every adapter implements the same interface:

```javascript
{
  id: "hubspot",                    // unique adapter ID
  name: "HubSpot",                  // display name
  type: "api",                      // "csv" | "sheets" | "api"
  status: "connected",              // "disconnected" | "connected" | "syncing" | "error"
  lastSync: "2026-03-12T14:30:00Z", // ISO timestamp
  
  // What this adapter provides
  provides: ["inquiries", "mqls", "sqls", "meetings", "pipeline_stage1"],
  
  // Normalize raw data → standard actuals schema
  normalize(rawData) → ActualsSnapshot,
  
  // Fetch data (for API adapters)
  fetch(config, dateRange) → rawData,
  
  // Validate connection
  test(config) → { ok: boolean, message: string },
}
```

---

## Actuals Schema

All adapters produce `ActualsSnapshot` objects:

```javascript
{
  source: "hubspot",
  timestamp: "2026-03-12T14:30:00Z",
  period: { year: 2026, month: 3 },          // or quarter
  
  // Funnel actuals (counts)
  funnel: {
    inquiries: 1240,
    mqls: 372,
    sqls: 149,
    meetingsHeld: 112,
    sqosCreated: 56,
    dealsWon: 17,
    dealsLost: 22,
  },
  
  // Pipeline actuals ($)
  pipeline: {
    stage1: { count: 34, value: 680000 },
    stage2: { count: 21, value: 1260000 },
    stage3: { count: 14, value: 840000 },
    stage4: { count: 8, value: 480000 },
    stage5: { count: 5, value: 300000 },
    total: { count: 82, value: 3560000 },
  },
  
  // Revenue actuals ($)
  revenue: {
    newLogoARR: 1020000,
    expansionARR: 180000,
    churnedARR: 85000,
    currentARR: 4115000,
  },
  
  // Capacity actuals
  capacity: {
    activeAEs: 7,                // actual headcount (vs planned 8)
    activeSdrs: 10,
    avgDealSize: 57500,          // trailing avg (vs planned 60K)
    avgCycleDays: 98,            // trailing avg (vs planned 84)
    winRate: 27.5,               // trailing % (vs planned 30%)
  },
  
  // Spend actuals ($)
  spend: {
    totalMarketing: 82000,
    byChannel: {
      "Paid Search": 24600,
      "Content / SEO": 8200,
      "Events": 16400,
      "Cold Outbound": 20500,
      "Content Syndication": 12300,
    },
    totalSales: 185000,
    totalSAndM: 267000,
  },
  
  // Signals (optional, from intent/enrichment platforms)
  signals: {
    intentSurgeAccounts: 12,
    avgLeadScore: 64,
    pipelineVelocityTrend: -0.05,  // negative = slowing
  },
}
```

---

## Data Source Implementations

### Source 1: CSV Upload (Phase 1 — immediate)
- User exports from CRM/finance, uploads CSV
- Adapter maps columns → actuals schema
- Column mapping UI: "Which column is MQLs? Which is Closed-Won ARR?"
- Supports monthly or quarterly granularity
- **This is the MVP.** Every CRM and MAP can export CSV.

### Source 2: Google Sheets (Phase 1 — near-term)
- Published Google Sheet URL → fetch as CSV
- Same normalization as CSV, but auto-refreshes
- Nicky already uses Google Drive for everything
- No auth needed if sheet is published to web

### Source 3: HubSpot API (Phase 2)
- Netlify Function: `/api/adapters/hubspot`
- OAuth 2.0 flow → store tokens in encrypted environment variable
- Endpoints: contacts (funnel), deals (pipeline), analytics (spend)
- Scheduled sync via Netlify scheduled functions (cron)

### Source 4: Salesforce API (Phase 2)  
- Netlify Function: `/api/adapters/salesforce`
- OAuth 2.0 + JWT flow
- SOQL queries: Opportunity (pipeline), Lead (funnel), Campaign (spend)
- Scheduled sync

### Source 5: Manual Entry (always available)
- Inline form in the engine UI
- Quick monthly snapshot entry
- Fallback when APIs aren't connected

---

## Storage

### Client-side (Phase 1)
- `localStorage` for actuals snapshots (survives page refresh)
- Export/import as JSON backup
- Fine for single-user, personal tool

### Netlify Blobs (Phase 2)
- Server-side key-value store included with Netlify
- Stores actuals, adapter configs, sync history
- Enables scheduled sync without client being open
- No separate database needed

### Migration path
Phase 1 localStorage → Phase 2 Netlify Blobs is non-breaking.
The actuals store API stays the same; only the backend changes.

---

## How Actuals Flow Into Governance

When actuals exist for a period, the governance spine gains new verdict types:

### Variance Verdicts
```
PLAN: 56 SQOs in Q1
ACTUAL: 38 SQOs through Feb
VERDICT: [WARNING] SQO generation 32% behind plan with 1 month remaining in Q1.
         At current run rate, Q1 will finish at ~45 SQOs (80% of plan).
         Pipeline coverage for Q2 close is at risk.
```

### Drift Verdicts
```
PLAN assumption: 30% SQO→Won rate
OBSERVED trailing: 24.5% SQO→Won rate
VERDICT: [CRITICAL] Observed win rate 5.5pp below plan assumption.
         This alone accounts for 18% of the revenue shortfall.
         Recalibrate sqoToWonRate to 25% for realistic projections,
         or diagnose why win rate has degraded.
```

### Trend Verdicts
```
OBSERVED: Pipeline velocity -5% month-over-month for 3 months
VERDICT: [WARNING] Pipeline velocity declining. Deals are taking 5% longer
         each month. If trend continues, Q3 cycle will be 112 days
         vs 84-day plan. Coverage model needs adjustment.
```

### Recalibration Suggestions
```
OBSERVED across 6 months of actuals:
  - Actual avg deal size: $52K (plan: $60K)  
  - Actual win rate: 26% (plan: 30%)
  - Actual inquiry→MQL: 34% (plan: 30%)
  
VERDICT: [INFO] Actuals suggest recalibrating 3 inputs:
  avgDealSize: 60000 → 52000 (based on trailing 6mo)
  sqoToWonRate: 30 → 26 (based on trailing 6mo)
  inquiryToMqlRate: 30 → 34 (based on trailing 6mo)
  [APPLY RECALIBRATION] button
```

---

## Implementation Phases

### Phase 1: Schema + CSV + Manual Entry
- adapters.js: adapter interface + CSV normalizer
- actuals.js: localStorage-backed actuals store
- comparator.js: plan-vs-actual merge + variance calculations
- DataIngestionPage.jsx: CSV upload UI + manual entry form
- Enhanced governance verdicts when actuals present

### Phase 2: Google Sheets + Netlify Functions
- Sheets adapter (published sheet URL → auto-fetch)
- Netlify Functions skeleton for API adapters
- netlify.toml updates for functions directory
- Sync status dashboard

### Phase 3: CRM API Adapters
- HubSpot OAuth + data pull functions
- Salesforce OAuth + SOQL functions
- Scheduled sync (Netlify cron)
- Netlify Blobs for server-side actuals storage

### Phase 4: Signal Ingestion
- Intent data adapters (6sense, Bombora)
- Activity signal adapters (Gong, Outreach)
- Signal-based governance verdicts

### Phase 5: Closed-Loop Recalibration
- Auto-detect assumption drift
- Suggest input recalibrations
- "What-if" comparison: plan assumptions vs observed reality
- Board-ready variance report generation
