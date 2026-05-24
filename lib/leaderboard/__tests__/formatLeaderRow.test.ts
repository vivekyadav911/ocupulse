import {
  formatLeaderboardDisplay,
  formatLeaderboardMeta,
  formatLeaderboardPrimaryLabel,
} from '../formatLeaderRow';
import type { LeaderRow } from '../../../services/firestore';

const row = (over: Partial<LeaderRow>): LeaderRow => ({
  id: '1',
  teamName: 'Team Alpha',
  score: 80,
  activityType: 'reaction',
  ...over,
});

describe('formatLeaderboardDisplay', () => {
  it('formats sound with dB units', () => {
    const d = formatLeaderboardDisplay('sound', 72, { peakDb: 72, avgDb: 58 });
    expect(d.scoreText).toContain('72');
    expect(d.scoreText).toContain('dB');
  });

  it('formats breathing as bpm', () => {
    const d = formatLeaderboardDisplay('breathing', 14, { bpm: 14 });
    expect(d.scoreText).toBe('14 bpm');
  });
});

describe('formatLeaderboardPrimaryLabel', () => {
  it('prefers student first name', () => {
    expect(formatLeaderboardPrimaryLabel(row({ studentFirstName: 'Alex' }))).toBe('Alex');
  });

  it('falls back to team name', () => {
    expect(formatLeaderboardPrimaryLabel(row({ teamName: 'Team Alpha' }))).toBe('Team Alpha');
  });
});

describe('formatLeaderboardMeta', () => {
  it('includes team when student name is shown', () => {
    const meta = formatLeaderboardMeta(
      row({ studentFirstName: 'Alex', detail: 'avg 250 ms · trace 80' }),
      'reaction',
      () => 'Reaction',
    );
    expect(meta).toContain('Team Alpha');
    expect(meta).toContain('avg 250 ms');
  });

  it('includes activity on all tab', () => {
    const meta = formatLeaderboardMeta(
      row({ studentFirstName: 'Alex', detail: 'avg 250 ms · trace 80' }),
      'all',
      () => 'Reaction',
    );
    expect(meta).toContain('Reaction');
  });
});
