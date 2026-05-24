import { mergeLeaderRows } from '../mergeRows';
import type { LeaderRow } from '../../../services/firestore';

const row = (id: string, score: number, at = 0): LeaderRow => ({
  id,
  teamName: 'T',
  score,
  activityType: 'reaction',
  submittedAt: at,
});

describe('mergeLeaderRows', () => {
  it('prefers remote over local for same id', () => {
    const merged = mergeLeaderRows([row('a', 10)], [{ ...row('a', 99), teamName: 'Remote' }]);
    expect(merged[0]?.score).toBe(99);
    expect(merged[0]?.teamName).toBe('Remote');
  });

  it('sorts by score descending', () => {
    const merged = mergeLeaderRows([row('a', 5)], [row('b', 20)]);
    expect(merged.map((r) => r.id).sort()).toEqual(['a', 'b']);
  });
});
