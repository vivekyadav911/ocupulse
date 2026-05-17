import type * as SQLite from 'expo-sqlite';
import { createDao, type Dao } from './dao';
import type { ExperimentResult, OutboxInsert, OutboxRow, Session, Student, Team } from './types';

export type { Dao } from './dao';
export type { ExperimentResult, OutboxInsert, OutboxRow, Session, Student, Team } from './types';

export function createSqliteExports(getDatabase: () => Promise<SQLite.SQLiteDatabase>) {
  const teamsDao: Dao<Team> = createDao(getDatabase, {
    table: 'teams',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'name'],
    toInsertParams: (row) => [row.id, row.name],
    updateColumns: ['name'],
    toUpdateParams: (row) => [row.name],
    fromRow: (row) => ({
      id: String(row.id),
      name: String(row.name),
    }),
  });

  const studentsDao: Dao<Student> = createDao(getDatabase, {
    table: 'students',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'first_name', 'team_id'],
    toInsertParams: (row) => [row.id, row.firstName, row.teamId],
    updateColumns: ['first_name', 'team_id'],
    toUpdateParams: (row) => [row.firstName, row.teamId],
    fromRow: (row) => ({
      id: String(row.id),
      firstName: String(row.first_name),
      teamId: row.team_id != null ? String(row.team_id) : null,
    }),
  });

  const sessionsDao: Dao<Session> = createDao(getDatabase, {
    table: 'sessions',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'team_id', 'activity_type', 'start_time'],
    toInsertParams: (row) => [row.id, row.teamId, row.activityType, row.startTime],
    updateColumns: ['team_id', 'activity_type', 'start_time'],
    toUpdateParams: (row) => [row.teamId, row.activityType, row.startTime],
    fromRow: (row) => ({
      id: String(row.id),
      teamId: row.team_id != null ? String(row.team_id) : null,
      activityType: row.activity_type != null ? String(row.activity_type) : null,
      startTime: row.start_time != null ? Number(row.start_time) : null,
    }),
  });

  const resultsDao: Dao<ExperimentResult> = createDao(getDatabase, {
    table: 'experiment_results',
    idColumn: 'id',
    getId: (row) => row.id,
    insertColumns: ['id', 'session_id', 'activity_type', 'score', 'data_json', 'synced'],
    toInsertParams: (row) => [
      row.id,
      row.sessionId,
      row.activityType,
      row.score,
      row.dataJson,
      row.synced,
    ],
    updateColumns: ['session_id', 'activity_type', 'score', 'data_json', 'synced'],
    toUpdateParams: (row) => [row.sessionId, row.activityType, row.score, row.dataJson, row.synced],
    fromRow: (row) => ({
      id: String(row.id),
      sessionId: row.session_id != null ? String(row.session_id) : null,
      activityType: row.activity_type != null ? String(row.activity_type) : null,
      score: row.score != null ? Number(row.score) : null,
      dataJson: row.data_json != null ? String(row.data_json) : null,
      synced: Number(row.synced) === 1 ? 1 : 0,
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

  return {
    teamsDao,
    studentsDao,
    sessionsDao,
    resultsDao,
    outboxDao,
    insertOutbox,
    getAllOutbox,
    deleteOutboxIds,
    markResultSynced,
  };
}
