import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Layout, useReducedMotion } from 'react-native-reanimated';
import type { LeaderboardFilter, LeaderRow } from '../../services/firestore';
import { subscribeLeaderboard } from '../../services/firestore';
import { useThemedStyles } from '../../theme/themedStyles';

const FILTERS: { key: LeaderboardFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reaction', label: 'Reaction' },
  { key: 'sound', label: 'Sound' },
  { key: 'earthquake', label: 'Earthquake' },
  { key: 'humanperf', label: 'Human perf' },
];

const springLayout = Layout.springify().damping(18).stiffness(120);

export default function LeaderboardScreen() {
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [movedUp, setMovedUp] = useState<Set<string>>(new Set());
  const prevRankRef = useRef<Map<string, number>>(new Map());
  const reduceMotion = useReducedMotion();

  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md, backgroundColor: t.colors.surfaceAlt },
    h1: { fontSize: 24, fontWeight: '800', color: t.colors.text },
    sub: { color: t.colors.muted, marginBottom: t.spacing.md },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: t.spacing.md },
    chip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.colors.muted,
      marginRight: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    chipOn: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
    chipText: { color: t.colors.text, fontWeight: '600' },
    chipTextOn: { color: t.colors.textInverse },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: 12,
      marginBottom: t.spacing.sm,
    },
    rank: { width: 36, fontWeight: '800', color: t.colors.accent },
    team: { flex: 1, color: t.colors.text, fontWeight: '600' },
    score: { fontWeight: '800', color: t.colors.primary },
    up: { marginLeft: t.spacing.xs, color: t.colors.success, fontWeight: '800' },
    meta: { fontSize: 12, color: t.colors.muted },
    empty: { marginTop: t.spacing.lg, color: t.colors.muted },
  }));

  useEffect(() => {
    const ranks = prevRankRef.current;
    const unsub = subscribeLeaderboard(filter, (next) => {
      const up = new Set<string>();
      next.forEach((row, index) => {
        const prev = ranks.get(row.id);
        if (prev != null && index < prev) up.add(row.id);
        ranks.set(row.id, index);
      });
      setMovedUp(up);
      setRows(next);
    });
    return () => {
      unsub();
      ranks.clear();
    };
  }, [filter]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Leaderboard</Text>
      <Text style={styles.sub}>Live Firestore rankings — rows spring when ranks change</Text>
      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Animated.FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        itemLayoutAnimation={reduceMotion ? undefined : springLayout}
        renderItem={({ item, index }) => (
          <Animated.View layout={reduceMotion ? undefined : springLayout}>
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.team}>{item.teamName}</Text>
                {filter === 'all' ? <Text style={styles.meta}>{item.activityType}</Text> : null}
              </View>
              {movedUp.has(item.id) ? <Text style={styles.up}>▲</Text> : null}
              <Text style={styles.score}>{Math.round(item.score)}</Text>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No scores yet — complete an activity on any device.</Text>
        }
      />
    </View>
  );
}
