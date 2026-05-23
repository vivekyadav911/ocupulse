import {
  aggregateSoundLevels,
  meteringToApproxSpl,
  pollutionTierForPeakDb,
  pollutionTierLabel,
} from '../lib/calc/soundLevel';

describe('meteringToApproxSpl', () => {
  it('maps dBFS to approx SPL with +90 offset', () => {
    expect(meteringToApproxSpl(-60)).toBe(30);
    expect(meteringToApproxSpl(-30)).toBe(60);
  });

  it('clamps to sensible SPL range', () => {
    expect(meteringToApproxSpl(-100)).toBe(20);
    expect(meteringToApproxSpl(50)).toBe(120);
    expect(meteringToApproxSpl(Number.NaN)).toBe(20);
  });
});

describe('aggregateSoundLevels', () => {
  it('returns zero stats for empty input', () => {
    expect(aggregateSoundLevels([])).toEqual({ peakDb: 0, avgDb: 0 });
  });

  it('computes peak and rounded average', () => {
    expect(aggregateSoundLevels([40, 50, 60])).toEqual({ peakDb: 60, avgDb: 50 });
  });
});

describe('pollutionTierForPeakDb', () => {
  it('classifies quiet below 60 dB', () => {
    expect(pollutionTierForPeakDb(45)).toBe('quiet');
    expect(pollutionTierForPeakDb(59)).toBe('quiet');
  });

  it('classifies moderate from 60 to 85 dB', () => {
    expect(pollutionTierForPeakDb(60)).toBe('moderate');
    expect(pollutionTierForPeakDb(85)).toBe('moderate');
  });

  it('classifies loud above 85 dB', () => {
    expect(pollutionTierForPeakDb(86)).toBe('loud');
  });
});

describe('pollutionTierLabel', () => {
  it('returns human-readable labels', () => {
    expect(pollutionTierLabel('quiet')).toBe('Quiet');
    expect(pollutionTierLabel('moderate')).toBe('Moderate');
    expect(pollutionTierLabel('loud')).toBe('Loud');
  });
});
