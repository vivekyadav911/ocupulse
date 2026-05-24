import { ageBreathingBracket, buildBreathingHealthReport } from '../healthBrackets';

describe('healthBrackets', () => {
  it('uses wider resting range for primary-age students', () => {
    const bracket = ageBreathingBracket('Year 5');
    expect(bracket.healthyRestMin).toBe(18);
    expect(bracket.healthyRestMax).toBe(25);
    expect(bracket.approxAgeYears).toBe(10);
  });

  it('uses adolescent resting range for secondary students', () => {
    const bracket = ageBreathingBracket('Year 9');
    expect(bracket.healthyRestMin).toBe(12);
    expect(bracket.healthyRestMax).toBe(20);
    expect(bracket.approxAgeYears).toBe(14);
  });

  it('builds health report with age bracket classification', () => {
    const report = buildBreathingHealthReport('Year 6', {
      rest: { bpm: 20 },
      jog: { bpm: 28 },
      starJumps: { bpm: 32 },
    });

    expect(report.rows).toHaveLength(3);
    expect(report.rows[0]!.category).toBe('healthy');
    expect(report.rows[1]!.category).toBe('elevated (expected)');
    expect(report.overallSummary).toMatch(/20\.0 BPM/);
    expect(report.overallSummary).toMatch(/28\.0 BPM/);
  });

  it('flags below-healthy resting rate', () => {
    const report = buildBreathingHealthReport('Year 8', {
      rest: { bpm: 10 },
      jog: { bpm: 18 },
      starJumps: { bpm: 22 },
    });

    expect(report.rows[0]!.category).toBe('below healthy');
    expect(report.overallSummary).toMatch(/below the typical healthy range/);
  });
});
