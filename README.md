# Ocupulse

Cross-platform mobile app for STEMM Lab — Expo / React Native, Firebase (Auth + Firestore), seven sensor-driven activities, and offline-first SQLite sync.

**Contributors:** [vivekyadav911](https://github.com/vivekyadav911), [vineetyadavx](https://github.com/vineetyadavx)

**Expo SDK:** 54 (`expo` ~54.0.33)

## Prerequisites

| Tool | Version | Verify |
|------|---------|--------|
| Node.js | 22.22.0 (LTS) | `node -v` |
| npm | 11.x | `npm -v` |
| Expo CLI | 54.x | `npx expo --version` |
| TypeScript | 5.9.x | `npx tsc --version` |

**Android:** Android Studio with SDK 35, JDK 17.  
**iOS (macOS):** Xcode 16.x, Command Line Tools.

## Quick start

```bash
git clone https://github.com/vivekyadav911/ocupulse.git
cd ocupulse
cp .env.example .env
# Fill FIREBASE_* from Firebase Console (see Firebase section below)

npm install
npm run secret-scan
npx expo start
```

Place `google-services.json` and `GoogleService-Info.plist` at the **repo root** if using native prebuild (both are gitignored).

After changing `.env`, restart with a clean cache: `npx expo start -c`.

## Firebase

Project: **`ocupulse-a9986`**

1. Copy [`.env.example`](.env.example) → `.env` and fill web app keys from [Firebase Console](https://console.firebase.google.com/project/ocupulse-a9986/settings/general) → Your apps → Web app.
2. Enable **Email/Password** and **Anonymous** auth (student quick join).
3. Create a **Firestore** database.
4. Deploy rules and indexes:

```bash
npm run firebase:login
npm run firebase:deploy-firestore
```

Or first-time setup: `npm run firebase:setup` then `npm run firebase:sync-env`.

Security rules live in [`firebase/firestore.rules`](firebase/firestore.rules). Media stays on-device (`expo-file-system`); Firestore stores scores, users, teams, and sessions.

## Roles and workflow

| Role | Sign-in | Experiments | Data |
|------|---------|-------------|------|
| **Student** | Student tab or quick join | After teacher approves roster (if team has a teacher) | Own results + team leaderboard |
| **Teacher** | Teacher tab | Anytime (personal practice) | **My experiment results** + **Team library** |

**Students joining a class**

1. Teacher sets a team name in **Teacher setup** and shares it.
2. Student signs up and enters the **same team name**.
3. Teacher **Accept** on the dashboard; until then, activities are disabled.

**Teachers**

- Personal runs do not appear on the team Board.
- **Team management** — approve, decline, remove students.
- **Board** — team leaderboard only.

One email = one role in Firestore.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Expo dev server |
| `npm run lint` | ESLint |
| `npm test` | Jest (run `npm run rebuild:native` if SQLite tests fail after a Node upgrade) |
| `npm run secret-scan` | Fail on committed API keys / real AdMob units |
| `npm run guard:sensitive` | Fail if tracked files include secrets or submission artifacts |
| `npm run firebase:setup` | Create `.env` from Firebase CLI |
| `npm run firebase:deploy-firestore` | Deploy Firestore rules + indexes |
| `npm run android` / `npm run ios` | Native run |
| `npm run eas:login` | Sign in to Expo (once, before EAS builds) |
| `npm run build:android:preview:setup` | First Android preview build (interactive keystore) |
| `npm run build:android:preview` | Queue preview APK (`--no-wait`) |
| `npm run build:android:preview:wait` | Wait for preview APK in terminal |

## Quality gates (before push)

```bash
npm run guard:sensitive
npm run secret-scan
npm run lint
npm test
```

Husky runs the sensitive-file guard and secret scan on commit; push runs the guard on outgoing commits.

## Exporting source for submission

Do **not** commit `.env`, `google-services.json`, PDFs, or a `docs/` folder. Generate a clean archive from a tagged commit:

```bash
git archive --format=zip --output=ocupulse-source.zip HEAD
```

## Licence

Educational — La Trobe University CSE3MAD.
