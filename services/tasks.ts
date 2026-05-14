import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncOutbox } from './firestore';

export const BG_SYNC_OUTBOX = 'stemm-lab-bg-sync-outbox';

TaskManager.defineTask(BG_SYNC_OUTBOX, async () => {
  try {
    await syncOutbox();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BG_SYNC_OUTBOX, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (e) {
    console.warn('[STEMM Lab] Background fetch registration:', e);
  }
}
