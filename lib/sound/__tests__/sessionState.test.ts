import { buildSoundSubmitPayload } from '../buildSubmitPayload';
import {
  createInitialSoundSessionState,
  createSoundCapture,
  summarizeSoundSession,
} from '../sessionState';

describe('createSoundCapture', () => {
  it('marks first capture prediction as N/A', () => {
    const capture = createSoundCapture({
      actionLabel: 'whisper',
      peakDb: 35,
      lat: -37.8,
      lng: 144.9,
      prediction: null,
      previousPeakDb: null,
    });
    expect(capture.predictionCorrect).toBeNull();
  });

  it('evaluates louder prediction against previous capture', () => {
    const capture = createSoundCapture({
      actionLabel: 'clap',
      peakDb: 80,
      lat: -37.8,
      lng: 144.9,
      prediction: 'louder',
      previousPeakDb: 70,
    });
    expect(capture.predictionCorrect).toBe(true);
  });
});

describe('summarizeSoundSession', () => {
  it('returns null for empty captures', () => {
    expect(summarizeSoundSession([])).toBeNull();
  });

  it('computes loudest, quietest, avg, and ear protection', () => {
    const captures = [
      createSoundCapture({
        actionLabel: 'whisper',
        peakDb: 40,
        lat: 0,
        lng: 0,
        prediction: null,
        previousPeakDb: null,
      }),
      createSoundCapture({
        actionLabel: 'shout',
        peakDb: 90,
        lat: 0,
        lng: 0,
        prediction: 'louder',
        previousPeakDb: 40,
      }),
    ];
    const summary = summarizeSoundSession(captures);
    expect(summary?.avgDb).toBe(65);
    expect(summary?.earProtectionRecommended).toBe(true);
    expect(summary?.loudestAction).toContain('shout');
    expect(summary?.quietestAction).toContain('whisper');
  });
});

describe('buildSoundSubmitPayload', () => {
  it('builds activity 2 payload', () => {
    const state = createInitialSoundSessionState();
    const capture = createSoundCapture({
      actionLabel: 'book drop',
      peakDb: 72,
      lat: -37.8,
      lng: 144.9,
      prediction: null,
      previousPeakDb: null,
    });
    state.captures.push(capture);
    state.reflection = { surprises: 'None', earMuffRecommendation: 'No' };

    const payload = buildSoundSubmitPayload(state.captures, state.reflection, {
      teamName: 'Team A',
      memberName: 'Sam',
      gradeLevel: 'Year 6',
    });

    expect(payload.activityId).toBe(2);
    expect(payload.captures).toHaveLength(1);
    expect(payload.summary.avgDb).toBe(72);
  });

  it('throws when no captures', () => {
    expect(() =>
      buildSoundSubmitPayload(
        [],
        { surprises: '', earMuffRecommendation: '' },
        {
          teamName: 'T',
          memberName: 'M',
          gradeLevel: 'Year 6',
        },
      ),
    ).toThrow('Add at least one capture');
  });
});
