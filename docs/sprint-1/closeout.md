# Sprint 1 closeout checklist (Issue #6)

| Acceptance item | Status | Evidence |
|-----------------|--------|----------|
| `npm start` launches; index redirect without errors | Done | [`app/index.tsx`](../../app/index.tsx), [`setup.md`](./setup.md) run steps |
| Deliberate lint error blocks `git commit` | Done | Husky + lint-staged in [`.husky/pre-commit`](../../.husky/pre-commit); verify in [`setup.md`](./setup.md) |
| Device rotation does not rotate UI | Done | `orientation: 'portrait'` in [`app.config.ts`](../../app.config.ts); `ScreenOrientation.lockAsync(PORTRAIT_UP)` in [`app/_layout.tsx`](../../app/_layout.tsx) |
| `expo-router` installed; root `_layout.tsx` uses `<Slot />` | Done | `package.json` dependency; root layout |
| `docs/sprint-1/setup.md` lists SDK / Node / Xcode versions | Done | [`setup.md`](./setup.md) |
| Expo SDK 51+, TypeScript, ESLint, Prettier, Husky | Done | `package.json`, `eslint.config.js`, `.prettierrc`, `prepare` script |
| `app.config.ts` (not `app.json`) | Done | [`app.config.ts`](../../app.config.ts) |
| 15 screen stubs navigable via Expo Router | Done | Route table in [`setup.md`](./setup.md) |

## Git tag

```bash
git fetch --tags
git show sprint-1-end
```

Tag **`sprint-1-end`** marks Sprint 1 bootstrap + documentation closeout on `main`.

## Azure DevOps

- Work item: **Issue #6** — _sprint 1 closeout and documentation_
- Iteration: `ocupulse\Sprint 1`
- Board screenshot: optional `docs/sprint-1/board-snapshot.png` (see [`README-board-snapshots.md`](./README-board-snapshots.md))
