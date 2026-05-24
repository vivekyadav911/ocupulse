import type { ExperimentRecord } from '../../../services/experimentsData';
import { formatExperimentText } from '../formatExperimentReport';

function makeRecord(
  activityType: ExperimentRecord['activityType'],
  score: number,
  payload: Record<string, unknown>,
): ExperimentRecord {
  return {
    id: 'test-id',
    sessionId: 'session-1',
    activityType,
    score,
    submittedAt: 1_700_000_000_000,
    teamName: 'Team Alpha',
    studentFirstName: 'Alex',
    payload: {
      teamName: 'Team Alpha',
      studentFirstName: 'Alex',
      submittedAt: 1_700_000_000_000,
      sessionId: 'session-1',
      ...payload,
    },
    synced: true,
    scoreLabel: String(score),
    detail: 'test',
  };
}

describe('formatExperimentText', () => {
  it('includes header fields for any activity', () => {
    const text = formatExperimentText(
      makeRecord('reaction', 82, { avgReactionMs: 310, traceScore: 75 }),
    );
    expect(text).toContain('Ocupulse Experiment Report');
    expect(text).toContain('Activity: Reaction');
    expect(text).toContain('Student: Alex');
    expect(text).toContain('Team: Team Alpha');
    expect(text).toContain('session-1');
  });

  it('formats sound captures', () => {
    const text = formatExperimentText(
      makeRecord('sound', 68, {
        peakDb: 72,
        avgDb: 68,
        address: '123 Main St',
        captures: [{ actionLabel: 'Traffic', peakDb: 72 }],
        reflection: { surprises: 'Louder than expected' },
      }),
    );
    expect(text).toContain('Peak dB: 72');
    expect(text).toContain('Average dB: 68');
    expect(text).toContain('Traffic');
    expect(text).toContain('Louder than expected');
  });

  it('formats handfan trials', () => {
    const text = formatExperimentText(
      makeRecord('handfan', 25, {
        material: 'paper',
        trials: [{ design: 1, distanceCm: 15, predictedAngleDeg: 20, actualAngleDeg: 22 }],
      }),
    );
    expect(text).toContain('Material: paper');
    expect(text).toContain('Design 1, 15 cm');
    expect(text).toContain('22°');
  });
});
