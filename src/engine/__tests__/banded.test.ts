// Banding tests (§3a) — banding doesn't distort the base case, bands are ordered,
// ranges actually propagate, and direction-of-badness is encoded correctly.
import { describe, it, expect } from 'vitest';
import { computeModel } from '../core';
import { runBanded } from '../banded';
import fixturesRaw from './golden-fixtures.json';

const fixtures = fixturesRaw as Array<{ name: string; inputs: any; output: any }>;
const base = fixtures[0].inputs; // baseline — all plain numbers (Points)

// A combine()-produced banded leaf: exactly {low,mid,high}, all numbers.
function isLeaf(o: any): boolean {
  return o && typeof o === 'object' && !Array.isArray(o) &&
    Object.keys(o).length === 3 &&
    typeof o.low === 'number' && typeof o.mid === 'number' && typeof o.high === 'number';
}
function extractMid(n: any): any {
  if (isLeaf(n)) return n.mid;
  if (Array.isArray(n)) return n.map(extractMid);
  if (n && typeof n === 'object') {
    const o: any = {};
    for (const k of Object.keys(n)) o[k] = extractMid(n[k]);
    return o;
  }
  return n;
}
function eachLeaf(n: any, fn: (b: any) => void): void {
  if (isLeaf(n)) { fn(n); return; }
  if (Array.isArray(n)) { n.forEach((x) => eachLeaf(x, fn)); return; }
  if (n && typeof n === 'object') { for (const k of Object.keys(n)) eachLeaf(n[k], fn); }
}

describe('banded', () => {
  it('degenerate ranges → mid reproduces computeModel, every band collapses (low=mid=high)', () => {
    const banded = runBanded(base);
    // mid of the banded tree must equal the point result byte-for-byte
    expect(JSON.stringify(extractMid(banded))).toBe(JSON.stringify(computeModel(base)));
    // and with no ranged inputs every leaf is degenerate
    eachLeaf(banded, (b) => {
      if (Number.isNaN(b.mid)) return; // NaN == NaN comparisons are meaningless
      expect(b.low).toBe(b.mid);
      expect(b.high).toBe(b.mid);
    });
  });

  it('genuine ranges → every band ordered low ≤ mid ≤ high', () => {
    const ranged = {
      ...base,
      aeOTE: { low: 240000, mid: 280000, high: 340000, source: 'test' },   // higherIsWorse
      sqoToWonRate: { low: 25, mid: 30, high: 35, source: 'test' },         // higherIsBetter
    };
    const banded = runBanded(ranged);
    eachLeaf(banded, (b) => {
      if (Number.isNaN(b.low) || Number.isNaN(b.mid) || Number.isNaN(b.high)) return;
      expect(b.low).toBeLessThanOrEqual(b.mid);
      expect(b.mid).toBeLessThanOrEqual(b.high);
    });
  });

  it('ranges propagate → headline has real width, mid equals the all-mids point run', () => {
    const ranged = {
      ...base,
      aeOTE: { low: 240000, mid: 280000, high: 340000, source: 'test' },
    };
    const banded: any = runBanded(ranged);
    const comp = banded.summary.totalSalesFixedComp; // aeOTE drives AE comp directly
    expect(comp.high).toBeGreaterThan(comp.low);                 // band has width
    expect(comp.mid).toBe(computeModel(base).summary.totalSalesFixedComp); // mid = point result
  });

  it('direction-of-badness: higher cost-per-rep (aeOTE) raises sales comp', () => {
    const lo = computeModel({ ...base, aeOTE: 240000 });
    const hi = computeModel({ ...base, aeOTE: 340000 });
    expect(hi.summary.totalSalesFixedComp).toBeGreaterThan(lo.summary.totalSalesFixedComp);
  });
});
