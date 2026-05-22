import { Stack } from 'expo-router';
import { BackButton } from '../../components/BackButton';
import { useAppTheme } from '../../theme/useAppTheme';

export default function SpikesLayout() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerLeft: () => <BackButton compact />,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
