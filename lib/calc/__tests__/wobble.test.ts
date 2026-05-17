import { magnitudeRms, wobbleScoreFromRms } from '../wobble';

describe('magnitudeRms', () => {
  it('returns 0 for empty input', () => {
    expect(magnitudeRms([])).toBe(0);
  });

  it('computes RMS of deviations from mean', () => {
    const rms = magnitudeRms([1, 1.1, 0.9, 1.05, 0.95]);
    expect(rms).toBeGreaterThan(0);
    expect(rms).toBeLessThan(0.1);
  });
});

describe('wobbleScoreFromRms', () => {
  it('scores a stable platform above 80', () => {
    expect(wobbleScoreFromRms(0.05)).toBeGreaterThan(80);
  });

  it('scores a wobbly platform below 40', () => {
    expect(wobbleScoreFromRms(0.5)).toBeLessThan(40);
  });

  it('returns 100 for zero or invalid RMS', () => {
    expect(wobbleScoreFromRms(0)).toBe(100);
    expect(wobbleScoreFromRms(Number.NaN)).toBe(100);
  });
});
