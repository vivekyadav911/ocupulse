import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { StemmBannerAd } from '../../components/StemmBannerAd';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useSessionStore } from '../../store/sessionStore';
import { colors, spacing } from '../../theme/tokens';

const ACTIVITIES: { path: string; title: string }[] = [
  { path: '/activity/parachute', title: 'Parachute Drop' },
  { path: '/activity/sound', title: 'Sound Pollution Hunter' },
  { path: '/activity/handfan', title: 'Hand Fan' },
  { path: '/activity/earthquake', title: 'Earthquake Structure' },
  { path: '/activity/humanperf', title: 'Human Performance Lab' },
  { path: '/activity/reaction', title: 'Reaction Board' },
  { path: '/activity/breathing', title: 'Breathing Pace' },
];

export default function HomeScreen() {
  const router = useRouter();
  const team = useSessionStore((s) => s.teamName);

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

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, backgroundColor: colors.surfaceAlt, paddingBottom: spacing.xl },
  h1: { fontSize: 28, fontWeight: '800', color: colors.primary },
  sub: { color: colors.muted, marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
});
