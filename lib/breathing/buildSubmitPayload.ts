import { downsampleWaveform } from './breathingSignal';
import { buildBreathingHealthReport } from './healthBrackets';
import {
  allStatesRecorded,
  BREATHING_STATES,
  type BreathingSessionState,
  type BreathingStateId,
  computeBreathingTeamAggregates,
} from './sessionState';

export type BreathingTeamMeta = {
  teamName: string;
  memberName: string;
  gradeLevel: string;
};

export type BreathingLocation = {
  lat: number;
  lng: number;
  address?: string;
  suburb?: string;
} | null;

export type BreathingSubmitPayload = {
  activityId: 7;
  submittedAt: string;
  team: BreathingTeamMeta;
  location: BreathingLocation;
  readings: Record<
    BreathingStateId,
    {
      stateLabel: string;
      bpm: number;
      peakCount: number;
      predictedBpm: string;
      waveform: { t: number; z: number }[];
      recordedAt: string;
    }
  >;
  teamSummary: {
    avgRestBpm: number | null;
    avgJogBpm: number | null;
    avgStarJumpsBpm: number | null;
    jogIncreasePct: number | null;
    memberRows: {
      memberName: string;
      restBpm: number | null;
      jogBpm: number | null;
      starJumpsBpm: number | null;
      bpmIncreasePct: number | null;
    }[];
  };
  reflection: {
    wereYouRight: string;
    surprises: string;
    predictions: Record<BreathingStateId, string>;
  };
  healthReport: ReturnType<typeof buildBreathingHealthReport>;
};

export function buildBreathingSubmitPayload(
  state: BreathingSessionState,
  team: BreathingTeamMeta,
  location: BreathingLocation,
): BreathingSubmitPayload {
  if (!allStatesRecorded(state.recordings)) {
    throw new Error('Complete all three session states before uploading.');
  }

  const readings = {} as BreathingSubmitPayload['readings'];
  const predictions = {} as Record<BreathingStateId, string>;

  for (const s of BREATHING_STATES) {
    const rec = state.recordings[s.id]!;
    predictions[s.id] = rec.predictedBpm;
    readings[s.id] = {
      stateLabel: s.label,
      bpm: rec.bpm,
      peakCount: rec.peakCount,
      predictedBpm: rec.predictedBpm,
      waveform: downsampleWaveform(rec.waveform, 25, 5),
      recordedAt: rec.recordedAt,
    };
  }

  const aggregates =
    state.teamAggregates ?? computeBreathingTeamAggregates([], team.memberName, state.recordings);

  return {
    activityId: 7,
    submittedAt: new Date().toISOString(),
    team,
    location,
    readings,
    teamSummary: {
      avgRestBpm: aggregates.avgRestBpm,
      avgJogBpm: aggregates.avgJogBpm,
      avgStarJumpsBpm: aggregates.avgStarJumpsBpm,
      jogIncreasePct: aggregates.jogIncreasePct,
      memberRows: aggregates.memberRows.map((r) => ({
        memberName: r.memberName,
        restBpm: r.restBpm,
        jogBpm: r.jogBpm,
        starJumpsBpm: r.starJumpsBpm,
        bpmIncreasePct: r.bpmIncreasePct,
      })),
    },
    reflection: {
      wereYouRight: state.reflection.wereYouRight,
      surprises: state.reflection.surprises,
      predictions,
    },
    healthReport: buildBreathingHealthReport(team.gradeLevel, state.recordings),
  };
}
