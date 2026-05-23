import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { mediaAssetsDao } from './db/sqlite';
import type { MediaAsset } from './db/types';

export type PersistMediaInput = {
  localUri: string;
  sessionId: string;
  mimeType: string;
};

export type PersistMediaResult = {
  id: string;
  localUri: string;
  contentType: string;
};

function extForMime(mime: string): string {
  if (mime.includes('video')) return 'mp4';
  if (mime.includes('audio')) return 'm4a';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return 'bin';
}

async function ensureDir(path: string): Promise<void> {
  const info = await getInfoAsync(path);
  if (!info.exists) {
    await makeDirectoryAsync(path, { intermediates: true });
  }
}

/** Copy clip/photo/audio into app document storage (free, on-device). */
export async function persistMedia(input: PersistMediaInput): Promise<PersistMediaResult | null> {
  if (!documentDirectory) {
    console.warn('[Ocupulse] documentDirectory unavailable');
    return null;
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const ext = extForMime(input.mimeType);
  const dir = `${documentDirectory}media/${input.sessionId}`;
  await ensureDir(dir);
  const destUri = `${dir}/${id}.${ext}`;

  await copyAsync({ from: input.localUri, to: destUri });

  const asset: MediaAsset = {
    id,
    sessionId: input.sessionId,
    localUri: destUri,
    remoteUrl: null,
    mimeType: input.mimeType,
    synced: 1,
  };
  await mediaAssetsDao.insert(asset);

  return { id, localUri: destUri, contentType: input.mimeType };
}

/** Retry persisting queued temp URIs into document storage. */
export async function persistPendingMedia(): Promise<void> {
  const pending = (await mediaAssetsDao.findAll()).filter((a) => a.synced === 0 && a.localUri);
  for (const asset of pending) {
    if (!asset.localUri || !asset.sessionId) continue;
    try {
      const ext = extForMime(asset.mimeType ?? 'application/octet-stream');
      const dir = `${documentDirectory}media/${asset.sessionId}`;
      await ensureDir(dir);
      const destUri = `${dir}/${asset.id}.${ext}`;
      await copyAsync({ from: asset.localUri, to: destUri });
      await mediaAssetsDao.update({
        ...asset,
        localUri: destUri,
        synced: 1,
      });
    } catch (e) {
      console.warn('[Ocupulse] persistPendingMedia failed', asset.id, e);
    }
  }
}

export async function queueMediaPersist(
  localUri: string,
  sessionId: string,
  mimeType: string,
): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await mediaAssetsDao.insert({
    id,
    sessionId,
    localUri,
    remoteUrl: null,
    mimeType,
    synced: 0,
  });
  return id;
}

export async function getSessionMedia(sessionId: string): Promise<MediaAsset[]> {
  const all = await mediaAssetsDao.findAll();
  return all.filter((a) => a.sessionId === sessionId && a.localUri);
}
