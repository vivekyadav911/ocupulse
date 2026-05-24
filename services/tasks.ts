import { isExpoGo } from '../lib/expoRuntime';
import { syncAll } from './sync';

export const BG_SYNC_OUTBOX = 'stemm-lab-bg-sync-outbox';

const MIN_INTERVAL_SEC = 15 * 60;

if (!isExpoGo()) {
  const BackgroundFetch =
    require('expo-background-fetch') as typeof import('expo-background-fetch');
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

  TaskManager.defineTask(BG_SYNC_OUTBOX, async () => {
    try {
      await syncAll();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (e) {
      if (__DEV__) console.warn('[Ocupulse] BG_SYNC_OUTBOX failed:', e);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/** Run outbox drain immediately (foreground / dev testing). */
export async function runBackgroundOutboxSyncNow(): Promise<'new-data' | 'failed'> {
  try {
    await syncAll();
    return 'new-data';
  } catch {
    return 'failed';
  }
}

export async function registerBackgroundSync(): Promise<void> {
  if (isExpoGo()) return;

  try {
    const BackgroundFetch =
      require('expo-background-fetch') as typeof import('expo-background-fetch');
    const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

    await BackgroundFetch.setMinimumIntervalAsync(MIN_INTERVAL_SEC);

    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Denied ||
      status === BackgroundFetch.BackgroundFetchStatus.Restricted
    ) {
      return;
    }

    const registered = await TaskManager.isTaskRegisteredAsync(BG_SYNC_OUTBOX);
    if (!registered) {
      await BackgroundFetch.registerTaskAsync(BG_SYNC_OUTBOX, {
        minimumInterval: MIN_INTERVAL_SEC,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch requires a dev/production build with UIBackgroundModes configured.
  }
}
