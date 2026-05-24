#!/usr/bin/env node
/**
 * Mirrors FIREBASE_* keys into EXPO_PUBLIC_FIREBASE_* so Metro inlines them in the client bundle.
 * Safe to run multiple times.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('No .env file found.');
  process.exit(1);
}

const pairs = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY'],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'],
  ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'],
  ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID'],
];

const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const map = Object.fromEntries(
  lines
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1)];
    }),
);

let changed = false;
for (const [publicKey, sourceKey] of pairs) {
  if (map[publicKey]?.trim()) continue;
  const source = map[sourceKey]?.trim();
  if (!source) continue;
  lines.push(`${publicKey}=${source}`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(envPath, `${lines.filter((l, i, arr) => !(i === arr.length - 1 && l === '')).join('\n')}\n`);
  console.log('Added EXPO_PUBLIC_FIREBASE_* keys to .env');
} else {
  console.log('EXPO_PUBLIC_FIREBASE_* keys already present or FIREBASE_* missing.');
}
