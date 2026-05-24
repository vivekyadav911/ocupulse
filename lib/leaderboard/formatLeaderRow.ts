import type { ActivityType } from '../../store/sessionStore';

export type LeaderboardDisplay = {
  scoreText: string;
  detail: string;
};

function num(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/** Human-readable primary score + detail for leaderboard rows. */
export function formatLeaderboardDisplay(
  activityType: string,
  score: number,
  payload: Record<string, unknown> = {},
): LeaderboardDisplay {
  const act = activityType as ActivityType;
  switch (act) {
    case 'reaction': {
      const avgMs = num(payload, 'avgReactionMs');
      const trace = num(payload, 'traceScore');
      return {
        scoreText: `${Math.round(score)}`,
        detail:
          avgMs != null
            ? `avg ${Math.round(avgMs)} ms · trace ${trace ?? '—'}`
            : 'reaction + trace',
      };
    }
    case 'sound': {
      const peak = num(payload, 'peakDb') ?? score;
      const avg = num(payload, 'avgDb');
      return {
        scoreText: `${Math.round(peak)} dB`,
        detail: avg != null ? `avg ${Math.round(avg)} dB peak` : 'sound pollution sample',
      };
    }
    case 'earthquake': {
      const rms = num(payload, 'rmsG');
      return {
        scoreText: `${Math.round(score)}`,
        detail: rms != null ? `stability · wobble ${rms.toFixed(3)} g` : 'stability score',
      };
    }
    case 'humanperf': {
      const jerk = num(payload, 'jerkRms');
      return {
        scoreText: `${Math.round(score)}`,
        detail: jerk != null ? `smoothness · jerk ${jerk.toFixed(2)}` : 'arm smoothness',
      };
    }
    case 'parachute': {
      const sensorG = num(payload, 'impactG') ?? num(payload, 'gForceSensor');
      const formulaG = num(payload, 'gForceFormula') ?? num(payload, 'gForce');
      const g = sensorG ?? formulaG;
      const source = sensorG != null ? 'sensor' : formulaG != null ? 'formula' : '';
      return {
        scoreText: `${Math.round(score)}`,
        detail: g != null ? `safety · ${g.toFixed(2)} g ${source}` : 'landing safety',
      };
    }
    case 'handfan': {
      const deg = num(payload, 'bendAngleDeg') ?? score;
      const shift = num(payload, 'shiftPx');
      return {
        scoreText: `${Math.round(deg)}°`,
        detail: shift != null ? `fan motion · ${Math.round(shift)} px est.` : 'bend angle',
      };
    }
    case 'breathing': {
      const bpm = num(payload, 'bpm') ?? score;
      return {
        scoreText: `${bpm} bpm`,
        detail: 'chest rhythm (30 s)',
      };
    }
    default:
      return { scoreText: `${Math.round(score)}`, detail: activityType };
  }
}
