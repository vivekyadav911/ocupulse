import {
  computeEarthquakeReadings,
  G_DELTA_TO_CM,
  ratingFromPeakCm,
  SAMPLE_HZ,
  stabilityScoreFromPeakCm,
  summarizeDesignRuns,
} from '../earthquakeDisplacement';

describe('ratingFromPeakCm', () => {
  it('maps thresholds correctly', () => {
    expect(ratingFromPeakCm(0.49)).toBe('excellent');
    expect(ratingFromPeakCm(0.5)).toBe('good');
    expect(ratingFromPeakCm(0.99)).toBe('good');
    expect(ratingFromPeakCm(1)).toBe('fair');
    expect(ratingFromPeakCm(1.99)).toBe('fair');
    expect(ratingFromPeakCm(2)).toBe('poor');
    expect(ratingFromPeakCm(5)).toBe('poor');
  });
});

describe('computeEarthquakeReadings', () => {
  it('returns zeros for empty samples', () => {
    const r = computeEarthquakeReadings([]);
    expect(r.peakDisplacementCm).toBe(0);
    expect(r.rating).toBe('excellent');
    expect(r.sampleCount).toBe(0);
  });

  it('computes tilt from atan2(y, x)', () => {
    const samples = [
      { x: 1, y: 0, z: 0, t: 0 },
      { x: 0, y: 1, z: 0, t: 16 },
    ];
    const r = computeEarthquakeReadings(samples);
    expect(r.maxTiltDeg).toBeCloseTo(90, 0);
  });

  it('converts g-delta sums to centimeters (not millimeters)', () => {
    const samples = [
      { x: 0, y: 0, z: 1, t: 0 },
      { x: 0.4, y: 0, z: 1, t: 16 },
      { x: 0.8, y: 0, z: 1, t: 32 },
    ];
    const r = computeEarthquakeReadings(samples);
    // Old factor (2.5) would report ~10× larger — mm-scale numbers labelled as cm.
    expect(G_DELTA_TO_CM).toBe(0.25);
    expect(r.peakXCm).toBeGreaterThan(0);
    expect(r.peakXCm).toBeLessThan(1);
    expect(r.peakXCm * 10).toBeLessThan(0.8 * 2.5);
  });

  it('stable signal scores lower than violent shake', () => {
    const stable = simulateVibration({ amplitudeG: 0.005, frequencyHz: 3, durationMs: 3000 });
    const violent = simulateVibration({ amplitudeG: 0.15, frequencyHz: 10, durationMs: 3000 });
    const stablePeak = computeEarthquakeReadings(stable).peakDisplacementCm;
    const violentPeak = computeEarthquakeReadings(violent).peakDisplacementCm;
    expect(violentPeak).toBeGreaterThan(stablePeak);
  });

  it('counts all generated samples', () => {
    const samples = simulateVibration({ amplitudeG: 0.02, frequencyHz: 5, durationMs: 1000 });
    const r = computeEarthquakeReadings(samples);
    expect(r.sampleCount).toBe(samples.length);
    expect(samples.length).toBeGreaterThan(SAMPLE_HZ);
  });

  it('sums magnitude of changes for total displacement', () => {
    const samples = [
      { x: 0, y: 0, z: 1, t: 0 },
      { x: 0.1, y: 0, z: 1, t: 16 },
      { x: 0.1, y: 0.1, z: 1, t: 32 },
    ];
    const r = computeEarthquakeReadings(samples);
    expect(r.totalDisplacementCm).toBeGreaterThan(0);
    expect(r.totalDisplacementCm).toBeLessThan(r.peakDisplacementCm * 4);
  });
});

describe('stabilityScoreFromPeakCm', () => {
  it('returns 100 for zero displacement', () => {
    expect(stabilityScoreFromPeakCm(0)).toBe(100);
  });

  it('decreases with displacement', () => {
    expect(stabilityScoreFromPeakCm(1)).toBe(50);
    expect(stabilityScoreFromPeakCm(2)).toBe(0);
  });
});

describe('summarizeDesignRuns', () => {
  it('picks lowest peak displacement', () => {
    const summary = summarizeDesignRuns([
      { design: 1, folds: 3, pillars: 2, peakDisplacementCm: 1.5 },
      { design: 2, folds: 5, pillars: 4, peakDisplacementCm: 0.4 },
      { design: 3, folds: 2, pillars: 3, peakDisplacementCm: 2.1 },
    ]);
    expect(summary.bestDesign).toBe(2);
    expect(summary.winningFolds).toBe(5);
    expect(summary.winningPillars).toBe(4);
    expect(summary.bestPeakCm).toBe(0.4);
  });
});

function simulateVibration(opts: {
  amplitudeG: number;
  frequencyHz: number;
  durationMs: number;
}): { x: number; y: number; z: number; t: number }[] {
  const { amplitudeG, frequencyHz, durationMs } = opts;
  const intervalMs = 1000 / SAMPLE_HZ;
  const samples: { x: number; y: number; z: number; t: number }[] = [];
  for (let t = 0; t <= durationMs; t += intervalMs) {
    const phase = (2 * Math.PI * frequencyHz * t) / 1000;
    samples.push({
      x: amplitudeG * Math.sin(phase),
      y: amplitudeG * 0.5 * Math.cos(phase),
      z: 1 + amplitudeG * 0.2 * Math.sin(phase * 1.3),
      t,
    });
  }
  return samples;
}
