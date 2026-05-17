import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { signInEmail } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

export default function LoginScreen() {
  const router = useRouter();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: {
      flex: 1,
      padding: t.spacing.md,
      justifyContent: 'center',
    },
    h1: { fontSize: 26, fontWeight: '800', color: t.colors.text, marginBottom: t.spacing.sm },
    sub: { marginBottom: t.spacing.md, color: t.colors.muted },
    label: {
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.xs,
      fontWeight: '600',
      color: t.colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: t.colors.muted,
      borderRadius: 8,
      padding: t.spacing.sm,
      marginBottom: t.spacing.sm,
      color: t.colors.text,
      backgroundColor: t.colors.surface,
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
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.h1}>STEMM Lab</Text>
        <Text style={styles.sub}>
          Quick join opens the app locally for testing — no Firebase account. Use teacher login when
          auth is enabled.
        </Text>
        <Button title="Quick join (local testing)" onPress={quickJoin} disabled={busy} />
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="teacher@school.edu"
          placeholderTextColor={colors.muted}
          style={styles.input}
          accessibilityLabel="Teacher email"
          accessibilityHint="Enter your school email address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.muted}
          style={styles.input}
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
      </Card>
    </View>
  );
}
