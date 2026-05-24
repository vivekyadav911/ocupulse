import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { showAlert } from '../../lib/alert';
import { outboxDao, resultsDao, runMigrations, teamsDao } from '../../services/db/sqlite';
import { colors, spacing } from '../../theme/tokens';

export default function SqliteSpike() {
  const [rows, setRows] = useState<string>('Tap the button to insert and read back.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void runMigrations().catch((e: unknown) => setError(String(e)));
  }, []);

  const test = async () => {
    try {
      setError(null);
      const teamId = `t-${Date.now()}`;
      await teamsDao.insert({ id: teamId, name: 'Alpha' });
      await outboxDao.insert({
        path: `scores/spike-${Date.now()}`,
        payload: JSON.stringify({ teamId, teamName: 'Alpha', score: 42, activityType: 'reaction' }),
        createdAt: Date.now(),
      });
      const team = await teamsDao.findById(teamId);
      const outbox = await outboxDao.findAll();
      const results = await resultsDao.findAll();
      setRows(JSON.stringify({ team, outbox, experiment_results: results }, null, 2));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      showAlert('SQLite error', msg);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.t}>SQLite + outbox schema (stemm-lab.db)</Text>
      <Button title="Insert fake team + outbox row, read back" onPress={() => void test()} />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Text style={styles.out} selectable>
        {rows}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  t: { marginBottom: spacing.md, color: colors.text },
  err: { marginTop: spacing.sm, color: colors.danger },
  out: { marginTop: spacing.md, fontFamily: 'monospace', fontSize: 12, color: colors.text },
});
