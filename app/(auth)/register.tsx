import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { AuthScreenHeader } from '../../components/AuthScreenHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { registerEmail } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function RegisterScreen() {
  const router = useRouter();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const [email, setEmail] = useState('');
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
      fontSize: 22,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.md,
    },
  }));

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
    <View style={styles.screen}>
      <AuthScreenHeader />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ocupulse</Text>
        <Card bordered>
          <Text style={styles.h1}>Teacher registration</Text>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="teacher@school.edu"
            accessibilityLabel="Registration email"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password (min 6 chars)"
            accessibilityLabel="Registration password"
          />
          <Button title="Create account" onPress={go} disabled={busy} />
          <Button
            title="Back to login"
            variant="secondary"
            onPress={() => router.back()}
            disabled={busy}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
