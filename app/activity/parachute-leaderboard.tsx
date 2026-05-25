import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { subscribeLeaderboard } from '../../services/leaderboard';
import type { LeaderRow } from '../../services/firestore';
import { fetchParachuteLeaderboard } from '../../services/stemmApi';
import { useThemedStyles } from '../../theme/themedStyles';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;

export default function ParachuteLeaderboardScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiNote, setApiNote] = useState<string | null>(null);

  const styles = useThemedStyles((t) => ({
    sub: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
    note: { color: t.colors.muted, fontSize: t.typography.caption, marginBottom: t.spacing.sm },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: t.spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: t.radii.md,
      marginBottom: t.spacing.sm,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    rank: { width: 40, fontWeight: '800' as const, color: t.colors.accent },
    team: { flex: 1, color: t.colors.text, fontWeight: '600' as const },
    score: { fontWeight: '800' as const, color: t.colors.text, textAlign: 'right' as const },
    scoreSub: { fontSize: 11, color: t.colors.muted, textAlign: 'right' as const },
    empty: { color: t.colors.muted, marginTop: t.spacing.lg },
    spinner: { marginTop: t.spacing.xl },
  }));

  useEffect(() => {
    setLoading(true);
    setApiNote(null);
    const sub = subscribeLeaderboard('parachute', (next) => {
      setRows(next.slice(0, 5));
      setLoading(false);
    });
    void fetchParachuteLeaderboard()
      .then((apiRows) => {
        if (apiRows.length > 0) setApiNote('Includes STEMM API scores when online.');
      })
      .catch(() => {
        setApiNote('Showing saved scores on this device and Firebase (offline API).');
      });
    return () => sub.unsubscribe();
  }, []);

  return (
    <ExperimentScreen title="Parachute Drop Leaderboard" eyebrow="STEMM Lab">
      <Text style={styles.sub}>Top 5 — slowest fall wins (lowest final velocity).</Text>
      {apiNote ? <Text style={styles.note}>{apiNote}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>
          No scores yet — complete a run and tap Upload results on the activity screen.
        </Text>
      ) : (
        rows.map((row, index) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            {index < 3 ? (
              <Ionicons
                name="medal"
                size={22}
                color={MEDAL_COLORS[index]}
                style={{ marginRight: 8 }}
              />
            ) : (
              <View style={{ width: 30 }} />
            )}
            <Text style={styles.team}>{row.teamName}</Text>
            <View>
              <Text style={styles.score}>{row.scoreLabel ?? row.score.toFixed(2)} m/s</Text>
              {row.detail ? <Text style={styles.scoreSub}>{row.detail}</Text> : null}
            </View>
          </View>
        ))
      )}
      <Button title="Back to activity" variant="secondary" onPress={() => router.back()} />
    </ExperimentScreen>
  );
}
