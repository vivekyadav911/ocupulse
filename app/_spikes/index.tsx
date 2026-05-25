import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenShell } from '../../components/ScreenShell';
import { useThemedStyles } from '../../theme/themedStyles';

const SPIKES = [
  'sensors',
  'camera',
  'mic',
  'maps',
  'sqlite',
  'firestore',
  'notes',
  'system',
  'components',
] as const;

export default function SpikesIndex() {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    h1: { fontSize: 22, fontWeight: '800', marginBottom: t.spacing.md, color: t.colors.text },
  }));

  return (
    <ScreenShell>
      <Text style={styles.h1}>Sprint 2 capability spikes</Text>
      <Card bordered>
        {SPIKES.map((s) => (
          <Button
            key={s}
            title={s}
            variant="secondary"
            onPress={() => router.push(`/_spikes/${s}`)}
          />
        ))}
      </Card>
    </ScreenShell>
  );
}
