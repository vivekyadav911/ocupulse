import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { signInAnonymousStudent, signInEmail } from '../../services/auth';
import { isFirebaseConfigured } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const firebaseReady = isFirebaseConfigured();
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
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.xs,
      marginBottom: t.spacing.md,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      fontSize: t.typography.caption,
      fontWeight: '700',
      color: t.colors.muted,
    },
    sectionTitle: {
      fontSize: t.typography.label,
      fontWeight: '800',
      color: t.colors.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
      marginBottom: t.spacing.sm,
    },
    sectionSub: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
      marginBottom: t.spacing.sm,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.border,
      marginVertical: t.spacing.md,
    },
    footer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.xs,
      marginTop: t.spacing.md,
    },
    footerText: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
    },
  }));

  const quickJoin = async () => {
    if (!firebaseReady) {
      setQuickJoin(true);
      router.replace('/(tabs)');
      return;
    }
    setBusy(true);
    try {
      setQuickJoin(false);
      await signInAnonymousStudent();
      router.replace('/(auth)/student-setup');
    } catch (e) {
      Alert.alert('Quick join', e instanceof Error ? e.message : 'Anonymous sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const teacherLogin = async () => {
    if (!firebaseReady) {
      Alert.alert('Firebase', 'Add Firebase keys to .env and restart Expo.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Login', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      useAuthStore.getState().setQuickJoinActive(false);
      await signInEmail(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Login', e instanceof Error ? e.message : 'Email sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ocupulse</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: firebaseReady ? colors.accent : colors.danger },
            ]}
          />
          <Text style={styles.statusText}>
            {firebaseReady ? 'Firebase connected' : 'Firebase offline — local mode only'}
          </Text>
        </View>

        <Card bordered>
          <Text style={styles.sectionTitle}>Students</Text>
          <Text style={styles.sectionSub}>
            Quick join signs you in anonymously, then asks for your name and team.
          </Text>
          <Button title="Quick join as student" icon="flash" onPress={quickJoin} disabled={busy} />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Teachers</Text>
          <Text style={styles.sectionSub}>Use your school email and password.</Text>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="teacher@school.edu"
            accessibilityLabel="Teacher email"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            accessibilityLabel="Password"
          />
          <Button
            title="Teacher login"
            variant="secondary"
            onPress={teacherLogin}
            disabled={busy}
          />
          <Button
            title="Create teacher account"
            variant="secondary"
            onPress={() => router.push('/(auth)/register')}
            disabled={busy}
          />

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
            <Text style={styles.footerText}>Secure Ocupulse Gateway v2.4.0</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
