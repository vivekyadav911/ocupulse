import { impactGFromMagnitudes } from '../parachuteImpact';

describe('impactGFromMagnitudes', () => {
  it('returns peak above resting level', () => {
    const rest = Array.from({ length: 20 }, () => 1);
    const spike = [...rest, 3.5, 2.8, 1.1];
    expect(impactGFromMagnitudes(spike)).toBeCloseTo(2.5, 1);
  });

  it('returns 0 for flat signal', () => {
    expect(impactGFromMagnitudes([1, 1, 1, 1])).toBe(0);
  });
});
