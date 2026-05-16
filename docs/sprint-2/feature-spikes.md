# Sprint 2 feature spikes — rubric coverage

Consolidated cross-check of **Assessment 4** capabilities ([capability matrix](../sprint-1/feature-list.md)) against **spike routes** (`app/_spikes/`) and **production code**. Open the spike hub: [`app/_spikes/index.tsx`](../../app/_spikes/index.tsx).

| Quick index | Spike | Production entry |
|-------------|-------|------------------|
| Hub | [`index.tsx`](../../app/_spikes/index.tsx) | — |

---

## Firebase Authentication

- **Spike:** _(auth flows validated in Sprint 3; no dedicated spike screen)_
- **Code:** [`app/(auth)/login.tsx`](../../app/(auth)/login.tsx), [`app/(auth)/register.tsx`](../../app/(auth)/register.tsx), [`app/(auth)/onboarding.tsx`](../../app/(auth)/onboarding.tsx)
- **Service:** [`services/auth.ts`](../../services/auth.ts), [`store/authStore.ts`](../../store/authStore.ts)
- **Notes:** Anonymous quick-join + email teacher login; root auth listener in [`app/_layout.tsx`](../../app/_layout.tsx).

## Firestore

- **Spike:** [`app/_spikes/firestore.tsx`](../../app/_spikes/firestore.tsx)
- **Code:** [`services/firestore.ts`](../../services/firestore.ts) — `writeSessionOptimistic`, `subscribeLeaderboard`, `syncOutbox`
- **UI:** [`app/(tabs)/leaderboard.tsx`](../../app/(tabs)/leaderboard.tsx)
- **Notes:** Real-time `scores` collection; offline writes queue via SQLite outbox.

## Firebase Test Lab

