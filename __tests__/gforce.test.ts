import { gForceBounce, gForceNoBounce } from '../lib/calc/gforce';

describe('g-force (user specification)', () => {
  it('Case 1: no bounce — 2.0 m/s, 0.05 s ≈ 4.1 g', () => {
    const g = gForceNoBounce(2.0, 0.05);
    expect(g).toBeCloseTo(4.08, 1);
  });

  it('Case 2: bounce — Δv 3.47 m/s, 0.02 s ≈ 17.7 g', () => {
    const g = gForceBounce(2.0, 1.47, 0.02);
    expect(g).toBeCloseTo(17.7, 0);
  });

  it('returns 0 for invalid contact time', () => {
    expect(gForceNoBounce(2, 0)).toBe(0);
  });
});
