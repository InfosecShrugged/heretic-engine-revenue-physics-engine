// ─────────────────────────────────────────────────────────────────────────────
// Banded output (§3a, false-precision firewall).
//
// The engine core is point-only. Banding sits ABOVE it: resolve a ModelInputs
// (whose assumption fields may carry Ranged bands) down to plain ResolvedInputs at
// three endpoints, run the unchanged pure core three times, and combine every
// numeric output leaf into a Banded {low, mid, high}. Output precision then
// honestly reflects input certainty. The pure-function core is exactly what makes
// this clean — banding is three calls, not special-case logic inside the math.
// ─────────────────────────────────────────────────────────────────────────────
import { computeModel } from './core';
import { isRanged, RANGED_FIELD_DIRECTIONS } from './contract';
import type { ModelInputs, ResolvedInputs, ModelOutputs, ModelOutputsBanded } from './contract';

export type Scenario = 'optimistic' | 'mid' | 'pessimistic';

/**
 * Collapse a ModelInputs to plain ResolvedInputs at one endpoint. Ranged fields
 * resolve per their DIRECTION OF BADNESS: "optimistic" picks the plan-favorable end
 * (low cost / high conversion), "pessimistic" the unfavorable end — NOT a mechanical
 * numeric min/max, which would invert bands for cost-type inputs. Points pass through.
 */
export function resolveInputs(model: ModelInputs, scenario: Scenario): ResolvedInputs {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(model)) {
    const v = (model as Record<string, unknown>)[key];
    if (isRanged(v)) {
      if (scenario === 'mid') { out[key] = v.mid; continue; }
      // higherIsWorse → favorable end is the LOW value; else (higherIsBetter / unknown) → HIGH.
      const higherIsWorse = RANGED_FIELD_DIRECTIONS[key] === 'higherIsWorse';
      const favorable = higherIsWorse ? v.low : v.high;
      const unfavorable = higherIsWorse ? v.high : v.low;
      out[key] = scenario === 'optimistic' ? favorable : unfavorable;
    } else {
      out[key] = v;
    }
  }
  return out as unknown as ResolvedInputs;
}

/**
 * Combine three output trees into a banded tree. Every numeric leaf becomes
 * {low: min, mid: mid-run value, high: max} across the three runs — so the band is
 * always ordered (low ≤ mid ≤ high) and the mid is exactly the point result the UI
 * shows. Arrays combine element-wise, objects key-wise; non-numbers take the mid run.
 */
function combine(opt: unknown, mid: unknown, pess: unknown): unknown {
  if (typeof mid === 'number') {
    const nums = [opt, mid, pess].filter((n): n is number => typeof n === 'number');
    return { low: Math.min(...nums), mid, high: Math.max(...nums) };
  }
  if (Array.isArray(mid)) {
    const o = opt as unknown[] | undefined;
    const p = pess as unknown[] | undefined;
    return mid.map((m, i) => combine(o?.[i], m, p?.[i]));
  }
  if (mid && typeof mid === 'object') {
    const o = opt as Record<string, unknown> | undefined;
    const p = pess as Record<string, unknown> | undefined;
    const res: Record<string, unknown> = {};
    for (const k of Object.keys(mid as Record<string, unknown>)) {
      res[k] = combine(o?.[k], (mid as Record<string, unknown>)[k], p?.[k]);
    }
    return res;
  }
  return mid; // strings, booleans, null, undefined
}

/**
 * Run the deterministic core at the three endpoints of every ranged input and
 * assemble the spread. With no ranged inputs (all Points / degenerate bands) the
 * three runs are identical, so every band collapses to low=mid=high — the base case
 * is undistorted and the mid reproduces computeModel exactly.
 */
export function runBanded(model: ModelInputs): ModelOutputsBanded {
  const optimistic = computeModel(resolveInputs(model, 'optimistic'));
  const mid: ModelOutputs = computeModel(resolveInputs(model, 'mid'));
  const pessimistic = computeModel(resolveInputs(model, 'pessimistic'));
  return combine(optimistic, mid, pessimistic) as ModelOutputsBanded;
}
