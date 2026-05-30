import {
  allRunsComplete,
  completedRunCount,
  createInitialEarthquakeSessionState,
  nextIncompleteDesign,
} from '../sessionState';

describe('earthquake sessionState', () => {
  it('advances to the next incomplete design after each run', () => {
    const state = createInitialEarthquakeSessionState();
    expect(nextIncompleteDesign(state.runs)).toBe(1);

    state.runs[1].readings = {
      totalDisplacementCm: 1,
      peakXCm: 0.5,
      peakYCm: 0.4,
      peakZCm: 0.3,
      peakDisplacementCm: 0.5,
      maxTiltDeg: 10,
      rating: 'good',
      sampleCount: 100,
    };

    expect(completedRunCount(state.runs)).toBe(1);
    expect(nextIncompleteDesign(state.runs)).toBe(2);
    expect(allRunsComplete(state.runs)).toBe(false);
  });

  it('returns null when every design has readings', () => {
    const state = createInitialEarthquakeSessionState();
    const readings = {
      totalDisplacementCm: 1,
      peakXCm: 0.5,
      peakYCm: 0.4,
      peakZCm: 0.3,
      peakDisplacementCm: 0.5,
      maxTiltDeg: 10,
      rating: 'good' as const,
      sampleCount: 100,
    };

    for (const design of [1, 2, 3] as const) {
      state.runs[design].readings = readings;
    }

    expect(nextIncompleteDesign(state.runs)).toBeNull();
    expect(allRunsComplete(state.runs)).toBe(true);
  });
});
