import { forceFromStiffness } from '../handfanForce';

describe('handfanForce', () => {
  it('returns 0 for 0° angle', () => {
    expect(forceFromStiffness(0, 0.2)).toBe(0);
  });

  it('computes F = k × θ (radians)', () => {
    const f = forceFromStiffness(90, 1);
    expect(f).toBeCloseTo(Math.PI / 2, 5);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(forceFromStiffness(Number.NaN, 0.2)).toBe(0);
    expect(forceFromStiffness(45, Number.NaN)).toBe(0);
  });
});
