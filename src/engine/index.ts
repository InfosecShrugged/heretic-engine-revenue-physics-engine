// ─────────────────────────────────────────────────────────────────────────────
// OpptyCon engine — public API (Layer 0).
//
// The UI calls THIS. Today it passes inputs a human typed; tomorrow an agent or a
// CRM connector assembles the same ModelInputs and calls the same functions. That
// call site doesn't care where the inputs came from — which is the whole point.
//
//   computeModel(resolved)  — the pure core. (ResolvedInputs) => ModelOutputs.
//   runBanded(model)        — three pure runs → banded {low,mid,high} outputs.
//   resolveInputs(model, e) — collapse a ranged ModelInputs to one endpoint.
//   contract.ts             — the canonical, source-agnostic data shapes + the
//                             CrmSnapshot ingestion contract (CSV today, connector later).
// ─────────────────────────────────────────────────────────────────────────────

export { computeModel, DEFAULT_INPUTS, MONTHS, QUARTERS } from './core';
export { runBanded, resolveInputs } from './banded';
export type { Scenario } from './banded';
export * from './contract';
