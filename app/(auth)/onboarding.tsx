import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors, spacing } from '../../theme/tokens';

export default function OnboardingScreen() {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.h1}>Welcome to STEMM Lab</Text>
        <Text style={styles.p}>
          Complete experiments with your team, capture sensor and video data, and climb school-safe
          leaderboards. Tap Quick join for a frictionless classroom session.
        </Text>
        <Button title="Continue to login" onPress={() => router.replace('/(auth)/login')} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  h1: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: spacing.md },
  p: { fontSize: 16, lineHeight: 22, color: colors.text, marginBottom: spacing.lg },
});
