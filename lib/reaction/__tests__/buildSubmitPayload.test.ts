import { buildReactionSubmitPayload, scoreFromReactionState } from '../buildSubmitPayload';
import { createInitialReactionSessionState } from '../sessionState';

function completeState() {
  return {
    ...createInitialReactionSessionState(),
    phase1: { appearTs: 1000, tapTs: 1250, reactionMs: 250 },
    phase2: { appearTs: 2000, tapTs: 2300, reactionMs: 300, handUsed: 'left' as const },
    phase3: {
      tracePath: [{ x: 10, y: 20, t: 1000 }],
      accuracyPct: 85,
      avgDelayMs: 12,
      idealTrace: [{ x: 10, y: 20, t: 1000 }],
      waveSnapshots: [
        [
          { x: 0, y: 80, t: 0 },
          { x: 300, y: 80, t: 0 },
        ],
      ],
      waveConfig: {
        width: 300,
        height: 160,
        amplitude: 40,
        wavelength: 150,
        scrollSpeed: 0.03,
        phaseOffset: 0,
      },
    },
    reflection: {
      predictedReactionMs: '280',
      surprises: 'Non-dominant was slower',
      practiceHelped: 'Yes',
    },
    teamStats: {
      phase1Mean: 250,
      phase1StdDev: 0,
      phase1Fastest: 250,
      phase2Mean: 300,
      phase2StdDev: 0,
      phase2Fastest: 300,
      phase3AccuracyMean: 85,
      phase3AccuracyStdDev: 0,
      scatterData: [{ memberName: 'Sam', phase1Ms: 250, phase3AccuracyPct: 85 }],
    },
  };
}

describe('buildReactionSubmitPayload', () => {
  it('builds activity 6 payload when all phases complete', () => {
    const payload = buildReactionSubmitPayload(completeState(), {
      teamName: 'Alpha',
      memberName: 'Sam',
      gradeLevel: 'Year 6',
    });

    expect(payload.activityId).toBe(6);
    expect(payload.phase1.reactionMs).toBe(250);
    expect(payload.phase2.handUsed).toBe('left');
    expect(payload.phase3.accuracyPct).toBe(85);
    expect(payload.comparison.percentSlower).toBe(20);
    expect(payload.team.memberName).toBe('Sam');
  });

  it('throws when phases incomplete', () => {
    expect(() =>
      buildReactionSubmitPayload(createInitialReactionSessionState(), {
        teamName: 'T',
        memberName: 'M',
        gradeLevel: 'Year 6',
      }),
    ).toThrow('Complete all 3 phases');
  });
});

describe('scoreFromReactionState', () => {
  it('returns blended score', () => {
    expect(scoreFromReactionState(completeState())).toBeGreaterThan(0);
  });
});
