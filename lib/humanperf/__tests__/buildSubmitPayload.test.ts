import { buildHumanperfSubmitPayload } from '../buildSubmitPayload';
import { createInitialHumanperfSessionState } from '../sessionState';

function completeState() {
  const state = createInitialHumanperfSessionState();
  const base = {
    peakJerkMm: 12,
    durationSec: 20,
    smoothnessRating: 'Good' as const,
    jerkSeries: [{ t: 0, jerkMm: 10 }],
    recordedAt: '2026-01-01T00:00:00.000Z',
  };
  state.attempts[1] = { movement: 1, avgJerkMm: 8, ...base };
  state.attempts[2] = { movement: 2, avgJerkMm: 22, ...base };
  state.attempts[3] = { movement: 3, avgJerkMm: 12, ...base };
  state.reflection = {
    hardestToKeepSmooth: 'Circle',
    feedbackHelped: 'Yes',
    surprises: 'Side to side was easier',
  };
  return state;
}

describe('buildHumanperfSubmitPayload', () => {
  it('builds payload with chart data and summary', () => {
    const payload = buildHumanperfSubmitPayload(
      completeState(),
      { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      { lat: -33.8, lng: 151.2, suburb: 'Sydney' },
    );

    expect(payload.activityId).toBe(5);
    expect(payload.attempts).toHaveLength(3);
    expect(payload.chartData.avgJerkMm).toEqual([8, 22, 12]);
    expect(payload.summary.hardestMovement).toBe(2);
    expect(payload.summary.hardestMovementLabel).toBe('Up / Down');
    expect(payload.location?.suburb).toBe('Sydney');
  });

  it('throws when movements incomplete', () => {
    expect(() =>
      buildHumanperfSubmitPayload(
        createInitialHumanperfSessionState(),
        { teamName: 'T', memberName: 'M', gradeLevel: 'Year 6' },
        null,
      ),
    ).toThrow(/Complete all 3 movements/);
  });
});
