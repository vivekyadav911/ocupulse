# Sprint 1 — development environment setup

Exact toolchain used for the STEMM Lab (`ocupulse`) Expo bootstrap (Issue #6). Re-run the version commands below after upgrading dependencies.

## Required versions

| Tool | Version | Verify |
|------|---------|--------|
| **Node.js** | **22.22.0** (LTS recommended) | `node -v` |
| **npm** | **11.11.0** | `npm -v` |
| **Expo SDK** | **54.0.33** (`expo` package; CLI **54.0.24**) | `npx expo --version` |
| **Expo Router** | **6.0.23** | `npm ls expo-router` |
| **React Native** | **0.81.5** | `npm ls react-native` |
| **React** | **19.1.0** | `npm ls react` |
| **TypeScript** | **5.9.3** | `npx tsc --version` |
| **ESLint** | **9.18.x** (flat config via `eslint.config.js`) | `npx eslint -v` |
| **Prettier** | **3.8.x** | `npx prettier -v` |

### iOS (macOS only)

| Tool | Notes |
|------|--------|
| **Xcode** | **16.x** recommended for SDK 54 builds (install via Mac App Store) |
| **Xcode Command Line Tools** | `xcode-select --install` |
| **CocoaPods** | Bundled with Expo prebuild / EAS; `pod --version` if building locally |

### Android

| Tool | Notes |
|------|--------|
| **Android Studio** | Ladybug / Koala era with **SDK 35** platform + build-tools |
| **JDK** | **17** (Expo SDK 54 default for Gradle) |

> Sprint 1 acceptance required **Expo SDK 51+**; the repo tracks the current Expo 54 line for ongoing sprints.

## First-time install

```bash
git clone https://github.com/vivekyadav911/ocupulse.git
cd ocupulse
npm install --legacy-peer-deps
cp .env.example .env   # if present; fill Firebase keys for auth/Firestore
```

## Run the app

```bash
npm start
```

Press `i` (iOS Simulator) or `a` (Android Emulator). The entry route `app/index.tsx` redirects to login or the home dashboard with no red screen errors when Firebase extras are optional (anonymous quick join still works).

## Configuration

- **`app.config.ts`** — single source of truth (no `app.json`).
- **`orientation: 'portrait'`** in config plus runtime lock in `app/_layout.tsx` via `expo-screen-orientation`.
- **Root routing** — `app/_layout.tsx` renders `<Slot />` (Expo Router file-based routes).

## Linting & pre-commit

Husky runs **lint-staged** on every commit (`*.{ts,tsx}` → ESLint + Prettier).

Verify the hook blocks bad code:

```bash
echo "const x: any = 1" >> app/_lint-hook-test.ts
git add app/_lint-hook-test.ts
git commit -m "test: should fail lint"
# Expect commit to be rejected; then:
git restore --staged app/_lint-hook-test.ts
del app\_lint-hook-test.ts   # Windows
```

## Quality checks

```bash
npm run lint
npm test
npx tsc --noEmit
```

## Fifteen navigable screen stubs (Sprint 1)

| # | Route file |
|---|------------|
| 1 | `app/(auth)/login.tsx` |
| 2 | `app/(auth)/register.tsx` |
| 3 | `app/(auth)/onboarding.tsx` |
| 4 | `app/(tabs)/index.tsx` |
| 5 | `app/activity/parachute.tsx` |
| 6 | `app/activity/sound.tsx` |
| 7 | `app/activity/handfan.tsx` |
| 8 | `app/activity/earthquake.tsx` |
| 9 | `app/activity/humanperf.tsx` |
| 10 | `app/activity/reaction.tsx` |
| 11 | `app/activity/breathing.tsx` |
| 12 | `app/results/[sessionId].tsx` |
| 13 | `app/(tabs)/leaderboard.tsx` |
| 14 | `app/(tabs)/settings.tsx` |
| 15 | `app/results/sound-map.tsx` |

Entry: `app/index.tsx` → auth or tabs. Nested stacks/tabs live in group `_layout.tsx` files under `(auth)`, `(tabs)`, `activity`, and `results`.
