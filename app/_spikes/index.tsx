import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useThemedStyles } from '../../theme/themedStyles';

const SPIKES = [
  'sensors',
  'camera',
  'mic',
  'maps',
  'sqlite',
  'firestore',
  'system',
  'components',
] as const;

export default function SpikesIndex() {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md },
    h1: { fontSize: 22, fontWeight: '800', marginBottom: t.spacing.md, color: t.colors.text },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Sprint 2 capability spikes</Text>
      <Card>
        {SPIKES.map((s) => (
          <Button
            key={s}
            title={s}
            variant="secondary"
            onPress={() => router.push(`/_spikes/${s}`)}
          />
        ))}
      </Card>
    </View>
  );
}
