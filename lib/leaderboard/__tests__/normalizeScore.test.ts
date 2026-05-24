import { normalizedScoreForAll } from '../normalizeScore';
import type { LeaderRow } from '../../../services/firestore';

const base = (activityType: string, score: number, extra: Partial<LeaderRow> = {}): LeaderRow => ({
  id: '1',
  teamName: 'T',
  score,
  activityType,
  ...extra,
});

describe('normalizedScoreForAll', () => {
  it('passes through 0–100 activity scores', () => {
    expect(normalizedScoreForAll(base('reaction', 85))).toBe(85);
    expect(normalizedScoreForAll(base('earthquake', 72))).toBe(72);
  });

  it('maps sound peak dB to 0–100', () => {
    expect(normalizedScoreForAll(base('sound', 60, { peakDb: 60 }))).toBe(47);
    expect(normalizedScoreForAll(base('sound', 100, { peakDb: 100 }))).toBe(100);
  });

  it('rewards lower parachute velocity', () => {
    const slow = normalizedScoreForAll(base('parachute', 1));
    const fast = normalizedScoreForAll(base('parachute', 4));
    expect(slow).toBeGreaterThan(fast);
  });

  it('maps hand fan angle to 0–100', () => {
    expect(normalizedScoreForAll(base('handfan', 45))).toBe(100);
    expect(normalizedScoreForAll(base('handfan', 0))).toBe(0);
  });

  it('maps breathing bpm to 0–100', () => {
    expect(normalizedScoreForAll(base('breathing', 15))).toBe(50);
  });
});
