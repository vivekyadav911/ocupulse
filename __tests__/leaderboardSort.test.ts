import { sortLeaderboard } from '../lib/leaderboardSort';

describe('leaderboard sort', () => {
  it('sorts by score desc then submission time', () => {
    const sorted = sortLeaderboard([
      { teamId: 'a', score: 10, submittedAt: 100 },
      { teamId: 'b', score: 10, submittedAt: 50 },
      { teamId: 'c', score: 20, submittedAt: 200 },
    ]);
    expect(sorted.map((s) => s.teamId)).toEqual(['c', 'b', 'a']);
  });
});
