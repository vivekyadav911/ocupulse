import { formatLeaderboardDisplay } from '../leaderboard/formatLeaderRow';
import type { ExperimentRecord } from '../../services/experimentsData';
import type { LeaderRow } from '../../services/firestore';
import { studentFirstNameFromPayload } from './stored';

/** Single adapter: experiment library rows → leaderboard rows. */
export function experimentRecordToLeaderRow(record: ExperimentRecord): LeaderRow {
  const { payload, activityType, score } = record;
  const display = formatLeaderboardDisplay(activityType, score, payload);
  return {
    id: record.id,
    teamName: record.teamName,
    score: record.score,
    activityType: record.activityType,
    submittedAt: record.submittedAt,
    scoreLabel: record.scoreLabel ?? display.scoreText,
    detail: record.detail ?? display.detail,
    studentId: record.studentId,
    studentFirstName: record.studentFirstName ?? studentFirstNameFromPayload(payload),
    lat: payload.lat != null ? Number(payload.lat) : undefined,
    lng: payload.lng != null ? Number(payload.lng) : undefined,
    peakDb: payload.peakDb != null ? Number(payload.peakDb) : undefined,
    avgDb: payload.avgDb != null ? Number(payload.avgDb) : undefined,
    sessionId: record.sessionId,
    updatedAt: record.submittedAt,
  };
}
