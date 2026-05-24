import { formatLeaderboardDisplay } from '../formatLeaderRow';

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
