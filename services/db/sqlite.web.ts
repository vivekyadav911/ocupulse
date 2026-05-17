import type * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';
import { createSqliteExports } from './sqlite.shared';
import { WebMemoryDatabase, resetWebMemoryTables } from './webMemoryDb';

export type {
  Dao,
  ExperimentResult,
  OutboxInsert,
  OutboxRow,
  Session,
  Student,
  Team,
} from './sqlite.shared';

let db: WebMemoryDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) db = new WebMemoryDatabase();
  return db as unknown as SQLite.SQLiteDatabase;
}

export async function resetDbForTests(): Promise<void> {
  resetWebMemoryTables();
  db = null;
}

async function isMigrationApplied(database: WebMemoryDatabase, version: string): Promise<boolean> {
  const row = await database.getFirstAsync<{ version: string }>(
    'SELECT version FROM schema_migrations WHERE version = ?',
    [version],
  );
  return !!row;
}

const LEGACY_INIT_VERSION = '001_schema';

export async function runMigrations(): Promise<void> {
  const database = await getDb();
  const mem = database as unknown as WebMemoryDatabase;
  for (const migration of MIGRATIONS) {
    if (await isMigrationApplied(mem, migration.version)) continue;

    if (migration.version === '001_init' && (await isMigrationApplied(mem, LEGACY_INIT_VERSION))) {
      await mem.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        '001_init',
        Date.now(),
      ]);
      continue;
    }

    await mem.execAsync(migration.sql);
    await mem.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      migration.version,
      Date.now(),
    ]);
  }
}

const api = createSqliteExports(() => getDb());

export const {
  teamsDao,
  studentsDao,
  sessionsDao,
  resultsDao,
  outboxDao,
  insertOutbox,
  getAllOutbox,
  deleteOutboxIds,
  markResultSynced,
} = api;
