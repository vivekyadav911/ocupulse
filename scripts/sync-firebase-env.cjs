#!/usr/bin/env node
/**
 * Normalizes Firebase keys in .env (strips quotes/spaces) and keeps FIREBASE_* and
 * EXPO_PUBLIC_FIREBASE_* in sync — either prefix works when pasting from the console.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const PAIRS = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', 'FIREBASE_API_KEY'],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'],
  ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'],
  ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_APP_ID'],
];

function cleanValue(value) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/^["']|["']$/g, '');
}

function parseEnvLines(text) {
  const map = {};
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    map[key] = line.slice(idx + 1);
  }
  return map;
}

function syncFirebasePairs(map) {
  for (const [publicKey, privateKey] of PAIRS) {
    const value = cleanValue(map[publicKey]) || cleanValue(map[privateKey]);
    if (!value) continue;
    map[publicKey] = value;
    map[privateKey] = value;
  }
  return map;
}

function buildEnvContent(templateLines, map) {
  const seen = new Set();
  const out = templateLines.map((line) => {
    if (!line || line.startsWith('#') || !line.includes('=')) return line;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    seen.add(key);
    if (!(key in map)) return line;
    return `${key}=${cleanValue(map[key])}`;
  });

  for (const [publicKey, privateKey] of PAIRS) {
    for (const key of [privateKey, publicKey]) {
      if (seen.has(key) || !map[key]) continue;
      out.push(`${key}=${cleanValue(map[key])}`);
      seen.add(key);
    }
  }

  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example — fill Firebase keys, then run this again.');
  } else {
    console.error('No .env file found. Run: npm run firebase:setup');
  }
  process.exit(1);
}

const templateLines = fs.existsSync(examplePath)
  ? fs.readFileSync(examplePath, 'utf8').split('\n')
  : fs.readFileSync(envPath, 'utf8').split('\n');

const map = syncFirebasePairs(parseEnvLines(fs.readFileSync(envPath, 'utf8')));
fs.writeFileSync(envPath, buildEnvContent(templateLines, map));
console.log('Normalized and synced FIREBASE_* ↔ EXPO_PUBLIC_FIREBASE_* in .env');
