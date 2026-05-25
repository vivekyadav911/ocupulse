import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { PageTitle } from '../../../components/PageTitle';
import { ScreenShell } from '../../../components/ScreenShell';
import {
  getStudentProfile,
  getStudentScoreHistory,
  type StudentScoreRow,
} from '../../../services/teacher';
import { useSessionStore } from '../../../store/sessionStore';
import { useThemedStyles } from '../../../theme/themedStyles';

export default function StudentDetailScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const [firstName, setFirstName] = useState('Student');
  const [email, setEmail] = useState<string | null>(null);
  const [scores, setScores] = useState<StudentScoreRow[]>([]);

  const styles = useThemedStyles((t) => ({
    card: { marginBottom: t.spacing.md },
    label: {
      fontSize: t.typography.label,
      fontWeight: '700',
      color: t.colors.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      marginBottom: t.spacing.xs,
    },
    value: { color: t.colors.text, fontWeight: '600', marginBottom: t.spacing.md },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: t.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border,
    },
    activity: { color: t.colors.text, fontWeight: '600', textTransform: 'capitalize' as const },
    score: { color: t.colors.accent, fontWeight: '800' as const },
    empty: { color: t.colors.muted, fontStyle: 'italic' as const },
  }));

  useEffect(() => {
    if (!studentId || !activeTeamId) return;
    void (async () => {
      const profile = await getStudentProfile(activeTeamId, studentId);
      if (profile) {
        setFirstName(profile.firstName);
        setEmail(profile.email);
      }
      setScores(await getStudentScoreHistory(studentId));
    })();
  }, [studentId, activeTeamId]);

  return (
    <ScreenShell>
      <PageTitle title={firstName} />
      <Card bordered style={styles.card}>
        <Text style={styles.label}>Profile</Text>
        <Text style={styles.value}>Email: {email ?? '—'}</Text>
        <Text style={styles.label}>Experiments</Text>
        {scores.length === 0 ? (
          <Text style={styles.empty}>No results yet.</Text>
        ) : (
          scores.map((s) => {
            const detailId = s.sessionId ?? s.id;
            return (
              <Pressable
                key={s.id}
                style={styles.row}
                onPress={() =>
                  router.push({
                    pathname: `/experiments-data/${detailId}`,
                    params: { scope: 'team' },
                  })
                }
              >
                <Text style={styles.activity}>{s.activityType}</Text>
                <Text style={styles.score}>{s.scoreLabel ?? s.score}</Text>
              </Pressable>
            );
          })
        )}
      </Card>
      <Button title="Back to roster" variant="secondary" onPress={() => router.back()} />
    </ScreenShell>
  );
}
