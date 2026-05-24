import type { WaveformPoint } from './breathingSignal';
import { bpmIncreasePercent } from './breathingSignal';

export type BreathingStateId = 'rest' | 'jog' | 'starJumps';

export const BREATHING_STATES: { id: BreathingStateId; label: string; shortLabel: string }[] = [
  { id: 'rest', label: 'At rest', shortLabel: 'At rest' },
  { id: 'jog', label: 'After exercise 1 (jog)', shortLabel: 'After jog' },
  { id: 'starJumps', label: 'After exercise 2 (star jumps)', shortLabel: 'After star jumps' },
];

export function breathingStateLabel(id: BreathingStateId): string {
  return BREATHING_STATES.find((s) => s.id === id)?.label ?? id;
}

export function breathingStateShortLabel(id: BreathingStateId): string {
  return BREATHING_STATES.find((s) => s.id === id)?.shortLabel ?? id;
}

export type BreathingStateRecording = {
  bpm: number;
  peakCount: number;
  waveform: WaveformPoint[];
  predictedBpm: string;
  recordedAt: string;
};

export type BreathingReflection = {
  wereYouRight: string;
  surprises: string;
};

export type BreathingTeamMemberRow = {
  memberName: string;
  restBpm: number | null;
  jogBpm: number | null;
  starJumpsBpm: number | null;
  bpmIncreasePct: number | null;
  restWaveform: WaveformPoint[];
};

export type BreathingTeamAggregates = {
  memberRows: BreathingTeamMemberRow[];
  avgRestBpm: number | null;
  avgJogBpm: number | null;
  avgStarJumpsBpm: number | null;
  jogIncreasePct: number | null;
  highestIncreaseMember: string | null;
};

export type BreathingSessionPhase =
  | 'intro'
  | 'recording'
  | 'verifyPeaks'
  | 'stateSummary'
  | 'results'
  | 'upload';

export type BreathingSessionState = {
  phase: BreathingSessionPhase;
  activeState: BreathingStateId;
  recordings: Partial<Record<BreathingStateId, BreathingStateRecording>>;
  pendingPrediction: string;
  reflection: BreathingReflection;
  teamAggregates: BreathingTeamAggregates | null;
  uploadStatus: 'idle' | 'uploading' | 'error';
  uploadError: string | null;
};

export function createInitialBreathingSessionState(): BreathingSessionState {
  return {
    phase: 'intro',
    activeState: 'rest',
    recordings: {},
    pendingPrediction: '',
    reflection: { wereYouRight: '', surprises: '' },
    teamAggregates: null,
    uploadStatus: 'idle',
    uploadError: null,
  };
}

export function allStatesRecorded(recordings: BreathingSessionState['recordings']): boolean {
  return BREATHING_STATES.every((s) => recordings[s.id] != null);
}

export function nextIncompleteState(
  recordings: BreathingSessionState['recordings'],
): BreathingStateId | null {
  for (const s of BREATHING_STATES) {
    if (!recordings[s.id]) return s.id;
  }
  return null;
}

export function memberRowFromPayload(
  memberName: string,
  payload: Record<string, unknown>,
): BreathingTeamMemberRow {
  const readings = (payload.readings ?? {}) as Record<
    string,
    { bpm?: number; waveform?: WaveformPoint[] }
  >;
  const restBpm = readings.rest?.bpm ?? null;
  const jogBpm = readings.jog?.bpm ?? null;
  const starJumpsBpm = readings.starJumps?.bpm ?? null;
  const peak = Math.max(jogBpm ?? 0, starJumpsBpm ?? 0);
  const bpmIncreasePct = restBpm != null && peak > 0 ? bpmIncreasePercent(restBpm, peak) : null;
  return {
    memberName,
    restBpm,
    jogBpm,
    starJumpsBpm,
    bpmIncreasePct,
    restWaveform: readings.rest?.waveform ?? [],
  };
}

export function computeBreathingTeamAggregates(
  peerPayloads: Record<string, unknown>[],
  currentMember: string,
  currentRecordings: Partial<Record<BreathingStateId, BreathingStateRecording>>,
): BreathingTeamAggregates {
  const memberMap = new Map<string, BreathingTeamMemberRow>();

  for (const payload of peerPayloads) {
    const member =
      (payload.team as { memberName?: string } | undefined)?.memberName ??
      (payload.memberName as string | undefined) ??
      'Unknown';
    memberMap.set(member, memberRowFromPayload(member, payload));
  }

  const currentReadings: Record<string, { bpm?: number; waveform?: WaveformPoint[] }> = {};
  for (const s of BREATHING_STATES) {
    const rec = currentRecordings[s.id];
    if (rec) {
      currentReadings[s.id] = { bpm: rec.bpm, waveform: rec.waveform };
    }
  }
  memberMap.set(currentMember, memberRowFromPayload(currentMember, { readings: currentReadings }));

  const memberRows = [...memberMap.values()].sort((a, b) =>
    a.memberName.localeCompare(b.memberName),
  );

  const avg = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v != null && v > 0);
    if (!nums.length) return null;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
  };

  const avgRestBpm = avg(memberRows.map((r) => r.restBpm));
  const avgJogBpm = avg(memberRows.map((r) => r.jogBpm));
  const avgStarJumpsBpm = avg(memberRows.map((r) => r.starJumpsBpm));
  const jogIncreasePct =
    avgRestBpm != null && avgJogBpm != null ? bpmIncreasePercent(avgRestBpm, avgJogBpm) : null;

  let highestIncreaseMember: string | null = null;
  let highestIncrease = -Infinity;
  for (const row of memberRows) {
    if (row.bpmIncreasePct != null && row.bpmIncreasePct > highestIncrease) {
      highestIncrease = row.bpmIncreasePct;
      highestIncreaseMember = row.memberName;
    }
  }

  return {
    memberRows,
    avgRestBpm,
    avgJogBpm,
    avgStarJumpsBpm,
    jogIncreasePct,
    highestIncreaseMember,
  };
}

export function buildTeamInsightText(aggregates: BreathingTeamAggregates): string {
  const { avgRestBpm, avgJogBpm, jogIncreasePct } = aggregates;
  if (avgRestBpm == null || avgJogBpm == null) {
    return 'Complete recordings for your team to generate a summary insight.';
  }
  const pct = jogIncreasePct != null ? `${jogIncreasePct.toFixed(1)}%` : 'an unmeasured';
  return `Your team's average resting BPM was ${avgRestBpm.toFixed(1)}. After jogging it rose to ${avgJogBpm.toFixed(1)} — a ${pct} increase.`;
}

export function scoreFromBreathingRecordings(
  recordings: Partial<Record<BreathingStateId, BreathingStateRecording>>,
): number {
  const rest = recordings.rest?.bpm ?? 0;
  const jog = recordings.jog?.bpm ?? 0;
  const jumps = recordings.starJumps?.bpm ?? 0;
  return Math.round((rest + jog + jumps) / 3) || rest || jog || jumps;
}
