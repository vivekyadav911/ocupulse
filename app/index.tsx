import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  const quickJoin = useAuthStore((s) => s.quickJoinActive);
  if (user === undefined) return null;
  if (!user && !quickJoin) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
