import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { ActivityRow } from '../../components/ActivityRow';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle, TeamSubtitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { StemmBannerAd } from '../../components/StemmBannerAd';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

const ACTIVITIES: { path: string; title: string }[] = [
  { path: '/activity/parachute', title: 'Parachute Drop' },
  { path: '/activity/sound', title: 'Sound Pollution Hunter' },
  { path: '/activity/handfan', title: 'Hand Fan' },
  { path: '/activity/earthquake', title: 'Earthquake Structure' },
  { path: '/activity/humanperf', title: 'Human Performance Lab' },
  { path: '/activity/reaction', title: 'Reaction Board' },
  { path: '/activity/breathing', title: 'Breathing Pace Trainer' },
];

export default function HomeScreen() {
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
        title="Spikes (dev)"
        variant="secondary"
        icon="terminal-outline"
        onPress={() => router.push('/_spikes')}
      />
      <Button
        title="Sound results map"
        variant="accent"
        icon="map-outline"
        onPress={() => router.push('/results/sound-map')}
      />
    </ScreenShell>
  );
}
