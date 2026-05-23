import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';
import { ensureMediaAssetsTable, execMigrationSql } from './migrations/run';
import { createSqliteExports } from './sqlite.shared';

export type {
  Dao,
  ExperimentResult,
  MediaAsset,
  OutboxInsert,
  OutboxRow,
  Session,
  Student,
  Team,
} from './sqlite.shared';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) db = await SQLite.openDatabaseAsync('stemm-lab.db');
  return db;
}

export async function resetDbForTests(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

async function isMigrationApplied(
  database: SQLite.SQLiteDatabase,
  version: string,
): Promise<boolean> {
  try {
    const row = await database.getFirstAsync<{ version: string }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [version],
    );
    return !!row;
  } catch {
    return false;
  }
}

const LEGACY_INIT_VERSION = '001_schema';

export async function runMigrations(): Promise<void> {
  const database = await getDb();
  for (const migration of MIGRATIONS) {
    if (await isMigrationApplied(database, migration.version)) continue;

    if (
      migration.version === '001_init' &&
      (await isMigrationApplied(database, LEGACY_INIT_VERSION))
    ) {
      await database.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        '001_init',
        Date.now(),
      ]);
      continue;
    }

    await execMigrationSql(database, migration.sql);
    await database.runAsync('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      migration.version,
      Date.now(),
    ]);
  }
  await ensureMediaAssetsTable(database);
}

const api = createSqliteExports(() => getDb());

export const {
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
} = api;
