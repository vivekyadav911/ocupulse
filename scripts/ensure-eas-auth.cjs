/**
 * Exit 0 when EAS can run non-interactive builds (EXPO_TOKEN or eas login).
 * Run: node scripts/ensure-eas-auth.cjs
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const easBin = path.join(root, 'node_modules', 'eas-cli', 'bin', 'run');

function runEas(args) {
  return spawnSync(process.execPath, [easBin, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
}

if (process.env.EXPO_TOKEN?.trim()) {
  console.log('[Ocupulse] EXPO_TOKEN is set — EAS auth OK.');
  process.exit(0);
}

const whoami = runEas(['whoami']);
if (whoami.status === 0) {
  const line = (whoami.stdout || '').trim().split('\n').filter(Boolean).pop();
  if (line) console.log(`[Ocupulse] Signed in to Expo as ${line}`);
  process.exit(0);
}

console.error('');
console.error('Expo account required before cloud builds.');
console.error('');
console.error('  1. Sign in (opens browser):');
console.error('       npm run eas:login');
console.error('');
console.error('  2. Link this app to Expo (first time only):');
console.error('       npm run eas:init');
console.error('');
console.error('  3. Queue the APK again:');
console.error('       npm run build:android:preview');
console.error('');
console.error('Optional CI token: add EXPO_TOKEN to .env (see .env.example).');
console.error('  https://expo.dev/accounts/[account]/settings/access-tokens');
console.error('');
process.exit(1);
