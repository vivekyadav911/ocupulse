#!/usr/bin/env node
/**
 * Creates .env from .env.example, optionally fills keys from native Firebase config files,
 * mirrors FIREBASE_* ↔ EXPO_PUBLIC_FIREBASE_*, and validates required keys.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

const REQUIRED = ['FIREBASE_API_KEY', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
const OPTIONAL_BUT_RECOMMENDED = ['FIREBASE_AUTH_DOMAIN', 'FIREBASE_MESSAGING_SENDER_ID'];

function cleanValue(value) {
  if (value == null) return '';
  return String(value)
    .trim()
    .replace(/^["']|["']$/g, '');
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const map = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    map[line.slice(0, idx).trim()] = cleanValue(line.slice(idx + 1));
  }
  return map;
}

function mergeFromGoogleServices() {
  const file = path.join(root, 'google-services.json');
  if (!fs.existsSync(file)) return {};
  try {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const client = json.client?.[0];
    const project = json.project_info ?? {};
    const apiKey = client?.api_key?.[0]?.current_key;
    const appId = client?.client_info?.mobilesdk_app_id;
    return {
      ...(apiKey ? { FIREBASE_API_KEY: apiKey } : {}),
      ...(project.project_id ? { FIREBASE_PROJECT_ID: project.project_id } : {}),
      ...(project.firebase_url
        ? { FIREBASE_AUTH_DOMAIN: project.firebase_url.replace('https://', '') }
        : {}),
      ...(project.project_number
        ? { FIREBASE_MESSAGING_SENDER_ID: String(project.project_number) }
        : {}),
      ...(project.storage_bucket ? { FIREBASE_STORAGE_BUCKET: project.storage_bucket } : {}),
      ...(appId ? { FIREBASE_APP_ID: appId } : {}),
    };
  } catch {
    return {};
  }
}

function mergeFromFirebaseCli(projectId) {
  try {
    const raw = execSync(
      `npx -y firebase-tools@latest apps:sdkconfig WEB --project ${projectId}`,
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const cfg = JSON.parse(raw);
    return {
      ...(cfg.apiKey ? { FIREBASE_API_KEY: cfg.apiKey } : {}),
      ...(cfg.authDomain ? { FIREBASE_AUTH_DOMAIN: cfg.authDomain } : {}),
      ...(cfg.projectId ? { FIREBASE_PROJECT_ID: cfg.projectId } : {}),
      ...(cfg.storageBucket ? { FIREBASE_STORAGE_BUCKET: cfg.storageBucket } : {}),
      ...(cfg.messagingSenderId ? { FIREBASE_MESSAGING_SENDER_ID: cfg.messagingSenderId } : {}),
      ...(cfg.appId ? { FIREBASE_APP_ID: cfg.appId } : {}),
    };
  } catch {
    return {};
  }
}

function mergeFromPlist() {
  const file = path.join(root, 'GoogleService-Info.plist');
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8');
  const pick = (key) => {
    const m = text.match(
      new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`, 'i'),
    );
    return m?.[1]?.trim();
  };
  return {
    ...(pick('API_KEY') ? { FIREBASE_API_KEY: pick('API_KEY') } : {}),
    ...(pick('PROJECT_ID') ? { FIREBASE_PROJECT_ID: pick('PROJECT_ID') } : {}),
    ...(pick('GCM_SENDER_ID') ? { FIREBASE_MESSAGING_SENDER_ID: pick('GCM_SENDER_ID') } : {}),
    ...(pick('GOOGLE_APP_ID') ? { FIREBASE_APP_ID: pick('GOOGLE_APP_ID') } : {}),
    ...(pick('STORAGE_BUCKET') ? { FIREBASE_STORAGE_BUCKET: pick('STORAGE_BUCKET') } : {}),
  };
}

function main() {
  if (!fs.existsSync(examplePath)) {
    console.error('Missing .env.example');
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example');
  }

  const map = parseEnvFile(envPath);
  const projectId = map.FIREBASE_PROJECT_ID || map.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ocupulse-a9986';
  const merged = {
    ...map,
    ...mergeFromFirebaseCli(projectId),
    ...mergeFromGoogleServices(),
    ...mergeFromPlist(),
  };

  const templateLines = fs.readFileSync(examplePath, 'utf8').split('\n');
  const keys = new Set(Object.keys(merged));
  const out = templateLines.map((line) => {
    if (!line || line.startsWith('#') || !line.includes('=')) return line;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    if (!keys.has(key)) return line;
    return `${key}=${cleanValue(merged[key])}`;
  });
  fs.writeFileSync(envPath, `${out.join('\n').replace(/\n+$/, '')}\n`);

  require('./sync-firebase-env.cjs');

  const final = parseEnvFile(envPath);
  const missing = REQUIRED.filter((k) => !final[k]?.trim());
  const weak = OPTIONAL_BUT_RECOMMENDED.filter((k) => !final[k]?.trim());

  if (missing.length) {
    console.error('\nFirebase is not ready. Missing in .env:');
    for (const k of missing) console.error(`  - ${k}`);
    console.error('\nPaste keys under FIREBASE_* or EXPO_PUBLIC_FIREBASE_* (either works).');
    console.error('Then run:  npm run firebase:setup');
    console.error('Restart Expo:  npx expo start -c\n');
    process.exit(1);
  }

  if (weak.length) {
    console.warn('Optional keys empty (app may still work):', weak.join(', '));
  }

  console.log('\nFirebase .env looks good. Restart Metro with cache clear:');
  console.log('  npx expo start -c\n');
}

main();
