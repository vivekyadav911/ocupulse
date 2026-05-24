import {
  aggregateSoundLevels,
  formatPredictionCorrect,
  isPredictionCorrect,
  meteringToApproxSpl,
  pollutionTierForPeakDb,
  pollutionTierLabel,
  referenceRowForDb,
} from '../lib/calc/soundLevel';

describe('meteringToApproxSpl', () => {
  it('maps dBFS to approx SPL with +90 offset', () => {
    expect(meteringToApproxSpl(-60)).toBe(30);
    expect(meteringToApproxSpl(-30)).toBe(60);
  });

  it('clamps to 0–140 SPL range', () => {
    expect(meteringToApproxSpl(-100)).toBe(0);
    expect(meteringToApproxSpl(50)).toBe(140);
    expect(meteringToApproxSpl(Number.NaN)).toBe(0);
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

describe('referenceRowForDb', () => {
  it('matches whisper/library for low dB', () => {
    expect(referenceRowForDb(20).source).toBe('Whisper / library');
  });

  it('matches busy traffic band', () => {
    expect(referenceRowForDb(70).source).toBe('Busy traffic');
  });

  it('matches explosion at 140+ dB', () => {
    expect(referenceRowForDb(140).source).toBe('Explosion');
  });
});

describe('isPredictionCorrect', () => {
  it('returns null when no previous reading', () => {
    expect(isPredictionCorrect('louder', 80, null)).toBeNull();
    expect(isPredictionCorrect(null, 80, 70)).toBeNull();
  });

  it('evaluates louder prediction', () => {
    expect(isPredictionCorrect('louder', 80, 70)).toBe(true);
    expect(isPredictionCorrect('louder', 65, 70)).toBe(false);
  });

  it('evaluates softer prediction', () => {
    expect(isPredictionCorrect('softer', 60, 70)).toBe(true);
    expect(isPredictionCorrect('softer', 75, 70)).toBe(false);
  });
});

describe('formatPredictionCorrect', () => {
  it('formats yes/no/N/A', () => {
    expect(formatPredictionCorrect(true)).toBe('Yes');
    expect(formatPredictionCorrect(false)).toBe('No');
    expect(formatPredictionCorrect(null)).toBe('N/A');
  });
});
