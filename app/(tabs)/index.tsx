import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActivityRow } from '../../components/ActivityRow';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle, TeamSubtitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { StemmBannerAd } from '../../components/StemmBannerAd';
import {
  subscribeTeamScores,
  subscribeTeamStudents,
  type StudentRosterRow,
} from '../../services/teacher';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

const ACTIVITIES: { path: string; title: string }[] = [
  { path: '/activity/parachute', title: 'Parachute Drop' },
  { path: '/activity/sound', title: 'Sound Pollution Hunter' },
  { path: '/activity/handfan', title: 'Hand Fan' },
  { path: '/activity/earthquake', title: 'Earthquake Structure' },
  { path: '/activity/humanperf', title: 'Human Performance Lab – Stretch Speed & Gracefulness' },
  { path: '/activity/reaction', title: 'Reaction Board' },
  { path: '/activity/breathing', title: 'Breathing Pace Trainer' },
];

function StudentHome() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);
  const styles = useThemedStyles((t) => ({
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: t.spacing.md,
    },
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
    },
    card: { marginBottom: t.spacing.md },
  }));

  return (
    <ScreenShell>
      <PageTitle title="Dashboard" />
      <TeamSubtitle team={team} />
      <StemmBannerAd />
      <Card bordered style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <Badge label={`${ACTIVITIES.length} Experiments`} />
        </View>
        {ACTIVITIES.map((a) => (
          <ActivityRow key={a.path} title={a.title} onPress={() => router.push(a.path)} />
        ))}
      </Card>
      <Button
        title="Experiments Data"
        variant="accent"
        icon="folder-open-outline"
        onPress={() => router.push('/experiments-data')}
      />
      <Button
        title="Sound results map"
        variant="secondary"
        icon="map-outline"
        onPress={() => router.push('/results/sound-map')}
      />
    </ScreenShell>
  );
}

function TeacherHome() {
  const router = useRouter();
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const teamName = useSessionStore((s) => s.teamName);
  const [students, setStudents] = useState<StudentRosterRow[]>([]);
  const [scoreCounts, setScoreCounts] = useState<Record<string, number>>({});

  const styles = useThemedStyles((t) => ({
    sectionTitle: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    sub: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
    card: { marginBottom: t.spacing.md },
    row: {
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    name: { fontWeight: '700', color: t.colors.text, fontSize: t.typography.body },
    meta: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: 2 },
    empty: { color: t.colors.muted, fontStyle: 'italic' as const },
  }));

  useEffect(() => {
    if (!activeTeamId) return;
    return subscribeTeamStudents(activeTeamId, setStudents);
  }, [activeTeamId]);

  useEffect(() => {
    if (!activeTeamId) return;
    return subscribeTeamScores(activeTeamId, 'all', (rows) => {
      const counts: Record<string, number> = {};
      for (const row of rows) {
        if (!row.studentId) continue;
        counts[row.studentId] = (counts[row.studentId] ?? 0) + 1;
      }
      setScoreCounts(counts);
    });
  }, [activeTeamId]);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [students],
  );

  return (
    <ScreenShell>
      <PageTitle title="Teacher dashboard" />
      <TeamSubtitle team={teamName} />
      <Card bordered style={styles.card}>
        <Text style={styles.sectionTitle}>Team roster</Text>
        <Text style={styles.sub}>
          View student profiles and experiment results. Students run activities from their own
          accounts.
        </Text>
        {!activeTeamId ? (
          <Text style={styles.empty}>No team configured.</Text>
        ) : sortedStudents.length === 0 ? (
          <Text style={styles.empty}>
            No students yet. Share team name &quot;{teamName}&quot; so students can join.
          </Text>
        ) : (
          sortedStudents.map((s) => (
            <Pressable
              key={s.id}
              style={styles.row}
              onPress={() => router.push(`/(tabs)/student/${s.id}`)}
            >
              <Text style={styles.name}>{s.firstName}</Text>
              <Text style={styles.meta}>
                {s.email ?? 'No email'} · {scoreCounts[s.id] ?? 0} experiments
              </Text>
            </Pressable>
          ))
        )}
      </Card>
      <Button
        title="Experiments Data"
        variant="accent"
        icon="folder-open-outline"
        onPress={() => router.push('/experiments-data')}
      />
    </ScreenShell>
  );
}

export default function HomeScreen() {
  const role = useSessionStore((s) => s.role);
  if (role === 'teacher') return <TeacherHome />;
  return <StudentHome />;
}
