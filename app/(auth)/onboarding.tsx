import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AuthScreenHeader } from '../../components/AuthScreenHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useThemedStyles } from '../../theme/themedStyles';

export default function OnboardingScreen() {
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    screen: {
      flex: 1,
      backgroundColor: t.colors.authBg,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: t.spacing.md,
      paddingBottom: t.spacing.xl,
      justifyContent: 'center',
    },
    brand: {
      textAlign: 'center' as const,
      fontSize: 20,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.lg,
    },
    h1: {
      fontSize: 22,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.md,
    },
    p: {
      fontSize: t.typography.body,
      lineHeight: 22,
      color: t.colors.muted,
      marginBottom: t.spacing.lg,
    },
  }));

  return (
    <View style={styles.screen}>
      <AuthScreenHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.brand}>Ocupulse</Text>
        <Card bordered>
          <Text style={styles.h1}>Welcome to Ocupulse</Text>
          <Text style={styles.p}>
            Complete experiments with your team, capture sensor and video data, and climb
            school-safe leaderboards. Use Quick join on the login screen to try the app without
            signing in (local testing only; Firebase auth can be enabled later for teachers).
          </Text>
          <Button title="Continue to login" onPress={() => router.replace('/(auth)/login')} />
        </Card>
      </ScrollView>
    </View>
  );
}
