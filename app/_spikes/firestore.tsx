import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { writeSessionOptimistic } from '../../services/firestore';
import { subscribeLeaderboard } from '../../services/firestore';
import type { LeaderRow } from '../../services/firestore';
import { colors, spacing } from '../../theme/tokens';

export default function FirestoreSpike() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const write = async () => {
    await writeSessionOptimistic({
      activityType: 'reaction',
      teamName: 'SpikeTeam',
      score: Math.random() * 100,
      payload: { spike: true },
    });
  };
  const listen = () => {
    return subscribeLeaderboard('reaction', setRows);
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>Firestore write + leaderboard listener</Text>
      <Button title="Write random score" onPress={write} />
      <Button title="Attach listener" variant="secondary" onPress={() => listen()} />
      <Text style={styles.out}>{rows.map((r) => `${r.teamName}:${r.score}`).join('\n')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md },
  t: { marginBottom: spacing.md },
  out: { marginTop: spacing.md, color: colors.text },
});
