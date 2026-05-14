# Lean Canvas — STEMM Lab / STEMM Lab mobile app

_Originally produced as **Assessment 1**, submitted **30 March 2026** (La Trobe LMS).  
The PDF lean canvas graphic is the canonical visual; this markdown preserves the nine blocks in text for the repository._

## 1. Problem

Primary and lower-high school students need **guided, safe, gamified** ways to run real-world STEM experiments with phones. Existing tools are either **too expert-focused** (dense menus, no onboarding) or **not sensor-native** (quiz apps without physics data capture). Teachers need **classroom-ready** flows: teams, lightweight sign-in, and evidence (video + sensor logs) suitable for moderation.

## 2. Customer segments

- **Students** (upper primary / lower high school) doing hands-on challenges.
- **Teachers** moderating teams, sessions, and leaderboards.
- **Schools** as organisational tenants (multi-class rollout).

## 3. Unique value proposition

**“Real experiments, real sensors, real leaderboards”** — seven specification-aligned activities (parachute, sound + GPS, hand fan, earthquake, human performance, reaction, breathing) with **Kahoot-style frictionless join** + **Phyphox-grade sensor credibility**, wrapped in WCAG-minded UI (44×44 dp targets, high contrast, portrait lock).

## 4. Solution

Cross-platform **Expo (SDK 51+)** app with **Expo Router**, **Zustand** state, **Firebase Auth + Firestore**, **SQLite** cache with **offline outbox sync**, device capabilities (camera, mic, IMU, GPS, notifications, battery, background tasks), and **AdMob** only under a **kid-safe grade gate**.

## 5. Channels

- Teacher-led deployment (PIN / email class lists).
- GitHub + Azure DevOps visible process for coursework markers.
- Future: school IT MDM / APK sideload.

## 6. Revenue streams

- **Free tier** for education; optional **non-intrusive ads** for older cohorts only (Assessment 4 rubric + ethics alignment).
- Longer term: institutional licence / premium analytics (out of scope for MVP).

## 7. Cost structure

- Firebase consumption (Auth, Firestore reads/writes).
- Expo / EAS build minutes.
- Engineering time (pair programming).

## 8. Key metrics

- Session completion rate per activity.
- Median time-to-first-successful-recording.
- Leaderboard engagement (return sessions per week).
- Crash-free sessions (Test Lab + manual QA).

## 9. Unfair advantage

- **Assessment-aligned experiment pack** tied to a published **user specification** (repeatable lesson plans).
- **Offline-first** SQLite outbox for flaky classroom WiFi.
- **Competitive analysis–informed UX** (A2: Kahoot join flow + Phyphox sensor graphs).
