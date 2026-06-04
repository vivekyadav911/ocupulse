import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { AuthScreenHeader } from '../../components/AuthScreenHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { TeamIdPreview } from '../../components/TeamIdPreview';
import { TeamSelectField } from '../../components/TeamSelectField';
import { applySessionFromProfile } from '../../lib/applySessionFromProfile';
import type { Team } from '../../services/db/types';
import { fetchAvailableTeams, setupStudentProfile } from '../../services/profiles';
import { syncAll } from '../../services/sync';
import { useAuthStore } from '../../store/authStore';
import { useThemedStyles } from '../../theme/themedStyles';

export default function StudentSetupScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAvailableTeams()
      .then((rows) => {
        if (!cancelled) setTeams(rows);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      })
      .finally(() => {
        if (!cancelled) setTeamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;
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
    if (!firstName.trim() || !teamId) {
      Alert.alert('Profile', 'Enter your first name and choose a team.');
      return;
    }
    setBusy(true);
    try {
      const { team, student } = await setupStudentProfile({
        firstName: firstName.trim(),
        teamId,
      });
      applySessionFromProfile({
        role: 'student',
        profileReady: true,
        teamId: team.id,
        studentId: student.id,
        teamName: team.name,
        displayName: student.firstName,
        studentFirstName: student.firstName,
        activeTeamId: team.id,
        teamMemberStatus: 'active',
      });
      useAuthStore.getState().setProfileHydrated(true);
      await syncAll();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Setup', e instanceof Error ? e.message : 'Could not save profile');
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
          <Text style={styles.h1}>Student profile</Text>
          <Text style={styles.sub}>
            Enter your first name and choose your class team from the list. You can start
            experiments as soon as you join.
          </Text>
          <FormField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Alex"
            accessibilityLabel="First name"
          />
          <TeamSelectField
            teams={teams}
            value={teamId}
            onChange={setTeamId}
            loading={teamsLoading}
            disabled={busy}
          />
          <TeamIdPreview teamName={selectedTeam?.name ?? ''} />
          <Button
            title="Continue"
            icon="checkmark"
            onPress={finish}
            disabled={busy || teamsLoading || !teamId}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
