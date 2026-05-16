import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useBatteryLevel } from '../../hooks/useBattery';
import { useAppTheme } from '../../theme/useAppTheme';
import { useThemedStyles } from '../../theme/themedStyles';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const { level } = useBatteryLevel();
  const warn = level < 0.2;
  const critical = level < 0.1;
  const styles = useThemedStyles((t) => ({
    banner: { padding: t.spacing.sm },
    bannerText: { fontWeight: '700', textAlign: 'center' as const },
  }));

  return (
    <View style={{ flex: 1 }}>
      {warn ? (
        <View
          style={[styles.banner, { backgroundColor: critical ? colors.danger : colors.accent }]}
        >
          <Text
            style={[styles.bannerText, { color: critical ? colors.textInverse : colors.primary }]}
          >
            {critical ? 'Charge to record — battery critical' : 'Low battery — recordings may stop'}
          </Text>
        </View>
      ) : null}
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
