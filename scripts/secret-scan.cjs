/* eslint-env node */
/** Fail if tracked-looking secret patterns appear in source (Issue #5). */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const FIREBASE_KEY = /AIza[0-9A-Za-z_-]{20,}/;
/** Block real AdMob units; allow Google's documented test publisher in app.config.ts only. */
const ADMOB_NON_TEST = /ca-app-pub-(?!3940256099942544)\d+\/\d+/;
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  'dist',
  'coverage',
  'android',
  'ios',
  'assets',
]);
const SKIP_FILES = new Set(['secret-scan.cjs', 'package-lock.json']);
const EXT_OK = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.cjs', '.mjs']);

function walk(dir, hits) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full);
    if (SKIP_DIRS.has(name)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, hits);
      continue;
    }
    if (SKIP_FILES.has(name)) continue;
    if (name.startsWith('.env')) continue;
    const ext = path.extname(name);
    if (!EXT_OK.has(ext)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (FIREBASE_KEY.test(text)) hits.push(`${rel} (Firebase API key)`);
    if (ADMOB_NON_TEST.test(text)) hits.push(`${rel} (AdMob unit — use test IDs or .env)`);
  }
}

const hits = [];
walk(ROOT, hits);
if (hits.length) {
  console.error('Secret scan failed — possible keys in:\n', hits.join('\n'));
  process.exit(1);
}
console.log('Secret scan OK (no AIza / AdMob unit IDs in tracked source extensions).');
