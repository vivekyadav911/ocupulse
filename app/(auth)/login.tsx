import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthRoleToggle } from '../../components/AuthRoleToggle';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FormField } from '../../components/FormField';
import { formatAuthError } from '../../lib/authErrors';
import {
  inferEffectiveRole,
  isIncompleteStudentProfile,
} from '../../lib/profileRole';
import {
  convertIncompleteStudentToTeacher,
  getUserProfile,
  registerStudentEmail,
  registerTeacherEmail,
  signInAnonymousStudent,
  signInEmail,
  signOutUser,
  updateUserProfile,
} from '../../services/auth';
import { isFirebaseConfigured } from '../../services/firebase';
import { applySessionFromProfile } from '../../lib/applySessionFromProfile';
import { resolveAuthRedirect } from '../../lib/authRouting';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

type AuthRole = 'student' | 'teacher';
type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; role?: string }>();
  const insets = useSafeAreaInsets();
  const setRole = useSessionStore((s) => s.setRole);
  const sessionRole = useSessionStore((s) => s.role);
  const profileReady = useSessionStore((s) => s.profileReady);
  const user = useAuthStore((s) => s.user);
  const profileHydrated = useAuthStore((s) => s.profileHydrated);
  const { colors } = useAppTheme();

  const [role, setAuthRole] = useState<AuthRole>(params.role === 'teacher' ? 'teacher' : 'student');
  const [mode, setMode] = useState<AuthMode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (params.role === 'teacher' || params.role === 'student') {
      setAuthRole(params.role);
    }
    if (params.mode === 'signup' || params.mode === 'signin') {
      setMode(params.mode);
    }
  }, [params.mode, params.role]);

  useEffect(() => {
    if (user === undefined || !profileHydrated || !user) return;
    const redirect = resolveAuthRedirect({
      user,
      role: sessionRole,
      profileReady,
      hydrated: true,
    });
    if (redirect === 'loading' || redirect === '/(auth)/login') return;
    router.replace(redirect ?? '/(tabs)');
  }, [user, profileHydrated, sessionRole, profileReady, router]);

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
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.xs,
      marginBottom: t.spacing.md,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: t.typography.caption, fontWeight: '700', color: t.colors.muted },
    sectionSub: {
      fontSize: t.typography.caption,
      color: t.colors.muted,
      lineHeight: 18,
      marginBottom: t.spacing.sm,
    },
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.md },
    footer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: t.spacing.xs,
      marginTop: t.spacing.md,
    },
    footerText: { fontSize: t.typography.caption, color: t.colors.muted },
  }));

  const finishAuth = (profileRole: AuthRole, ready: boolean, name?: string) => {
    applySessionFromProfile({
      profileReady: ready,
      role: profileRole,
      displayName: name?.trim(),
      studentFirstName: profileRole === 'student' ? name?.trim() : undefined,
    });
    setRole(profileRole);
    useAuthStore.getState().setProfileHydrated(true);
    router.replace(
      ready
        ? '/(tabs)'
        : profileRole === 'teacher'
          ? '/(auth)/teacher-setup'
          : '/(auth)/student-setup',
    );
  };

  const signIn = async () => {
    if (!firebaseReady) {
      Alert.alert('Firebase', 'Configure Firebase in .env and restart Expo with -c.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Sign in', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      const cred = await signInEmail(email, password);
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        await signOutUser();
        Alert.alert(
          'Sign in',
          'Account found but profile is missing. Try signing up again with the same email.',
        );
        return;
      }

      const effectiveRole = await inferEffectiveRole(cred.user.uid, profile);
      if (effectiveRole !== profile.role) {
        await updateUserProfile(cred.user.uid, { role: effectiveRole });
        profile = { ...profile, role: effectiveRole };
      }

      if (profile.role !== role) {
        const name = profile.displayName?.trim();
        const nameHint = name ? ` (${name})` : '';

        if (role === 'teacher' && isIncompleteStudentProfile(profile)) {
          Alert.alert(
            'Account type',
            'This email was started as a student but setup was never finished. Continue as a teacher instead?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => void signOutUser() },
              {
                text: 'Continue as teacher',
                onPress: () => {
                  void (async () => {
                    try {
                      const updated = await convertIncompleteStudentToTeacher(
                        cred.user.uid,
                        profile!.displayName,
                      );
                      finishAuth('teacher', updated.profileReady ?? false, updated.displayName);
                    } catch (e) {
                      await signOutUser();
                      Alert.alert('Sign in', formatAuthError(e));
                    }
                  })();
                },
              },
            ],
          );
          return;
        }

        Alert.alert(
          'Sign in',
          role === 'teacher'
            ? `This email is registered as a student${nameHint}. Sign in under the Student tab, or use a different email for a teacher account.`
            : `This email is registered as a teacher${nameHint}. Sign in under the Teacher tab.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => void signOutUser() },
            {
              text: role === 'teacher' ? 'Use Student tab' : 'Use Teacher tab',
              onPress: () => {
                setAuthRole(profile!.role);
                finishAuth(profile!.role, profile!.profileReady ?? false, profile!.displayName);
              },
            },
          ],
        );
        return;
      }
      finishAuth(profile.role, profile.profileReady ?? false, profile.displayName);
    } catch (e) {
      Alert.alert('Sign in', formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    if (!firebaseReady) {
      Alert.alert('Firebase', 'Configure Firebase in .env and restart Expo with -c.');
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert('Sign up', 'Enter email and password.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Sign up', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Sign up', 'Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (role === 'student') {
        await registerStudentEmail(email, password);
        const localPart = email.trim().split('@')[0] || 'Student';
        finishAuth('student', false, localPart);
      } else {
        const cred = await registerTeacherEmail(email, password, displayName);
        const profile = await getUserProfile(cred.user.uid);
        finishAuth(
          'teacher',
          profile?.profileReady ?? false,
          profile?.displayName ?? (displayName.trim() || email.trim().split('@')[0]),
        );
      }
    } catch (e) {
      Alert.alert('Sign up', formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const quickJoin = async () => {
    if (!firebaseReady) {
      Alert.alert('Firebase', 'Configure Firebase in .env and restart Expo with -c.');
      return;
    }
    setBusy(true);
    try {
      const cred = await signInAnonymousStudent();
      const profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        Alert.alert('Quick join', 'Could not create student profile.');
        return;
      }
      finishAuth('student', profile.profileReady ?? false, profile.displayName);
    } catch (e) {
      Alert.alert('Quick join', formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const roleHint =
    role === 'student'
      ? mode === 'signup'
        ? 'Create a student account, then choose your name and team.'
        : 'Sign in to run experiments and save results.'
      : mode === 'signup'
        ? 'Create a teacher account, then set up your supervised team.'
        : 'Sign in to view roster, results, and team leaderboard.';

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>Ocupulse</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: firebaseReady ? colors.accent : colors.danger },
            ]}
          />
          <Text style={styles.statusText}>
            {firebaseReady
              ? 'Firebase connected'
              : 'Firebase not configured — copy .env.example to .env, fill keys, run npm run firebase:setup, then npx expo start -c'}
          </Text>
        </View>

        <Card bordered>
          <AuthRoleToggle
            value={role}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
            ]}
            onChange={setAuthRole}
            disabled={busy}
          />

          <AuthRoleToggle
            value={mode}
            options={[
              { value: 'signin', label: 'Sign in' },
              { value: 'signup', label: 'Sign up' },
            ]}
            onChange={setMode}
            disabled={busy}
          />

          <Text style={styles.sectionSub}>{roleHint}</Text>

          {mode === 'signup' && role === 'teacher' ? (
            <FormField
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ms. Chen"
            />
          ) : null}

          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={role === 'student' ? 'student@school.edu' : 'teacher@school.edu'}
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Min 6 characters"
          />

          {mode === 'signup' ? (
            <FormField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Repeat password"
            />
          ) : null}

          <Button
            title={mode === 'signin' ? 'Sign in' : 'Create account'}
            icon={role === 'student' ? 'school' : 'briefcase'}
            onPress={mode === 'signin' ? signIn : signUp}
            disabled={busy}
          />

          {role === 'student' && mode === 'signin' ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionSub}>
                Try the app instantly without email — local testing and demos.
              </Text>
              <Button
                title="Quick join (anonymous)"
                variant="secondary"
                icon="flash-outline"
                onPress={quickJoin}
                disabled={busy}
              />
            </>
          ) : null}

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
            <Text style={styles.footerText}>Secure Ocupulse Gateway v2.4.0</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
