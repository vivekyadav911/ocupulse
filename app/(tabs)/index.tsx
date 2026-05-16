import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { StemmBannerAd } from '../../components/StemmBannerAd';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
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
    wrap: {
      padding: t.spacing.md,
      backgroundColor: t.colors.surfaceAlt,
      paddingBottom: t.spacing.xl,
    },
    h1: { fontSize: 28, fontWeight: '800', color: t.colors.text },
    sub: { color: t.colors.muted, marginBottom: t.spacing.md },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: t.spacing.sm,
      color: t.colors.text,
    },
  }));

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Dashboard</Text>
      <Text style={styles.sub}>Team: {team}</Text>
      <StemmBannerAd />
      <Card>
        <Text style={styles.cardTitle}>Activities</Text>
        {ACTIVITIES.map((a) => (
          <Button
            key={a.path}
            title={a.title}
            variant="secondary"
            onPress={() => router.push(a.path)}
          />
        ))}
      </Card>
      <Button title="Spikes (dev)" variant="secondary" onPress={() => router.push('/_spikes')} />
      <Button
        title="Sound results map"
        variant="secondary"
        onPress={() => router.push('/results/sound-map')}
      />
    </ScrollView>
  );
}
