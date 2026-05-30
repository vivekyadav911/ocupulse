import { requeueUnsyncedExperiments, syncOutbox } from './firestore';
import { persistPendingMedia } from './storage';

/** Drain outbox rows and persist queued media to on-device storage. */
export async function syncAll(): Promise<void> {
  await requeueUnsyncedExperiments();
  await syncOutbox();
  await persistPendingMedia();
}
