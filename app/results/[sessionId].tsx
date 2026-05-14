import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { showResultsInterstitialIfAllowed } from '../../lib/admobGate';
import { colors, spacing } from '../../theme/tokens';

export default function ResultsDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  const done = async () => {
    await showResultsInterstitialIfAllowed();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.title}>Session saved</Text>
        <Text style={styles.id}>ID: {sessionId}</Text>
        <Text style={styles.p}>
          Result queued in SQLite outbox and syncing to Firestore when online.
        </Text>
        <Button title="Done (may show ad for Year 9+)" onPress={done} />
        <Button
          title="Leaderboard"
          variant="secondary"
          onPress={() => router.replace('/(tabs)/leaderboard')}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 24, fontWeight: '800', color: colors.primary },
  id: { marginVertical: spacing.md, fontFamily: 'monospace', color: colors.muted },
  p: { color: colors.text, marginBottom: spacing.lg },
});
