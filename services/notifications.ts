import { isExpoGo } from '../lib/expoRuntime';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGo()) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return notificationsModule;
  } catch {
    notificationsModule = null;
    return null;
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleStreakReminder(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const { SchedulableTriggerInputTypes } = Notifications;
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

/** Immediate local notification when a student requests to join a teacher's team. */
export async function notifyStudentJoinRequest(
  studentName: string,
  teamName: string,
): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New join request',
      body: `${studentName} wants to join ${teamName}`,
      data: { type: 'roster_join' },
    },
    trigger: null,
  });
}

export async function notifyRankUp(rank: number): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Leaderboard update',
      body: `You moved to #${rank}!`,
    },
    trigger: null,
  });
}
