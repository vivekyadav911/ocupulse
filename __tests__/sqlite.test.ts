import Database from 'better-sqlite3';
import type * as SQLite from 'expo-sqlite';

import * as ExpoSqlite from 'expo-sqlite';
import {
  outboxDao,
  resetDbForTests,
  resultsDao,
  runMigrations,
  sessionsDao,
  studentsDao,
  teamsDao,
} from '../services/db/sqlite';

let mockNativeDb: Database.Database;

function createMockAdapter(database: Database.Database): SQLite.SQLiteDatabase {
  return {
    execAsync(sql: string) {
      database.exec(sql);
      return Promise.resolve();
    },
    runAsync(sql: string, params: readonly unknown[] = []) {
      const result = database.prepare(sql).run(...params);
      return Promise.resolve({
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: result.changes,
      });
    },
    getFirstAsync<T>(sql: string, params: readonly unknown[] = []) {
      const row = database.prepare(sql).get(...params);
      return Promise.resolve((row as T) ?? null);
    },
    getAllAsync<T>(sql: string, params: readonly unknown[] = []) {
      return Promise.resolve(database.prepare(sql).all(...params) as T[]);
    },
    closeAsync() {
      database.close();
      return Promise.resolve();
    },
  } as unknown as SQLite.SQLiteDatabase;
}

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

const openDatabaseAsync = ExpoSqlite.openDatabaseAsync as jest.MockedFunction<
  typeof ExpoSqlite.openDatabaseAsync
>;

describe('sqlite DAOs', () => {
  beforeEach(async () => {
    await resetDbForTests();
    mockNativeDb = new Database(':memory:');
    openDatabaseAsync.mockResolvedValue(createMockAdapter(mockNativeDb));
    await runMigrations();
  });

  afterEach(async () => {
    await resetDbForTests();
    mockNativeDb.close();
  });

  it('runs 002_indexes migration on a fresh database', async () => {
    await runMigrations();
    const indexes = mockNativeDb
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'`)
      .all() as { name: string }[];
    const names = indexes.map((i) => i.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'idx_students_team',
        'idx_sessions_team',
        'idx_sessions_activity',
        'idx_results_session',
        'idx_results_activity',
        'idx_results_synced',
        'idx_outbox_created',
      ]),
    );
  });

  it('round-trips teamsDao', async () => {
    const row = { id: 'team-1', name: 'Alpha' };
    await teamsDao.insert(row);
    expect(await teamsDao.findById('team-1')).toEqual(row);
    const updated = { ...row, name: 'Beta' };
    await teamsDao.update(updated);
    expect(await teamsDao.findAll()).toEqual([updated]);
  });

  it('round-trips studentsDao', async () => {
    const row = { id: 'stu-1', firstName: 'Ada', teamId: 'team-1' };
    await studentsDao.insert(row);
    expect(await studentsDao.findById('stu-1')).toEqual(row);
    const updated = { ...row, firstName: 'Grace', teamId: null };
    await studentsDao.update(updated);
    expect(await studentsDao.findAll()).toEqual([updated]);
  });

  it('round-trips sessionsDao', async () => {
    const row = {
      id: 'sess-1',
      teamId: 'team-1',
      activityType: 'parachute',
      startTime: 1_700_000_000_000,
    };
    await sessionsDao.insert(row);
    expect(await sessionsDao.findById('sess-1')).toEqual(row);
    const updated = { ...row, activityType: 'earthquake', startTime: 1_700_000_100_000 };
    await sessionsDao.update(updated);
    expect(await sessionsDao.findAll()).toEqual([updated]);
  });

  it('round-trips resultsDao', async () => {
    const row = {
      id: 'res-1',
      sessionId: 'sess-1',
      activityType: 'parachute',
      score: 88.5,
      dataJson: '{"g":2}',
      synced: 0 as const,
    };
    await resultsDao.insert(row);
    expect(await resultsDao.findById('res-1')).toEqual(row);
    const updated = { ...row, score: 91, synced: 1 as const };
    await resultsDao.update(updated);
    expect(await resultsDao.findAll()).toEqual([updated]);
  });

  it('round-trips outboxDao', async () => {
    await outboxDao.insert({
      path: 'scores/res-1',
      payload: '{"score":1}',
      createdAt: 1_700_000_000_000,
    });
    const [inserted] = await outboxDao.findAll();
    expect(inserted).toMatchObject({
      path: 'scores/res-1',
      payload: '{"score":1}',
      createdAt: 1_700_000_000_000,
    });
    expect(inserted?.id).toBeGreaterThan(0);

    const found = await outboxDao.findById(inserted!.id);
    expect(found).toEqual(inserted);

    const updated = { ...inserted!, payload: '{"score":2}' };
    await outboxDao.update(updated);
    expect(await outboxDao.findById(inserted!.id)).toEqual(updated);
  });
});
