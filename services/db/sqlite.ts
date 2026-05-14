import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) db = await SQLite.openDatabaseAsync('stemm-lab.db');
  return db;
}

export async function runMigrations(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      team_id TEXT
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      activity_type TEXT,
      start_time INTEGER
    );
    CREATE TABLE IF NOT EXISTS experiment_results (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      activity_type TEXT,
      score REAL,
      data_json TEXT,
      synced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_results_activity ON experiment_results(activity_type);
    CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at);
  `);
}

export async function insertOutbox(path: string, payload: object): Promise<void> {
  const database = await getDb();
  await database.runAsync('INSERT INTO outbox (path, payload, created_at) VALUES (?, ?, ?)', [
    path,
    JSON.stringify(payload),
    Date.now(),
  ]);
}

export async function getAllOutbox(): Promise<{ id: number; path: string; payload: string }[]> {
  const database = await getDb();
  return database.getAllAsync<{ id: number; path: string; payload: string }>(
    'SELECT id, path, payload FROM outbox ORDER BY id ASC',
  );
}

export async function deleteOutboxIds(ids: number[]): Promise<void> {
  if (!ids.length) return;
  const database = await getDb();
  const ph = ids.map(() => '?').join(',');
  await database.runAsync(`DELETE FROM outbox WHERE id IN (${ph})`, ids);
}

export async function markResultSynced(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE experiment_results SET synced = 1 WHERE id = ?', [id]);
}
