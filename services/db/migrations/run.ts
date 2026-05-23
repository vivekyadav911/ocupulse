import type * as SQLite from 'expo-sqlite';

/** Run migration SQL one statement at a time; skip duplicate-column errors on upgrade. */
export async function execMigrationSql(
  database: SQLite.SQLiteDatabase,
  sql: string,
): Promise<void> {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await database.execAsync(`${statement};`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/duplicate column name/i.test(msg)) continue;
      if (/already exists/i.test(msg)) continue;
      throw e;
    }
  }
}

export const ENSURE_MEDIA_ASSETS_SQL = `
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  local_uri TEXT,
  remote_url TEXT,
  mime_type TEXT,
  synced INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_media_session ON media_assets(session_id);
CREATE INDEX IF NOT EXISTS idx_media_synced ON media_assets(synced);
`;

export async function ensureMediaAssetsTable(database: SQLite.SQLiteDatabase): Promise<void> {
  await execMigrationSql(database, ENSURE_MEDIA_ASSETS_SQL);
}
