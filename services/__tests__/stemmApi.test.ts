import { fetchParachuteLeaderboard, getApiBase, submitParachuteActivity } from '../stemmApi';

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
});
