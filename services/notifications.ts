import { isExpoGo } from '../lib/expoRuntime';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
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

function permissionGranted(
  Notifications: NotificationsModule,
  status: import('expo-notifications').PermissionStatus,
  iosStatus?: number,
): boolean {
  if (status === 'granted') return true;
  const ios = Notifications.IosAuthorizationStatus;
  if (
    iosStatus === ios.AUTHORIZED ||
    iosStatus === ios.PROVISIONAL ||
    iosStatus === ios.EPHEMERAL
  ) {
    return true;
  }
  return false;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    // Expo Go still supports notifications when the native module is linked.
    if (isExpoGo()) return true;
    return false;
  }
  const existing = await Notifications.getPermissionsAsync();
  if (permissionGranted(Notifications, existing.status, existing.ios?.status)) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return permissionGranted(Notifications, requested.status, requested.ios?.status);
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

/** Local notification when an experiment is saved on this device. */
export async function notifyExperimentSaved(activityName: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Experiment saved',
      body: `${activityName} — saved locally and queued for sync.`,
      data: { type: 'experiment_saved' },
    },
    trigger: null,
  });
}

/** Local notification when an experiment record is deleted. */
export async function notifyExperimentDeleted(activityName: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  const ok = await ensureNotificationPermissions();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Experiment deleted',
      body: `${activityName} — removed from this device.`,
      data: { type: 'experiment_deleted' },
    },
    trigger: null,
  });
}
