import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { resolveAuthRedirect } from '../lib/authRouting';

function AuthLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const profileHydrated = useAuthStore((s) => s.profileHydrated);
  const role = useSessionStore((s) => s.role);
  const profileReady = useSessionStore((s) => s.profileReady);

  if (user === undefined || !profileHydrated) return <AuthLoading />;

  const redirect = resolveAuthRedirect({ user, role, profileReady, hydrated: true });
  if (redirect === 'loading') return <AuthLoading />;
  if (redirect) return <Redirect href={redirect} />;

  return <Redirect href="/(tabs)" />;
}
