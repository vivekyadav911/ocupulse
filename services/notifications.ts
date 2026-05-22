import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleStreakReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ocupulse',
      body: 'Keep your science streak — open Ocupulse today!',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: 16,
      minute: 0,
    },
  });
}

export async function notifyRankUp(rank: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Leaderboard update',
      body: `You moved to #${rank}!`,
    },
    trigger: null,
  });
}
