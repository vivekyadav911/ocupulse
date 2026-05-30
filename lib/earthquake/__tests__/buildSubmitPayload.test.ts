import { buildEarthquakeSubmitPayload } from '../buildSubmitPayload';
import { createInitialEarthquakeSessionState } from '../sessionState';

function stateWithThreeCompletedRuns() {
  const state = createInitialEarthquakeSessionState();
  const readings = {
    totalDisplacementCm: 1.2,
    peakXCm: 0.5,
    peakYCm: 0.4,
    peakZCm: 0.3,
    peakDisplacementCm: 0.5,
    maxTiltDeg: 12,
    rating: 'good' as const,
    sampleCount: 120,
  };

  for (const design of [1, 2, 3] as const) {
    state.runs[design] = {
      ...state.runs[design],
      folds: '3',
      pillars: '4',
      predictedMovement: '1-2cm',
      readings,
      testDurationSec: 20,
      completedAt: '2026-01-01T00:00:00.000Z',
    };
  }

  state.reflection = {
    bestDesignWhy: 'Design 1 was most stable.',
    surprises: 'Design 3 wobbled more than expected.',
  };

  return state;
}

describe('buildEarthquakeSubmitPayload', () => {
  it('builds payload when all designs and reflections are complete', () => {
    const payload = buildEarthquakeSubmitPayload(stateWithThreeCompletedRuns(), {
      teamName: 'Team A',
      memberName: 'Alex',
      gradeLevel: '8',
    });

    expect(payload.activityId).toBe(4);
    expect(payload.designs).toHaveLength(3);
    expect(payload.summary.bestDesign).toBe(1);
    expect(payload.reflection.bestDesignWhy).toContain('stable');
  });

  it('rejects upload when designs are incomplete', () => {
    const state = createInitialEarthquakeSessionState();
    state.runs[1] = {
      ...state.runs[1],
      folds: '2',
      pillars: '2',
      predictedMovement: '<1cm',
      readings: {
        totalDisplacementCm: 0.5,
        peakXCm: 0.2,
        peakYCm: 0.2,
        peakZCm: 0.1,
        peakDisplacementCm: 0.2,
        maxTiltDeg: 5,
        rating: 'excellent',
        sampleCount: 60,
      },
      testDurationSec: 5,
      completedAt: '2026-01-01T00:00:00.000Z',
    };
    state.reflection = { bestDesignWhy: 'Design 1', surprises: 'None' };

    expect(() =>
      buildEarthquakeSubmitPayload(state, {
        teamName: 'Team A',
        memberName: 'Alex',
        gradeLevel: '8',
      }),
    ).toThrow(/Complete all 3 design tests/);
  });
});
