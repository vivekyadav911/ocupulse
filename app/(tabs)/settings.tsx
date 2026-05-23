import { useRouter } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { signOutUser } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, type GradeLevel } from '../../store/sessionStore';
import { useThemeStore } from '../../store/themeStore';
import { useThemedStyles } from '../../theme/themedStyles';

const GRADES: GradeLevel[] = ['Year 4', 'Year 6', 'Year 9', 'High School'];

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const { mode, toggle } = useThemeStore();
  const { teamName, studentFirstName, gradeLevel, setTeam, resetProfile } = useSessionStore();
  const styles = useThemedStyles((t) => ({
    label: {
      marginTop: t.spacing.md,
      fontSize: t.typography.label,
      fontWeight: '700',
      color: t.colors.muted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    now: { color: t.colors.text, marginBottom: t.spacing.sm, fontWeight: '600' },
    card: { marginTop: t.spacing.sm },
  }));

  const pickGrade = (g: GradeLevel) => {
    setTeam({ gradeLevel: g });
    Alert.alert(
      'Grade updated',
      `Interstitial ads: ${g === 'Year 9' || g === 'High School' ? 'on' : 'off'} for this demo gate.`,
    );
  };

  const logout = async () => {
    setQuickJoin(false);
    resetProfile();
    await signOutUser();
    useSessionStore.persist.clearStorage();
    router.replace('/(auth)/login');
  };

  const authLabel =
    user?.email ??
    (user?.isAnonymous ? 'Student (anonymous)' : user ? 'Signed in' : 'Not signed in');

  return (
    <ScreenShell>
      <PageTitle title="Settings" />
      <Card bordered style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.now}>{authLabel}</Text>
        <Text style={styles.label}>Appearance</Text>
        <Text style={styles.now}>Theme: {mode}</Text>
        <Button title="Toggle dark / light" variant="secondary" onPress={toggle} />
        <Text style={styles.label}>Grade / cohort (AdMob kid-safe gate)</Text>
        <Text style={styles.now}>{gradeLevel}</Text>
        {GRADES.map((g) => (
          <Button key={g} title={g} variant="secondary" onPress={() => pickGrade(g)} />
        ))}
        <Text style={styles.label}>Team</Text>
        <Text style={styles.now}>{teamName}</Text>
        <Text style={styles.label}>Student</Text>
        <Text style={styles.now}>{studentFirstName}</Text>
        <Button title="Sign out" variant="danger" onPress={logout} />
      </Card>
    </ScreenShell>
  );
}
