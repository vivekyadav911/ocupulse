import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { StatReadout } from '../../components/StatReadout';
import { StemmMap } from '../../components/StemmMap';
import { showResultsInterstitialIfAllowed } from '../../lib/admobGate';
import {
  markerColorForPeakDb,
  pollutionTierForPeakDb,
  pollutionTierLabel,
} from '../../lib/calc/soundLevel';
import { parseSoundPayload } from '../../lib/sound/parseSoundPayload';
import type { SoundSamplePayload } from '../../lib/sound/types';
import { resultsDao } from '../../services/db/sqlite';
import { useThemedStyles } from '../../theme/themedStyles';

export default function ResultsDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const [activityType, setActivityType] = useState<string | null>(null);
  const [soundPayload, setSoundPayload] = useState<SoundSamplePayload | null>(null);
  const styles = useThemedStyles((t) => ({
    id: {
      marginVertical: t.spacing.md,
      fontFamily: 'monospace',
      color: t.colors.muted,
      fontSize: t.typography.caption,
    },
    p: { color: t.colors.muted, marginBottom: t.spacing.lg, lineHeight: 22 },
    card: { marginTop: t.spacing.sm },
    tierBadge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radii.xl,
      borderWidth: 1,
      marginBottom: t.spacing.sm,
    },
    tierText: {
      fontSize: t.typography.caption,
      fontWeight: '800' as const,
    },
    addr: { color: t.colors.muted, marginBottom: t.spacing.md },
    map: {
      width: '100%' as const,
      height: 160,
      borderRadius: t.radii.lg,
      marginBottom: t.spacing.md,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
  }));

  useEffect(() => {
    if (!sessionId) return;
    void (async () => {
      const row = await resultsDao.findById(sessionId);
      if (!row) return;
      setActivityType(row.activityType);
      if (row.activityType === 'sound' && row.dataJson) {
        setSoundPayload(parseSoundPayload(row.dataJson));
      }
    })();
  }, [sessionId]);

  const done = async () => {
    await showResultsInterstitialIfAllowed();
    router.replace('/(tabs)');
  };

  const isSound = activityType === 'sound' && soundPayload != null;
  const tier = isSound
    ? (soundPayload.pollutionTier ?? pollutionTierForPeakDb(soundPayload.peakDb))
    : null;
  const tierColor = isSound ? markerColorForPeakDb(soundPayload.peakDb) : undefined;

  return (
    <ScreenShell>
      <PageTitle eyebrow="Saved" title={isSound ? 'Sound sample saved' : 'Session result'} />
      <Card bordered style={styles.card}>
        {isSound ? (
          <>
            {tier != null && tierColor ? (
              <View
                style={[
                  styles.tierBadge,
                  { borderColor: tierColor, backgroundColor: `${tierColor}22` },
                ]}
              >
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {pollutionTierLabel(tier)}
                </Text>
              </View>
            ) : null}
            <StatReadout label="Peak dB (approx)" value={`${Math.round(soundPayload.peakDb)} dB`} />
            <StatReadout label="Avg dB" value={`${Math.round(soundPayload.avgDb)} dB`} />
            <Text style={styles.addr}>{soundPayload.address || 'Location saved'}</Text>
            <StemmMap
              style={styles.map}
              initialRegion={{
                latitude: soundPayload.lat,
                longitude: soundPayload.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              markers={[
                {
                  id: sessionId ?? 'saved',
                  latitude: soundPayload.lat,
                  longitude: soundPayload.lng,
                  pinColor: markerColorForPeakDb(soundPayload.peakDb),
                  title: `${Math.round(soundPayload.peakDb)} dB peak`,
                  description: soundPayload.address,
                },
              ]}
            />
            <Button
              title="View all on sound map"
              variant="accent"
              icon="map-outline"
              onPress={() => router.push('/results/sound-map')}
            />
          </>
        ) : null}

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
