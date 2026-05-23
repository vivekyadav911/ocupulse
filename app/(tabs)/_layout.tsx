import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useBattery } from '../../hooks/useBattery';
import { isFirebaseConfigured } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
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
    <View
      style={[styles.banner, { backgroundColor: critical ? colors.danger : colors.accentMuted }]}
    >
      <Text style={[styles.bannerText, { color: critical ? colors.textInverse : colors.text }]}>
        {critical ? 'Charge to record' : 'Battery low — recordings may stop'}
      </Text>
    </View>
  );
}

function TabsLayoutInner() {
  const { colors } = useAppTheme();
  const { recordingDisabled } = useBattery();

  useEffect(() => {
    if (__DEV__ && recordingDisabled) {
      console.log('[Ocupulse] Recording disabled — battery below 10%');
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
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Board',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const quickJoin = useAuthStore((s) => s.quickJoinActive);
  const profileReady = useSessionStore((s) => s.profileReady);
  const firebaseReady = isFirebaseConfigured();

  if (user === undefined) return null;

  if (!firebaseReady && quickJoin) {
    return <TabsLayoutInner />;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user.isAnonymous && !profileReady) {
    return <Redirect href="/(auth)/student-setup" />;
  }

  return <TabsLayoutInner />;
}
