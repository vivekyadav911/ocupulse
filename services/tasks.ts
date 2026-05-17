import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncOutbox } from './firestore';

export const BG_SYNC_OUTBOX = 'stemm-lab-bg-sync-outbox';

const MIN_INTERVAL_SEC = 15 * 60;

TaskManager.defineTask(BG_SYNC_OUTBOX, async () => {
  try {
    await syncOutbox();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    console.warn('[STEMM Lab] BG_SYNC_OUTBOX failed:', e);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/** Run outbox drain immediately (foreground / dev testing). */
export async function runBackgroundOutboxSyncNow(): Promise<BackgroundFetch.BackgroundFetchResult> {
  try {
    await syncOutbox();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
}

export async function registerBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.setMinimumIntervalAsync(MIN_INTERVAL_SEC);

    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn('[STEMM Lab] Background fetch denied by OS');
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
  } catch (e) {
    console.warn('[STEMM Lab] Background fetch registration:', e);
  }
}
