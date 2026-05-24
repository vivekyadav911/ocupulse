import {
  aggregateAttempt,
  computeJerkMm,
  hardestMovement,
  JERK_MM_SCALE,
  scoreFromAttempts,
  smoothnessRating,
} from '../humanperfJerk';

describe('humanperfJerk', () => {
  it('computes jerk as magnitude delta scaled to mm', () => {
    const prev = { x: 0, y: 0, z: 1 };
    const curr = { x: 0, y: 0, z: 1.01 };
    expect(computeJerkMm(prev, curr)).toBeCloseTo(0.01 * JERK_MM_SCALE, 3);
  });

  it('rates smoothness bands', () => {
    expect(smoothnessRating(3)).toBe('Excellent');
    expect(smoothnessRating(10)).toBe('Good');
    expect(smoothnessRating(20)).toBe('Fair');
    expect(smoothnessRating(35)).toBe('Poor');
  });

  it('aggregates attempt stats from samples', () => {
    const t0 = 1000;
    const samples = [
      { x: 0, y: 0, z: 1, t: t0 },
      { x: 0, y: 0, z: 1.01, t: t0 + 10 },
      { x: 0, y: 0, z: 1.02, t: t0 + 20 },
    ];
    const agg = aggregateAttempt(samples);
    expect(agg.jerkSeries).toHaveLength(2);
    expect(agg.peakJerkMm).toBeGreaterThan(0);
    expect(agg.avgJerkMm).toBeGreaterThan(0);
    expect(agg.durationSec).toBeCloseTo(0.02, 3);
  });

  it('finds hardest movement by avg jerk', () => {
    const result = hardestMovement([
      { movement: 1, avgJerkMm: 5 },
      { movement: 2, avgJerkMm: 22 },
      { movement: 3, avgJerkMm: 10 },
    ]);
    expect(result?.movement).toBe(2);
    expect(result?.avgJerkMm).toBe(22);
  });

  it('scores lower jerk higher', () => {
    const high = scoreFromAttempts([
      { movement: 1, avgJerkMm: 5 },
      { movement: 2, avgJerkMm: 5 },
      { movement: 3, avgJerkMm: 5 },
    ]);
    const low = scoreFromAttempts([
      { movement: 1, avgJerkMm: 40 },
      { movement: 2, avgJerkMm: 40 },
      { movement: 3, avgJerkMm: 40 },
    ]);
    expect(high).toBeGreaterThan(low);
  });
});
