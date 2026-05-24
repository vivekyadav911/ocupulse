import type { LeaderRow } from '../../services/firestore';

const PARACHUTE_V_MIN = 0.5;
const PARACHUTE_V_MAX = 5;
const HANDFAN_ANGLE_MAX = 45;
const BREATHING_BPM_MAX = 30;
const SOUND_SPL_MIN = 25;
const SOUND_SPL_MAX = 100;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function linearMap(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const t = (value - min) / (max - min);
  return clamp100(t * 100);
}

function invertLinearMap(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const t = (max - value) / (max - min);
  return clamp100(t * 100);
}

/** Map any activity's raw result to 0–100 for cross-activity "All" rankings (higher = better). */
export function normalizedScoreForAll(row: LeaderRow): number {
  const { activityType, score } = row;

  switch (activityType) {
    case 'reaction':
    case 'earthquake':
    case 'humanperf':
      return clamp100(score);
    case 'sound': {
      const peak = row.peakDb ?? score;
      return linearMap(peak, SOUND_SPL_MIN, SOUND_SPL_MAX);
    }
    case 'parachute':
      return invertLinearMap(score, PARACHUTE_V_MIN, PARACHUTE_V_MAX);
    case 'handfan':
      return linearMap(score, 0, HANDFAN_ANGLE_MAX);
    case 'breathing':
      return linearMap(score, 0, BREATHING_BPM_MAX);
    default:
      return clamp100(score);
  }
}
