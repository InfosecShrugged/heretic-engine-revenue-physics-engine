// ─── Governance-Actuals Bridge ───
// Extends the governance spine with actuals-based verdicts.
// Drop-in replacement for evaluateSpine when actuals are available.
//
// Usage:
//   import { evaluateSpineWithActuals } from './governance-actuals';
//   import { actualsStore, comparePlanToActuals } from './actuals';
//
//   const actuals = actualsStore.getAll();
//   const spine = evaluateSpineWithActuals(model, inputs, actuals);
//   // spine.verdicts now includes plan-vs-actual verdicts when data exists

import { evaluateSpine } from './governance';
import { comparePlanToActuals } from './actuals';

export function evaluateSpineWithActuals(model, inputs, actuals) {
  // Run base governance evaluation (plan-vs-benchmarks)
  const baseSpine = evaluateSpine(model, inputs);

  // If no actuals, return base spine unchanged
  if (!actuals || actuals.length === 0) {
    return { ...baseSpine, hasActuals: false, comparison: null };
  }

  // Run plan-vs-actual comparison
  const comparison = comparePlanToActuals(model, actuals);

  // Merge actuals-based verdicts into the verdict list
  const allVerdicts = [...baseSpine.verdicts, ...comparison.variances];

  // Re-sort by severity
  const SEV = { critical: 0, warning: 1, healthy: 2, info: 3 };
  allVerdicts.sort((a, b) => SEV[a.severity] - SEV[b.severity]);

  // Recompute counts
  const criticalCount = allVerdicts.filter(v => v.severity === 'critical').length;
  const warningCount = allVerdicts.filter(v => v.severity === 'warning').length;

  const systemHealth = criticalCount > 0 ? 'critical'
    : warningCount > 3 ? 'degraded'
    : warningCount > 0 ? 'caution'
    : 'healthy';

  return {
    ...baseSpine,
    verdicts: allVerdicts,
    systemHealth,
    counts: {
      critical: criticalCount,
      warning: warningCount,
      healthy: allVerdicts.filter(v => v.severity === 'healthy').length,
      total: allVerdicts.length,
    },
    hasActuals: true,
    comparison,
    recalibrations: comparison.recalibrations,
    drift: comparison.drift,
    periodsWithData: comparison.periodsWithData,
  };
}
