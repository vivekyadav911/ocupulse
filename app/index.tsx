import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);
  if (user === undefined) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
