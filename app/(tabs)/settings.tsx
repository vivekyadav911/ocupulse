import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { signOutUser } from '../../services/auth';
import { useSessionStore, type GradeLevel } from '../../store/sessionStore';
import { useThemeStore } from '../../store/themeStore';
import { colors, spacing } from '../../theme/tokens';

const GRADES: GradeLevel[] = ['Year 4', 'Year 6', 'Year 9', 'High School'];

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, toggle } = useThemeStore();
  const { teamName, gradeLevel, setTeam } = useSessionStore();

  const pickGrade = (g: GradeLevel) => {
    setTeam({ gradeLevel: g });
    Alert.alert(
      'Grade updated',
      `Interstitial ads: ${g === 'Year 9' || g === 'High School' ? 'on' : 'off'} for this demo gate.`,
    );
  };

  const logout = async () => {
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

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceAlt },
  h1: { fontSize: 22, fontWeight: '800', marginBottom: spacing.md, color: colors.primary },
  label: { marginTop: spacing.md, fontWeight: '700', color: colors.text },
  now: { color: colors.muted, marginBottom: spacing.sm },
});
