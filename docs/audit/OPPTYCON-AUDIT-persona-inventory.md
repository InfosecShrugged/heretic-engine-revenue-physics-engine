# Deliverable B — Feature Inventory by Persona View
**OpptyCon revenue-physics · HEAD `3ba29d5` (2026-06-02)**

All 8 persona views exist as React components, wired into the `pages` map at `App.jsx` L5016. Every view consumes one shared model from `computeModel(inputs)` (`engine.js` L197); its `summary` object (`engine.js` L1288–1291: `ltvCac, rule40, magicNumber, burnMultiple, cacPayback, opMargin, attainmentRequired, totalSAndMPct, funnelGrade, coverageHealth`) is computed once and reformatted per view.

| Persona | File + line | Live questions/widgets | Persona-specific compute vs shared chrome |
|---|---|---|---|
| **CFO** | `CFOPage` L1249; `MODULE_DOCS.cfo` L747 | 3 live + 2 "not yet modeled" stubs (L1345–1361) | **Mostly relabeled.** Q1 tiles read shared summary (`s.ltvCac`, `s.cacPayback`, `s.magicNumber`, `s.rule40` L1270–1273). Persona-local math thin: `annualBurn`/`cumulativeBurnOverPlan` (L1253–1255), `sAndMZone` banding (L1259). |
| **CEO** | `CEOPage` L1380; `MODULE_DOCS.ceo` L757 | 4 live + 1 stub (L1490) | **Mixed.** Q1/Q3 re-read shared summary. CEO-local: `threat` priority chain (L1389–1397), 4-function `fnCheck`-vs-`costBenchmarks` bands (L1406–1417). Q3 burn openly "Same as CFO Q2" (comment L1376). |
| **CRO** | `CROPage` L1516; `MODULE_DOCS.cro` L767 | 5 live | **Largely distinct.** `fullCapacity`/`rampedCapacity`/`rampLoss` (L1519–1522), `aesNeededAt85`/`aeGap`/hire-timing (L1525–1532), `sdrRatio` verdict, `att` realism band (L1535–1537) — computed in-component, nowhere else. Q2 reuses `model.phaseShiftedFunnel`. |
| **CMO** | `CMOPage` L1716; `MODULE_DOCS.cmo` L777 | 5+ live | **Largely distinct.** Pulls `monthly`, `motions`, `channels` (L1717) exec personas don't. CMO-local: monthly inq/MQL aggregation (L1719–1722), 4 CAC variants from `pnl` (L1724–1728), channel concentration (L1733–1735), fixed/variable split (L1737–1741), motion mix (L1743–1748). |
| **VC** | `VCPage` L2032; `MODULE_DOCS.vc` L787 | **4 live** (Q4 funding-need dead-coded `{false && …}` L2106) | **Mixed.** Q1 tiles re-read shared summary (L2047–2050). VC-local: `allInPayback`/`investable` (L2035–2036), `y2Credible` Y2-growth test (L2037–2039). |
| **PE** | `PEPage` L2473; **no `MODULE_DOCS.pe`** (config ends at revops L816) | 4 live | **Most genuinely distinct view** — see PE verdict. Header points at missing config key `pe` (L2497), so its tooltip/info-panel content is absent. |
| **Board** | `BoardPage` L2579; `MODULE_DOCS.board` L797 | 5 live | **Mostly relabeled / summarization.** Q2 `issue` chain "same priority chain as CEO" (L2586); Q4 `sAndMZone` duplicates CFO's band logic. Board-local content is the Q5 assumptions panel (L2663–2669) — presentation, not new calc. |
| **RevOps** | `RevOpsPage` L2701; `MODULE_DOCS.revops` L807 | 5 live | **Largely distinct.** Reads `funnelHealth`/`channels` (L2702). RevOps-local: `worstStage` sort (L2704–2705), capacity decomposition `fullCap−rampLoss−attrLoss` (L2707–2710), `floorFlags` (L2712–2714), `leverage` largest-gap pick (L2716). |

## Findings

**Real views: 8 of 8 exist** (`pages` map L5016). Config caveat: only **7 have `MODULE_DOCS` entries** — **PE has a working page but no config entry**, so its info-panel/tooltip content is missing.

**PE math verdict: REAL and NOT shared boilerplate.** FCF/EBITDA proxy and exit-multiple math are computed inline in `PEPage` and exist nowhere else:
- `opMarginProxy = grossMargin − sandmRev − 20` (EBITDA/FCF-like margin, L2484) → `fcfHealthy`/`fcfApproaching` (L2485–2486).
- Rule-of-40-keyed exit multiples `exitMultLow`/`exitMultHigh` (L2488–2489), `targetEntryMult = 5` (L2490), `multipleExpansion` (L2491).
- grep for `exitMult`, `opMarginProxy`, `multipleExpansion` in `engine.js` → **nothing**. Not in `computeModel`, not shared with VC. PE also uniquely reads `inputs.nrr` for retention levers (L2493–2495).

**Persona-specific vs relabeled:**
- **Genuinely persona-specific compute:** CRO (capacity/AE-gap/SDR/attainment), CMO (monthly demand, CAC variants, motion mix, channel concentration), RevOps (capacity decomposition, floor-bound, leverage stage), PE (exit-multiple/FCF thesis).
- **Mostly shared `summary` relabeled:** CFO, CEO, VC, Board — thin per-view derivations (banding, threat-chain, payback-from-`pnl`).
- The **"5 first-5-min questions" claim is loose in practice:** CFO 3 live + 2 stubs · CEO 4 + 1 stub · VC 4 (Q4 dead-coded L2106) · PE 4 · only CRO, CMO, Board, RevOps render a full five.

**Onboarding → persona routing: works, but PE is unreachable from it.** Wizard captures `role` (default "ceo", L4662); `buildOverrides` stamps `_persona` (L4701); `handleOnboardComplete` calls `setPage(_persona)` (L5019–5021) — first-run selection does route. **But the role grid (L4751–4760) offers only ceo/cfo/cro/cmo/vc/board/revops/dashboard — PE is not offered** (`grep value:"pe"` → no match). PE View is reachable only via left-nav.
