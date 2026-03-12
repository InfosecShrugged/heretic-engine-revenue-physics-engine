# Data Ingestion — Integration Guide
## Wiring adapters + actuals into the Revenue Physics Engine

---

## Files Added

```
src/
├── adapters.js              ← Data source adapters (CSV, Sheets, Manual, API skeletons)
├── actuals.js               ← Actuals store + plan-vs-actual comparator
├── governance-actuals.js    ← Bridge: extends spine with actuals-based verdicts

netlify/
└── functions/
    └── adapter-hubspot.js   ← Phase 2: HubSpot API serverless function

docs/
└── DATA-INGESTION-SPEC.md   ← Full architecture specification
```

---

## Phase 1 Integration (CSV + Manual Entry)

### Step 1: Import actuals into SpinePage

In `SpinePage.jsx`, change the governance import:

```jsx
// BEFORE
import { evaluateSpine, SEVERITY_COLORS, SYSTEM_HEALTH_COLORS } from './governance';

// AFTER  
import { evaluateSpineWithActuals } from './governance-actuals';
import { SEVERITY_COLORS, SYSTEM_HEALTH_COLORS } from './governance';
import { actualsStore } from './actuals';
```

Then update the useMemo:

```jsx
// BEFORE
const spine = useMemo(() => evaluateSpine(model, inputs), [model, inputs]);

// AFTER
const actuals = useMemo(() => actualsStore.getAll(), []);
const spine = useMemo(() => evaluateSpineWithActuals(model, inputs, actuals), [model, inputs, actuals]);
```

### Step 2: Add Data Ingestion page to App.jsx

```jsx
// Add to imports (top of App.jsx)
import DataIngestionPage from './DataIngestionPage';

// Add to NAV_SECTIONS (in the "System" section)
{ section: "System", items: [
  {id:"spine",label:"Governance Spine",icon:Shield},
  {id:"data",label:"Data Sources",icon:Zap},        // ← ADD
  {id:"architecture",label:"Architecture",icon:Activity},
]},

// Add to pages object
const pages = {
  // ... existing pages ...
  data: <DataIngestionPage 
          onDataImported={() => setInputs(prev => ({...prev}))} // trigger re-render
          mobile={mobile} />,
};
```

### Step 3: Build the DataIngestionPage

This is the UI component. It handles:
- CSV file upload + column mapping
- Google Sheets URL connection
- Manual entry form
- Actuals history view
- Export/import JSON backup

The DataIngestionPage.jsx component should be built next — it's the 
largest UI piece. Use Claude Code to build it from the adapters.js 
MANUAL_FIELDS definition and the csvAdapter.normalize() interface.

Key UX flow:
1. User uploads CSV → parseCSV() → guessColumnMapping() → preview
2. User confirms/adjusts column mapping → csvAdapter.normalize()
3. Snapshots saved to actualsStore → governance spine re-evaluates
4. Spine page now shows plan-vs-actual verdicts

---

## What Changes in the Spine

When actuals exist, the governance spine gains three new capabilities:

### 1. Variance Verdicts
"Q2 ARR pacing at 67% of plan with 1 month remaining"
— These only appear when actuals data exists for the current period.

### 2. Drift Detection  
"Observed win rate 24.5% — 5.5pp below 30% plan assumption"
— Compares trailing observed rates to input assumptions.

### 3. Recalibration Suggestions
"Recalibrate avgDealSize from $60K to $52K based on trailing 6-month actuals"
— Suggests specific input changes with an [APPLY] action.

Without actuals, the spine works exactly as before (plan-vs-benchmark only).

---

## Phase 2: Google Sheets Auto-Refresh

The simplest "passive" ingestion that doesn't require API keys:

1. Create a Google Sheet with your monthly actuals
2. Publish it: File → Share → Publish to web → CSV
3. Paste the published URL into the Data Sources page
4. The engine fetches fresh data on every page load

Column mapping is auto-detected on first connect, then saved.
No backend required — the published Sheet is a public CSV endpoint.

---

## Phase 2: HubSpot API

1. Create a HubSpot Private App: Settings → Integrations → Private Apps
2. Scopes needed: `crm.objects.contacts.read`, `crm.objects.deals.read`
3. Copy the access token
4. Set `HUBSPOT_ACCESS_TOKEN` in Netlify environment variables
5. Deploy — the function at `/api/adapters/hubspot` activates
6. Uncomment the API redirect in `netlify.toml`

The function pulls:
- Contacts by lifecycle stage (funnel counts)
- Deals by stage (pipeline snapshot)  
- Closed-won/lost deals (revenue + win rate)
- Normalizes everything to the ActualsSnapshot schema

---

## Data Flow Summary

```
CSV Upload ─────────┐
Google Sheets ──────┤
Manual Entry ───────┤──→ adapters.js (normalize) ──→ actualsStore.save()
HubSpot API* ───────┤                                       │
Salesforce API* ────┘                                       ▼
                                                    actualsStore.getAll()
                                                            │
                                                            ▼
engine.js (plan) ──────→ governance-actuals.js ←── comparePlanToActuals()
                                │
                                ▼
                    SpinePage (enhanced verdicts)
                    ├── Plan-vs-benchmark (always)
                    ├── Plan-vs-actual (when data exists)
                    ├── Drift detection
                    └── Recalibration suggestions

* = Phase 2 (requires Netlify Functions)
```

---

## Testing Without Real Data

Generate synthetic actuals to test the comparison engine:

```javascript
import { actualsStore, emptySnapshot } from './actuals';

// Create 3 months of synthetic data
for (let m = 1; m <= 3; m++) {
  const snap = emptySnapshot('test', { year: 2026, month: m });
  snap.funnel = { inquiries: 380 + Math.random() * 100, mqls: 110 + Math.random() * 30,
    sqls: 45 + Math.random() * 15, meetingsHeld: 30 + Math.random() * 10,
    sqosCreated: 15 + Math.random() * 5, dealsWon: 4 + Math.round(Math.random() * 3),
    dealsLost: 5 + Math.round(Math.random() * 3) };
  snap.revenue = { newLogoARR: snap.funnel.dealsWon * 55000, currentARR: 3200000 + m * 180000 };
  snap.capacity = { activeAEs: 7, avgDealSize: 52000 + Math.random() * 10000 };
  actualsStore.save(snap);
}
```

This will immediately surface drift verdicts (win rate, deal size) and 
variance verdicts (quarterly pacing) on the Spine page.
