import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { outboxDao, runMigrations, teamsDao } from '../../services/db/sqlite';
import { colors, spacing } from '../../theme/tokens';

export default function SqliteSpike() {
  const [rows, setRows] = useState<string>('—');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void runMigrations().catch((e) => setError(String(e)));
  }, []);

  const test = async () => {
    try {
      setError(null);
      await teamsDao.insert({ id: 't1', name: 'Alpha' });
      await outboxDao.insert({
        path: 'scores/spike-test',
        payload: JSON.stringify({ teamId: 't1', score: 42 }),
        createdAt: Date.now(),
      });
      const team = await teamsDao.findById('t1');
      const outbox = await outboxDao.findAll();
      setRows(JSON.stringify({ team, outbox }, null, 2));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>SQLite + outbox schema (stemm-lab.db)</Text>
      <Button title="Insert fake team + outbox row, read back" onPress={test} />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Text style={styles.out}>{rows}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { marginBottom: spacing.md, color: colors.text },
  err: { marginTop: spacing.sm, color: colors.danger },
  out: { marginTop: spacing.md, fontFamily: 'monospace', color: colors.text },
});
