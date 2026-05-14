# Sprint 2 feature spikes

Cross-check each rubric capability with the **spike route** under `app/_spikes/`:

| Capability | Spike screen | Notes |
|------------|--------------|-------|
| Sensors + charts | `sensors.tsx` | Accelerometer + gyro + `react-native-chart-kit` |
| Camera | `camera.tsx` | Stub hook — use `expo-camera` `CameraView` in dev client |
| Microphone / dB | `mic.tsx` | `expo-av` metering → approx SPL |
| GPS + Maps | `maps.tsx` | `expo-location` + `react-native-maps` |
| SQLite + outbox | `sqlite.tsx` | Schema in `services/db/sqlite.ts` |
| Firestore live | `firestore.tsx` | Writes + `subscribeLeaderboard` |
| Notifications + battery + tasks | `system.tsx` | Local notification + battery readout |
| Shared UI | `components.tsx` | `Button`, `Card`, `StatReadout` |

Consolidate screenshots/GIFs into this doc during Sprint 2 closeout.
