import { Redirect, Stack } from 'expo-router';
import { useSessionStore } from '../../store/sessionStore';

export default function ActivityLayout() {
  const role = useSessionStore((s) => s.role);
  if (role === 'teacher') return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
