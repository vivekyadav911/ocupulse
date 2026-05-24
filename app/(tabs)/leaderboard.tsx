import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Layout, useReducedMotion } from 'react-native-reanimated';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import type { LeaderboardFilter, LeaderRow } from '../../services/leaderboard';
import { subscribeLeaderboard } from '../../services/leaderboard';
import { syncOutbox } from '../../services/firestore';
import { useThemedStyles } from '../../theme/themedStyles';

const FILTERS: { key: LeaderboardFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reaction', label: 'Reaction' },
  { key: 'sound', label: 'Sound' },
  { key: 'earthquake', label: 'Earthquake' },
  { key: 'humanperf', label: 'Human perf' },
  { key: 'parachute', label: 'Parachute' },
  { key: 'handfan', label: 'Hand fan' },
  { key: 'breathing', label: 'Breathing' },
];

const springLayout = Layout.springify().damping(18).stiffness(120);

function activityLabel(activityType: string): string {
  const found = FILTERS.find((f) => f.key === activityType);
  return found?.label ?? activityType;
}

export default function LeaderboardScreen() {
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [movedUp, setMovedUp] = useState<Set<string>>(new Set());
  const prevRankRef = useRef<Map<string, number>>(new Map());
  const reduceMotion = useReducedMotion();

  const styles = useThemedStyles((t) => ({
    sub: { color: t.colors.muted, marginBottom: t.spacing.md },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: t.spacing.md },
    chip: {
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: t.colors.border,
      marginRight: t.spacing.sm,
      marginBottom: t.spacing.sm,
      backgroundColor: t.colors.surface,
    },
    chipOn: { backgroundColor: t.colors.primaryButton, borderColor: t.colors.primaryButton },
    chipText: { color: t.colors.text, fontWeight: '600' },
    chipTextOn: { color: t.colors.textInverse },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.md,
      marginBottom: t.spacing.sm,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    rank: { width: 36, fontWeight: '800', color: t.colors.accent },
    team: { flex: 1, color: t.colors.text, fontWeight: '600' },
    score: { fontWeight: '800', color: t.colors.text, textAlign: 'right' as const },
    up: { marginLeft: t.spacing.xs, color: t.colors.success, fontWeight: '800' },
    meta: { fontSize: 12, color: t.colors.muted, marginTop: 2 },
    empty: { marginTop: t.spacing.lg, color: t.colors.muted },
    list: { flex: 1, minHeight: 200 },
  }));

  const subRef = useRef<ReturnType<typeof subscribeLeaderboard> | null>(null);

  useFocusEffect(
    useCallback(() => {
      void syncOutbox().then(() => subRef.current?.refresh());
    }, []),
  );

  useEffect(() => {
    const ranks = prevRankRef.current;
    const sub = subscribeLeaderboard(filter, (next) => {
      const up = new Set<string>();
      next.forEach((row, index) => {
        const prev = ranks.get(row.id);
        if (prev != null && index < prev) up.add(row.id);
        ranks.set(row.id, index);
      });
      setMovedUp(up);
      setRows(next);
    });
    subRef.current = sub;
    return () => {
      sub.unsubscribe();
      subRef.current = null;
      ranks.clear();
    };
  }, [filter]);

  return (
    <ScreenShell scroll={false}>
      <PageTitle eyebrow="Rankings" title="Board" />
      <Text style={styles.sub}>
        Scores from this device and cloud sync — complete an experiment, then Save result
      </Text>
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
        style={styles.list}
        data={rows}
        keyExtractor={(item) => item.id}
        itemLayoutAnimation={reduceMotion ? undefined : springLayout}
        renderItem={({ item, index }) => (
          <Animated.View layout={reduceMotion ? undefined : springLayout}>
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.team}>{item.teamName || 'Demo Team'}</Text>
                <Text style={styles.meta}>
                  {filter === 'all'
                    ? `${activityLabel(item.activityType)}${item.detail ? ` · ${item.detail}` : ''}`
                    : item.detail || activityLabel(item.activityType)}
                </Text>
              </View>
              {movedUp.has(item.id) ? <Text style={styles.up}>▲</Text> : null}
              <Text style={styles.score}>{item.scoreLabel ?? Math.round(item.score)}</Text>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No scores yet — open an activity, finish it, and tap Save result.
          </Text>
        }
      />
    </ScreenShell>
  );
}
