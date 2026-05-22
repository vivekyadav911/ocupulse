import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { signInEmail } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('teacher@school.edu');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
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
      fontSize: 26,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    sub: {
      marginBottom: t.spacing.md,
      color: t.colors.muted,
      lineHeight: 22,
      fontSize: t.typography.body,
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

  const quickJoin = () => {
    setQuickJoin(true);
    router.replace('/(tabs)');
  };

  const teacherLogin = async () => {
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
        <Card bordered>
          <Text style={styles.h1}>Ocupulse</Text>
          <Text style={styles.sub}>
            Quick join opens the app locally for testing — no Firebase account. Use teacher login
            when auth is enabled.
          </Text>
          <Button
            title="Quick join (local testing)"
            icon="flash"
            onPress={quickJoin}
            disabled={busy}
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="teacher@school.edu"
            accessibilityLabel="Teacher email"
            accessibilityHint="Enter your school email address"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            accessibilityLabel="Password"
            accessibilityHint="Enter your account password"
          />
          <Button
            title="Teacher login (email)"
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
          <Button
            title="Onboarding tips"
            variant="secondary"
            onPress={() => router.push('/(auth)/onboarding')}
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
