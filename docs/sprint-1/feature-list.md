# Capability matrix — rubric ↔ activities (Sprint 1)

Maps **Assessment 4** implementation requirements to **STEMM Lab screens / activities**. Activity names follow the user specification: Parachute, Sound Pollution Hunter, Hand Fan, Earthquake Structure, Human Performance Lab, Reaction Board, Breathing Pace Trainer.

| Rubric capability                            | Where it is exercised                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Firebase Authentication**                  | `(auth)/login`, `(auth)/register`; anonymous “quick join” + email teacher login.                                                                                        |
| **Firestore**                                | Session + result writes; `subscribeLeaderboard` on `(tabs)/leaderboard`; real-time rank updates.                                                                        |
| **Firebase Test Lab**                        | Production APK from EAS; Robo crawl on **two different devices** (one per student).                                                                                     |
| **Sensors (accelerometer, gyroscope, etc.)** | Parachute (g-force with accel), Earthquake (vibration RMS), Human Performance (gyro smoothness), Breathing (chest Z-axis), Reaction (timing/trace uses touch + timing). |
| **Camera / torch**                           | Parachute slow-mo; Hand Fan video / line tracking; optional torch if enabled on device.                                                                                 |
| **Microphone**                               | Sound Pollution Hunter (dB sampling).                                                                                                                                   |
| **Maps & GPS**                               | Sound Pollution Hunter + results map (`results/sound-map` or embedded in activity flow).                                                                                |
| **Battery**                                  | `(tabs)/_layout` banner via `expo-battery`; warns before long recordings.                                                                                               |
| **Parallel programming**                     | JS `async` work for sensor sampling + sync; outbox flush in work queue pattern (not blocking UI thread).                                                                |
| **Work Manager / Task Manager**              | `expo-task-manager` + `expo-background-fetch` drains SQLite **outbox** → Firestore.                                                                                     |
| **Notifications**                            | Streak reminder; local notification on leaderboard rank-up (`expo-notifications`).                                                                                      |
| **AdMob**                                    | Banner on Home; interstitial after Results with **grade-level kid-safe gate** (high school only).                                                                       |
| **Testing: Jest**                            | Unit: e.g. `gforce`, leaderboard sort, AdMob gate; Integration: outbox sync with mocked Firestore.                                                                      |
| **Testing: E2E (Maestro)**                   | Separate flows per student (e.g. login → reaction → results; login → earthquake → leaderboard).                                                                         |
| **APK / build**                              | EAS Android production profile; installable artefact documented in `docs/sprint-3/build.md`.                                                                            |
| **SQLite**                                   | `expo-sqlite` local cache + **outbox** for offline-first Firestore sync.                                                                                                |
| **Navigation / data between screens**        | Expo Router 15+ routes: auth stack, tab shell, activity stack, dynamic `results/[sessionId]`.                                                                           |

### Per-activity quick map

| Activity            | Primary device capabilities     | Backend                   |
| ------------------- | ------------------------------- | ------------------------- |
| 1 Parachute         | Camera (slow-mo), accelerometer | Firestore + SQLite outbox |
| 2 Sound             | Microphone, GPS, maps           | Firestore + local samples |
| 3 Hand Fan          | Camera                          | Firestore                 |
| 4 Earthquake        | Accelerometer, haptics          | Firestore                 |
| 5 Human Performance | Gyroscope                       | Firestore                 |
| 6 Reaction          | Timer, gestures                 | Firestore                 |
| 7 Breathing         | Accelerometer (low-pass Z)      | Firestore                 |
