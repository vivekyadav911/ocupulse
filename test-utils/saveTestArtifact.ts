import fs from 'fs';
import path from 'path';
import type { ReactTestInstance } from 'react-test-renderer';
import { screen } from '@testing-library/react-native';

const ARTIFACT_DIR = path.join(__dirname, '../test-artifacts');

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMobileMockupHtml(name: string, debugTree: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(name)}</title>
  <style>
    body {
      margin: 0;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 24px;
    }
    .phone {
      width: min(390px, 100%);
      min-height: 720px;
      border: 12px solid #0f172a;
      border-radius: 28px;
      background: #0b1020;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
      overflow: hidden;
    }
    .header {
      color: #e2e8f0;
      background: #111827;
      font-weight: 700;
      padding: 14px 16px;
      font-size: 14px;
      letter-spacing: 0.2px;
    }
    pre {
      margin: 0;
      padding: 16px;
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <div class="phone">
    <div class="header">${escapeHtml(name)}</div>
    <pre>${escapeHtml(debugTree)}</pre>
  </div>
</body>
</html>`;
}

export function saveTestArtifact(name: string, root?: ReactTestInstance | null) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  if (root) {
    screen.debug(root, 12_000);
  } else {
    screen.debug(undefined, 12_000);
  }
  const debugTree =
    root && typeof root.toJSON === 'function'
      ? JSON.stringify(root.toJSON(), null, 2)
      : 'No rendered root provided.';
  fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.txt`), debugTree, 'utf8');

  if (root && typeof root.toJSON === 'function') {
    fs.writeFileSync(
      path.join(ARTIFACT_DIR, `${name}.json`),
      JSON.stringify(root.toJSON(), null, 2),
      'utf8',
    );
  }

  fs.writeFileSync(path.join(ARTIFACT_DIR, `${name}.html`), buildMobileMockupHtml(name, debugTree));
}
