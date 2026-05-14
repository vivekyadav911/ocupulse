import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, spacing } from '../../theme/tokens';

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

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
});
