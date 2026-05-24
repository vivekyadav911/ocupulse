import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Layout, useReducedMotion } from 'react-native-reanimated';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import {
  formatLeaderboardMeta,
  formatLeaderboardPrimaryLabel,
} from '../../lib/leaderboard/formatLeaderRow';
import { ACTIVITY_LABELS, activityDisplayName } from '../../lib/activities/labels';
import type { LeaderboardFilter, LeaderRow } from '../../services/leaderboard';
import { subscribeLeaderboard } from '../../services/leaderboard';
import { syncOutbox } from '../../services/firestore';
import { subscribeTeamScores } from '../../services/teacher';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

const springLayout = Layout.springify().damping(18).stiffness(120);

export default function LeaderboardScreen() {
  const { activity: activityParam } = useLocalSearchParams<{ activity?: string }>();
  const role = useSessionStore((s) => s.role);
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const teamName = useSessionStore((s) => s.teamName);
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [movedUp, setMovedUp] = useState<Set<string>>(new Set());
  const prevRankRef = useRef<Map<string, number>>(new Map());
  const reduceMotion = useReducedMotion();
  const isTeacher = role === 'teacher';

  useEffect(() => {
    if (
      activityParam &&
      ACTIVITY_LABELS.some((f) => f.key === activityParam) &&
      activityParam !== 'all'
    ) {
      setFilter(activityParam);
    }
  }, [activityParam]);

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
    list: { flex: 1 },
    listContent: { paddingBottom: t.spacing.sm },
    listContentEmpty: { flexGrow: 1 },
  }));

  const subRef = useRef<ReturnType<typeof subscribeLeaderboard> | null>(null);

  useFocusEffect(
    useCallback(() => {
      void syncOutbox().then(() => subRef.current?.refresh());
    }, []),
  );

  useEffect(() => {
    const ranks = prevRankRef.current;
    const applyRows = (next: LeaderRow[]) => {
      const up = new Set<string>();
      next.forEach((row, index) => {
        const prev = ranks.get(row.id);
        if (prev != null && index < prev) up.add(row.id);
        ranks.set(row.id, index);
      });
      setMovedUp(up);
      setRows(next);
    };

    if (isTeacher && activeTeamId) {
      const unsub = subscribeTeamScores(activeTeamId, filter, applyRows);
      return () => {
        unsub();
        ranks.clear();
      };
    }

    const sub = subscribeLeaderboard(filter, applyRows);
    subRef.current = sub;
    return () => {
      sub.unsubscribe();
      subRef.current = null;
      ranks.clear();
    };
  }, [filter, isTeacher, activeTeamId]);

  const subtitle = isTeacher
    ? `Team leaderboard — ${teamName || 'your team'}${filter === 'all' ? ' · scores normalized 0–100' : ''}`
    : filter === 'all'
      ? 'All activities ranked on a 0–100 scale — pick an activity for native scores'
      : 'Scores from this device and cloud sync — complete an experiment, then Save result';

  const emptyMessage = isTeacher
    ? 'No scores yet for your team — students complete activities from their accounts.'
    : 'No scores yet — open an activity, finish it, and tap Save result.';

  return (
    <ScreenShell scroll={false}>
      <PageTitle eyebrow="Rankings" title="Board" />
      <Text style={styles.sub}>{subtitle}</Text>
      <View style={styles.chips}>
        {ACTIVITY_LABELS.map((f) => {
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
        contentContainerStyle={rows.length ? styles.listContent : styles.listContentEmpty}
        data={rows}
        keyExtractor={(item) => item.id}
        itemLayoutAnimation={reduceMotion ? undefined : springLayout}
        showsVerticalScrollIndicator
        renderItem={({ item, index }) => (
          <Animated.View layout={reduceMotion ? undefined : springLayout}>
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.team}>{formatLeaderboardPrimaryLabel(item)}</Text>
                <Text style={styles.meta}>
                  {formatLeaderboardMeta(item, filter, activityDisplayName)}
                </Text>
              </View>
              {movedUp.has(item.id) ? <Text style={styles.up}>▲</Text> : null}
              <Text style={styles.score}>{item.scoreLabel ?? Math.round(item.score)}</Text>
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      />
    </ScreenShell>
  );
}
