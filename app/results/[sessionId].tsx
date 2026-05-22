import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { showResultsInterstitialIfAllowed } from '../../lib/admobGate';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ResultsDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    id: {
      marginVertical: t.spacing.md,
      fontFamily: 'monospace',
      color: t.colors.muted,
      fontSize: t.typography.caption,
    },
    p: { color: t.colors.muted, marginBottom: t.spacing.lg, lineHeight: 22 },
    card: { marginTop: t.spacing.sm },
  }));

  const done = async () => {
    await showResultsInterstitialIfAllowed();
    router.replace('/(tabs)');
  };

  return (
    <ScreenShell>
      <PageTitle eyebrow="Saved" title="Session result" />
      <Card bordered style={styles.card}>
        <Text style={styles.id}>ID: {sessionId}</Text>
        <Text style={styles.p}>
          Result queued in SQLite outbox and syncing to Firestore when online.
        </Text>
        <Button title="Done (may show ad for Year 9+)" onPress={done} />
        <Button
          title="Leaderboard"
          variant="accent"
          icon="bar-chart-outline"
          onPress={() => router.replace('/(tabs)/leaderboard')}
        />
        <Button title="Home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </Card>
    </ScreenShell>
  );
}
