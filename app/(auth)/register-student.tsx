import { Redirect } from 'expo-router';

export default function RegisterStudentScreen() {
  return <Redirect href="/(auth)/login?mode=signup&role=student" />;
}
