// Golden tests — prove the extraction/refactor did NOT move the numbers.
// Fixtures were captured from the pre-refactor engine (engine.js) with dates pinned.
// Each fixture replays its inputs through the new engine; output must be identical.
import { describe, it, expect } from 'vitest';
import { computeModel } from '../core';
import fixturesRaw from './golden-fixtures.json';

const fixtures = fixturesRaw as Array<{ name: string; inputs: any; output: any }>;

describe('golden — engine reproduces pre-refactor numbers exactly', () => {
  it('has the captured scenario set', () => {
    expect(fixtures.map((f) => f.name)).toEqual([
      'baseline', 'aggressive-growth', 'capacity-constrained', 'multi-year-horizon', 'edge-zeros',
    ]);
  });

  for (const f of fixtures) {
    it(`reproduces: ${f.name}`, () => {
      const out = computeModel(f.inputs);
      // Byte-identical serialization — same code path, same key order. Any drift fails.
      expect(JSON.stringify(out)).toBe(JSON.stringify(f.output));
    });
  }
});
