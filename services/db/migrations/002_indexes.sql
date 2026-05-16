CREATE INDEX IF NOT EXISTS idx_students_team ON students(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_team ON sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(activity_type);
CREATE INDEX IF NOT EXISTS idx_results_session ON experiment_results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_activity ON experiment_results(activity_type);
CREATE INDEX IF NOT EXISTS idx_results_synced ON experiment_results(synced);
CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox(created_at);
