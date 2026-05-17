import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useBattery } from '../../hooks/useBattery';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

function BatteryBanner() {
  const { colors } = useAppTheme();
  const { warn, critical } = useBattery();
  const styles = useThemedStyles((t) => ({
    banner: { padding: t.spacing.sm },
    bannerText: { fontWeight: '700', textAlign: 'center' as const },
  }));

  if (!warn) return null;

  return (
    <View style={[styles.banner, { backgroundColor: critical ? colors.danger : colors.accent }]}>
      <Text style={[styles.bannerText, { color: critical ? colors.textInverse : colors.primary }]}>
        {critical ? 'Charge to record' : 'Battery low — recordings may stop'}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { recordingDisabled } = useBattery();

  useEffect(() => {
    if (__DEV__ && recordingDisabled) {
      console.log('[STEMM Lab] Recording disabled — battery below 10%');
    }
  }, [recordingDisabled]);

  return (
    <View style={{ flex: 1 }}>
      <BatteryBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.surface },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Board' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}
