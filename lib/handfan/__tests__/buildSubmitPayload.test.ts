import {
  allTrialsComplete,
  createInitialHandfanSessionState,
  createInitialTrials,
  trialKey,
} from '../sessionState';
import { buildHandfanSubmitPayload } from '../buildSubmitPayload';

describe('buildHandfanSubmitPayload', () => {
  it('builds payload when all trials complete', () => {
    const state = createInitialHandfanSessionState();
    for (const design of [1, 2, 3] as const) {
      for (const distanceCm of [15, 30, 45] as const) {
        const key = trialKey(design, distanceCm);
        state.trials[key] = {
          design,
          distanceCm,
          predictedAngleDeg: '10',
          actualAngleDeg: 12,
          observationNotes: 'note',
        };
      }
    }
    state.forceCalc.angleDeg = '12';
    state.reflection.stiffnessEffect = 'Stiffer = less bend';

    const payload = buildHandfanSubmitPayload(
      state,
      {
        teamName: 'Alpha',
        memberName: 'Sam',
        gradeLevel: 'Year 6',
      },
      { lat: -37.8, lng: 144.9 },
    );

    expect(payload.activityId).toBe(3);
    expect(payload.trials).toHaveLength(9);
    expect(payload.material).toBe('paper');
    expect(payload.team.teamName).toBe('Alpha');
    expect(payload.forceCalculation?.forceN).toBeCloseTo((0.05 * (12 * Math.PI)) / 180, 5);
    expect(allTrialsComplete(state.trials)).toBe(true);
  });

  it('throws when trials incomplete', () => {
    const state = createInitialHandfanSessionState();
    expect(() =>
      buildHandfanSubmitPayload(
        state,
        { teamName: 'T', memberName: 'M', gradeLevel: 'Year 6' },
        null,
      ),
    ).toThrow('Complete all 9 trials');
  });

  it('throws on invalid predicted angle', () => {
    const state = createInitialHandfanSessionState();
    state.trials = createInitialTrials();
    const key = trialKey(1, 15);
    state.trials[key] = {
      design: 1,
      distanceCm: 15,
      predictedAngleDeg: 'abc',
      actualAngleDeg: 10,
      observationNotes: '',
    };
    for (const design of [1, 2, 3] as const) {
      for (const distanceCm of [15, 30, 45] as const) {
        const k = trialKey(design, distanceCm);
        if (k !== key) {
          state.trials[k] = {
            design,
            distanceCm,
            predictedAngleDeg: '5',
            actualAngleDeg: 6,
            observationNotes: '',
          };
        }
      }
    }
    expect(() =>
      buildHandfanSubmitPayload(
        state,
        { teamName: 'T', memberName: 'M', gradeLevel: 'Year 6' },
        null,
      ),
    ).toThrow('Invalid predicted angle');
  });
});
