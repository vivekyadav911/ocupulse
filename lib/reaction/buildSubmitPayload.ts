import {
  combinedReactionScore,
  downsampleTracePoints,
  mean,
  standardDeviation,
} from '../calc/reactionStats';
import {
  allPhasesComplete,
  dominantNonDominantComparison,
  type ReactionSessionState,
  type TeamAggregates,
} from './sessionState';

export type ReactionTeamMeta = {
  teamName: string;
  memberName: string;
  gradeLevel: string;
};

export type ReactionSubmitPayload = {
  activityId: 6;
  submittedAt: string;
  team: ReactionTeamMeta;
  phase1: {
    reactionMs: number;
    appearTs: number;
    tapTs: number;
  };
  phase2: {
    reactionMs: number;
    handUsed: 'left' | 'right';
    appearTs: number;
    tapTs: number;
  };
  phase3: {
    accuracyPct: number;
    avgDelayMs: number;
    tracePath: { x: number; y: number; t: number }[];
    idealTrace: { x: number; y: number; t: number }[];
    waveSnapshots: { x: number; y: number; t: number }[][];
    waveConfig: {
      width: number;
      height: number;
      amplitude: number;
      wavelength: number;
      scrollSpeed: number;
      phaseOffset?: number;
    };
  };
  comparison: {
    dominantMs: number;
    nonDominantMs: number;
    differenceMs: number;
    percentSlower: number;
  };
  statistics: {
    phase1Mean: number;
    phase1StdDev: number;
    phase2Mean: number;
    phase2StdDev: number;
    phase3AccuracyMean: number;
    phase3AccuracyStdDev: number;
  };
  scatterData: { memberName: string; phase1Ms: number; phase3AccuracyPct: number }[];
  reflection: {
    predictedReactionMs: string;
    surprises: string;
    practiceHelped: string;
  };
};

export function computeTeamAggregates(
  peerPayloads: Record<string, unknown>[],
  currentMember: string,
  currentPhase1Ms: number,
  currentPhase2Ms: number,
  currentPhase3Accuracy: number,
): TeamAggregates {
  const scatterMap = new Map<string, { phase1Ms: number; phase3AccuracyPct: number }>();

  for (const payload of peerPayloads) {
    const member =
      (payload.team as { memberName?: string } | undefined)?.memberName ??
      (payload.memberName as string | undefined) ??
      'Unknown';
    const p1 = payload.phase1 as { reactionMs?: number } | undefined;
    const p3 = payload.phase3 as { accuracyPct?: number } | undefined;
    if (p1?.reactionMs != null && p3?.accuracyPct != null) {
      scatterMap.set(member, { phase1Ms: p1.reactionMs, phase3AccuracyPct: p3.accuracyPct });
    }
  }

  scatterMap.set(currentMember, {
    phase1Ms: currentPhase1Ms,
    phase3AccuracyPct: currentPhase3Accuracy,
  });

  const scatterData = [...scatterMap.entries()].map(([memberName, d]) => ({
    memberName,
    ...d,
  }));

  const phase1Values = [...scatterMap.values()].map((d) => d.phase1Ms);
  const phase3Values = [...scatterMap.values()].map((d) => d.phase3AccuracyPct);

  const phase2Values: number[] = [];
  for (const payload of peerPayloads) {
    const p2 = payload.phase2 as { reactionMs?: number } | undefined;
    if (p2?.reactionMs != null) phase2Values.push(p2.reactionMs);
  }
  phase2Values.push(currentPhase2Ms);

  return {
    phase1Mean: mean(phase1Values),
    phase1StdDev: standardDeviation(phase1Values),
    phase1Fastest: phase1Values.length ? Math.min(...phase1Values) : null,
    phase2Mean: mean(phase2Values),
    phase2StdDev: standardDeviation(phase2Values),
    phase2Fastest: phase2Values.length ? Math.min(...phase2Values) : null,
    phase3AccuracyMean: mean(phase3Values),
    phase3AccuracyStdDev: standardDeviation(phase3Values),
    scatterData,
  };
}

export function buildReactionSubmitPayload(
  state: ReactionSessionState,
  team: ReactionTeamMeta,
): ReactionSubmitPayload {
  if (!allPhasesComplete(state)) {
    throw new Error('Complete all 3 phases before uploading.');
  }

  const comparison = dominantNonDominantComparison(state)!;
  const stats = state.teamStats;

  return {
    activityId: 6,
    submittedAt: new Date().toISOString(),
    team,
    phase1: {
      reactionMs: state.phase1!.reactionMs,
      appearTs: state.phase1!.appearTs,
      tapTs: state.phase1!.tapTs,
    },
    phase2: {
      reactionMs: state.phase2!.reactionMs,
      handUsed: state.phase2!.handUsed,
      appearTs: state.phase2!.appearTs,
      tapTs: state.phase2!.tapTs,
    },
    phase3: {
      accuracyPct: state.phase3!.accuracyPct,
      avgDelayMs: state.phase3!.avgDelayMs,
      tracePath: downsampleTracePoints(state.phase3!.tracePath),
      idealTrace: downsampleTracePoints(state.phase3!.idealTrace),
      waveSnapshots: state.phase3!.waveSnapshots.map((snap) => downsampleTracePoints(snap, 48)),
      waveConfig: state.phase3!.waveConfig,
    },
    comparison,
    statistics: {
      phase1Mean: stats?.phase1Mean ?? state.phase1!.reactionMs,
      phase1StdDev: stats?.phase1StdDev ?? 0,
      phase2Mean: stats?.phase2Mean ?? state.phase2!.reactionMs,
      phase2StdDev: stats?.phase2StdDev ?? 0,
      phase3AccuracyMean: stats?.phase3AccuracyMean ?? state.phase3!.accuracyPct,
      phase3AccuracyStdDev: stats?.phase3AccuracyStdDev ?? 0,
    },
    scatterData: stats?.scatterData ?? [
      {
        memberName: team.memberName,
        phase1Ms: state.phase1!.reactionMs,
        phase3AccuracyPct: state.phase3!.accuracyPct,
      },
    ],
    reflection: { ...state.reflection },
  };
}

export function scoreFromReactionState(state: ReactionSessionState): number {
  if (!state.phase1 || !state.phase3) return 0;
  return combinedReactionScore(state.phase1.reactionMs, state.phase3.accuracyPct);
}
