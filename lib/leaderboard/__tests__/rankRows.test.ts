import { compareLeaderRows, prepareLeaderboardRows } from '../rankRows';
import type { LeaderRow } from '../../../services/firestore';

const row = (id: string, activityType: string, score: number, submittedAt = 0): LeaderRow => ({
  id,
  teamName: 'T',
  score,
  activityType,
  submittedAt,
  scoreLabel: String(score),
});

describe('compareLeaderRows', () => {
  it('ranks parachute by lowest velocity first', () => {
    const slow = row('a', 'parachute', 1.2);
    const fast = row('b', 'parachute', 3.5);
    expect(compareLeaderRows(slow, fast, 'parachute')).toBeLessThan(0);
  });

  it('ranks mixed activities on normalized 0–100 for all', () => {
    const react = row('a', 'reaction', 90);
    const parachute = row('b', 'parachute', 4);
    expect(compareLeaderRows(react, parachute, 'all')).toBeLessThan(0);
  });
});

describe('prepareLeaderboardRows', () => {
  it('shows normalized score labels on all tab', () => {
    const rows = prepareLeaderboardRows([row('a', 'reaction', 80)], 'all');
    expect(rows[0]?.scoreLabel).toBe('80');
  });

  it('keeps native score labels on activity tab', () => {
    const r = row('a', 'sound', 72);
    r.scoreLabel = '72 dB';
    const rows = prepareLeaderboardRows([r], 'sound');
    expect(rows[0]?.scoreLabel).toBe('72 dB');
  });

  it('filters by activity type', () => {
    const rows = prepareLeaderboardRows(
      [row('a', 'reaction', 80), row('b', 'sound', 70)],
      'reaction',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.activityType).toBe('reaction');
  });
});
