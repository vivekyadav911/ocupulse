# Sprint 2 retrospective — STEMM Lab

**Sprint window (nominal):** Sun 6 Apr – Sat 26 Apr 2026 (Sprint 2).  
**Closeout activities:** consolidated rubric ↔ spike documentation, navigation shell + capability spikes, design tokens, screen-flow mapping; tagged `sprint-2-end`.

## What worked

- **Spike-first validation** on real Android hardware for sensors, mic metering, maps, and SQLite outbox — caught Expo Go vs dev-client gaps early.
- **Expo Router shell** (`(auth)`, `(tabs)`, `activity/*`, `results/*`) matches A1 wireframes in [`screen-flow.md`](./screen-flow.md) without rework in Sprint 3.
- **Central design tokens** ([`theme/tokens.ts`](../../theme/tokens.ts)) kept spikes and tab UI visually aligned with Assessment 1 contrast targets.
- **Offline-first sketch** (SQLite schema + outbox spike) de-risked Firestore sync before activity screens wrote scores.

## What did not

- **E2E automation** slipped — Detox was a poor fit for Expo SDK 54; no Maestro flows landed in Sprint 2.
- **Camera spike** stayed a thin stub until Sprint 3 `useCameraRecorder` work on a dev client build.
- **Firebase Test Lab** runs were documented but not fully executed on two device matrices before Sprint 2 end (scheduled for production APK in Sprint 3).

## Changes for Sprint 3

- **Switch E2E to Maestro** — separate YAML flows per team member (e.g. login → reaction → results; login → earthquake → leaderboard).
- **Production hooks** for accelerometer/gyro (ring buffer, Hz, leak checks) and SQLite DAOs with Jest round-trips.
- **Tighten Firestore security rules** before classroom pilots; keep secret scan in CI/pre-commit habit.
- **Execute Test Lab** on EAS `production` AAB/APK with one device per student.

---

**Vivek Yadav** — 16 May 2026  
Sprint 2: spike hub, Firestore/SQLite/system spikes, screen flow + feature-spikes consolidation, EAS profiles; Sprint 3 focus: production hooks, DAO layer, and Maestro E2E.

**Vineet Yadav** — 16 May 2026  
Sprint 2: design tokens, shared components spike, maps/mic/sensors spikes, Azure US2.x board hygiene; Sprint 3 focus: activity polish, Test Lab upload, and Maestro flow ownership.
