import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ACTIVITY_LABELS, activityDisplayName } from '../../lib/activities/labels';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { getCurrentUser } from '../../services/auth';
import {
  subscribeStudentExperiments,
  subscribeTeamExperiments,
  type ExperimentRecord,
} from '../../services/experimentsData';
import type { LeaderboardFilter } from '../../services/firestore';
import { syncOutbox } from '../../services/firestore';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ExperimentsDataListScreen() {
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const isTeacher = role === 'teacher';
  const [rows, setRows] = useState<ExperimentRecord[]>([]);
  const [filter, setFilter] = useState<LeaderboardFilter>('all');
  const studentSubRef = useRef<ReturnType<typeof subscribeStudentExperiments> | null>(null);

  const styles = useThemedStyles((t) => ({
    sub: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
    card: { marginBottom: t.spacing.md },
    chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginBottom: t.spacing.md },
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
    chipOn: { borderColor: t.colors.accent, backgroundColor: `${t.colors.accent}18` },
    chipText: { color: t.colors.text, fontWeight: '600' as const, fontSize: t.typography.caption },
    chipTextOn: { color: t.colors.accent, fontWeight: '800' as const },
    row: {
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    rowTitle: { fontWeight: '700', color: t.colors.text, fontSize: t.typography.body },
    rowMeta: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: 2 },
    empty: { color: t.colors.muted, fontStyle: 'italic' as const },
    badgeRow: { flexDirection: 'row' as const, gap: t.spacing.xs, marginTop: t.spacing.xs },
  }));

  useFocusEffect(
    useCallback(() => {
      void syncOutbox();
      studentSubRef.current?.refresh();
    }, []),
  );

  useEffect(() => {
    if (isTeacher) {
      studentSubRef.current = null;
      if (!activeTeamId) {
        setRows([]);
        return;
      }
      return subscribeTeamExperiments(activeTeamId, filter, setRows);
    }

    const user = getCurrentUser();
    if (!user) {
      setRows([]);
      return;
    }
    const sub = subscribeStudentExperiments(user.uid, setRows);
    studentSubRef.current = sub;
    return () => {
      sub.unsubscribe();
      studentSubRef.current = null;
    };
  }, [isTeacher, activeTeamId, filter]);

  const filteredRows = filter === 'all' ? rows : rows.filter((r) => r.activityType === filter);

  return (
    <ScreenShell>
      <PageTitle
        title="Experiments Data"
        eyebrow={isTeacher ? 'Team library' : 'Your experiments'}
      />
      <Text style={styles.sub}>
        {isTeacher
          ? 'Browse saved experiment results for your team. Tap a row to view details or export.'
          : 'Your saved experiment results sync to the cloud when online. Tap to view or share.'}
      </Text>

      <View style={styles.chips}>
        {ACTIVITY_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.chip, filter === key && styles.chipOn]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Card bordered style={styles.card}>
        {filteredRows.length === 0 ? (
          <Text style={styles.empty}>
            No saved experiments yet. Complete an activity to see data here.
          </Text>
        ) : (
          filteredRows.map((row) => (
            <Pressable
              key={row.id}
              style={styles.row}
              onPress={() => router.push(`/experiments-data/${row.sessionId}`)}
            >
              <Text style={styles.rowTitle}>
                {activityDisplayName(row.activityType)} · {row.scoreLabel ?? row.score}
              </Text>
              <Text style={styles.rowMeta}>
                {isTeacher && row.studentFirstName ? `${row.studentFirstName} · ` : ''}
                {row.teamName} ·{' '}
                {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}
              </Text>
              {!row.synced ? (
                <View style={styles.badgeRow}>
                  <Badge label="Pending sync" />
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </Card>
    </ScreenShell>
  );
}
