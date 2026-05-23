import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { setupStudentProfile } from '../../services/profiles';
import { syncAll } from '../../services/sync';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function StudentSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const setTeam = useSessionStore((s) => s.setTeam);
  const [firstName, setFirstName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [busy, setBusy] = useState(false);
  const styles = useThemedStyles((t) => ({
    screen: { flex: 1, backgroundColor: t.colors.authBg },
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
      fontSize: 24,
      fontWeight: '800',
      color: t.colors.text,
      marginBottom: t.spacing.sm,
    },
    sub: {
      marginBottom: t.spacing.md,
      color: t.colors.muted,
      lineHeight: 22,
    },
  }));

  const finish = async () => {
    if (!firstName.trim() || !teamName.trim()) {
      Alert.alert('Profile', 'Enter your first name and team name.');
      return;
    }
    setBusy(true);
    try {
      setQuickJoin(false);
      const { team, student } = await setupStudentProfile({
        firstName: firstName.trim(),
        teamName: teamName.trim(),
      });
      setTeam({
        profileReady: true,
        teamId: team.id,
        studentId: student.id,
        teamName: team.name,
        studentFirstName: student.firstName,
      });
      void syncAll();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Setup', e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ocupulse</Text>
        <Card bordered>
          <Text style={styles.h1}>Student profile</Text>
          <Text style={styles.sub}>
            Tell us your first name and team. You can join an existing team by typing the same team
            name your teacher used.
          </Text>
          <FormField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Alex"
            accessibilityLabel="First name"
          />
          <FormField
            label="Team name"
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Team Koala"
            accessibilityLabel="Team name"
          />
          <Button title="Continue" icon="checkmark" onPress={finish} disabled={busy} />
        </Card>
      </ScrollView>
    </View>
  );
}
