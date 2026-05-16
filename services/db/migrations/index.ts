/** SQL migrations — keep in sync with matching `.sql` files in this folder. */
export const MIGRATIONS: { version: string; sql: string }[] = [
  {
    version: '001_schema',
    sql: `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

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
`,
  },
  {
    version: '002_indexes',
    sql: `
CREATE INDEX IF NOT EXISTS idx_students_team ON students(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(activity_type);
CREATE INDEX IF NOT EXISTS idx_results_session ON experiment_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_activity ON experiment_results(activity_type);
CREATE INDEX IF NOT EXISTS idx_results_synced ON experiment_results(synced);
CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at);
`,
  },
];