- **Spike:** _(release pipeline — no in-app spike)_
- **Code / config:** [`eas.json`](../../eas.json) (`production` → Android AAB), [`app.config.ts`](../../app.config.ts)
- **Docs:** [`docs/sprint-1/firebase.md`](../sprint-1/firebase.md), [README submission checklist](../../README.md#submission-checklist-assessment-4)
- **Notes:** Build with `eas build --platform android --profile production`; upload artefact to Test Lab (one device matrix per student).

## Sensors (accelerometer, gyroscope)

- **Spike:** [`app/_spikes/sensors.tsx`](../../app/_spikes/sensors.tsx) — live `LineChart` of **accelerometer magnitude** (≥30 fps repaint; sensor at 60 Hz)
- **Hooks:** [`hooks/useAccelerometer.ts`](../../hooks/useAccelerometer.ts), [`hooks/useGyroscope.ts`](../../hooks/useGyroscope.ts) (`expo-sensors`, default `1000/60` ms interval)
  - Each exposes `{ x, y, z, magnitude }` plus ring-buffer fields from Sprint 3 (`series`, `stats`, `hz`)
  - Listeners removed on unmount (`sub.remove()` + dev `console.count` leak check)
- **Activities:** parachute, earthquake, humanperf, breathing — see [`docs/sprint-3/hooks-motion.md`](../sprint-3/hooks-motion.md)

### Screenshot

Capture on a **real device**: open `/_spikes/sensors`, walk or shake the phone, save as `docs/sprint-2/wireframes/sensors-spike.png`.

![Sensors spike — live accelerometer magnitude chart](./wireframes/sensors-spike.svg)

_(Replace with a device PNG at `./wireframes/sensors-spike.png` when captured.)_

## Camera / torch

- **Spike:** [`app/_spikes/camera.tsx`](../../app/_spikes/camera.tsx)
- **Code:** [`hooks/useCameraRecorder.ts`](../../hooks/useCameraRecorder.ts)
- **Activities:** [`app/activity/handfan.tsx`](../../app/activity/handfan.tsx), parachute slow-mo (camera hook + activity)
- **Docs:** [`docs/sprint-3/hooks-camera.md`](../sprint-3/hooks-camera.md)

## Microphone (dB / SPL)

- **Spike:** [`app/_spikes/mic.tsx`](../../app/_spikes/mic.tsx)
- **Code:** [`hooks/useMicrophoneDb.ts`](../../hooks/useMicrophoneDb.ts)
- **Activity:** [`app/activity/sound.tsx`](../../app/activity/sound.tsx)
- **Docs:** [`docs/sprint-3/hooks-microphone.md`](../sprint-3/hooks-microphone.md)

## GPS + Maps

- **Spike:** [`app/_spikes/maps.tsx`](../../app/_spikes/maps.tsx) — `MapView` + marker at device GPS; **suburb** label from reverse geocode
- **Hook:** [`hooks/useLocation.ts`](../../hooks/useLocation.ts)
  - `requestForegroundPermissionsAsync` → `getCurrentPositionAsync` → `reverseGeocodeAsync`
  - Returns `{ coords, suburb, address, error, loading, refresh }`
  - Suburb resolution: `district` → `subregion` → `city` (see `suburbFromGeocode`)
- **Production:** [`app/activity/sound.tsx`](../../app/activity/sound.tsx), [`app/results/sound-map.tsx`](../../app/results/sound-map.tsx)
- **Validate on a real phone** (Expo Go or dev client) — simulators often return stale or missing geocode fields

## Battery

- **Spike:** [`app/_spikes/system.tsx`](../../app/_spikes/system.tsx) (battery readout)
- **Code:** [`hooks/useBattery.ts`](../../hooks/useBattery.ts), low-battery banner in [`app/(tabs)/_layout.tsx`](../../app/(tabs)/_layout.tsx)

## Parallel programming (async / non-blocking UI)

- **Spike:** _(pattern demonstrated across spikes)_
- **Code:** Sensor hooks + `async` Firestore/SQLite in [`services/firestore.ts`](../../services/firestore.ts); NetInfo triggers `syncOutbox` in [`app/_layout.tsx`](../../app/_layout.tsx) without blocking render.
- **Notes:** UI thread stays responsive while sampling and sync run asynchronously.

## Work Manager / Task Manager (background outbox sync)

- **Spike:** [`app/_spikes/system.tsx`](../../app/_spikes/system.tsx) (related platform APIs)
- **Code:** [`services/tasks.ts`](../../services/tasks.ts) — `BG_SYNC_OUTBOX` + `expo-background-fetch` / `expo-task-manager`
- **Registered:** [`app/_layout.tsx`](../../app/_layout.tsx) → `registerBackgroundSync()`

## Notifications

- **Spike:** [`app/_spikes/system.tsx`](../../app/_spikes/system.tsx) (schedule test notification)
- **Code:** [`services/notifications.ts`](../../services/notifications.ts)
- **Docs:** [`docs/sprint-3/notifications.md`](../sprint-3/notifications.md)

## AdMob

- **Spike:** _(no dedicated spike — banner on Home)_
- **Code:** [`components/StemmBannerAd.tsx`](../../components/StemmBannerAd.tsx), [`app/(tabs)/index.tsx`](../../app/(tabs)/index.tsx)
- **Config:** Ad unit IDs via [`app.config.ts`](../../app.config.ts) `extra` (from `.env`)

## Testing — Jest (unit / integration)

- **Spike:** _(tests live under `__tests__` / `lib/**/__tests__`)_
- **Code:** [`__tests__/sqlite.test.ts`](../../__tests__/sqlite.test.ts), [`lib/sensors/__tests__/ringBuffer.test.ts`](../../lib/sensors/__tests__/ringBuffer.test.ts)
- **Run:** `npm test`

## Testing — E2E (Maestro)

- **Spike:** _(planned Sprint 3 — no Maestro flows in repo yet)_
- **Docs:** Capability matrix notes per-student flows (login → activity → leaderboard); adopt **Maestro** instead of Detox for Expo SDK 54 compatibility.
- **Planned paths:** `e2e/` flows TBD in Sprint 3.

## APK / EAS build

- **Spike:** _(build tooling)_
- **Code:** [`eas.json`](../../eas.json) — `preview` (APK), `production` (AAB)
- **Notes:** Document final artefact path in submission materials; see README checklist.

## SQLite (local cache + outbox)

- **Spike:** [`app/_spikes/sqlite.tsx`](../../app/_spikes/sqlite.tsx) — inserts a fake `teams` row + `outbox` row, reads both back
- **Code:** [`services/db/sqlite.ts`](../../services/db/sqlite.ts) opens `stemm-lab.db`; `runMigrations()` in [`app/_layout.tsx`](../../app/_layout.tsx) on startup
- **Migration:** [`services/db/migrations/001_init.sql`](../../services/db/migrations/001_init.sql) (+ `002_indexes.sql` in Sprint 3)
- **Docs:** [`docs/sprint-3/services.md`](../sprint-3/services.md) (typed DAOs)

### Schema (`001_init.sql`)

```sql
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  team_id TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  team_id TEXT,
  activity_type TEXT,
  start_time INTEGER
);

CREATE TABLE IF NOT EXISTS experiment_results (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  activity_type TEXT,
  score REAL,
  data_json TEXT,
  synced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

The **outbox** table queues not-yet-synced Firestore writes (`path` + JSON `payload`); `syncOutbox` in [`services/firestore.ts`](../../services/firestore.ts) drains it when online.

## Navigation / data between screens

- **Spike:** [`app/_spikes/components.tsx`](../../app/_spikes/components.tsx) (shared UI building blocks)
- **Code:** Expo Router — [`app/_layout.tsx`](../../app/_layout.tsx), [`app/(tabs)/`](../../app/(tabs)/), [`app/activity/`](../../app/activity/), [`app/results/[sessionId].tsx`](../../app/results/[sessionId].tsx)
- **Docs:** [`screen-flow.md`](./screen-flow.md), design tokens [`design-tokens.md`](./design-tokens.md) → [`theme/tokens.ts`](../../theme/tokens.ts)

## Shared UI components (theme + Zustand)

- **Spike:** [`app/_spikes/components.tsx`](../../app/_spikes/components.tsx) — primary / secondary / danger buttons + `StatReadout`
- **Tokens:** [`theme/tokens.ts`](../../theme/tokens.ts) — colors, spacing, radii, typography (light + dark)
- **Theme store:** [`store/themeStore.ts`](../../store/themeStore.ts) — persisted light/dark toggle (`stemm-theme` in AsyncStorage)
- **Session store:** [`store/sessionStore.ts`](../../store/sessionStore.ts) — team, activity, session id, grade gate
- **Docs:** [`components.md`](./components.md), [`design-tokens.md`](./design-tokens.md)
- **Settings toggle:** [`app/(tabs)/settings.tsx`](../../app/(tabs)/settings.tsx)

---

### Sprint 2 closeout

- All rubric rows above map to at least one **code pointer** (spike or production).
- Optional: add spike screenshots/GIFs under `docs/sprint-2/wireframes/` when capturing on device.
- Azure board: US2.x stories → **Done**; attach `board-snapshot.png` (see [`closeout.md`](./closeout.md)).
