import {
  fetchParachuteLeaderboard,
  getApiBase,
  submitEarthquakeActivity,
  submitHandfanActivity,
  submitHumanperfActivity,
  submitParachuteActivity,
  submitSoundActivity,
} from '../stemmApi';

describe('stemmApi', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('submitParachuteActivity POSTs JSON to activities endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = mockFetch;

    const payload = {
      activityId: 1 as const,
      submittedAt: '2026-05-24T00:00:00.000Z',
      team: { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      location: { lat: -37.8, lng: 144.9, address: 'Melbourne' },
      massKg: 0.2,
      primaryMode: false,
      runs: [],
      reflection: { bestDesign: 'P1', easiestDesign: 'Baseline', predictionsCorrect: 'Mostly' },
    };

    await submitParachuteActivity(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${getApiBase()}/api/activities/1/submit`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });

  it('fetchParachuteLeaderboard sorts ascending and takes top 5', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { teamName: 'Fast', finalVelocityMps: 3.5 },
        { teamName: 'Slow', finalVelocityMps: 1.2 },
        { teamName: 'Mid', finalVelocityMps: 2.0 },
        { teamName: 'A', finalVelocityMps: 0.8 },
        { teamName: 'B', finalVelocityMps: 1.0 },
        { teamName: 'C', finalVelocityMps: 4.0 },
      ],
    });

    const rows = await fetchParachuteLeaderboard();
    expect(rows).toHaveLength(5);
    expect(rows[0].teamName).toBe('A');
    expect(rows[0].finalVelocityMps).toBe(0.8);
    expect(rows[4].finalVelocityMps).toBe(3.5);
  });

  it('submitParachuteActivity throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });

    await expect(
      submitParachuteActivity({
        activityId: 1,
        submittedAt: '',
        team: { teamName: 'T', memberName: 'M', gradeLevel: 'Year 6' },
        location: null,
        massKg: 0.2,
        primaryMode: false,
        runs: [],
        reflection: { bestDesign: '', easiestDesign: '', predictionsCorrect: '' },
      }),
    ).rejects.toThrow('Server error');
  });

  it('submitSoundActivity POSTs JSON to activity 2 endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = mockFetch;

    const payload = {
      activityId: 2 as const,
      submittedAt: '2026-05-24T00:00:00.000Z',
      team: { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      captures: [
        {
          actionLabel: 'dropping a book',
          prediction: 'louder' as const,
          peakDb: 72,
          lat: -37.8,
          lng: 144.9,
          capturedAt: '2026-05-24T00:01:00.000Z',
          predictionCorrect: true,
        },
      ],
      summary: {
        loudestAction: 'dropping a book (72 dB)',
        quietestAction: 'dropping a book (72 dB)',
        avgDb: 72,
        earProtectionRecommended: false,
      },
      reflection: { surprises: 'Quiet library', earMuffRecommendation: 'No' },
    };

    await submitSoundActivity(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${getApiBase()}/api/activities/2/submit`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });

  it('submitHandfanActivity POSTs JSON to activity 3 endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = mockFetch;

    const payload = {
      activityId: 3 as const,
      submittedAt: '2026-05-24T00:00:00.000Z',
      team: { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      location: { lat: -37.8, lng: 144.9 },
      material: 'paper' as const,
      trials: [
        {
          design: 1 as const,
          distanceCm: 15 as const,
          predictedAngleDeg: 10,
          actualAngleDeg: 12,
          observationNotes: '',
        },
      ],
      forceCalculation: null,
      reflection: {
        stiffnessEffect: '',
        designInfluence: '',
        distanceEffect: '',
      },
    };

    await submitHandfanActivity(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${getApiBase()}/api/activities/3/submit`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });

  it('submitEarthquakeActivity POSTs JSON to activity 4 endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = mockFetch;

    const payload = {
      activityId: 4 as const,
      submittedAt: '2026-05-24T00:00:00.000Z',
      team: { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      designs: [
        {
          design: 1 as const,
          folds: 3,
          pillars: 2,
          designNote: 'Wide base',
          predictedMovement: '<1cm',
          readings: {
            totalDisplacementCm: 0.8,
            peakXCm: 0.3,
            peakYCm: 0.2,
            peakZCm: 0.4,
            peakDisplacementCm: 0.4,
            maxTiltDeg: 5,
            rating: 'excellent' as const,
            sampleCount: 100,
          },
        },
      ],
      chartData: {
        labels: ['Design 1', 'Design 2', 'Design 3'],
        peakCm: [0.4, 0, 0],
        ratings: ['excellent' as const, 'excellent' as const, 'excellent' as const],
      },
      summary: {
        bestDesign: 1,
        winningFolds: 3,
        winningPillars: 2,
        bestPeakCm: 0.4,
      },
      reflection: { bestDesignWhy: 'Wide base', surprises: 'None' },
    };

    await submitEarthquakeActivity(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${getApiBase()}/api/activities/4/submit`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });

  it('submitHumanperfActivity POSTs JSON to activity 5 endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = mockFetch;

    const payload = {
      activityId: 5 as const,
      submittedAt: '2026-05-24T00:00:00.000Z',
      team: { teamName: 'Alpha', memberName: 'Sam', gradeLevel: 'Year 6' },
      location: null,
      feedbackModeEnabled: true,
      feedbackThresholdMm: 15,
      attemptDurationSec: 20,
      attempts: [
        {
          movement: 1 as const,
          movementLabel: 'Circle',
          avgJerkMm: 8,
          peakJerkMm: 12,
          durationSec: 20,
          smoothnessRating: 'Good',
          jerkSeries: [{ t: 0, jerkMm: 10 }],
          recordedAt: '2026-05-24T00:01:00.000Z',
        },
      ],
      chartData: {
        movementLabels: ['Circle', 'Up / Down', 'Side to Side'],
        avgJerkMm: [8, 0, 0],
        ratings: ['Good', 'Excellent', 'Excellent'],
      },
      summary: {
        hardestMovement: 1 as const,
        hardestMovementLabel: 'Circle',
        hardestAvgJerkMm: 8,
      },
      reflection: {
        hardestToKeepSmooth: 'Circle',
        feedbackHelped: 'Yes',
        surprises: 'None',
      },
    };

    await submitHumanperfActivity(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${getApiBase()}/api/activities/5/submit`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  });
});
