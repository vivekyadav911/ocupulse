import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { signInEmail } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing } from '../../theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

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
        <Button title="Quick join (anonymous)" onPress={quickJoin} disabled={busy} />
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="teacher@school.edu"
          style={styles.input}
          accessibilityLabel="Teacher email"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={styles.input}
          accessibilityLabel="Password"
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

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  h1: { fontSize: 26, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm },
  sub: { marginBottom: spacing.md, color: colors.muted },
  label: { marginTop: spacing.sm, marginBottom: spacing.xs, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});
