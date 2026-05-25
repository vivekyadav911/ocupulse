import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ExperimentExportActions } from '../../components/experiments/ExperimentExportActions';
import { ExperimentSummaryBody } from '../../components/experiments/ExperimentSummaryBody';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { showResultsInterstitialIfAllowed } from '../../lib/admobGate';
import { getExperimentRecord, type ExperimentRecord } from '../../services/experimentsData';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ResultsDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const [record, setRecord] = useState<ExperimentRecord | null>(null);
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

  useEffect(() => {
    if (!sessionId) return;
    void getExperimentRecord(sessionId).then(setRecord);
  }, [sessionId]);

  const done = async () => {
    await showResultsInterstitialIfAllowed();
    router.replace('/(tabs)');
  };

  return (
    <ScreenShell>
      <PageTitle eyebrow="Saved" title="Experiment complete" />
      <Card bordered style={styles.card}>
        {record ? (
          <>
            <ExperimentSummaryBody record={record} />
            <Text style={styles.id}>Session: {sessionId}</Text>
            {!record.synced ? (
              <Text style={styles.p}>Queued for cloud sync when online.</Text>
            ) : (
              <Text style={styles.p}>Saved and syncing to your Experiments Data library.</Text>
            )}
            <ExperimentExportActions record={record} />
            {record.activityType === 'sound' ? (
              <Button
                title="View all on sound map"
                variant="accent"
                icon="map-outline"
                onPress={() => router.push('/results/sound-map')}
              />
            ) : null}
            <Button
              title="View in Experiments Data"
              variant="secondary"
              icon="folder-open-outline"
              onPress={() =>
                router.push({
                  pathname: '/experiments-data',
                  params: role === 'teacher' ? { scope: 'personal' } : {},
                })
              }
            />
          </>
        ) : (
          <>
            <Text style={styles.id}>ID: {sessionId}</Text>
            <Text style={styles.p}>Loading result…</Text>
          </>
        )}
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
