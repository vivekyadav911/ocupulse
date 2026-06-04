/* eslint-env node */
/** Block commits/pushes that include env files, keys, or other local-only secrets. */
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const BLOCKED = [
  {
    test: (rel) => rel === '.env' || (rel.startsWith('.env.') && rel !== '.env.example'),
    reason: 'env file with secrets — use .env.example as the template',
  },
  {
    test: (rel) => rel === 'google-services.json' || rel.endsWith('/google-services.json'),
    reason: 'Firebase Android config — keep local only',
  },
  {
    test: (rel) => rel === 'GoogleService-Info.plist' || rel.endsWith('/GoogleService-Info.plist'),
    reason: 'Firebase iOS config — keep local only',
  },
  {
    test: (rel) => /\.(pem|jks|p12|key|mobileprovision|p8)$/i.test(rel),
    reason: 'signing key or certificate — keep local only',
  },
  {
    test: (rel) => /serviceAccount.*\.json$/i.test(path.basename(rel)),
    reason: 'Firebase service account JSON — keep local only',
  },
  {
    test: (rel) => /credentials.*\.json$/i.test(path.basename(rel)) && !rel.includes('node_modules'),
    reason: 'credentials JSON — keep local only',
  },
  {
    test: (rel) => rel.endsWith('.apk') || rel.endsWith('.aab') || rel.endsWith('.ipa'),
    reason: 'build artifact — keep local only',
  },
  {
    test: (rel) => rel === 'docs' || rel.startsWith('docs/'),
    reason: 'submission docs folder — keep outside the repo',
  },
  {
    test: (rel) => /\.(pdf|docx)$/i.test(rel),
    reason: 'submission PDF/DOCX — keep outside the repo',
  },
];

function gitLines(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function violationsFor(files) {
  const hits = [];
  for (const file of files) {
    const rel = file.replace(/\\/g, '/');
    for (const rule of BLOCKED) {
      if (rule.test(rel)) {
        hits.push({ file: rel, reason: rule.reason });
        break;
      }
    }
  }
  return hits;
}

function main() {
  const mode = process.argv[2] ?? 'staged';
  const files =
    mode === 'tracked'
      ? gitLines(['ls-files'])
      : mode === 'push'
        ? gitLines([
            'diff',
            '--name-only',
            '--diff-filter=ACMRT',
            `${process.argv[3] ?? 'HEAD'}..${process.argv[4] ?? 'HEAD'}`,
          ])
        : gitLines(['diff', '--cached', '--name-only', '--diff-filter=ACMRT']);

  const hits = violationsFor(files);
  if (!hits.length) {
    console.log(`Sensitive-file guard OK (${mode}).`);
    return;
  }

  console.error(`Sensitive-file guard blocked ${mode} — remove these from git:\n`);
  for (const hit of hits) {
    console.error(`  • ${hit.file}\n    ${hit.reason}`);
  }
  console.error('\nThese files should stay on your machine only. See .gitignore.');
  process.exit(1);
}

main();
