import { Redirect, Stack } from 'expo-router';
import { canStudentRunExperiments } from '../../lib/studentAccess';
import { useSessionStore } from '../../store/sessionStore';

export default function ActivityLayout() {
  const role = useSessionStore((s) => s.role);
  const teamMemberStatus = useSessionStore((s) => s.teamMemberStatus);

  if (role === 'student' && !canStudentRunExperiments(teamMemberStatus)) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
