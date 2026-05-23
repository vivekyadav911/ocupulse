import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { isFirebaseConfigured } from '../services/firebase';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const quickJoin = useAuthStore((s) => s.quickJoinActive);
  const profileReady = useSessionStore((s) => s.profileReady);

  if (user === undefined) return null;

  const firebaseReady = isFirebaseConfigured();
  if (!firebaseReady && quickJoin) return <Redirect href="/(tabs)" />;

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.isAnonymous && !profileReady) {
    return <Redirect href="/(auth)/student-setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
