import { buildBreathingSubmitPayload } from '../buildSubmitPayload';
import { createInitialBreathingSessionState } from '../sessionState';

function completeState() {
  const state = createInitialBreathingSessionState();
  const baseWave = [
    { t: 0, z: 0.02 },
    { t: 40, z: 0.06 },
  ];
  state.recordings = {
    rest: {
      bpm: 14,
      peakCount: 7,
      waveform: baseWave,
      predictedBpm: '15',
      recordedAt: '2026-01-01T00:00:00.000Z',
    },
    jog: {
      bpm: 22,
      peakCount: 11,
      waveform: baseWave,
      predictedBpm: '20',
      recordedAt: '2026-01-01T00:01:00.000Z',
    },
    starJumps: {
      bpm: 28,
      peakCount: 14,
      waveform: baseWave,
      predictedBpm: '25',
      recordedAt: '2026-01-01T00:02:00.000Z',
    },
  };
  state.reflection = { wereYouRight: 'Mostly', surprises: 'Jog raised it more than expected' };
  return state;
}

describe('buildBreathingSubmitPayload', () => {
  it('builds payload with downsampled waveforms and team summary', () => {
    const payload = buildBreathingSubmitPayload(
      completeState(),
      { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      { lat: -37.8, lng: 144.9, suburb: 'Melbourne' },
    );

    expect(payload.activityId).toBe(7);
    expect(payload.readings.rest.bpm).toBe(14);
    expect(payload.readings.jog.bpm).toBe(22);
    expect(payload.readings.starJumps.bpm).toBe(28);
    expect(payload.readings.rest.waveform.length).toBeLessThanOrEqual(2);
    expect(payload.reflection.predictions.rest).toBe('15');
    expect(payload.location?.suburb).toBe('Melbourne');
    expect(payload.healthReport.rows).toHaveLength(3);
    expect(payload.healthReport.bracket.healthyRestMin).toBeGreaterThan(0);
  });

  it('throws when states incomplete', () => {
    expect(() =>
      buildBreathingSubmitPayload(
        createInitialBreathingSessionState(),
        { teamName: 'T', memberName: 'M', gradeLevel: 'Year 6' },
        null,
      ),
    ).toThrow(/Complete all three/);
  });
});
