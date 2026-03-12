# Spine Integration Guide
## How to wire governance.js + SpinePage.jsx into the existing engine

---

## Files Added (just copy into /src)

```
src/
├── governance.js    ← Governance engine (evaluates model → verdicts)
├── SpinePage.jsx    ← Spine page component (renders verdicts)
└── (existing files unchanged)
```

---

## Changes to App.jsx (3 edits)

### Edit 1: Add import (line ~14, after ArchitectureDiagram import)

```jsx
import ArchitectureDiagram from './ArchitectureDiagram';
import SpinePage from './SpinePage';                        // ← ADD THIS
```

### Edit 2: Add nav item (around line 389, in NAV_SECTIONS)

Find the "System" section:
```jsx
  { section: "System", items: [
    {id:"architecture",label:"Architecture",icon:Activity},
  ]},
```

Change to:
```jsx
  { section: "System", items: [
    {id:"spine",label:"Governance Spine",icon:Shield},      // ← ADD THIS
    {id:"architecture",label:"Architecture",icon:Activity},
  ]},
```

Note: `Shield` is already imported in the lucide-react import line.
If not, add it to the import:
```jsx
import { ..., Shield, ... } from 'lucide-react';
```

### Edit 3: Add page to pages object (around line 2601)

Find:
```jsx
const pages={dashboard:<DashboardPage {...pp}/>, ...architecture:<ArchitectureDiagram/>};
```

Add `spine` to the pages object:
```jsx
const pages={
  dashboard:<DashboardPage {...pp}/>,
  // ... all existing pages ...
  spine:<SpinePage {...pp}/>,                                // ← ADD THIS
  architecture:<ArchitectureDiagram/>
};
```

The SpinePage receives the same `{model, inputs, onInfoClick, mobile}` props
as all other pages, so the spread `{...pp}` works.

---

## That's It

Three lines changed. The governance engine runs inside SpinePage via useMemo — 
it recomputes whenever inputs change, just like every other page.

---

## What You'll See

With the default inputs ($3M→$10M, 8 AEs, 30% SQO win rate), the spine 
will surface verdicts like:

- **CRITICAL**: Required attainment at ~139% — plan demands >120% of quota capacity
- **CRITICAL**: Ramp-adjusted capacity covers only ~75% of target
- **WARNING**: Rule of 40 below threshold
- **WARNING**: CAC payback above target
- **INFO**: Marketing fixed budget is structural floor-bound

Each verdict expands to show diagnosis, recommendation, affected modules, 
and cascade links to related governance domains.

---

## Next Steps (Phase 2+)

Once the spine page is working:

1. **Color-code Architecture Diagram**: Pass `nodeHealth` from governance 
   into ArchitectureDiagram to color nodes by health status
   
2. **Module info panels**: Wire `onInfoClick` from verdict "Affects" buttons 
   to navigate to the affected module page

3. **"Apply Fix" buttons**: Add `suggestedInputChanges` to verdicts so users 
   can one-click apply recommended adjustments

4. **Scenario comparison**: Save baseline → apply changes → compare verdicts

---

## Testing

To verify the governance engine works correctly with your current inputs:

```javascript
// In browser console after loading:
import { evaluateSpine } from './governance';
import { computeModel, DEFAULT_INPUTS } from './engine';

const model = computeModel(DEFAULT_INPUTS);
const spine = evaluateSpine(model, DEFAULT_INPUTS);
console.log('System health:', spine.systemHealth);
console.log('Verdicts:', spine.verdicts.length);
spine.verdicts.forEach(v => console.log(`[${v.severity}] ${v.signal}`));
```
