import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import type { TabKey } from './challengeState';

async function ensureDir(path: string): Promise<void> {
  const info = await getInfoAsync(path);
  if (!info.exists) {
    await makeDirectoryAsync(path, { intermediates: true });
  }
}

/** Copy a recorded clip into document storage so it survives app restarts. */
export async function persistDraftVideo(
  sourceUri: string,
  scopeKey: string,
  tabKey: TabKey,
): Promise<string | null> {
  if (!documentDirectory) {
    console.warn('[Ocupulse] documentDirectory unavailable for draft video');
    return sourceUri;
  }

  const safeScope = scopeKey.replace(/[^a-zA-Z0-9:_-]/g, '_');
  const dir = `${documentDirectory}parachute-drafts/${safeScope}`;
  await ensureDir(dir);
  const destUri = `${dir}/${tabKey}.mp4`;

  try {
    await copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (e) {
    console.warn('[Ocupulse] persistDraftVideo failed', e);
    return sourceUri;
  }
}
