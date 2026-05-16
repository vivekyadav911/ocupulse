/** Run react-native-a11y rules via legacy eslintrc (ESLint 9 flat config). */
process.env.ESLINT_USE_FLAT_CONFIG = 'false';

const { spawnSync } = require('node:child_process');

const result = spawnSync(
  'npx',
  ['eslint', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', '-c', '.eslintrc.a11y.cjs'],
  { stdio: 'inherit', shell: true, env: process.env },
);

process.exit(result.status ?? 1);
