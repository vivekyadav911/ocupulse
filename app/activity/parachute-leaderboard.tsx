import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ExperimentScreen } from '../../components/ExperimentScreen';
import { fetchParachuteLeaderboard, type ParachuteLeaderboardEntry } from '../../services/stemmApi';
import { useThemedStyles } from '../../theme/themedStyles';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;

export default function ParachuteLeaderboardScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<ParachuteLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = useThemedStyles((t) => ({
    sub: { color: t.colors.muted, marginBottom: t.spacing.md, lineHeight: 20 },
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
    err: { color: t.colors.danger, marginBottom: t.spacing.sm },
    spinner: { marginTop: t.spacing.xl },
  }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchParachuteLeaderboard();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ExperimentScreen title="Parachute Drop Leaderboard" eyebrow="STEMM Lab">
      <Text style={styles.sub}>Top 5 teams — slowest fall wins (lowest final velocity).</Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>No scores yet — upload results from the activity screen.</Text>
      ) : (
        rows.map((row, index) => (
          <View key={`${row.teamName}-${index}`} style={styles.row}>
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
              <Text style={styles.score}>{row.finalVelocityMps.toFixed(2)} m/s</Text>
              <Text style={styles.scoreSub}>final velocity</Text>
            </View>
          </View>
        ))
      )}
      <View style={{ marginTop: 16 }}>
        <Button title="Retry" variant="secondary" onPress={() => void load()} />
        <Button title="Back to activity" variant="secondary" onPress={() => router.back()} />
      </View>
    </ExperimentScreen>
  );
}
