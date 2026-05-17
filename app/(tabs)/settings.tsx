import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { signOutUser } from '../../services/auth';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, type GradeLevel } from '../../store/sessionStore';
import { useThemeStore } from '../../store/themeStore';
import { useThemedStyles } from '../../theme/themedStyles';

const GRADES: GradeLevel[] = ['Year 4', 'Year 6', 'Year 9', 'High School'];

export default function SettingsScreen() {
  const router = useRouter();
  const setQuickJoin = useAuthStore((s) => s.setQuickJoinActive);
  const { mode, toggle } = useThemeStore();
  const { teamName, gradeLevel, setTeam } = useSessionStore();
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1, padding: t.spacing.md },
    h1: { fontSize: 22, fontWeight: '800', marginBottom: t.spacing.md, color: t.colors.text },
    label: { marginTop: t.spacing.md, fontWeight: '700', color: t.colors.text },
    now: { color: t.colors.muted, marginBottom: t.spacing.sm },
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
    await signOutUser();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.wrap}>
      <Card>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.label}>Theme: {mode}</Text>
        <Button title="Toggle dark / light" variant="secondary" onPress={toggle} />
        <Text style={styles.label}>Grade / cohort (AdMob kid-safe gate)</Text>
        <Text style={styles.now}>Current: {gradeLevel}</Text>
        {GRADES.map((g) => (
          <Button key={g} title={g} variant="secondary" onPress={() => pickGrade(g)} />
        ))}
        <Text style={styles.label}>Team</Text>
        <Text style={styles.now}>{teamName}</Text>
        <Button title="Sign out" variant="danger" onPress={logout} />
      </Card>
    </View>
  );
}
