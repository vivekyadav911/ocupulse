import type * as SQLite from 'expo-sqlite';
import { createDao, type Dao } from './dao';
import type {
  ExperimentResult,
  MediaAsset,
  OutboxInsert,
  OutboxRow,
  Session,
  Student,
  Team,
} from './types';

export type { Dao } from './dao';
export type {
  ExperimentResult,
  MediaAsset,
  OutboxInsert,
  OutboxRow,
  Session,
  Student,
  Team,
  UserProfile,
  UserRole,
} from './types';

function syncedFlag(v: unknown): 0 | 1 {
  return Number(v) === 1 ? 1 : 0;
}

export function createSqliteExports(getDatabase: () => Promise<SQLite.SQLiteDatabase>) {
  const teamsDao: Dao<Team> = createDao(getDatabase, {
    table: 'teams',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'name', 'teacher_id', 'school_id', 'synced'],
    toInsertParams: (row) => [
      row.id,
      row.name,
      row.teacherId ?? null,
      row.schoolId ?? null,
      row.synced,
    ],
    updateColumns: ['name', 'teacher_id', 'school_id', 'synced'],
    toUpdateParams: (row) => [row.name, row.teacherId ?? null, row.schoolId ?? null, row.synced],
    fromRow: (row) => ({
      id: String(row.id),
      name: String(row.name),
      teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
      schoolId: row.school_id != null ? String(row.school_id) : null,
      synced: syncedFlag(row.synced),
    }),
  });

  const studentsDao: Dao<Student> = createDao(getDatabase, {
    table: 'students',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'first_name', 'team_id', 'uid', 'device_id', 'synced'],
    toInsertParams: (row) => [
      row.id,
      row.firstName,
      row.teamId,
      row.uid ?? null,
      row.deviceId ?? null,
      row.synced,
    ],
    updateColumns: ['first_name', 'team_id', 'uid', 'device_id', 'synced'],
    toUpdateParams: (row) => [
      row.firstName,
      row.teamId,
      row.uid ?? null,
      row.deviceId ?? null,
      row.synced,
    ],
    fromRow: (row) => ({
      id: String(row.id),
      firstName: String(row.first_name),
      teamId: row.team_id != null ? String(row.team_id) : null,
      uid: row.uid != null ? String(row.uid) : null,
      deviceId: row.device_id != null ? String(row.device_id) : null,
      synced: syncedFlag(row.synced),
    }),
  });

  const sessionsDao: Dao<Session> = createDao(getDatabase, {
    table: 'sessions',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: [
      'id',
      'team_id',
      'activity_type',
      'start_time',
      'student_id',
      'created_by',
      'synced',
    ],
    toInsertParams: (row) => [
      row.id,
      row.teamId,
      row.activityType,
      row.startTime,
      row.studentId ?? null,
      row.createdBy ?? null,
      row.synced,
    ],
    updateColumns: ['team_id', 'activity_type', 'start_time', 'student_id', 'created_by', 'synced'],
    toUpdateParams: (row) => [
      row.teamId,
      row.activityType,
      row.startTime,
      row.studentId ?? null,
      row.createdBy ?? null,
      row.synced,
    ],
    fromRow: (row) => ({
      id: String(row.id),
      teamId: row.team_id != null ? String(row.team_id) : null,
      activityType: row.activity_type != null ? String(row.activity_type) : null,
      startTime: row.start_time != null ? Number(row.start_time) : null,
      studentId: row.student_id != null ? String(row.student_id) : null,
      createdBy: row.created_by != null ? String(row.created_by) : null,
      synced: syncedFlag(row.synced),
    }),
  });

  const resultsDao: Dao<ExperimentResult> = createDao(getDatabase, {
    table: 'experiment_results',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: [
      'id',
      'session_id',
      'activity_type',
      'score',
      'data_json',
      'synced',
      'team_id',
      'student_id',
      'user_id',
      'media_urls_json',
    ],
    toInsertParams: (row) => [
      row.id,
      row.sessionId,
      row.activityType,
      row.score,
      row.dataJson,
      row.synced,
      row.teamId ?? null,
      row.studentId ?? null,
      row.userId ?? null,
      row.mediaUrlsJson ?? null,
    ],
    updateColumns: [
      'session_id',
      'activity_type',
      'score',
      'data_json',
      'synced',
      'team_id',
      'student_id',
      'user_id',
      'media_urls_json',
    ],
    toUpdateParams: (row) => [
      row.sessionId,
      row.activityType,
      row.score,
      row.dataJson,
      row.synced,
      row.teamId ?? null,
      row.studentId ?? null,
      row.userId ?? null,
      row.mediaUrlsJson ?? null,
    ],
    fromRow: (row) => ({
      id: String(row.id),
      sessionId: row.session_id != null ? String(row.session_id) : null,
      activityType: row.activity_type != null ? String(row.activity_type) : null,
      score: row.score != null ? Number(row.score) : null,
      dataJson: row.data_json != null ? String(row.data_json) : null,
      synced: syncedFlag(row.synced),
      teamId: row.team_id != null ? String(row.team_id) : null,
      studentId: row.student_id != null ? String(row.student_id) : null,
      userId: row.user_id != null ? String(row.user_id) : null,
      mediaUrlsJson: row.media_urls_json != null ? String(row.media_urls_json) : null,
    }),
  });

  const mediaAssetsDao: Dao<MediaAsset> = createDao(getDatabase, {
    table: 'media_assets',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'session_id', 'local_uri', 'remote_url', 'mime_type', 'synced'],
    toInsertParams: (row) => [
      row.id,
      row.sessionId,
      row.localUri,
      row.remoteUrl,
      row.mimeType,
      row.synced,
    ],
    updateColumns: ['session_id', 'local_uri', 'remote_url', 'mime_type', 'synced'],
    toUpdateParams: (row) => [row.sessionId, row.localUri, row.remoteUrl, row.mimeType, row.synced],
    fromRow: (row) => ({
      id: String(row.id),
      sessionId: row.session_id != null ? String(row.session_id) : null,
      localUri: row.local_uri != null ? String(row.local_uri) : null,
      remoteUrl: row.remote_url != null ? String(row.remote_url) : null,
      mimeType: row.mime_type != null ? String(row.mime_type) : null,
      synced: syncedFlag(row.synced),
    }),
  });

  const outboxDao: Dao<OutboxRow, number, OutboxInsert> = createDao<
    OutboxRow,
    number,
    OutboxInsert
  >(getDatabase, {
    table: 'outbox',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['path', 'payload', 'created_at'],
    toInsertParams: (row: OutboxInsert) => [row.path, row.payload, row.createdAt],
    updateColumns: ['path', 'payload', 'created_at'],
    toUpdateParams: (row) => [row.path, row.payload, row.createdAt],
    fromRow: (row) => ({
      id: Number(row.id),
      path: String(row.path),
      payload: String(row.payload),
      createdAt: Number(row.created_at),
    }),
  });

  async function insertOutbox(path: string, payload: object): Promise<void> {
    await outboxDao.insert({
      path,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
    });
  }

  async function getAllOutbox(): Promise<{ id: number; path: string; payload: string }[]> {
    const rows = await outboxDao.findAll();
    return rows.map(({ id, path, payload }) => ({ id, path, payload }));
  }

  async function deleteOutboxIds(ids: number[]): Promise<void> {
    if (!ids.length) return;
    const database = await getDatabase();
    const ph = ids.map(() => '?').join(',');
    await database.runAsync(`DELETE FROM outbox WHERE id IN (${ph})`, ids);
  }

  async function markResultSynced(id: string): Promise<void> {
    const existing = await resultsDao.findById(id);
    if (!existing) return;
    await resultsDao.update({ ...existing, synced: 1 });
  }

  async function deleteSessionAndResult(sessionId: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM results WHERE id = ? OR session_id = ?', [
      sessionId,
      sessionId,
    ]);
    await database.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
    const outbox = await getAllOutbox();
    const stale = outbox
      .filter((r) => r.path === `scores/${sessionId}` || r.path === `sessions/${sessionId}`)
      .map((r) => r.id);
    await deleteOutboxIds(stale);
  }

  return {
    teamsDao,
    studentsDao,
    sessionsDao,
    resultsDao,
    mediaAssetsDao,
    outboxDao,
    insertOutbox,
    getAllOutbox,
    deleteOutboxIds,
    markResultSynced,
    deleteSessionAndResult,
  };
}
