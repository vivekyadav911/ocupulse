import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { TorchToggle } from './TorchToggle';
import { useThemedStyles } from '../theme/themedStyles';

/** Home shortcuts for assessment checklist (torch, labs). */
export function HomeQuickTools() {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    card: { marginBottom: t.spacing.md },
    title: {
      fontSize: t.typography.subtitle,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    hint: { color: t.colors.muted, fontSize: t.typography.caption, marginTop: t.spacing.sm },
  }));

  return (
    <Card bordered style={styles.card}>
      <Text style={styles.title}>Quick tools</Text>
      <TorchToggle />
      <View style={{ marginTop: 8 }}>
        <Button
          title="Sensors & labs"
          variant="secondary"
          onPress={() => router.push('/_spikes' as never)}
        />
      </View>
      <Text style={styles.hint}>
        Torch uses the camera flash. Labs include accelerometer, gyroscope, maps, and Firestore
        notes.
      </Text>
    </Card>
  );
}
