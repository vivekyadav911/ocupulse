import { useRouter } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageTitle } from '../../components/PageTitle';
import { ScreenShell } from '../../components/ScreenShell';
import { signOutUser } from '../../services/auth';
import { ensureNotificationPermissions } from '../../services/notifications';
import { registerBackgroundSync, runBackgroundOutboxSyncNow } from '../../services/tasks';
import { showAlert } from '../../lib/alert';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore, type GradeLevel } from '../../store/sessionStore';
import { useThemeStore } from '../../store/themeStore';
import { useThemedStyles } from '../../theme/themedStyles';

const GRADES: GradeLevel[] = ['Year 4', 'Year 6', 'Year 9', 'High School'];

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mode, toggle } = useThemeStore();
  const { role, teamName, displayName, studentFirstName, gradeLevel, setTeam, resetProfile } =
    useSessionStore();
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
    resetProfile();
    await signOutUser();
    useSessionStore.persist.clearStorage();
    router.replace('/(auth)/login');
  };

  const roleLabel = role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : '—';

  return (
    <ScreenShell compactHeader>
      <PageTitle title="Settings" />
      <Card bordered style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.now}>Role: {roleLabel}</Text>
        <Text style={styles.now}>
          Name:{' '}
          {role === 'teacher'
            ? displayName || user?.displayName || '—'
            : role === 'student'
              ? studentFirstName
              : '—'}
        </Text>
        <Text style={styles.now}>
          Email:{' '}
          {user?.email ??
            (user?.isAnonymous ? 'Anonymous (quick join)' : user ? 'Signed in' : 'Not signed in')}
        </Text>
        <Text style={styles.label}>Appearance</Text>
        <Text style={styles.now}>Theme: {mode}</Text>
        <Button title="Toggle dark / light" variant="secondary" onPress={toggle} />
        {role === 'student' ? (
          <>
            <Text style={styles.label}>Grade / cohort (AdMob kid-safe gate)</Text>
            <Text style={styles.now}>{gradeLevel}</Text>
            {GRADES.map((g) => (
              <Button key={g} title={g} variant="secondary" onPress={() => pickGrade(g)} />
            ))}
          </>
        ) : null}
        {role === 'teacher' ? (
          <>
            <Text style={styles.label}>Teacher mode</Text>
            <Text style={styles.now}>
              Run experiments from the dashboard for personal practice. Use Team management for
              roster approval and the team experiment library. One email cannot be both teacher and
              student — use separate accounts or the Student tab for a student profile.
            </Text>
          </>
        ) : null}
        <Text style={styles.label}>Team</Text>
        <Text style={styles.now}>{teamName}</Text>
        <Text style={styles.label}>Device & sync</Text>
        <Button
          title="Allow notifications"
          variant="secondary"
          onPress={() =>
            void ensureNotificationPermissions().then((ok) =>
              showAlert(
                'Notifications',
                ok
                  ? 'Ready — experiment save/delete will show local alerts.'
                  : 'Not granted yet. Open iPhone Settings → Expo Go → Notifications, allow alerts, then tap this again.',
              ),
            )
          }
        />
        <Button
          title="Run background sync now"
          variant="secondary"
          onPress={() =>
            void runBackgroundOutboxSyncNow().then((r) =>
              showAlert('Sync', r === 'new-data' ? 'Outbox synced.' : 'Sync failed — see logs.'),
            )
          }
        />
        <Button
          title="Register background fetch task"
          variant="secondary"
          onPress={() =>
            void registerBackgroundSync().then(() =>
              showAlert('Background fetch', 'Task registered (dev/EAS build; not in Expo Go).'),
            )
          }
        />
        <Button
          title="Firestore notes lab"
          variant="secondary"
          onPress={() => router.push('/_spikes/notes' as never)}
        />
        <Button
          title="Capability spikes (sensors, maps…)"
          variant="secondary"
          onPress={() => router.push('/_spikes')}
        />
        <Button title="Sign out" variant="danger" onPress={logout} />
      </Card>
    </ScreenShell>
  );
}
