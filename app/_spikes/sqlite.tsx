import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { getDb, runMigrations } from '../../services/db/sqlite';
import { colors, spacing } from '../../theme/tokens';

export default function SqliteSpike() {
  const [rows, setRows] = useState<string>('—');
  useEffect(() => {
    void runMigrations();
  }, []);
  const test = async () => {
    const db = await getDb();
    await db.execAsync(`INSERT OR REPLACE INTO teams (id, name) VALUES ('t1','Alpha');`);
    const r = await db.getAllAsync<{ id: string; name: string }>('SELECT * FROM teams LIMIT 5');
    setRows(JSON.stringify(r));
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>SQLite + outbox schema</Text>
      <Button title="Insert demo team + read back" onPress={test} />
      <Text style={styles.out}>{rows}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { marginBottom: spacing.md },
  out: { marginTop: spacing.md, fontFamily: 'monospace', color: colors.text },
});
