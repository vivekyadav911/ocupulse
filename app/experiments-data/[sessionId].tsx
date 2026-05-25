import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ExperimentExportActions } from '../../components/experiments/ExperimentExportActions';
import { ExperimentSummaryBody } from '../../components/experiments/ExperimentSummaryBody';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import {
  deleteExperimentRecord,
  getExperimentRecord,
  updateExperimentRecord,
  type ExperimentRecord,
} from '../../services/experimentsData';
import {
  experimentsScopeFromParam,
  teacherCanManageExperimentRecord,
} from '../../lib/experiments/scope';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ExperimentDetailScreen() {
  const { sessionId, scope: scopeParam } = useLocalSearchParams<{
    sessionId: string;
    scope?: string;
  }>();
  const router = useRouter();
  const role = useSessionStore((s) => s.role);
  const activeTeamId = useSessionStore((s) => s.activeTeamId);
  const teamMode = role === 'teacher' && experimentsScopeFromParam(scopeParam) === 'team';
  const [record, setRecord] = useState<ExperimentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const styles = useThemedStyles((t) => ({
    card: { marginBottom: t.spacing.md },
    id: {
      marginTop: t.spacing.md,
      fontFamily: 'monospace',
      color: t.colors.muted,
      fontSize: t.typography.caption,
    },
    empty: { color: t.colors.muted, fontStyle: 'italic' as const },
  }));

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    void getExperimentRecord(sessionId).then((row) => {
      setRecord(row);
      setLoading(false);
    });
  }, [sessionId]);

  return (
    <ScreenShell>
      <PageTitle title="Experiment detail" eyebrow="Experiments Data" />
      <Card bordered style={styles.card}>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : !record ? (
          <Text style={styles.empty}>Experiment not found.</Text>
        ) : (
          <>
            <ExperimentSummaryBody record={record} />
            <Text style={styles.id}>Session: {record.sessionId}</Text>
            {!record.synced ? <Text style={styles.id}>Status: pending cloud sync</Text> : null}
            <ExperimentExportActions record={record} />
            {record &&
            teamMode &&
            teacherCanManageExperimentRecord(
              record.payload,
              record.payload.teamId != null ? String(record.payload.teamId) : null,
              activeTeamId,
            ) ? (
              <>
                <Button
                  title="Edit score (+1)"
                  variant="secondary"
                  icon="create-outline"
                  onPress={() => {
                    void updateExperimentRecord(record.sessionId, {
                      score: record.score + 1,
                    }).then((updated) => {
                      if (updated) setRecord(updated);
                    });
                  }}
                />
                <Button
                  title="Delete experiment"
                  variant="danger"
                  icon="trash-outline"
                  onPress={() => {
                    Alert.alert('Delete experiment', 'Remove this record permanently?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          void deleteExperimentRecord(record.sessionId).then(() =>
                            router.replace('/experiments-data'),
                          );
                        },
                      },
                    ]);
                  }}
                />
              </>
            ) : null}
            {record.activityType === 'sound' ? (
              <Button
                title="View on sound map"
                variant="accent"
                icon="map-outline"
                onPress={() => router.push('/results/sound-map')}
              />
            ) : null}
            <Button
              title="Leaderboard"
              variant="secondary"
              icon="bar-chart-outline"
              onPress={() => router.push('/(tabs)/leaderboard')}
            />
          </>
        )}
      </Card>
      <Button title="Back to list" variant="secondary" onPress={() => router.back()} />
    </ScreenShell>
  );
}
