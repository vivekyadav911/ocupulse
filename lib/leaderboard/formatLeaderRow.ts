import type { LeaderRow } from '../../services/firestore';
import type { ActivityType } from '../../store/sessionStore';

export type LeaderboardDisplay = {
  scoreText: string;
  detail: string;
};

function num(payload: Record<string, unknown>, key: string): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function str(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload[key];
  return v != null ? String(v) : undefined;
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
      const phase1 = payload.phase1 as Record<string, unknown> | undefined;
      const phase3 = payload.phase3 as Record<string, unknown> | undefined;
      const avgMs = phase1 ? num(phase1, 'reactionMs') : num(payload, 'avgReactionMs');
      const accuracy = phase3 ? num(phase3, 'accuracyPct') : num(payload, 'traceScore');
      return {
        scoreText: `${Math.round(score)}`,
        detail:
          avgMs != null
            ? phase3
              ? `${Math.round(avgMs)} ms · ${(accuracy ?? 0).toFixed(0)}% trace`
              : `avg ${Math.round(avgMs)} ms · trace ${accuracy ?? '—'}`
            : 'reaction board',
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
      const bestPeak = num(payload, 'bestPeakCm');
      const summary = payload.summary as Record<string, unknown> | undefined;
      const peak = bestPeak ?? (summary ? num(summary, 'bestPeakCm') : undefined);
      const rms = num(payload, 'rmsG');
      if (peak != null) {
        return {
          scoreText: `${Math.round(score)}`,
          detail: `stability · best ${peak.toFixed(2)} cm`,
        };
      }
      return {
        scoreText: `${Math.round(score)}`,
        detail: rms != null ? `stability · wobble ${rms.toFixed(3)} g` : 'stability score',
      };
    }
    case 'humanperf': {
      const attempts = payload.attempts;
      if (Array.isArray(attempts) && attempts.length > 0) {
        const avgs = attempts
          .map((t) => {
            const row = t as Record<string, unknown>;
            return num(row, 'avgJerkMm');
          })
          .filter((v): v is number => v != null);
        const best = avgs.length ? Math.min(...avgs) : undefined;
        const summary = payload.summary as Record<string, unknown> | undefined;
        const hardest = summary ? str(summary, 'hardestMovementLabel') : undefined;
        return {
          scoreText: `${Math.round(score)}`,
          detail:
            best != null
              ? `smoothness · best ${best.toFixed(1)} mm avg jerk${hardest ? ` · hardest ${hardest}` : ''}`
              : 'stretch speed & gracefulness',
        };
      }
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
      const trials = payload.trials;
      if (Array.isArray(trials) && trials.length > 0) {
        const angles = trials
          .map((t) => {
            const row = t as Record<string, unknown>;
            return num(row, 'actualAngleDeg');
          })
          .filter((v): v is number => v != null);
        const avg =
          angles.length > 0
            ? Math.round(angles.reduce((a, b) => a + b, 0) / angles.length)
            : Math.round(score);
        const material = typeof payload.material === 'string' ? payload.material : '';
        return {
          scoreText: `${avg}°`,
          detail: material ? `avg bend · ${material}` : 'hand fan challenge',
        };
      }
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

/** Primary row label — student name when available, otherwise team. */
export function formatLeaderboardPrimaryLabel(row: LeaderRow): string {
  const student = row.studentFirstName?.trim();
  if (student) return student;
  return row.teamName?.trim() || 'Demo Team';
}

/** Subtitle under the primary label (team + activity context). */
export function formatLeaderboardMeta(
  row: LeaderRow,
  filter: string | 'all',
  activityLabel: (activityType: string) => string,
): string {
  const parts: string[] = [];
  if (row.studentFirstName?.trim()) {
    parts.push(row.teamName?.trim() || 'Demo Team');
  }
  if (filter === 'all') {
    parts.push(activityLabel(row.activityType));
  }
  if (row.detail) parts.push(row.detail);
  else if (filter !== 'all') parts.push(activityLabel(row.activityType));
  return parts.join(' · ');
}
