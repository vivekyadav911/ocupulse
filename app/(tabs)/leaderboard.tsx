import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { Layout, useReducedMotion } from 'react-native-reanimated';
import type { LeaderRow } from '../../services/firestore';
import { subscribeLeaderboard } from '../../services/firestore';
import { colors, spacing } from '../../theme/tokens';

export default function LeaderboardScreen() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return subscribeLeaderboard('reaction', setRows);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Leaderboard</Text>
      <Text style={styles.sub}>Live scores (sample: reaction activity)</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View layout={reduceMotion ? undefined : Layout.springify()}>
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <Text style={styles.team}>{item.teamName}</Text>
              <Text style={styles.score}>{item.score}</Text>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No scores yet — complete an activity.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  h1: { fontSize: 24, fontWeight: '800', color: colors.primary },
  sub: { color: colors.muted, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  rank: { width: 36, fontWeight: '800', color: colors.accent },
  team: { flex: 1, color: colors.text, fontWeight: '600' },
  score: { fontWeight: '800', color: colors.primary },
  empty: { marginTop: spacing.lg, color: colors.muted },
});
