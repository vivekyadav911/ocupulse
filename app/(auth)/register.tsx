import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { registerEmail } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing } from '../../theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      setQuickJoin(false);
      await registerEmail(email, password);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Register', e instanceof Error ? e.message : 'Could not register');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.h1}>Teacher registration</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          style={styles.input}
          accessibilityLabel="Registration email"
          accessibilityHint="Enter the email for your teacher account"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password (min 6 chars)"
          style={styles.input}
          accessibilityLabel="Registration password"
          accessibilityHint="Choose a password with at least six characters"
        />
        <Button title="Create account" onPress={go} disabled={busy} />
        <Button
          title="Back to login"
          variant="secondary"
          onPress={() => router.back()}
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
  h1: { fontSize: 22, fontWeight: '700', marginBottom: spacing.md, color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});
