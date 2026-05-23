import {
  estimateImpactImpulse,
  integrateAccelDeltaVVect,
  vectorMagnitude,
} from '../lib/calc/impactImpulse';

function buildPlateau(amplitude: number, dtMs: number, count: number, tStart = 0) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const t = tStart + i * dtMs;
    out.push({ t, x: amplitude, y: 0, z: 0, magnitude: amplitude });
  }
  return out;
}

describe('integrateAccelDeltaVVect', () => {
  it('integrates rectangular pulse as amplitude × duration', () => {
    const samples = buildPlateau(40, 10, 11, 1000);
    const v = integrateAccelDeltaVVect(samples, 0, samples.length - 1)!;
    expect(vectorMagnitude(v)).toBeCloseTo((40 * ((samples.length - 1) * 10)) / 1000);
    expect(v.x).toBeCloseTo(4, 6);
    expect(vectorMagnitude(v)).toBeCloseTo(4, 6);
  });
});

describe('estimateImpactImpulse', () => {
  it('returns null-ish when nothing exceeds min peak', () => {
    const samples = buildPlateau(2, 20, 20);
    const e = estimateImpactImpulse(samples, { minPeakMs2: 8 });
    expect(e.peakMagnitudeMs2).toBeNull();
    expect(e.contactTimeS).toBeNull();
    expect(e.deltaVMps).toBeNull();
  });

  it('finds contact window and Δv on a single spike', () => {
    const samples = buildPlateau(40, 10, 11, 5000);
    const e = estimateImpactImpulse(samples, { minPeakMs2: 8 });
    expect(e.peakMagnitudeMs2).toBeCloseTo(40);
    expect(e.contactTimeS).toBeCloseTo(0.1, 2);
    expect(e.deltaVMps).toBeCloseTo(4, 1);
  });

  it('chooses taller spike when two are present (separated by quiet gap)', () => {
    const quiet = (t0: number, n: number, dt = 10) =>
      Array.from({ length: n }, (_, i) => ({
        t: t0 + i * dt,
        x: 0.1,
        y: 0,
        z: 0,
        magnitude: 0.1,
      }));
    const low = buildPlateau(12, 10, 5, 0);
    const mid = quiet(60, 40, 10);
    const high = buildPlateau(60, 10, 500);
    const samples = [...low, ...mid, ...high];
    const e = estimateImpactImpulse(samples, { minPeakMs2: 8 });
    expect(e.peakMagnitudeMs2).toBeCloseTo(60);
    expect(e.startIndex).toBe(low.length + mid.length);
    expect(e.endIndex).toBe(samples.length - 1);
  });
});
