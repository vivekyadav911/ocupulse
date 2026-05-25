import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { AuthScreenHeader } from '../../components/AuthScreenHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { TeamIdPreview } from '../../components/TeamIdPreview';
import { applySessionFromProfile } from '../../lib/applySessionFromProfile';
import { createTeacherTeam } from '../../services/profiles';
import { syncAll } from '../../services/sync';
import { useAuthStore } from '../../store/authStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function TeacherSetupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
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
    h1: { fontSize: 24, fontWeight: '800', color: t.colors.text, marginBottom: t.spacing.sm },
    sub: { marginBottom: t.spacing.md, color: t.colors.muted, lineHeight: 22 },
  }));

  const finish = async () => {
    if (!displayName.trim() || !teamName.trim()) {
      Alert.alert('Setup', 'Enter your name and team name.');
      return;
    }
    setBusy(true);
    try {
      const team = await createTeacherTeam({
        displayName: displayName.trim(),
        teamName: teamName.trim(),
      });
      const name = displayName.trim();
      applySessionFromProfile({
        role: 'teacher',
        profileReady: true,
        displayName: name,
        teamName: team.name,
        teamId: team.id,
        managedTeamIds: [team.id],
        activeTeamId: team.id,
      });
      useAuthStore.getState().setProfileHydrated(true);
      void syncAll();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Setup', e instanceof Error ? e.message : 'Could not create team');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AuthScreenHeader backToLogin />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ocupulse</Text>
        <Card bordered>
          <Text style={styles.h1}>Teacher setup</Text>
          <Text style={styles.sub}>
            Create the team name your students will use when they register. Share this exact name
            with your class. After setup you can run experiments yourself (saved privately) and
            approve students under Team management on the dashboard.
          </Text>
          <FormField
            label="Your name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Ms. Chen"
          />
          <FormField
            label="Team name"
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Team Koala"
          />
          <TeamIdPreview teamName={teamName} />
          <Button title="Continue" icon="checkmark" onPress={finish} disabled={busy} />
        </Card>
      </ScrollView>
    </View>
  );
}
